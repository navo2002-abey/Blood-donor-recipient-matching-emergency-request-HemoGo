export const ROLES = {
  DONOR: 'DONOR',
  PATIENT_FAMILY: 'PATIENT_FAMILY',
  BLOOD_BANK_OFFICER: 'BLOOD_BANK_OFFICER',
  ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
  DONOR: 'Donor',
  PATIENT_FAMILY: 'Patient / Family',
  BLOOD_BANK_OFFICER: 'Blood Bank Officer',
  ADMIN: 'System Admin',
};

export const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@hemogo.com', password: 'Admin@123' },
  { role: 'Donor', email: 'donor@hemogo.com', password: 'Donor@123' },
  { role: 'Blood Bank Officer', email: 'officer@hemogo.com', password: 'Officer@123' },
];

export const DONOR_MENU = [
  { key: 'Dashboard', tab: 'Home' },
  { key: 'Find Donors', screen: 'FindDonors' },
  { key: 'Request Blood', screen: 'AvailableDonors' },
  { key: 'History' },
  { key: 'Live Map', tab: 'Map' },
  { key: 'Rewards', tab: 'Rewards' },
  { key: 'Profile & Settings', tab: 'Profile' },
  { key: 'Notifications' },
  { key: 'Help & Support' },
];

export const ADMIN_MENU = [
  { key: 'Admin Dashboard', tab: 'Home' },
  { key: 'Manage Users', tab: 'Users' },
  { key: 'Blood Banks' },
  { key: 'Emergency Requests', tab: 'Requests' },
  { key: 'Reports & Analytics', tab: 'Reports' },
  { key: 'Donor Verification' },
  { key: 'Notifications' },
  { key: 'Settings', tab: 'Profile' },
];

export const OFFICER_MENU = [
  { key: 'Inventory Dashboard', tab: 'Home' },
  { key: 'Expiry Monitoring', tab: 'Alerts' },
  { key: 'AI Shortage Prediction' },
  { key: 'Smart Blood Rescue' },
  { key: 'Nearby Blood Bank Stock', tab: 'Stock' },
  { key: 'QR Scan' },
  { key: 'Emergency Alerts & Logs', tab: 'Requests' },
  { key: 'Settings', tab: 'Profile' },
];

export const PATIENT_MENU = [
  { key: 'Dashboard', tab: 'Home' },
  { key: 'Create Request', tab: 'Requests' },
  { key: 'Find Donors', screen: 'FindDonors' },
  { key: 'My Requests', tab: 'Requests' },
  { key: 'Profile & Settings', tab: 'Profile' },
  { key: 'Help & Support' },
];
