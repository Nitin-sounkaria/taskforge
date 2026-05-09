import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate, timeAgo, isOverdue } from '../hooks/useApi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
  RadialBarChart, RadialBar, Legend,
} from 'recharts';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

const STATUS_COLORS = { TODO: '#3b82f6', IN_PROGRESS: '#8b5cf6', IN_REVIEW: '#f59e0b', DONE: '#10b981' };
const PRIORITY_COLORS = { LOW: '#64748b', MEDIUM: '#3b82f6', HIGH: '#f59e0b', CRITICAL: '#ef4444' };
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const PRIORITY_LABELS = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
const WORKLOAD_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#f1f5f9', fontSize: '.8rem' }}>
      {label && <div style={{ marginBottom: 4, color: '#94a3b8' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/overdue'),
        api.get('/dashboard/recent-activity'),
      ]).then(([s, c, o, a]) => {
        setStats(s); setCharts(c); setOverdue(o); setActivity(a);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [authLoading, isAuthenticated]);

  if (loading) return (
    <div>
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      <div className="dashboard-grid">
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 300 }} />)}
      </div>
    </div>
  );

  // Status distribution donut
  const statusData = stats ? Object.entries(stats.statusCounts).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key, value, fill: STATUS_COLORS[key]
  })) : [];

  // Priority distribution donut
  const priorityData = charts ? Object.entries(charts.priorityCounts).map(([key, value]) => ({
    name: PRIORITY_LABELS[key] || key, value, fill: PRIORITY_COLORS[key]
  })) : [];

  // Tasks by status bar
  const barData = stats ? Object.entries(stats.statusCounts).map(([key, value]) => ({
    name: STATUS_LABELS[key]?.replace(' ', '\n') || key, count: value, fill: STATUS_COLORS[key]
  })) : [];

  // Activity trend area
  const activityTrend = charts?.dailyActivity?.map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Created: d.tasks_created, Updated: d.tasks_updated, Total: d.total,
  })) || [];

  // Workload data
  const workloadData = charts?.workload?.map((w, i) => ({
    name: w.name, active: w.active, completed: w.completed,
    fill: WORKLOAD_COLORS[i % WORKLOAD_COLORS.length],
  })) || [];

  // Tasks by project
  const projectData = charts?.tasksByProject || [];

  const hasData = stats?.totalTasks > 0;

  return (
    <div>
      <div className="section-header"><h1>Dashboard</h1></div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Projects</div>
            <div className="stat-value">{stats?.totalProjects || 0}</div>
          </div>
          <div className="stat-icon purple"><FolderKanban size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value">{stats?.totalTasks || 0}</div>
            <div className="stat-sub">{stats?.completionRate || 0}% completed</div>
          </div>
          <div className="stat-icon blue"><TrendingUp size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Completed</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.statusCounts?.DONE || 0}</div>
          </div>
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats?.overdueTasks || 0}</div>
            <div className="stat-sub">{stats?.dueThisWeek || 0} due this week</div>
          </div>
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
        </div>
      </div>

      <div className="dashboard-grid">

        {/* 1. Task Status Distribution — Donut */}
        <div className="chart-container">
          <h3>Task Status Distribution</h3>
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-md" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center gap-sm" style={{ fontSize: '.78rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.fill }} />
                    <span className="text-muted">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="empty-state"><div className="empty-icon">📊</div><p>No tasks yet</p></div>}
        </div>

        {/* 2. Priority Breakdown — Donut */}
        <div className="chart-container">
          <h3>Priority Breakdown</h3>
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={4} strokeWidth={0}>
                    {priorityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-md" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {priorityData.map((d, i) => (
                  <div key={i} className="flex items-center gap-sm" style={{ fontSize: '.78rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: d.fill }} />
                    <span className="text-muted">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="empty-state"><div className="empty-icon">🎯</div><p>No tasks yet</p></div>}
        </div>

        {/* 3. Activity Trend — Area Chart (full width) */}
        <div className="chart-container full-width">
          <h3>Activity Trend (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={activityTrend}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradUpdated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Created" stroke="#6366f1" fill="url(#gradCreated)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Updated" stroke="#8b5cf6" fill="url(#gradUpdated)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-lg" style={{ justifyContent: 'center', marginTop: '.5rem' }}>
            <div className="flex items-center gap-sm" style={{ fontSize: '.78rem' }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: '#6366f1' }} />
              <span className="text-muted">Created</span>
            </div>
            <div className="flex items-center gap-sm" style={{ fontSize: '.78rem' }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, background: '#8b5cf6' }} />
              <span className="text-muted">Updated</span>
            </div>
          </div>
        </div>

        {/* 4. Tasks by Status — Bar Chart */}
        <div className="chart-container">
          <h3>Tasks by Status</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tasks">
                  {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-icon">📈</div><p>No data available</p></div>}
        </div>

        {/* 5. Tasks per Project — Horizontal Bar */}
        <div className="chart-container">
          <h3>Tasks per Project</h3>
          {projectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectData} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tasks" radius={[0, 6, 6, 0]} name="Tasks" fill="#6366f1">
                  {projectData.map((_, i) => <Cell key={i} fill={WORKLOAD_COLORS[i % WORKLOAD_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-icon">📁</div><p>No projects yet</p></div>}
        </div>

        {/* 6. Team Workload — Stacked Bar */}
        <div className="chart-container">
          <h3>Team Workload</h3>
          {workloadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={workloadData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="active" stackId="a" name="Active" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="completed" stackId="a" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-icon">👥</div><p>No team data</p></div>}
          {workloadData.length > 0 && (
            <div className="flex gap-lg" style={{ justifyContent: 'center', marginTop: '.5rem' }}>
              <div className="flex items-center gap-sm" style={{ fontSize: '.78rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1' }} />
                <span className="text-muted">Active</span>
              </div>
              <div className="flex items-center gap-sm" style={{ fontSize: '.78rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                <span className="text-muted">Completed</span>
              </div>
            </div>
          )}
        </div>

        {/* 7. Overdue Tasks */}
        <div className="chart-container">
          <div className="section-header"><h3>Overdue Tasks</h3></div>
          {overdue.length > 0 ? (
            <div className="task-list">
              {overdue.slice(0, 5).map((t) => (
                <div key={t.id} className="task-item" onClick={() => navigate(`/projects/${t.projectId}`)}>
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      <span className="overdue">Due {formatDate(t.dueDate)}</span>
                      <span>{t.project?.name}</span>
                    </div>
                  </div>
                  {t.assignee && (
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(t.assignee.name) }} title={t.assignee.name}>
                      {getInitials(t.assignee.name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="empty-state"><div className="empty-icon">🎉</div><h3>All caught up!</h3><p>No overdue tasks</p></div>}
        </div>

        {/* 8. Recent Activity */}
        <div className="chart-container">
          <div className="section-header"><h3>Recent Activity</h3></div>
          {activity.length > 0 ? (
            <div className="activity-list">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="activity-item">
                  <div className="avatar avatar-sm" style={{ background: getAvatarColor(a.user?.name) }}>
                    {getInitials(a.user?.name)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      <strong>{a.user?.name}</strong> {a.details || a.action.toLowerCase().replace(/_/g, ' ')}
                    </div>
                    <div className="activity-time">{timeAgo(a.createdAt)}{a.project ? ` · ${a.project.name}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="empty-state"><div className="empty-icon">📋</div><h3>No activity yet</h3><p>Actions will appear here</p></div>}
        </div>
      </div>
    </div>
  );
}
