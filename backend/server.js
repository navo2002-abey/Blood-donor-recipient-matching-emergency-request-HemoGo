const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
// Rashan's routes
const stockRoutes = require('./routes/stockRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const transferRoutes = require('./routes/transferRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const bloodBankRoutes = require('./routes/bloodBankRoutes');
// Teammate's routes
const bloodRequestRoutes = require('./routes/bloodRequestRoutes');
const requestSummaryRoutes = require('./routes/requestSummaryRoutes');
const matchRoutes = require('./routes/matchRoutes');

const seedUsers = require('./utils/seedUsers');
const seedBloodBanks = require('./utils/seedBloodBanks');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  console.error('Server start failed: JWT_SECRET is missing from backend/.env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HemoGo API is running',
  });
});

// -------------------- ROUTES --------------------
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/request-summaries', requestSummaryRoutes);
app.use('/api', matchRoutes);

// Blood Bank Officer + Advanced Features (Rashan's part)
app.use('/api/stock', stockRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/blood-banks', bloodBankRoutes);

// -------------------- 404 --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'This API endpoint was not found.',
  });
});

// -------------------- ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server. Please try again.',
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedUsers();
  await seedBloodBanks();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HemoGo API running on http://localhost:${PORT}`);
    console.log('Registered routes:');
    console.log('  /api/auth');
    console.log('  /api/admin');
    console.log('  /api/blood-requests');
    console.log('  /api/request-summaries');
    console.log('  /api/request-matches');
    console.log('  /api/best-donor-ai');
    console.log('  /api/stock');
    console.log('  /api/reservations');
    console.log('  /api/transfers');
    console.log('  /api/predictions');
    console.log('  /api/campaigns');
    console.log('  /api/blood-banks');
  });
};

startServer();