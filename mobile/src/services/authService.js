import api from './api';
import { clearSession, saveSession } from '../utils/storage';

export const registerUser = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  await saveSession(data.token, data.user);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  await saveSession(data.token, data.user);
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const logoutUser = async () => {
  await clearSession();
};

export const updateProfile = async (payload) => {
  const { data } = await api.patch('/auth/profile', payload);
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await api.patch('/auth/password', payload);
  return data;
};

export const forgotPassword = async (payload) => {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
};

export const socialLoginUser = async (payload) => {
  const { data } = await api.post('/auth/social', payload);
  if (data.token && data.user) {
    await saveSession(data.token, data.user);
  }
  return data;
};
