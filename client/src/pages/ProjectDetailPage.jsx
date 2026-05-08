import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast, getInitials, getAvatarColor, formatDate, isOverdue, statusLabel, priorityLabel } from '../hooks/useApi';
import { Plus, X, Trash2, Edit3, UserPlus, ArrowLeft, Search } from 'lucide-react';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);

  const fetchProject = () => {
    setLoading(true);
    api.get(`/projects/${id}`).then(setProject).catch(() => { toast.error('Project not found'); navigate('/projects'); }).finally(() => setLoading(false));
  };
  useEffect(() => { fetchProject(); }, [id]);

  const isProjectAdmin = project?.members?.some(m => m.userId === user?.id && m.role === 'ADMIN') || user?.role === 'ADMIN';

  const filteredTasks = (project?.tasks || []).filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) { toast.error('Task title is required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/tasks`, { ...taskForm, assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null });
      toast.success('Task created!');
      setShowCreateTask(false);
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      fetchProject();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/tasks/${showEditTask.id}`, { ...taskForm, assigneeId: taskForm.assigneeId || null, dueDate: taskForm.dueDate || null });
      toast.success('Task updated!');
      setShowEditTask(null);
      fetchProject();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); toast.success('Task deleted'); fetchProject(); } catch (err) { toast.error(err.message); }
  };

  const handleStatusChange = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); fetchProject(); } catch (err) { toast.error(err.message); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) { toast.error('Email is required'); return; }
    setSubmitting(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail, role: memberRole });
      toast.success('Member added!');
      setShowAddMember(false);
      setMemberEmail('');
      fetchProject();
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); toast.success('Member removed'); fetchProject(); } catch (err) { toast.error(err.message); }
  };

  const handleUpdateRole = async (userId, role) => {
    try { await api.put(`/projects/${id}/members/${userId}`, { role }); toast.success('Role updated'); fetchProject(); } catch (err) { toast.error(err.message); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try { await api.delete(`/projects/${id}`); toast.success('Project deleted'); navigate('/projects'); } catch (err) { toast.error(err.message); }
  };

  const openEditTask = (t) => {
    setTaskForm({ title: t.title, description: t.description || '', status: t.status, priority: t.priority, dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '', assigneeId: t.assigneeId || '' });
    setShowEditTask(t);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!project) return null;

  const taskFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditTask(null) : setShowCreateTask(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Task' : 'Create Task'}</h3>
          <button className="btn-ghost btn-icon" onClick={() => isEdit ? setShowEditTask(null) : setShowCreateTask(false)}><X size={20}/></button>
        </div>
        <form onSubmit={isEdit ? handleEditTask : handleCreateTask}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="task-title">Title *</label>
              <input id="task-title" name="taskTitle" className="form-input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label htmlFor="task-desc">Description</label>
              <textarea id="task-desc" name="taskDescription" className="form-input" placeholder="Task details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group">
                <label htmlFor="task-status">Status</label>
                <select id="task-status" name="taskStatus" className="form-input" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-priority">Priority</label>
                <select id="task-priority" name="taskPriority" className="form-input" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              <div className="form-group">
                <label htmlFor="task-due">Due Date</label>
                <input id="task-due" name="taskDueDate" type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label htmlFor="task-assignee">Assignee</label>
                <select id="task-assignee" name="taskAssignee" className="form-input" value={taskForm.assigneeId} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => isEdit ? setShowEditTask(null) : setShowCreateTask(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'1.5rem'}}>
        <button className="btn-ghost btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={20}/></button>
        <div style={{flex:1}}>
          <h1>{project.name}</h1>
          {project.description && <p className="text-muted text-sm" style={{marginTop:'.25rem'}}>{project.description}</p>}
        </div>
        {isProjectAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}><Trash2 size={16}/> Delete</button>}
      </div>

      <div className="tabs">
        <button className={`tab${activeTab === 'tasks' ? ' active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks ({project.tasks?.length || 0})</button>
        <button className={`tab${activeTab === 'members' ? ' active' : ''}`} onClick={() => setActiveTab('members')}>Members ({project.members?.length || 0})</button>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="task-filters">
            <div style={{position:'relative',flex:1,maxWidth:280}}>
              <Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />
              <input className="form-input" placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} style={{paddingLeft:36}} />
            </div>
            <select className="form-input" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <select className="form-input" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateTask(true)}><Plus size={16}/> Add Task</button>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state" style={{marginTop:'2rem'}}>
              <div className="empty-icon">📝</div>
              <h3>No tasks found</h3>
              <p>{project.tasks?.length === 0 ? 'Create your first task to get started.' : 'Try adjusting your filters.'}</p>
              {project.tasks?.length === 0 && <button className="btn btn-primary" onClick={() => setShowCreateTask(true)}><Plus size={16}/> Create Task</button>}
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map(t => (
                <div key={t.id} className="task-item">
                  <select className="form-input" value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)}
                    style={{width:'auto',padding:'.3rem .5rem',fontSize:'.75rem',minWidth:110}} title="Change status">
                    {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                  <div className="task-info" onClick={() => openEditTask(t)}>
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      <span className={`badge badge-${t.priority.toLowerCase()}`}>{priorityLabel(t.priority)}</span>
                      {t.dueDate && <span className={isOverdue(t.dueDate) && t.status !== 'DONE' ? 'overdue' : ''}>{formatDate(t.dueDate)}</span>}
                      {t.assignee && <span>{t.assignee.name}</span>}
                    </div>
                  </div>
                  <div className="task-actions">
                    {t.assignee && <div className="avatar avatar-sm" style={{background:getAvatarColor(t.assignee.name)}} title={t.assignee.name}>{getInitials(t.assignee.name)}</div>}
                    <button className="btn-ghost btn-icon" onClick={() => openEditTask(t)} title="Edit"><Edit3 size={16}/></button>
                    {isProjectAdmin && <button className="btn-ghost btn-icon" onClick={() => handleDeleteTask(t.id)} title="Delete"><Trash2 size={16} color="var(--danger)"/></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <>
          {isProjectAdmin && (
            <div style={{marginBottom:'1.25rem'}}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}><UserPlus size={16}/> Add Member</button>
            </div>
          )}
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.id} className="member-item">
                <div className="avatar" style={{background:getAvatarColor(m.user.name)}}>{getInitials(m.user.name)}</div>
                <div className="member-info">
                  <div className="member-name">{m.user.name} {m.userId === project.ownerId && <span className="text-muted text-sm">· Owner</span>}</div>
                  <div className="member-email">{m.user.email}</div>
                </div>
                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                {isProjectAdmin && m.userId !== project.ownerId && (
                  <div className="flex gap-sm">
                    <select className="form-input" value={m.role} onChange={e => handleUpdateRole(m.userId, e.target.value)} style={{width:'auto',padding:'.3rem .5rem',fontSize:'.8rem'}}>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    <button className="btn-ghost btn-icon" onClick={() => handleRemoveMember(m.userId)} title="Remove"><Trash2 size={16} color="var(--danger)"/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {showCreateTask && taskFormModal(false)}
      {showEditTask && taskFormModal(true)}

      {showAddMember && (
        <div className="modal-overlay" onClick={() => setShowAddMember(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Member</h3>
              <button className="btn-ghost btn-icon" onClick={() => setShowAddMember(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="member-email">Email Address *</label>
                  <input id="member-email" name="memberEmail" type="email" className="form-input" placeholder="user@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="member-role">Role</label>
                  <select id="member-role" name="memberRole" className="form-input" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddMember(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Adding...' : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
