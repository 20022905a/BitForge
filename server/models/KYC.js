const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Personal info
  firstName:   { type: String, required: true },
  lastName:    { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  nationality: { type: String, required: true },
  address:     { type: String, required: true },
  city:        { type: String, required: true },
  country:     { type: String, required: true },
  zipCode:     { type: String, required: true },

  // Document
  documentType:   { type: String, enum: ['passport', 'drivers_license', 'national_id'], required: true },
  documentNumber: { type: String, required: true },
  documentFront:  { type: String }, // base64 or filename
  documentBack:   { type: String },
  selfie:         { type: String },

  // Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: { type: String },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:      { type: Date },
  submittedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);
