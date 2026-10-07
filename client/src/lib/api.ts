import axios from 'axios';
import { API_URL } from './config';

export type Doc = Record<string, any>;

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e: any) =>
  e?.response?.data?.message ?? e?.message ?? 'Something went wrong. Try again.';

export const money = (n = 0) => '₹' + Number(n).toLocaleString('en-IN');
export const dateStr = (d?: string | Date) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');
export const today = () => new Date().toISOString().slice(0, 10);

export default api;
