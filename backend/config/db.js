const dns = require('dns');
const mongoose = require('mongoose');

dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MongoDB connection failed: MONGO_URI is missing from backend/.env');
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    if (String(error.message).includes('querySrv') || String(error.message).includes('ENOTFOUND')) {
      console.error(
        'DNS could not reach Atlas. Use a standard mongodb:// host list in MONGO_URI, not mongodb+srv://.'
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
