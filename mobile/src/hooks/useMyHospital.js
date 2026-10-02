import { useAuth } from '../context/AuthContext';

const FALLBACK = 'Colombo General Hospital Blood Bank';

export const useMyHospital = () => {
  const { user } = useAuth();
  return user?.hospital || FALLBACK;
};