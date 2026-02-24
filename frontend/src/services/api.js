import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'dealer']);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getHighlyDemanded: () => api.get('/products/highly-demanded'),
  getPriceDrop: () => api.get('/products/price-drop'),
  getRecentlyViewed: () => api.get('/products/user/recently-viewed'),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (productId, quantity) => api.put(`/cart/update/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
  updateAddress: (data) => api.put('/cart/address', data),
};

// Orders
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
  getTracking: (id) => api.get(`/orders/${id}/tracking`),
  getInvoice: (id) => api.get(`/orders/${id}/invoice`),
  reorder: (id) => api.post(`/orders/${id}/reorder`),
};

// Returns
export const returnsAPI = {
  create: (data) => api.post('/returns', data),
  getAll: () => api.get('/returns'),
  getById: (id) => api.get(`/returns/${id}`),
  cancel: (id) => api.post(`/returns/${id}/cancel`),
};

// Issues
export const issuesAPI = {
  create: (data) => api.post('/issues', data),
  getAll: () => api.get('/issues'),
  getById: (id) => api.get(`/issues/${id}`),
  addComment: (id, message) => api.post(`/issues/${id}/comments`, { message }),
};

// Payments
export const paymentsAPI = {
  getSummary: () => api.get('/payments/summary'),
  getInvoices: (params) => api.get('/payments/invoices', { params }),
  pay: (data) => api.post('/payments/pay', data),
  getCards: () => api.get('/payments/cards'),
  addCard: (data) => api.post('/payments/cards', data),
  deleteCard: (id) => api.delete(`/payments/cards/${id}`),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  updateContact: (data) => api.put('/profile/contact', data),
  updateBank: (data) => api.put('/profile/bank', data),
  updatePassword: (data) => api.put('/profile/password', data),
  changePassword: (data) => api.put('/profile/password', data),
  updateNotifications: (data) => api.put('/profile/notifications', data),
  updateLanguage: (language) => api.put('/profile/language', { language }),
};

// Notifications
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Banners
export const bannersAPI = {
  getAll: () => api.get('/banners'),
};

// Support
export const supportAPI = {
  getConfig: () => api.get('/support/config'),
};

export default api;
