import api from './api';

export const fetchAdminReport = async () => {
  const { data } = await api.get('/admin/reports');
  return data.report;
};

export const fetchAdminUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data.users || [];
};

export const createAdminUser = async (payload) => {
  const { data } = await api.post('/admin/users', payload);
  return data.user;
};

export const updateAdminUser = async (id, payload) => {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data.user;
};
