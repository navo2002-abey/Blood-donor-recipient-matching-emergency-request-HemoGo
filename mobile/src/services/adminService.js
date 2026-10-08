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

export const fetchAdminBloodRequests = async (params = {}) => {
  const { data } = await api.get('/admin/blood-requests', { params });
  return data;
};

export const updateAdminBloodRequest = async (id, payload) => {
  const { data } = await api.put(`/admin/blood-requests/${id}`, payload);
  return data;
};

export const assignDonorToBloodRequest = async (id, donorId) => {
  const { data } = await api.post(`/admin/blood-requests/${id}/assign-donor`, { donorId });
  return data;
};

export const overrideBloodRequestStatus = async (id, status, adminNotes = '') => {
  const { data } = await api.post(`/admin/blood-requests/${id}/override-status`, { status, adminNotes });
  return data;
};

export const deleteAdminBloodRequest = async (id) => {
  const { data } = await api.delete(`/admin/blood-requests/${id}`);
  return data;
};
