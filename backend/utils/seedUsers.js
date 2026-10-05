const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEMO_USERS = [
  {
    name: 'Anusha Fernando',
    email: 'admin@hemogo.com',
    phone: '0770000001',
    password: 'Admin@123',
    role: 'ADMIN',
    hospital: 'HemoGo National Network',
  },
  {
    name: 'Amal Perera',
    email: 'amal.donor@hemogo.com',
    phone: '0771234567',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'AB-',
    area: 'Kalubowila, Colombo',
    hospital: 'Colombo South Teaching Hospital (Kalubowila)',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Rashed Fernando',
    email: 'rashed.donor@hemogo.com',
    phone: '0772345678',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'A+',
    area: 'Colombo 07',
    hospital: 'National Hospital of Sri Lanka (Colombo)',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Nimesha Perera',
    email: 'nimesha.donor@hemogo.com',
    phone: '0773456789',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'O-',
    area: 'Colombo 08',
    hospital: 'Lady Ridgeway Hospital (LRH)',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Kasun Silva',
    email: 'kasun.donor@hemogo.com',
    phone: '0713456789',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'B+',
    area: 'Colombo 05',
    hospital: 'Sri Jayewardenepura General Hospital',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Dilani Perera',
    email: 'dilani.donor@hemogo.com',
    phone: '0764567890',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'A-',
    area: 'Colombo 10',
    hospital: 'National Hospital Colombo',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Tharindu Silva',
    email: 'tharindu.donor@hemogo.com',
    phone: '0755678901',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'AB+',
    area: 'Colombo 06',
    hospital: 'Colombo South Teaching Hospital (Kalubowila)',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Sajith Kumar',
    email: 'sajith.donor@hemogo.com',
    phone: '0776789012',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'O+',
    area: 'Colombo 04',
    hospital: 'National Hospital of Sri Lanka (Colombo)',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Menaka Dias',
    email: 'menaka.donor@hemogo.com',
    phone: '0717890123',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'B-',
    area: 'Colombo 03',
    hospital: 'Castle Street Hospital for Women',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  },
  // Default general donor
  {
    name: 'Amal Silva',
    email: 'donor@hemogo.com',
    phone: '0770000002',
    password: 'Donor@123',
    role: 'DONOR',
    bloodGroup: 'O+',
    area: 'Colombo',
    hospital: null,
  },
  // Officer 1 — Colombo General
  {
    name: 'Nimal Perera',
    email: 'officer@hemogo.com',
    phone: '0770000003',
    password: 'Officer@123',
    role: 'BLOOD_BANK_OFFICER',
    hospital: 'Colombo General Hospital Blood Bank',
  },
  // Officer 2 — National Hospital Colombo
  {
    name: 'Priya Jayawardena',
    email: 'officer.national@hemogo.com',
    phone: '0770000004',
    password: 'Officer@123',
    role: 'BLOOD_BANK_OFFICER',
    hospital: 'National Hospital Colombo Blood Bank',
  },
  // Officer 3 — Kandy
  {
    name: 'Rohan Silva',
    email: 'officer.kandy@hemogo.com',
    phone: '0770000005',
    password: 'Officer@123',
    role: 'BLOOD_BANK_OFFICER',
    hospital: 'Kandy Teaching Hospital Blood Bank',
  },
];

const seedUsers = async () => {
  for (const account of DEMO_USERS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      // Update name + hospital in case they changed
      let changed = false;
      if (existing.name !== account.name) {
        existing.name = account.name;
        changed = true;
      }
      if (account.bloodGroup && existing.bloodGroup !== account.bloodGroup) {
        existing.bloodGroup = account.bloodGroup;
        changed = true;
      }
      if (account.area && existing.area !== account.area) {
        existing.area = account.area;
        changed = true;
      }
      if (account.avatar && existing.avatar !== account.avatar) {
        existing.avatar = account.avatar;
        changed = true;
      }
      if (account.isAvailable !== undefined && existing.isAvailable !== account.isAvailable) {
        existing.isAvailable = account.isAvailable;
        changed = true;
      }
      if (changed) await existing.save();
      continue;
    }

    const hashedPassword = await bcrypt.hash(account.password, 12);
    await User.create({
      ...account,
      password: hashedPassword,
    });
    console.log(`Seeded ${account.role} account: ${account.email}`);
  }
};

module.exports = seedUsers;