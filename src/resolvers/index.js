const Resolver = require('@forge/resolver').default;
const api = require('@forge/api');
const { route } = api;

const resolver = new Resolver();

// Get all projects the user has access to
resolver.define('getProjects', async () => {
  const allProjects = [];
  let startAt = 0;

  while (true) {
    const res = await api.asApp().requestJira(
      route`/rest/api/3/project/search?startAt=${startAt}&maxResults=50`,
    );
    if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
    const data = await res.json();
    allProjects.push(...(data.values || []));
    if (data.isLast || allProjects.length >= (data.total || 0)) break;
    startAt += 50;
  }

  return allProjects
    .map((p) => ({ key: p.key, name: p.name }))
    .sort((a, b) => a.key.localeCompare(b.key));
});

// Fetch issues for a project
resolver.define('getIssues', async ({ payload }) => {
  const { projectKey } = payload;
  if (!projectKey || !/^[A-Z][A-Z0-9_]{0,9}$/.test(projectKey)) {
    throw new Error(`Invalid project key: ${projectKey}`);
  }

  const excludedStatuses = ['Accepted', 'Done', 'Abandoned'];
  const statusClause = excludedStatuses.map((s) => `"${s}"`).join(', ');
  const jql = `project = ${projectKey} AND status NOT IN (${statusClause}) ORDER BY created DESC`;
  const fields = 'summary,status,priority,assignee,issuetype,created,duedate,labels,comment';

  let allIssues = [];
  let startAt = 0;
  const maxResults = 100;

  while (true) {
    const res = await api.asApp().requestJira(
      route`/rest/api/3/search?jql=${jql}&fields=${fields}&startAt=${startAt}&maxResults=${maxResults}`,
    );
    if (!res.ok) throw new Error(`Failed to fetch issues: ${res.status}`);
    const data = await res.json();
    allIssues.push(...(data.issues || []));
    if (startAt + maxResults >= (data.total || 0)) break;
    startAt += maxResults;
  }

  const issues = allIssues.map((issue) => transform(issue));
  const stats = computeStats(issues);

  return { project: projectKey, issues, stats, refreshedAt: new Date().toISOString() };
});

function transform(issue) {
  const f = issue.fields;
  const now = new Date();
  const created = new Date(f.created);
  const daysOpen = Math.floor((now - created) / (1000 * 60 * 60 * 24));

  let ageBucket;
  if (daysOpen <= 7) ageBucket = 'fresh';
  else if (daysOpen <= 30) ageBucket = 'ageing';
  else if (daysOpen <= 90) ageBucket = 'stale';
  else ageBucket = 'critical';

  let dueDate = f.duedate || null;
  let dueStatus = null;
  if (dueDate) {
    const due = new Date(dueDate);
    const daysUntilDue = Math.floor((due - now) / (1000 * 60 * 60 * 24));
    if (daysUntilDue < 0) dueStatus = 'overdue';
    else if (daysUntilDue <= 7) dueStatus = 'due-soon';
    else dueStatus = 'on-track';
  }

  let latestComment = null;
  const comments = f.comment?.comments || [];
  if (comments.length > 0) {
    const last = comments[comments.length - 1];
    latestComment = {
      author: last.author?.displayName || 'Unknown',
      date: last.created?.split('T')[0] || '',
      body: extractText(last.body),
    };
  }

  return {
    key: issue.key,
    type: f.issuetype?.name || 'Unknown',
    summary: f.summary || '',
    status: f.status?.name || 'Unknown',
    priority: f.priority?.name || 'None',
    assignee: f.assignee?.displayName || 'Unassigned',
    daysOpen,
    ageBucket,
    dueDate,
    dueStatus,
    labels: f.labels || [],
    latestComment,
    url: `/browse/${issue.key}`,
  };
}

function extractText(adfBody) {
  if (!adfBody) return '';
  if (typeof adfBody === 'string') return adfBody;
  const texts = [];
  const walk = (node) => {
    if (node.text) texts.push(node.text);
    if (node.content) node.content.forEach(walk);
  };
  walk(adfBody);
  return texts.join(' ').slice(0, 200);
}

function computeStats(issues) {
  const stats = {
    total: issues.length,
    byType: {},
    byStatus: {},
    byPriority: {},
    byAge: { fresh: 0, ageing: 0, stale: 0, critical: 0 },
    dueDates: { overdue: 0, dueSoon: 0, hasDueDate: 0, noDueDate: 0 },
    assignees: new Set(),
    labels: new Set(),
  };

  for (const issue of issues) {
    stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
    stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
    stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;
    stats.byAge[issue.ageBucket]++;
    if (issue.dueDate) {
      stats.dueDates.hasDueDate++;
      if (issue.dueStatus === 'overdue') stats.dueDates.overdue++;
      if (issue.dueStatus === 'due-soon') stats.dueDates.dueSoon++;
    } else {
      stats.dueDates.noDueDate++;
    }
    stats.assignees.add(issue.assignee);
    issue.labels.forEach((l) => stats.labels.add(l));
  }

  stats.assignees = [...stats.assignees].sort();
  stats.labels = [...stats.labels].sort();
  return stats;
}

exports.handler = resolver.getDefinitions();
