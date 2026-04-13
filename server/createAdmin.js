/**
 * Run this once to create your admin account:
 *   node createAdmin.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  const existing = await User.findOne({ email: 'admin@bitforge.com' })
  if (existing) {
    console.log('Admin already exists! Email: admin@bitforge.com')
    process.exit(0)
  }

  const admin = await User.create({
    firstName: 'BitForge',
    lastName: 'Admin',
    email: 'admin@bitforge.com',
    password: 'Admin@BitForge2025',
    role: 'admin',
    kycVerified: true,
    kycStatus: 'approved',
  })

  console.log('✅ Admin created!')
  console.log('   Email:    admin@bitforge.com')
  console.log('   Password: Admin@BitForge2025')
  console.log('   Account:  ' + admin.accountNumber)
  process.exit(0)
}

createAdmin().catch(err => { console.error(err); process.exit(1) })
