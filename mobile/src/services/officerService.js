import api from './api';

export const stockService = {
  list: (params) => api.get('/stock', { params }),
  get: (id) => api.get(`/stock/${id}`),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  remove: (id) => api.delete(`/stock/${id}`),
  expiring: (days = 7) => api.get('/stock/expiring', { params: { days } }),
};

export const reservationService = {
  list: (params) => api.get('/reservations', { params }),
  create: (data) => api.post('/reservations', data),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  remove: (id) => api.delete(`/reservations/${id}`),
};

export const transferService = {
  list: (params) => api.get('/transfers', { params }),
  create: (data) => api.post('/transfers', data),
  update: (id, data) => api.put(`/transfers/${id}`, data),
  remove: (id) => api.delete(`/transfers/${id}`),
};

export const predictionService = {
  list: () => api.get('/predictions'),
};

export const campaignService = {
  list: () => api.get('/campaigns'),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  remove: (id) => api.delete(`/campaigns/${id}`),
};

export const bloodBankService = {
  list: () => api.get('/blood-banks'),
  get: (id) => api.get(`/blood-banks/${id}`),
};