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

export const getCoaches = async () => {
  const res = await apiClient.get('coaches');
  return res.data;
};

export const bookCoach = async (coachId, startDate) => {
  const payload = {};
  if (startDate) payload.startDate = startDate;
  const res = await apiClient.post(`coaches/${coachId}/book`, payload);
  return res.data;
};

export const createCoach = async (coach) => {
  const res = await apiClient.post('coaches', coach);
  return res.data;
};

export const updateCoach = async (id, coach) => {
  const res = await apiClient.put(`coaches/${id}`, coach);
  return res.data;
};

export const deleteCoach = async (id) => {
  const res = await apiClient.delete(`coaches/${id}`);
  return res.data;
};

export const getMyCoachBookings = async () => {
  const res = await apiClient.get('coaches/my/bookings');
  return res.data;
};

// Note: coaches use direct purchase via `bookCoach`; cart/checkout flow removed.

export const approveCoachBooking = async (bookingId) => {
  const res = await apiClient.post(`coaches/bookings/${bookingId}/approve`);
  return res.data;
};

export const rejectCoachBooking = async (bookingId) => {
  const res = await apiClient.post(`coaches/bookings/${bookingId}/reject`);
  return res.data;
};

export const getAllCoachBookings = async (params) => {
  const res = await apiClient.get('coaches/bookings', { params });
  return res.data;
};