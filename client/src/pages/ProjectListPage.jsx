import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast, getInitials, getAvatarColor } from '../hooks/useApi';
import { Plus, FolderKanban, X } from 'lucide-react';

export default function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(setProjects).catch(() => toast.error('Failed to load projects')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors({ name: 'Project name is required' }); return; }
    setCreating(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      setErrors({});
      fetchProjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="projects-grid">{[1,2,3].map(i => <div key={i} className="skeleton skeleton-card" style={{height:180}} />)}</div>
      ) : projects.length === 0 ? (
        <div className="empty-state" style={{marginTop:'4rem'}}>
          <div className="empty-icon"><FolderKanban size={56} strokeWidth={1} /></div>
          <h3>No projects yet</h3>
          <p>Create your first project to start tracking tasks and collaborating with your team.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} /> Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p) => {
            const total = p.taskStats?.total || 0;
            const done = p.taskStats?.done || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <h3>{p.name}</h3>
                <p className="project-desc">{p.description || 'No description'}</p>
                <div className="project-meta">
                  <div className="project-members">
                    {p.members?.slice(0, 4).map((m) => (
                      <div key={m.id} className="avatar avatar-sm" style={{background: getAvatarColor(m.user.name)}} title={m.user.name}>
                        {getInitials(m.user.name)}
                      </div>
                    ))}
                    {p.members?.length > 4 && <div className="avatar avatar-sm" style={{background:'var(--elevated)'}}>+{p.members.length - 4}</div>}
                  </div>
                  <span className="text-sm text-muted">{total} tasks · {pct}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}} /></div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Project</h3>
              <button className="btn-ghost btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="project-name">Project Name *</label>
                  <input id="project-name" name="projectName" className={`form-input${errors.name ? ' error' : ''}`}
                    placeholder="My Awesome Project" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label htmlFor="project-desc">Description</label>
                  <textarea id="project-desc" name="projectDescription" className="form-input"
                    placeholder="What's this project about?" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
