const { connectDB } = require('@/lib/mongodb');
const User = require('@/models/User');
const Lawyer = require('@/models/Lawyer');

const lawyers = [
  {
    user: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      image: '/lawyers/john-smith.jpg'
    },
    specialization: 'Criminal Law',
    experience: 15,
    location: 'Mumbai, Maharashtra',
    hourlyRate: 2500,
    availability: {
      isAvailable: true,
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    },
    languages: ['English', 'Hindi', 'Marathi'],
    ratings: {
      average: 4.8,
      count: 120
    },
    description: 'Experienced criminal defense attorney with a strong track record of successful cases.'
  },
  {
    user: {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      image: '/lawyers/priya-patel.jpg'
    },
    specialization: 'Family Law',
    experience: 10,
    location: 'Delhi, NCR',
    hourlyRate: 2000,
    availability: {
      isAvailable: true,
      workingDays: ['Tuesday', 'Thursday', 'Saturday'],
      workingHours: {
        start: '10:00',
        end: '18:00'
      }
    },
    languages: ['English', 'Hindi', 'Gujarati'],
    ratings: {
      average: 4.9,
      count: 95
    },
    description: 'Compassionate family law specialist with expertise in divorce and child custody cases.'
  },
  {
    user: {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      image: '/lawyers/rajesh-kumar.jpg'
    },
    specialization: 'Corporate Law',
    experience: 20,
    location: 'Bangalore, Karnataka',
    hourlyRate: 3000,
    availability: {
      isAvailable: true,
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    },
    languages: ['English', 'Hindi', 'Kannada'],
    ratings: {
      average: 4.7,
      count: 150
    },
    description: 'Seasoned corporate lawyer with extensive experience in mergers and acquisitions.'
  },
  {
    user: {
      name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      image: '/lawyers/ananya-sharma.jpg'
    },
    specialization: 'Property Law',
    experience: 8,
    location: 'Chennai, Tamil Nadu',
    hourlyRate: 1800,
    availability: {
      isAvailable: true,
      workingDays: ['Tuesday', 'Thursday', 'Saturday'],
      workingHours: {
        start: '10:00',
        end: '18:00'
      }
    },
    languages: ['English', 'Hindi', 'Tamil'],
    ratings: {
      average: 4.6,
      count: 80
    },
    description: 'Property law expert specializing in real estate transactions and disputes.'
  },
  {
    user: {
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      image: '/lawyers/vikram-singh.jpg'
    },
    specialization: 'Tax Law',
    experience: 12,
    location: 'Hyderabad, Telangana',
    hourlyRate: 2200,
    availability: {
      isAvailable: true,
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    },
    languages: ['English', 'Hindi', 'Telugu'],
    ratings: {
      average: 4.5,
      count: 110
    },
    description: 'Tax law specialist with expertise in corporate and individual tax planning.'
  },
  {
    user: {
      name: 'Dinesh Patel',
      email: 'dinesh.patel@chiramelco.com',
      image: '/lawyers/dinesh-patel.jpg',
      phone: '9183682586'
    },
    specialization: 'Personal Injury Law',
    experience: 8,
    location: 'Chennai, Tamil Nadu',
    hourlyRate: 223067,
    availability: {
      isAvailable: true,
      workingDays: ['Monday', 'Wednesday', 'Friday'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      }
    },
    languages: ['English', 'Hindi', 'Tamil'],
    ratings: {
      average: 3.0,
      count: 3
    },
    description: 'Counsel at Chiramel & Co, Solicitors and Advocates. Specialized in Personal Injury Law with 8 years of experience. Handled 199 cases with 148 successful outcomes.',
    firm: {
      name: 'Chiramel & Co, Solicitors and Advocates',
      size: 185,
      targetAudience: 'Employers'
    },
    barCouncilId: 'NB/CG/2016/36743',
    affiliation: 'Supreme Court of India',
    cases: {
      total: 199,
      successful: 148
    },
    clientReviews: [
      'Inadequate preparation and subpar legal advice.',
      'Provided incorrect information and poor advice.',
      'Provided substandard legal service and advice.'
    ]
  }
];

async function seedLawyers() {
  try {
    await connectDB();

    // Clear existing lawyers
    await Lawyer.deleteMany({});

    // Create users and lawyers
    for (const lawyerData of lawyers) {
      // Create user
      const user = new User({
        name: lawyerData.user.name,
        email: lawyerData.user.email,
        image: lawyerData.user.image,
        role: 'lawyer'
      });
      await user.save();

      // Create lawyer
      const lawyer = new Lawyer({
        user: user._id,
        specialization: lawyerData.specialization,
        experience: lawyerData.experience,
        location: lawyerData.location,
        hourlyRate: lawyerData.hourlyRate,
        availability: lawyerData.availability,
        languages: lawyerData.languages,
        ratings: lawyerData.ratings,
        description: lawyerData.description
      });
      await lawyer.save();
    }

    console.log('Successfully seeded lawyers');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding lawyers:', error);
    process.exit(1);
  }
}

seedLawyers(); 