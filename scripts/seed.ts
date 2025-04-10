const connectDB = require('../lib/mongodb').default;
const User = require('../models/User').default;
const Lawyer = require('../models/Lawyer').default;
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await connectDB();

    // Create test users
    const userPassword = await bcrypt.hash('password123', 10);
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        phone: '1234567890',
        role: 'user',
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPassword,
        phone: '0987654321',
        role: 'user',
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
        isVerified: true,
        verificationDocuments: [
          {
            type: 'license',
            url: 'https://example.com/license1.pdf',
            verified: true
          }
        ]
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
        isVerified: true,
        verificationDocuments: [
          {
            type: 'license',
            url: 'https://example.com/license2.pdf',
            verified: true
          }
        ]
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
};

seed(); 