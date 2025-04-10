import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'chat', 'in_person'],
    required: true
  },
  schedule: {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, required: true },
    duration: { type: Number, required: true }
  },
  details: {
    legalIssue: { type: String, required: true },
    description: { type: String, required: true },
    preferredLanguage: { type: String, required: true },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'urgent'] }
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment: {
    amount: { type: Number },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed'] },
    method: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    submittedAt: { type: Date }
  },
  rescheduling: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldDate: { type: String },
    newDate: { type: String },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
    requestedAt: { type: Date }
  }],
  cancellation: {
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    cancelledAt: { type: Date }
  }
}, {
  timestamps: true
});

export default mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema); 