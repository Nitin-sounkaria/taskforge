import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useApi';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><Zap size={40} color="var(--primary)" /></div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your TaskForge account</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
              placeholder="Email Address" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" className={`form-input${errors.password ? ' error' : ''}`}
              placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>
          {errors.submit && <div className="form-error mb-2">{errors.submit}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
