import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { getInitials, getAvatarColor } from '../../hooks/useApi';
import { LayoutDashboard, FolderKanban, Settings, LogOut, Menu, X, Zap, ArrowLeft, Shield } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { 
    try { await api.post('/auth/logout'); } catch (e) {}
    logout(); 
    navigate('/login'); 
  };
  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/projects', icon: <FolderKanban size={20} />, label: 'Projects' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ to: '/admin', icon: <Shield size={20} />, label: 'Command Center' });
  }

  const isHome = location.pathname === '/dashboard';

  return (
    <div className="app-layout">
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link to="/dashboard" className="sidebar-header" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Zap size={24} color="var(--primary)" />
          <span className="logo">TaskForge</span>
        </Link>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to} to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" style={{ background: getAvatarColor(user?.name) }}>
              {getInitials(user?.name)}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role?.toLowerCase()}</div>
            </div>
            <button className="btn-ghost btn-icon" onClick={handleLogout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-ghost btn-icon mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {!isHome && (
              <button className="btn-back" onClick={() => navigate(-1)} title="Go Back">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
            )}
          </div>
          <div className="topbar-actions">
            <span className="text-sm text-muted">Welcome, {user?.name?.split(' ')[0]}</span>
            <div className="avatar avatar-sm" style={{ background: getAvatarColor(user?.name) }}>
              {getInitials(user?.name)}
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {sidebarOpen && <div className="modal-overlay" style={{ zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
