import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { useToast } from '../hooks/useApi';
import { Users, CheckSquare, Clock, AlertTriangle, Search, Monitor, Globe, BarChart3, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, u, t] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/tasks')
        ]);
        setStats(s);
        setUsers(u);
        setTasks(t);
      } catch (err) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    const statusCounts = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [tasks]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assignee?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="admin-dashboard admin-mode">
      <header className="section-header admin-header">
        <div className="flex items-center gap-lg">
          <div>
            <div className="admin-badge-glow">ADMIN MASTER MODE</div>
            <h1 className="mt-1">Strategic Command Center</h1>
            <p className="text-muted">Global system monitoring & security audit</p>
          </div>
        </div>
        <div className="admin-status-indicator">
          <div className="pulse-dot" />
          <span>System Live</span>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Members</div>
            <div className="stat-value">{stats?.users}</div>
          </div>
          <div className="stat-icon purple"><Users size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">System Tasks</div>
            <div className="stat-value">{stats?.tasks}</div>
          </div>
          <div className="stat-icon blue"><CheckSquare size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value text-danger">{stats?.overdue}</div>
          </div>
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Project Count</div>
            <div className="stat-value">{stats?.projects}</div>
          </div>
          <div className="stat-icon green"><BarChart3 size={24} /></div>
        </div>
      </div>

      <div className="dashboard-grid mt-2">
        <div className="card">
          <h3>Task Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text)' }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Priority Breakdown</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mt-2">
        <div className="tabs">
          <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Member Tracking</button>
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Global Task Board</button>
        </div>

        <div className="p-1">
          <div className="flex justify-between items-center mb-2">
            <div className="form-group mb-0" style={{ width: '300px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={`Search ${activeTab}...`} 
                  style={{ paddingLeft: '36px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {activeTab === 'members' ? (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Device & Browser</th>
                    <th>Last Activity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-md">
                          <div className="avatar avatar-sm" style={{ background: 'var(--elevated)' }}>{u.name[0]}</div>
                          <div>
                            <div className="font-600">{u.name}</div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-xs">
                          <div className="flex items-center gap-sm text-xs">
                            <Monitor size={12} className="text-muted" /> {u.lastDevice || 'Unknown Device'}
                          </div>
                          <div className="flex items-center gap-sm text-xs">
                            <Globe size={12} className="text-muted" /> {u.lastBrowser || 'Unknown Browser'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs">
                          <div>IN: {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, p') : 'Never'}</div>
                          <div className="text-muted">OUT: {u.lastLogout ? format(new Date(u.lastLogout), 'MMM d, p') : '—'}</div>
                        </div>
                      </td>
                      <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td>
                        <button className="btn-ghost btn-sm" onClick={() => setSelectedUser(u)}>
                          Details <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Owner</th>
                    <th>Project</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => (
                    <tr key={t.id}>
                      <td className="font-600">{t.title}</td>
                      <td>{t.assignee?.name || 'Unassigned'}</td>
                      <td className="text-muted">{t.project.name}</td>
                      <td>
                        <span className={new Date(t.dueDate) < new Date() && t.status !== 'DONE' ? 'text-danger font-500' : 'text-xs'}>
                          {format(new Date(t.dueDate), 'MMM d')}
                        </span>
                      </td>
                      <td><span className={`badge badge-${t.status.toLowerCase().replace('_', '-')}`}>{t.status.replace('_', ' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Member Deep Dive</h3>
              <button className="btn-ghost btn-icon" onClick={() => setSelectedUser(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="flex items-center gap-lg mb-2">
                <div className="avatar avatar-lg" style={{ background: 'var(--primary)', width: '60px', height: '60px', fontSize: '1.5rem' }}>
                  {selectedUser.name[0]}
                </div>
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p className="text-muted">{selectedUser.email}</p>
                  <span className={`badge badge-${selectedUser.role.toLowerCase()} mt-1`}>{selectedUser.role}</span>
                </div>
              </div>

              <div className="stats-grid mt-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat-card">
                  <div className="stat-info">
                    <div className="stat-label">Tasks Assigned</div>
                    <div className="stat-value">{selectedUser._count.assignedTasks}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <div className="stat-label">Projects Owned</div>
                    <div className="stat-value">{selectedUser._count.ownedProjects}</div>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="mb-1">Last Connected Device</h3>
                <div className="card" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-center gap-md mb-1">
                    <Monitor className="text-primary" />
                    <div>
                      <div className="font-600">{selectedUser.lastDevice || 'Unknown Hardware'}</div>
                      <div className="text-xs text-muted">Operating System & Model</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <Globe className="text-primary" />
                    <div>
                      <div className="font-600">{selectedUser.lastBrowser || 'Unknown Software'}</div>
                      <div className="text-xs text-muted">Browser Engine & Version</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>Close Insight</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
