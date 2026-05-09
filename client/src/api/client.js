const BASE_URL = '/api';

class ApiClient {
  getToken() {
    return localStorage.getItem('taskforge_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        config.headers.Authorization = `Bearer ${this.getToken()}`;
        const retry = await fetch(`${BASE_URL}${endpoint}`, config);
        if (!retry.ok) {
          const err = await retry.json().catch(() => ({}));
          throw new Error(err.error || 'Request failed');
        }
        return retry.json();
      }
      localStorage.removeItem('taskforge_token');
      localStorage.removeItem('taskforge_refresh');
      localStorage.removeItem('taskforge_user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }

    return res.json();
  }

  async tryRefresh() {
    const refresh = localStorage.getItem('taskforge_refresh');
    if (!refresh) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('taskforge_token', data.accessToken);
      localStorage.setItem('taskforge_refresh', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  get(endpoint) { return this.request(endpoint); }
  post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

export const api = new ApiClient();
