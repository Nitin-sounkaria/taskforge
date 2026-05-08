import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { getInitials, getAvatarColor, formatDate, timeAgo, isOverdue, statusLabel } from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/overdue'),
      api.get('/dashboard/recent-activity'),
    ]).then(([s, o, a]) => {
      setStats(s); setOverdue(o); setActivity(a);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      <div className="dashboard-grid"><div className="skeleton" style={{height:300}} /><div className="skeleton" style={{height:300}} /></div>
    </div>
  );

  const chartData = stats ? Object.entries(stats.statusCounts).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key, value, fill: COLORS[Object.keys(STATUS_LABELS).indexOf(key)]
  })) : [];

  const barData = stats ? Object.entries(stats.statusCounts).map(([key, value]) => ({
    name: STATUS_LABELS[key]?.split(' ')[0] || key, count: value
  })) : [];

  return (
    <div>
      <div className="section-header"><h1>Dashboard</h1></div>

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
            <div className="stat-value" style={{color:'var(--success)'}}>{stats?.statusCounts?.DONE || 0}</div>
          </div>
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Overdue</div>
            <div className="stat-value" style={{color:'var(--danger)'}}>{stats?.overdueTasks || 0}</div>
            <div className="stat-sub">{stats?.dueThisWeek || 0} due this week</div>
          </div>
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3>Task Distribution</h3>
          {stats?.totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-icon">📊</div><p>No tasks yet to visualize</p></div>}
          <div className="flex gap-md" style={{justifyContent:'center',flexWrap:'wrap',marginTop:'.5rem'}}>
            {chartData.map((d,i) => (
              <div key={i} className="flex items-center gap-sm" style={{fontSize:'.8rem'}}>
                <div style={{width:10,height:10,borderRadius:2,background:d.fill}} />
                <span className="text-muted">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3>Tasks by Status</h3>
          {stats?.totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{fill:'#94a3b8',fontSize:12}} axisLine={{stroke:'#334155'}} />
                <YAxis tick={{fill:'#94a3b8',fontSize:12}} axisLine={{stroke:'#334155'}} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {barData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-icon">📈</div><p>No data available</p></div>}
        </div>

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
                    <div className="avatar avatar-sm" style={{background: getAvatarColor(t.assignee.name)}} title={t.assignee.name}>
                      {getInitials(t.assignee.name)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div className="empty-state"><div className="empty-icon">🎉</div><h3>All caught up!</h3><p>No overdue tasks</p></div>}
        </div>

        <div className="chart-container">
          <div className="section-header"><h3>Recent Activity</h3></div>
          {activity.length > 0 ? (
            <div className="activity-list">
              {activity.slice(0, 8).map((a) => (
                <div key={a.id} className="activity-item">
                  <div className="avatar avatar-sm" style={{background: getAvatarColor(a.user?.name)}}>
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
