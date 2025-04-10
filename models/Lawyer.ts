import mongoose from 'mongoose';

const LawyerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  Lawyer_name: String,
  Practice_area: String,
  Firm_name: String,
  Firm_size: Number,
  Target_audience: String,
  Designation: String,
  Years_of_Experience: Number,
  Total_cases: Number,
  Successful_cases: Number,
  Affiliation: String,
  Client_reviews: [String],
  Nominal_fees_per_hearing: Number,
  Bar_Council_ID: String,
  sentiment_score: Number,
  Location: String,
  contact: String,
  // Additional fields for the application
  specialization: String,
  experience: Number,
  location: String,
  hourlyRate: Number,
  availability: {
    isAvailable: { type: Boolean, default: true },
    workingDays: [String],
    workingHours: {
      start: String,
      end: String
    }
  },
  languages: [String],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Add indexes for better search performance
LawyerSchema.index({ Location: 'text', Practice_area: 'text' });
LawyerSchema.index({ Nominal_fees_per_hearing: 1 });
LawyerSchema.index({ Years_of_Experience: 1 });

// Virtual fields for compatibility
LawyerSchema.virtual('name').get(function() {
  return this.Lawyer_name;
});

LawyerSchema.virtual('specialization').get(function() {
  return this.Practice_area;
});

LawyerSchema.virtual('experience').get(function() {
  return this.Years_of_Experience;
});

LawyerSchema.virtual('hourlyRate').get(function() {
  return this.Nominal_fees_per_hearing;
});

// Set virtuals in toObject and toJSON
LawyerSchema.set('toObject', { virtuals: true });
LawyerSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Lawyer || mongoose.model('Lawyer', LawyerSchema); 