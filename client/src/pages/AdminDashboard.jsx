import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../hooks/useApi';
import { Users, CheckSquare, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [searchTerm, setSearchTerm] = useState('');
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
    <div className="admin-dashboard">
      <header className="section-header">
        <div>
          <h1>Master Command Center</h1>
          <p className="text-muted">Global system monitoring and member tracking</p>
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
            <div className="stat-label">Active Projects</div>
            <div className="stat-value">{stats?.projects}</div>
          </div>
          <div className="stat-icon green"><Clock size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value text-danger">{stats?.overdue}</div>
          </div>
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
        </div>
      </div>

      <div className="card mt-2">
        <div className="tabs">
          <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Member Tracking</button>
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Global Task Board</button>
        </div>

        <div className="p-1">
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-md items-center">
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
          </div>

          {activeTab === 'members' ? (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Last Login</th>
                    <th>Last Logout</th>
                    <th>Activity</th>
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
                      <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                      <td>{u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, p') : 'Never'}</td>
                      <td>{u.lastLogout ? format(new Date(u.lastLogout), 'MMM d, p') : '—'}</td>
                      <td>
                        <div className="text-xs">
                          <span className="text-primary">{u._count.assignedTasks} Tasks</span> • 
                          <span className="text-success ml-1">{u._count.ownedProjects} Projects</span>
                        </div>
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
                    <th>Task Name</th>
                    <th>Assignee</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => (
                    <tr key={t.id}>
                      <td className="font-600">{t.title}</td>
                      <td>{t.assignee?.name || 'Unassigned'}</td>
                      <td className="text-muted">{t.project.title}</td>
                      <td>
                        <span className={new Date(t.dueDate) < new Date() && t.status !== 'DONE' ? 'text-danger font-500' : ''}>
                          {format(new Date(t.dueDate), 'MMM d, yyyy')}
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
    </div>
  );
}
