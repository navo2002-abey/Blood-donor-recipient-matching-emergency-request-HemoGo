const BloodBank = require('../models/BloodBank');

const DEMO_BANKS = [
  {
    name: 'Colombo General Hospital Blood Bank',
    address: 'No 45, Baseline Road, Colombo 08, Sri Lanka',
    contact: '+94 11 269 1111',
    location: { latitude: 6.9271, longitude: 79.8612 },
    operatingHours: 'Open 24 Hours • 7 Days a Week',
    verified: true,
  },
  {
    name: 'National Hospital Colombo Blood Bank',
    address: 'Colombo 10, Sri Lanka',
    contact: '+94 11 269 1111',
    location: { latitude: 6.9218, longitude: 79.8651 },
    operatingHours: 'Open 24 Hours • 7 Days a Week',
    verified: true,
  },
  {
    name: 'Kandy Teaching Hospital Blood Bank',
    address: 'Kandy, Sri Lanka',
    contact: '+94 81 222 2261',
    location: { latitude: 7.2906, longitude: 80.6337 },
    operatingHours: 'Open 24 Hours • 7 Days a Week',
    verified: true,
  },
  {
    name: 'Galle General Hospital Blood Bank',
    address: 'Galle, Sri Lanka',
    contact: '+94 91 222 2261',
    location: { latitude: 6.0535, longitude: 80.2210 },
    operatingHours: '8.00 AM – 8.00 PM',
    verified: true,
  },
];

const seedBloodBanks = async () => {
  try {
    const count = await BloodBank.countDocuments();
    if (count === 0) {
      await BloodBank.insertMany(DEMO_BANKS);
      console.log(`Seeded ${DEMO_BANKS.length} blood banks`);
    } else {
      console.log(`Blood banks already present (${count}). Skipping seed.`);
    }
  } catch (error) {
    console.error('Blood bank seed failed:', error.message);
  }
};

module.exports = seedBloodBanks;