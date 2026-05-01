// API Client para Trading Bot App
const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'http://localhost:5000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
});

const api = {
  // ==================== AUTH ====================
  signup: async (email, password, name, referralCode = '') => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, name, referralCode }),
    });
    return res.json();
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // ==================== BOTS ====================
  getBots: async () => {
    const res = await fetch(`${API_BASE}/bots`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  getBot: async (botId) => {
    const res = await fetch(`${API_BASE}/bots/${botId}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  createBot: async (botData) => {
    const res = await fetch(`${API_BASE}/bots`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(botData),
    });
    return res.json();
  },

  updateBot: async (botId, botData) => {
    const res = await fetch(`${API_BASE}/bots/${botId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(botData),
    });
    return res.json();
  },

  deleteBot: async (botId) => {
    const res = await fetch(`${API_BASE}/bots/${botId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // ==================== BROKERS ====================
  connectBroker: async (brokerData) => {
    const res = await fetch(`${API_BASE}/brokers/connect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(brokerData),
    });
    return res.json();
  },

  getBrokers: async () => {
    const res = await fetch(`${API_BASE}/brokers`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  disconnectBroker: async (connectionId) => {
    const res = await fetch(`${API_BASE}/brokers/${connectionId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  // ==================== MARKETPLACE ====================
  getTemplates: async () => {
    const res = await fetch(`${API_BASE}/marketplace/templates`);
    return res.json();
  },

  getTemplate: async (templateId) => {
    const res = await fetch(`${API_BASE}/marketplace/templates/${templateId}`);
    return res.json();
  },

  // ==================== PAYMENTS ====================
  startCheckout: async (botTemplateId) => {
    const res = await fetch(`${API_BASE}/payments/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ botTemplateId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
    return data;
  },

  // ==================== HELPER ====================
  setToken: (token) => {
    localStorage.setItem('token', token);
  },

  getToken: () => localStorage.getItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token'),
};

export default api;
