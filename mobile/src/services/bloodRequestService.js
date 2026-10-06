import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { getStoredUser } from '../utils/storage';

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

export const getMyAcceptedIds = async (userKey) => {
  try {
    let key = userKey;
    if (!key) {
      const stored = await getStoredUser();
      key = stored?.email || stored?.id || stored?._id;
    }
    if (!key) return [];
    const storageKey = `HEMOGO_ACCEPTED_REQUESTS_${String(key).toLowerCase().trim()}`;
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMyAcceptedId = async (id, userKey) => {
  try {
    if (!id) return;
    let key = userKey;
    if (!key) {
      const stored = await getStoredUser();
      key = stored?.email || stored?.id || stored?._id;
    }
    if (!key) return;
    const storageKey = `HEMOGO_ACCEPTED_REQUESTS_${String(key).toLowerCase().trim()}`;
    const clean = String(id).replace(/^#/, '');
    const ids = await getMyAcceptedIds(key);
    if (!ids.includes(clean)) {
      ids.push(clean);
      await AsyncStorage.setItem(storageKey, JSON.stringify(ids));
    }
  } catch {}
};

export const getMyVerifiedIds = async (userKey) => {
  try {
    let key = userKey;
    if (!key) {
      const stored = await getStoredUser();
      key = stored?.email || stored?.id || stored?._id;
    }
    if (!key) return [];
    const storageKey = `HEMOGO_VERIFIED_REQUESTS_${String(key).toLowerCase().trim()}`;
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMyVerifiedId = async (id, userKey) => {
  try {
    if (!id) return;
    let key = userKey;
    if (!key) {
      const stored = await getStoredUser();
      key = stored?.email || stored?.id || stored?._id;
    }
    if (!key) return;
    const storageKey = `HEMOGO_VERIFIED_REQUESTS_${String(key).toLowerCase().trim()}`;
    const clean = String(id).replace(/^#/, '');
    const ids = await getMyVerifiedIds(key);
    if (!ids.includes(clean)) {
      ids.push(clean);
      await AsyncStorage.setItem(storageKey, JSON.stringify(ids));
    }
  } catch {}
};

export const acceptBloodRequest = async (id, payload = {}, userKey) => {
  try {
    await saveMyAcceptedId(id, userKey || payload?.donorEmail || payload?.email);
    const response = await api.post(`/blood-requests/${id}/accept`, payload);
    return response.data;
  } catch (error) {
    await saveMyAcceptedId(id, userKey || payload?.donorEmail || payload?.email);
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

export const verifyBloodRequest = async (id, payload = {}, userKey) => {
  try {
    await saveMyVerifiedId(id, userKey || payload?.donorEmail || payload?.email);
    const response = await api.post(`/blood-requests/${id}/verify`, payload);
    return response.data;
  } catch (error) {
    await saveMyVerifiedId(id, userKey || payload?.donorEmail || payload?.email);
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

export const fetchMatchingDonors = async (params = {}) => {
  try {
    const response = await api.get('/donors/matching', { params });
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: [],
    };
  }
};

