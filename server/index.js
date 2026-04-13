require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const priceRoutes = require('./routes/prices');
const moonpayRoutes = require('./routes/moonpay');
const portfolioRoutes = require('./routes/portfolio');
const kycRoutes = require('./routes/kyc');
const adminRoutes = require('./routes/admin');

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/user',      userRoutes);
app.use('/api/prices',    priceRoutes);
app.use('/api/moonpay',   moonpayRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/kyc',       kycRoutes);
app.use('/api/admin',     adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Database ─────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
