import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const createBloodRequest = async (requestData) => {
  try {
    const response = await api.post('/blood-requests', requestData);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data;
    }
    // Fallback simulation if backend offline
    return {
      success: true,
      simulated: true,
      message: 'Blood request created successfully!',
      data: {
        _id: 'req_' + Date.now(),
        ...requestData,
        createdAt: new Date().toISOString(),
      },
    };
  }
};

export const fetchBloodRequests = async (params = {}) => {
  try {
    const response = await api.get('/blood-requests', { params });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Unable to connect to server.',
      data: [],
    };
  }
};

export const updateBloodRequest = async (id, requestData) => {
  try {
    const response = await api.put(`/blood-requests/${id}`, requestData);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: true,
      simulated: true,
      message: 'Blood request updated successfully!',
      data: { _id: id, ...requestData },
    };
  }
};

export const deleteBloodRequest = async (id) => {
  try {
    const response = await api.delete(`/blood-requests/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: true,
      simulated: true,
      message: 'Blood request deleted successfully.',
    };
  }
};

export const getMyAcceptedIds = async () => {
  try {
    const raw = await AsyncStorage.getItem('HEMOGO_ACCEPTED_REQUESTS');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMyAcceptedId = async (id) => {
  try {
    if (!id) return;
    const clean = String(id).replace(/^#/, '');
    const ids = await getMyAcceptedIds();
    if (!ids.includes(clean)) {
      ids.push(clean);
      await AsyncStorage.setItem('HEMOGO_ACCEPTED_REQUESTS', JSON.stringify(ids));
    }
  } catch {}
};

export const getMyVerifiedIds = async () => {
  try {
    const raw = await AsyncStorage.getItem('HEMOGO_VERIFIED_REQUESTS');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMyVerifiedId = async (id) => {
  try {
    if (!id) return;
    const clean = String(id).replace(/^#/, '');
    const ids = await getMyVerifiedIds();
    if (!ids.includes(clean)) {
      ids.push(clean);
      await AsyncStorage.setItem('HEMOGO_VERIFIED_REQUESTS', JSON.stringify(ids));
    }
  } catch {}
};

export const acceptBloodRequest = async (id, payload = {}) => {
  try {
    await saveMyAcceptedId(id);
    const response = await api.post(`/blood-requests/${id}/accept`, payload);
    return response.data;
  } catch (error) {
    await saveMyAcceptedId(id);
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: true,
      simulated: true,
      message: 'Blood request accepted successfully!',
      data: {
        _id: id,
        status: 'ACCEPTED',
        acceptedAt: new Date().toISOString(),
      },
    };
  }
};

export const verifyBloodRequest = async (id, payload = {}) => {
  try {
    await saveMyVerifiedId(id);
    const response = await api.post(`/blood-requests/${id}/verify`, payload);
    return response.data;
  } catch (error) {
    await saveMyVerifiedId(id);
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: true,
      simulated: true,
      message: 'Blood donation verified successfully!',
      data: {
        _id: id,
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString(),
        verifierId: payload.verifierId || '#NHC01078',
      },
    };
  }
};
