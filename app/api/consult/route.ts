import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import Lawyer from '@/models/Lawyer';
import { z } from 'zod';

// Validation schema for consultation request
const consultationSchema = z.object({
  type: z.enum(['video', 'audio', 'chat', 'in_person'], {
    required_error: 'Please select a consultation type',
    invalid_type_error: 'Invalid consultation type'
  }),
  schedule: z.object({
    date: z.string({
      required_error: 'Please select a date'
    }),
    startTime: z.string({
      required_error: 'Please select a start time'
    }),
    endTime: z.string({
      required_error: 'Please select an end time'
    }),
    timezone: z.string().default('UTC'),
    duration: z.number().min(15).max(120)
  }),
  details: z.object({
    legalIssue: z.string().min(10, 'Please describe your legal issue in at least 10 characters'),
    description: z.string().min(20, 'Please provide more details about your issue (minimum 20 characters)'),
    preferredLanguage: z.string({
      required_error: 'Please select your preferred language'
    }),
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    additionalNotes: z.string().optional()
  }),
  lawyerId: z.string({
    required_error: 'Please select a lawyer'
  })
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const validatedData = consultationSchema.parse(body);

    // Validate time slot
    const startTime = new Date(`${validatedData.schedule.date}T${validatedData.schedule.startTime}`);
    const endTime = new Date(`${validatedData.schedule.date}T${validatedData.schedule.endTime}`);
    
    if (startTime >= endTime) {
      return NextResponse.json({ 
        error: 'Invalid time slot: End time must be after start time'
      }, { status: 400 });
    }

    if (startTime < new Date()) {
      return NextResponse.json({ 
        error: 'Invalid time slot: Cannot schedule consultations in the past'
      }, { status: 400 });
    }

    // Get user and lawyer details
    const [user, lawyer] = await Promise.all([
      User.findById(session.user.id),
      Lawyer.findById(validatedData.lawyerId)
    ]);

    if (!user || !lawyer) {
      return NextResponse.json({ error: 'User or lawyer not found' }, { status: 404 });
    }

    // Check if lawyer is available
    if (!lawyer.availability.isAvailable) {
      return NextResponse.json({ error: 'Lawyer is not available for consultations' }, { status: 400 });
    }

    // Check for time slot conflicts
    const conflictingConsultation = await Consultation.findOne({
      lawyer: lawyer._id,
      'schedule.date': validatedData.schedule.date,
      $or: [
        {
          'schedule.startTime': { 
            $lt: validatedData.schedule.endTime,
            $gte: validatedData.schedule.startTime 
          }
        },
        {
          'schedule.endTime': { 
            $gt: validatedData.schedule.startTime,
            $lte: validatedData.schedule.endTime 
          }
        }
      ],
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingConsultation) {
      return NextResponse.json({ 
        error: 'Selected time slot is no longer available'
      }, { status: 409 });
    }

    // Create consultation
    const consultation = new Consultation({
      user: user._id,
      lawyer: lawyer._id,
      type: validatedData.type,
      schedule: validatedData.schedule,
      details: validatedData.details,
      status: 'pending',
      createdAt: new Date()
    });

    await consultation.save();

    // Update user's and lawyer's consultations in parallel
    await Promise.all([
      User.findByIdAndUpdate(user._id, { 
        $push: { consultations: consultation._id } 
      }),
      Lawyer.findByIdAndUpdate(lawyer._id, { 
        $push: { consultations: consultation._id }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      consultation: {
        id: consultation._id,
        status: consultation.status,
        schedule: consultation.schedule,
        type: consultation.type,
        details: {
          legalIssue: consultation.details.legalIssue,
          preferredLanguage: consultation.details.preferredLanguage
        },
        lawyer: {
          id: lawyer._id,
          name: lawyer.user.name,
          specialization: lawyer.specialization
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors 
      }, { status: 400 });
    }
    console.error('Consultation creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create consultation. Please try again later.'
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const consultationId = searchParams.get('id');

    if (consultationId) {
      // Get specific consultation
      const consultation = await Consultation.findById(consultationId)
        .populate('user', 'name email')
        .populate('lawyer', 'user specialization')
        .populate('lawyer.user', 'name email');

      if (!consultation) {
        return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
      }

      return NextResponse.json({ consultation });
    } else {
      // Get all consultations for the user
      const consultations = await Consultation.find({ user: session.user.id })
        .populate('lawyer', 'user specialization')
        .populate('lawyer.user', 'name email')
        .sort({ createdAt: -1 });

      return NextResponse.json({ consultations });
    }
  } catch (error) {
    console.error('Consultation fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 