const DEMO_DONORS = [
  { id: '1', name: 'Rashed Fernando', bloodGroup: 'A+', phone: '+94 77 123 4567', dLat: 0.016, dLng: 0.012, distanceKm: 2.3, hospital: 'Mobile Hospital', available: true, gender: 'Male', age: 28, area: 'Colombo 07', address: 'No. 12, Park Road, Colombo 07, Sri Lanka' },
  { id: '2', name: 'Nimesha Perera', bloodGroup: 'A+', phone: '+94 77 234 5678', dLat: -0.028, dLng: 0.022, distanceKm: 4.1, hospital: 'National Hospital', available: true, gender: 'Female', age: 26, area: 'Colombo 08', address: 'No. 45, Havelock Road, Colombo 08, Sri Lanka' },
  { id: '3', name: 'Kasun Silva', bloodGroup: 'A+', phone: '+94 71 345 6789', dLat: 0.034, dLng: -0.03, distanceKm: 5.8, hospital: 'City Hospital', available: true, gender: 'Male', age: 31, area: 'Colombo 05', address: 'No. 18, Galle Road, Colombo 05, Sri Lanka' },
  { id: '4', name: 'Dilani Perera', bloodGroup: 'A+', phone: '+94 76 456 7890', dLat: 0.02, dLng: 0.048, distanceKm: 6.2, hospital: 'Colombo General Hospital', available: true, gender: 'Female', age: 24, area: 'Colombo 10', address: 'No. 7, Regent Street, Colombo 10, Sri Lanka' },
  { id: '5', name: 'Tharindu Silva', bloodGroup: 'A+', phone: '+94 75 567 8901', dLat: -0.012, dLng: 0.058, distanceKm: 6.8, hospital: 'National Hospital', available: true, gender: 'Male', age: 29, area: 'Colombo 06', address: 'No. 22, Duplication Road, Colombo 06, Sri Lanka' },
  { id: '6', name: 'Sajith Kumar', bloodGroup: 'A+', phone: '+94 77 678 9012', dLat: 0.052, dLng: 0.028, distanceKm: 7.1, hospital: 'City Hospital', available: true, gender: 'Male', age: 34, area: 'Colombo 04', address: 'No. 9, Bauddhaloka Mawatha, Colombo 04, Sri Lanka' },
  { id: '7', name: 'Menaka Dias', bloodGroup: 'A+', phone: '+94 71 789 0123', dLat: -0.048, dLng: 0.04, distanceKm: 7.6, hospital: 'Mobile Hospital', available: true, gender: 'Female', age: 27, area: 'Colombo 03', address: 'No. 14, Kollupitiya Road, Colombo 03, Sri Lanka' },
  { id: '8', name: 'Hasini Wick', bloodGroup: 'A+', phone: '+94 76 890 1234', dLat: 0.018, dLng: -0.068, distanceKm: 8.0, hospital: 'National Hospital', available: true, gender: 'Female', age: 25, area: 'Colombo 07', address: 'No. 31, Flower Road, Colombo 07, Sri Lanka' },
  { id: '9', name: 'Chamath Lee', bloodGroup: 'A+', phone: '+94 75 901 2345', dLat: 0.06, dLng: -0.036, distanceKm: 8.4, hospital: 'City Hospital', available: true, gender: 'Male', age: 30, area: 'Colombo 02', address: 'No. 5, York Street, Colombo 02, Sri Lanka' },
  { id: '10', name: 'Pavithra Gomez', bloodGroup: 'A+', phone: '+94 77 012 3456', dLat: -0.04, dLng: -0.062, distanceKm: 8.9, hospital: 'Colombo General Hospital', available: true, gender: 'Female', age: 23, area: 'Colombo 13', address: 'No. 16, Jampettah Street, Colombo 13, Sri Lanka' },
  { id: '11', name: 'Lakshan Madu', bloodGroup: 'A+', phone: '+94 71 123 6789', dLat: 0.07, dLng: 0.03, distanceKm: 9.2, hospital: 'Mobile Hospital', available: true, gender: 'Male', age: 32, area: 'Colombo 15', address: 'No. 28, Modera Street, Colombo 15, Sri Lanka' },
  { id: '12', name: 'Anjali Fernando', bloodGroup: 'A+', phone: '+94 76 234 7890', dLat: -0.055, dLng: 0.058, distanceKm: 9.6, hospital: 'National Hospital', available: true, gender: 'Female', age: 29, area: 'Colombo 05', address: 'No. 11, Thimbirigasyaya Road, Colombo 05, Sri Lanka' },
  { id: '13', name: 'Nuwan Thilak', bloodGroup: 'O+', phone: '+94 75 345 8901', dLat: 0.042, dLng: -0.08, distanceKm: 10.1, hospital: 'City Hospital', available: true, gender: 'Male', age: 36, area: 'Dehiwala', address: 'No. 40, Galle Road, Dehiwala, Sri Lanka' },
  { id: '14', name: 'Ishara Jay', bloodGroup: 'B+', phone: '+94 77 456 9012', dLat: -0.07, dLng: -0.05, distanceKm: 10.8, hospital: 'Colombo General Hospital', available: false, gender: 'Female', age: 27, area: 'Borella', address: 'No. 8, Cotta Road, Borella, Sri Lanka' },
];

export const COLOMBO = { latitude: 6.9271, longitude: 79.8612 };

export const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const getNearbyDonors = (center) =>
  DEMO_DONORS.map((donor) => ({
    id: donor.id,
    name: donor.name,
    bloodGroup: donor.bloodGroup,
    phone: donor.phone,
    distanceKm: donor.distanceKm,
    hospital: donor.hospital,
    available: donor.available,
    gender: donor.gender,
    age: donor.age,
    area: donor.area,
    address: donor.address,
    latitude: center.latitude + donor.dLat,
    longitude: center.longitude + donor.dLng,
  }));
