const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEMO_USERS = [
  {
    name: 'Anusha Fernando',
    email: 'admin@hemogo.com',
    phone: '0770000001',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  {
    name: 'Amal Silva',
    email: 'donor@hemogo.com',
    phone: '0770000002',
    password: 'Donor@123',
    role: 'DONOR',
  },
  {
    name: 'Dr. Nimal Perera',
    email: 'officer@hemogo.com',
    phone: '0770000003',
    password: 'Officer@123',
    role: 'BLOOD_BANK_OFFICER',
  },
];

const seedUsers = async () => {
  for (const account of DEMO_USERS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      if (existing.name !== account.name) {
        existing.name = account.name;
        await existing.save();
      }
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
