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
    name: 'Amal Silva',
    email: 'donor@hemogo.com',
    phone: '0770000002',
    password: 'Donor@123',
    role: 'DONOR',
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
      if (account.hospital && existing.hospital !== account.hospital) {
        existing.hospital = account.hospital;
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