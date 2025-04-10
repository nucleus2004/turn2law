import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import Lawyer from '@/models/Lawyer';
import { z } from 'zod';

// Validation schema for lawyer response
const responseSchema = z.object({
  consultationId: z.string(),
  action: z.enum(['accept', 'reject', 'reschedule']),
  message: z.string().optional(),
  newSchedule: z.object({
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    timezone: z.string()
  }).optional()
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const validatedData = responseSchema.parse(body);

    // Get consultation and lawyer details
    const consultation = await Consultation.findById(validatedData.consultationId);
    const lawyer = await Lawyer.findOne({ user: session.user.id });

    if (!consultation || !lawyer) {
      return NextResponse.json({ error: 'Consultation or lawyer not found' }, { status: 404 });
    }

    // Verify if the lawyer is assigned to this consultation
    if (consultation.lawyer.toString() !== lawyer._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }

    // Handle different response actions
    switch (validatedData.action) {
      case 'accept':
        consultation.status = 'scheduled';
        consultation.schedule = {
          ...consultation.schedule,
          ...validatedData.newSchedule
        };
        break;

      case 'reject':
        consultation.status = 'cancelled';
        consultation.cancellation = {
          cancelledBy: lawyer.user,
          reason: validatedData.message || 'Lawyer rejected the consultation',
          cancelledAt: new Date()
        };
        break;

      case 'reschedule':
        if (!validatedData.newSchedule) {
          return NextResponse.json({ error: 'New schedule is required for rescheduling' }, { status: 400 });
        }
        consultation.rescheduling.push({
          requestedBy: lawyer.user,
          oldDate: consultation.schedule.date,
          newDate: validatedData.newSchedule.date,
          reason: validatedData.message || 'Lawyer requested rescheduling',
          status: 'pending',
          requestedAt: new Date()
        });
        break;
    }

    await consultation.save();

    return NextResponse.json({ 
      success: true, 
      consultation: {
        id: consultation._id,
        status: consultation.status,
        schedule: consultation.schedule
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Consultation response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 