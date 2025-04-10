const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/turn2law';

// Define schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['user', 'lawyer', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  consultations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }]
}, { timestamps: true });

const lawyerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  languages: [{ type: String, required: true }],
  experience: { type: Number, required: true },
  location: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  availability: {
    isAvailable: { type: Boolean, default: true },
    workingHours: {
      start: { type: String },
      end: { type: String }
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    reviews: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String },
      consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Create models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Lawyer = mongoose.models.Lawyer || mongoose.model('Lawyer', lawyerSchema);

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Lawyer.deleteMany({});
    console.log('Cleared existing data');

    // Create test users
    const userPassword = await bcrypt.hash('password123', 10);
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        phone: '1234567890',
        role: 'lawyer',
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPassword,
        phone: '0987654321',
        role: 'lawyer',
        isVerified: true
      }
    ]);

    // Create test lawyers
    const lawyers = await Lawyer.create([
      {
        user: users[0]._id,
        specialization: 'Criminal Law',
        languages: ['english', 'hindi'],
        experience: 5,
        location: 'Mumbai',
        hourlyRate: 2000,
        availability: {
          isAvailable: true,
          workingHours: {
            start: '09:00',
            end: '18:00'
          },
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        ratings: {
          average: 4.5,
          count: 10,
          reviews: []
        },
        isVerified: true
      },
      {
        user: users[1]._id,
        specialization: 'Corporate Law',
        languages: ['english', 'tamil'],
        experience: 8,
        location: 'Chennai',
        hourlyRate: 3000,
        availability: {
          isAvailable: true,
          workingHours: {
            start: '10:00',
            end: '19:00'
          },
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        ratings: {
          average: 4.8,
          count: 15,
          reviews: []
        },
        isVerified: true
      }
    ]);

    console.log('Database seeded successfully!');
    console.log('Created users:', users);
    console.log('Created lawyers:', lawyers);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 