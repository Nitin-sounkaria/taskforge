import { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { useToast } from '../hooks/useApi';
import { Users, CheckSquare, Clock, AlertTriangle, Search, Monitor, Globe, BarChart3, ChevronRight, X, Calendar, Activity, Info, Plus } from 'lucide-react';
import { format, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [assignForm, setAssignForm] = useState({ projectId: '', title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, u, t, p] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/tasks'),
          api.get('/admin/projects')
        ]);
        setStats(s);
        setUsers(u);
        setTasks(t);
        setAllProjects(p);
        if (p.length > 0) setAssignForm(prev => ({ ...prev, projectId: p[0].id }));
        if (u.length > 0) setSelectedUser(u[0]);
      } catch (err) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userStats = useMemo(() => {
    if (!selectedUser) return null;
    const userTasks = tasks.filter(t => t.assigneeId === selectedUser.id);
    const statusCounts = userTasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [selectedUser, tasks]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!assignForm.title.trim() || !assignForm.projectId) {
      toast.error('Title and Project are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/projects/${assignForm.projectId}/tasks`, {
        ...assignForm,
        assigneeId: selectedUser.id,
        dueDate: assignForm.dueDate || null
      });
      toast.success(`Task assigned to ${selectedUser.name}`);
      setShowAssignModal(false);
      setAssignForm({ ...assignForm, title: '', description: '', dueDate: '' });
      // Refresh tasks
      const newTasks = await api.get('/admin/tasks');
      setTasks(newTasks);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="admin-dashboard admin-mode">
      <header className="section-header admin-header">
        <div className="flex items-center gap-lg">
          <div>
            <div className="admin-badge-glow">ADMIN MASTER MODE</div>
            <h1 className="mt-1">Strategic Operations Hub</h1>
          </div>
        </div>
        <div className="admin-status-indicator">
          <div className="pulse-dot" />
          <span>System Live</span>
        </div>
      </header>

      <div className="operations-layout">
        {/* Left Panel: Member Deck */}
        <aside className="member-deck card">
          <div className="deck-header">
            <h3>Member Deck</h3>
            <div className="search-box mt-1">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="Find member..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="member-list">
            {filteredUsers.map(u => (
              <div 
                key={u.id} 
                className={`member-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(u)}
              >
                <div className="avatar avatar-sm" style={{ background: selectedUser?.id === u.id ? 'var(--primary)' : 'var(--elevated)' }}>
                  {u.name[0]}
                </div>
                <div className="member-info">
                  <div className="member-name">{u.name}</div>
                  <div className="member-status">
                    <span className={`status-dot ${u.lastLogout && new Date(u.lastLogout) > new Date(u.lastLogin) ? '' : 'online'}`} />
                    {u.role.toLowerCase()}
                  </div>
                </div>
                <ChevronRight size={14} className="chevron" />
              </div>
            ))}
          </div>
        </aside>

        {/* Right Panel: Intelligence Engine */}
        <main className="intelligence-engine">
          {selectedUser ? (
            <>
              <div className="member-overview card">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-lg">
                    <div className="avatar avatar-lg" style={{ width: '64px', height: '64px', fontSize: '1.5rem', background: 'var(--primary)' }}>
                      {selectedUser.name[0]}
                    </div>
                    <div>
                      <h2>{selectedUser.name}</h2>
                      <p className="text-muted">{selectedUser.email}</p>
                      <div className="flex gap-md mt-1">
                        <span className="badge badge-admin">Master ID: {selectedUser.id.split('-')[0]}</span>
                        <span className="badge badge-member">Joined {format(new Date(selectedUser.createdAt), 'MMM yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="user-quick-stats">
                    <div className="q-stat">
                      <div className="q-label">Total Tasks</div>
                      <div className="q-value">{selectedUser._count.assignedTasks}</div>
                    </div>
                    <div className="q-stat">
                      <div className="q-label">Projects</div>
                      <div className="q-value">{selectedUser._count.ownedProjects}</div>
                    </div>
                    <button className="btn btn-primary btn-sm ml-2" onClick={() => setShowAssignModal(true)}>
                      <Plus size={16} /> Assign Task
                    </button>
                  </div>
                </div>

                <div className="tabs mt-2">
                  <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Performance</button>
                  <button className={`tab ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>Attendance Log</button>
                  <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Task Audit</button>
                </div>
              </div>

              <div className="engine-content mt-2">
                {activeTab === 'overview' && (
                  <div className="dashboard-grid">
                    <div className="card">
                      <div className="flex justify-between items-center mb-1">
                        <h3>Attendance Summary</h3>
                        <Activity size={18} className="text-primary" />
                      </div>
                      <div className="flex gap-lg items-center mt-1">
                        <div className="q-stat">
                          <div className="q-label">Currently Live</div>
                          <div className="q-value text-success">
                            {users.filter(u => !u.lastLogout || new Date(u.lastLogin) > new Date(u.lastLogout)).length}
                          </div>
                        </div>
                        <div className="q-stat">
                          <div className="q-label">Total Sessions</div>
                          <div className="q-value">{selectedUser.sessions?.length || 0}</div>
                        </div>
                      </div>
                      <div className="progress-bar mt-1" style={{ height: 6 }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.min(100, (users.filter(u => !u.lastLogout || new Date(u.lastLogin) > new Date(u.lastLogout)).length / users.length) * 100)}%`,
                            background: 'var(--success)'
                          }} 
                        />
                      </div>
                      <p className="text-xs text-muted mt-1">
                        System-wide: {users.filter(u => !u.lastLogout || new Date(u.lastLogin) > new Date(u.lastLogout)).length} of {users.length} members are currently active.
                      </p>
                    </div>
                    <div className="card">
                      <h3>Workload Distribution</h3>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={userStats}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {userStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="card">
                      <h3>Device Ecosystem</h3>
                      <div className="device-info-list">
                        <div className="device-item">
                          <Monitor className="text-primary" size={20} />
                          <div>
                            <div className="font-600">{selectedUser.lastDevice || 'Unknown Hardware'}</div>
                            <div className="text-xs text-muted">Primary Workstation</div>
                          </div>
                        </div>
                        <div className="device-item mt-1">
                          <Globe className="text-primary" size={20} />
                          <div>
                            <div className="font-600">{selectedUser.lastBrowser || 'Unknown Software'}</div>
                            <div className="text-xs text-muted">Web Engine</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'sessions' && (
                  <div className="card">
                    <h3>Historical Activity Log</h3>
                    <div className="table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Clock In</th>
                            <th>Clock Out</th>
                            <th>Duration</th>
                            <th>IP & Device</th>
                          </tr>
                        </thead>
                        <tbody>
                           {selectedUser.sessions?.map(s => {
                             const mins = s.logoutAt ? differenceInMinutes(new Date(s.logoutAt), new Date(s.loginAt)) : 0;
                             const hours = Math.floor(mins / 60);
                             const remainingMins = mins % 60;
                             return (
                               <tr key={s.id}>
                                 <td>{format(new Date(s.loginAt), 'MMM d, yyyy')}</td>
                                 <td className="text-success font-600">{format(new Date(s.loginAt), 'p')}</td>
                                 <td className="text-muted">{s.logoutAt ? format(new Date(s.logoutAt), 'p') : <span className="pulse-text text-success font-600">LIVE</span>}</td>
                                 <td className="font-600">
                                   {s.logoutAt 
                                     ? `${hours}h ${remainingMins}m` 
                                     : <div className="flex items-center gap-sm"><span className="pulse-dot" /> Tracking...</div>}
                                 </td>
                                 <td className="text-xs">
                                   <div className="font-600">{s.ipAddress || '—'}</div>
                                   <div className="text-muted truncate" style={{ maxWidth: 150 }}>{s.device}</div>
                                 </td>
                               </tr>
                             );
                           })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="card">
                    <h3>Deep Task Audit</h3>
                    <div className="audit-list">
                      {tasks.filter(t => t.assigneeId === selectedUser.id).map(t => (
                        <div key={t.id} className="audit-item">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-600">{t.title}</div>
                              <div className="text-xs text-muted">Project: {t.project.name}</div>
                            </div>
                            <span className={`badge badge-${t.status.toLowerCase().replace('_', '-')}`}>{t.status.replace('_', ' ')}</span>
                          </div>
                          <p className="task-desc mt-1 text-sm">{t.description || 'No description provided.'}</p>
                          <div className="flex justify-between items-center mt-1 text-xs text-muted">
                            <div className="flex items-center gap-sm"><Calendar size={12} /> Due {format(new Date(t.dueDate), 'MMM d')}</div>
                            <div className="flex items-center gap-sm"><Activity size={12} /> Priority: {t.priority}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Info size={48} className="text-muted" />
              <h2>No Member Selected</h2>
              <p>Select a member from the left deck to view detailed intelligence.</p>
            </div>
          )}
        </main>
      </div>
 
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Task to {selectedUser.name}</h3>
              <button className="btn-ghost btn-icon" onClick={() => setShowAssignModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAssignTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="assign-project">Select Project *</label>
                  <select 
                    id="assign-project" 
                    className="form-input" 
                    value={assignForm.projectId}
                    onChange={e => setAssignForm({ ...assignForm, projectId: e.target.value })}
                  >
                    {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="assign-title">Task Title *</label>
                  <input 
                    id="assign-title" 
                    className="form-input" 
                    placeholder="What needs to be done?" 
                    value={assignForm.title}
                    onChange={e => setAssignForm({ ...assignForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="assign-desc">Description</label>
                  <textarea 
                    id="assign-desc" 
                    className="form-input" 
                    placeholder="Details..." 
                    value={assignForm.description}
                    onChange={e => setAssignForm({ ...assignForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="assign-priority">Priority</label>
                    <select 
                      id="assign-priority" 
                      className="form-input"
                      value={assignForm.priority}
                      onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="assign-due">Due Date</label>
                    <input 
                      id="assign-due" 
                      type="date" 
                      className="form-input" 
                      value={assignForm.dueDate}
                      onChange={e => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
     </div>
  );
}
