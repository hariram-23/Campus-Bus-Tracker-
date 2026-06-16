// ===== API Helper =====
const API_BASE = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('cbt_token'); }
function getUser() { return JSON.parse(localStorage.getItem('cbt_user') || 'null'); }
function setAuth(token, user) {
  localStorage.setItem('cbt_token', token);
  localStorage.setItem('cbt_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('cbt_token');
  localStorage.removeItem('cbt_user');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  auth: {
    studentRegister: (body) => apiRequest('/auth/student/register', { method: 'POST', body: JSON.stringify(body) }),
    studentLogin: (body) => apiRequest('/auth/student/login', { method: 'POST', body: JSON.stringify(body) }),
    driverLogin: (body) => apiRequest('/auth/driver/login', { method: 'POST', body: JSON.stringify(body) }),
    adminLogin: (body) => apiRequest('/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  },
  buses: {
    getAll: () => apiRequest('/buses'),
    getById: (id) => apiRequest(`/buses/${id}`),
    getLive: () => apiRequest('/buses/live'),
    getLocation: (id) => apiRequest(`/buses/${id}/location`),
    create: (body) => apiRequest('/buses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/buses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => apiRequest(`/buses/${id}`, { method: 'DELETE' }),
  },
  routes: {
    getAll: () => apiRequest('/routes'),
    getById: (id) => apiRequest(`/routes/${id}`),
    create: (body) => apiRequest('/routes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => apiRequest(`/routes/${id}`, { method: 'DELETE' }),
  },
  trips: {
    start: () => apiRequest('/trips/start', { method: 'POST' }),
    end: () => apiRequest('/trips/end', { method: 'POST' }),
    updateLocation: (body) => apiRequest('/trips/location', { method: 'POST', body: JSON.stringify(body) }),
    history: () => apiRequest('/trips/history'),
    eta: (busId, stopId) => apiRequest(`/trips/eta/${busId}/${stopId}`),
    analytics: () => apiRequest('/trips/analytics'),
  },
  drivers: {
    getAll: () => apiRequest('/drivers'),
    create: (body) => apiRequest('/drivers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => apiRequest(`/drivers/${id}`, { method: 'DELETE' }),
  }
};

// ===== Toast Notifications =====
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', warning: '⚠️', danger: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-msg">${message}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ===== Auth Guard =====
function requireAuth(role) {
  const user = getUser();
  const token = getToken();
  if (!token || !user) {
    window.location.href = 'login.html';
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = 'login.html';
    return false;
  }
  return user;
}

function logout() {
  clearAuth();
  window.location.href = 'index.html';
}
