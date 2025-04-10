import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'lawyer', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  consultations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  }],
  profile: {
    avatar: String,
    bio: String,
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  preferences: {
    language: { type: String, default: 'en' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
  },
  verification: {
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      documentType: String,
      documentNumber: String
    }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    lastPasswordChange: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLogin: Date,
    accountLockedUntil: Date
  },
  activity: {
    lastLogin: Date,
    lastActive: Date,
    loginHistory: [{
      date: Date,
      ip: String,
      device: String,
      location: String
    }]
  },
  subscriptions: [{
    plan: { type: String, enum: ['free', 'basic', 'premium'] },
    startDate: Date,
    endDate: Date,
    status: { type: String, enum: ['active', 'expired', 'cancelled'] },
    autoRenew: Boolean
  }],
  wallet: {
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    transactions: [{
      type: { type: String, enum: ['credit', 'debit'] },
      amount: Number,
      description: String,
      reference: String,
      status: { type: String, enum: ['pending', 'completed', 'failed'] },
      createdAt: Date
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  metadata: {
    signupSource: String,
    referralCode: String,
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tags: [String]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 