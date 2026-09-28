const DEMO_DONORS = [
  { id: '1', name: 'Kasun Perera', bloodGroup: 'O+', dLat: 0.0042, dLng: 0.0031 },
  { id: '2', name: 'Nimali Silva', bloodGroup: 'A+', dLat: -0.0036, dLng: 0.0054 },
  { id: '3', name: 'Ruwan Fernando', bloodGroup: 'B+', dLat: 0.0061, dLng: -0.0028 },
  { id: '4', name: 'Ishara Jay', bloodGroup: 'O-', dLat: -0.0052, dLng: -0.0044 },
  { id: '5', name: 'Dilani Perera', bloodGroup: 'AB+', dLat: 0.0024, dLng: 0.0068 },
  { id: '6', name: 'Tharindu Silva', bloodGroup: 'A-', dLat: -0.0018, dLng: 0.0022 },
  { id: '7', name: 'Sajith Kumar', bloodGroup: 'O+', dLat: 0.0074, dLng: 0.0011 },
  { id: '8', name: 'Menaka Dias', bloodGroup: 'B-', dLat: -0.0066, dLng: 0.0038 },
  { id: '9', name: 'Hasini Wick', bloodGroup: 'A+', dLat: 0.0012, dLng: -0.0059 },
  { id: '10', name: 'Chamath Lee', bloodGroup: 'O+', dLat: 0.0048, dLng: -0.0062 },
  { id: '11', name: 'Pavithra G', bloodGroup: 'AB-', dLat: -0.0029, dLng: -0.0016 },
  { id: '12', name: 'Lakshan M', bloodGroup: 'B+', dLat: 0.0055, dLng: 0.0047 },
  { id: '13', name: 'Anjali F', bloodGroup: 'O-', dLat: -0.0041, dLng: 0.0071 },
  { id: '14', name: 'Nuwan T', bloodGroup: 'A+', dLat: 0.0033, dLng: -0.0034 },
];

export const COLOMBO = { latitude: 6.9271, longitude: 79.8612 };

export const getNearbyDonors = (center) =>
  DEMO_DONORS.map((donor) => ({
    id: donor.id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    latitude: center.latitude + donor.dLat,
    longitude: center.longitude + donor.dLng,
  }));
