import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, formatDate } from '../hooks/useApi';
import { Shield, Mail, Calendar, User } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div>
      <div className="section-header"><h1>Settings</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div className="avatar avatar-lg" style={{ background: getAvatarColor(user?.name), width: 64, height: 64, fontSize: '1.5rem' }}>
            {getInitials(user?.name)}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <span className={`badge badge-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </div>
        </div>
        <div className="flex flex-col gap-lg">
          <div className="flex items-center gap-md">
            <User size={18} color="var(--text-muted)" />
            <div><div className="text-sm text-muted">Full Name</div><div>{user?.name}</div></div>
          </div>
          <div className="flex items-center gap-md">
            <Mail size={18} color="var(--text-muted)" />
            <div><div className="text-sm text-muted">Email</div><div>{user?.email}</div></div>
          </div>
          <div className="flex items-center gap-md">
            <Shield size={18} color="var(--text-muted)" />
            <div><div className="text-sm text-muted">Role</div><div style={{ textTransform: 'capitalize' }}>{user?.role?.toLowerCase()}</div></div>
          </div>
          <div className="flex items-center gap-md">
            <Calendar size={18} color="var(--text-muted)" />
            <div><div className="text-sm text-muted">Joined</div><div>{formatDate(user?.createdAt)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
