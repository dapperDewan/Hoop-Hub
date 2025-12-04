import axios from 'axios';

const rawBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
const normalizedBase = rawBase.replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: `${normalizedBase}/`,
  withCredentials: false
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;