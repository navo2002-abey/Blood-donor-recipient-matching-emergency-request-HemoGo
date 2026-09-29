const DEMO_DONORS = [
  { id: '1', name: 'Rashed Fernando', bloodGroup: 'A+', dLat: 0.016, dLng: 0.012, distanceKm: 2.3, hospital: 'Mobile Hospital', available: true },
  { id: '2', name: 'Nimesha Perera', bloodGroup: 'A+', dLat: -0.028, dLng: 0.022, distanceKm: 4.1, hospital: 'National Hospital', available: true },
  { id: '3', name: 'Kasun Silva', bloodGroup: 'A+', dLat: 0.034, dLng: -0.03, distanceKm: 5.8, hospital: 'City Hospital', available: true },
  { id: '4', name: 'Dilani Perera', bloodGroup: 'A+', dLat: 0.02, dLng: 0.048, distanceKm: 6.2, hospital: 'Colombo General Hospital', available: true },
  { id: '5', name: 'Tharindu Silva', bloodGroup: 'A+', dLat: -0.012, dLng: 0.058, distanceKm: 6.8, hospital: 'National Hospital', available: true },
  { id: '6', name: 'Sajith Kumar', bloodGroup: 'A+', dLat: 0.052, dLng: 0.028, distanceKm: 7.1, hospital: 'City Hospital', available: true },
  { id: '7', name: 'Menaka Dias', bloodGroup: 'A+', dLat: -0.048, dLng: 0.04, distanceKm: 7.6, hospital: 'Mobile Hospital', available: true },
  { id: '8', name: 'Hasini Wick', bloodGroup: 'A+', dLat: 0.018, dLng: -0.068, distanceKm: 8.0, hospital: 'National Hospital', available: true },
  { id: '9', name: 'Chamath Lee', bloodGroup: 'A+', dLat: 0.06, dLng: -0.036, distanceKm: 8.4, hospital: 'City Hospital', available: true },
  { id: '10', name: 'Pavithra Gomez', bloodGroup: 'A+', dLat: -0.04, dLng: -0.062, distanceKm: 8.9, hospital: 'Colombo General Hospital', available: true },
  { id: '11', name: 'Lakshan Madu', bloodGroup: 'A+', dLat: 0.07, dLng: 0.03, distanceKm: 9.2, hospital: 'Mobile Hospital', available: true },
  { id: '12', name: 'Anjali Fernando', bloodGroup: 'A+', dLat: -0.055, dLng: 0.058, distanceKm: 9.6, hospital: 'National Hospital', available: true },
  { id: '13', name: 'Nuwan Thilak', bloodGroup: 'O+', dLat: 0.042, dLng: -0.08, distanceKm: 10.1, hospital: 'City Hospital', available: true },
  { id: '14', name: 'Ishara Jay', bloodGroup: 'B+', dLat: -0.07, dLng: -0.05, distanceKm: 10.8, hospital: 'Colombo General Hospital', available: false },
];

export const COLOMBO = { latitude: 6.9271, longitude: 79.8612 };

export const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const getNearbyDonors = (center) =>
  DEMO_DONORS.map((donor) => ({
    id: donor.id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    distanceKm: donor.distanceKm,
    hospital: donor.hospital,
    available: donor.available,
    latitude: center.latitude + donor.dLat,
    longitude: center.longitude + donor.dLng,
  }));
