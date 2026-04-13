const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'gain', 'fee'],
    required: true,
  },
  asset: { type: String, required: true },   // e.g. 'BTC', 'ETH', 'USD'
  amount: { type: Number, required: true },
  amountUSD: { type: Number },
  note: { type: String },
  moonpayTransactionId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  createdAt: { type: Date, default: Date.now },
});

const holdingSchema = new mongoose.Schema({
  asset: { type: String, required: true },     // e.g. 'bitcoin'
  symbol: { type: String, required: true },    // e.g. 'BTC'
  amount: { type: Number, default: 0 },        // units held
  avgBuyPrice: { type: Number, default: 0 },   // average purchase price in USD
});

const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 8 },
  phone:        { type: String, trim: true },

  // Account
  accountNumber: { type: String, unique: true },
  kycVerified:   { type: Boolean, default: false },
  kycStatus:     { type: String, enum: ['none', 'under_review', 'approved', 'rejected'], default: 'none' },
  suspended:     { type: Boolean, default: false },
  twoFAEnabled:  { type: Boolean, default: false },
  twoFAVerified: { type: Boolean, default: false },
  role:          { type: String, enum: ['user', 'admin'], default: 'user' },

  // Portfolio
  cashBalanceUSD: { type: Number, default: 0 },
  holdings:       [holdingSchema],
  transactions:   [transactionSchema],

  watchlist: [{ type: String }],

  // Metadata
  createdAt:  { type: Date, default: Date.now },
  lastLogin:  { type: Date },
}, { timestamps: true });

// Auto-generate account number
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.accountNumber = 'BT' + Date.now().toString().slice(-8);
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
