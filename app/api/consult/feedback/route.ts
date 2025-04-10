import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import Lawyer from '@/models/Lawyer';
import { z } from 'zod';

// Validation schema for feedback
const feedbackSchema = z.object({
  consultationId: z.string(),
  rating: z.number().min(1).max(5),
  review: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const validatedData = feedbackSchema.parse(body);

    // Get consultation and user details
    const consultation = await Consultation.findById(validatedData.consultationId);
    const user = await User.findById(session.user.id);

    if (!consultation || !user) {
      return NextResponse.json({ error: 'Consultation or user not found' }, { status: 404 });
    }

    // Verify if the user is the owner of the consultation
    if (consultation.user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
    }

    // Verify if the consultation is completed
    if (consultation.status !== 'completed') {
      return NextResponse.json({ error: 'Feedback can only be submitted for completed consultations' }, { status: 400 });
    }

    // Update feedback
    consultation.feedback = {
      rating: validatedData.rating,
      review: validatedData.review,
      submittedAt: new Date()
    };

    await consultation.save();

    // Update lawyer's rating
    const lawyer = await Lawyer.findById(consultation.lawyer);
    if (lawyer) {
      const totalRatings = lawyer.ratings.count + 1;
      const newAverage = ((lawyer.ratings.average * lawyer.ratings.count) + validatedData.rating) / totalRatings;
      
      lawyer.ratings = {
        average: newAverage,
        count: totalRatings,
        reviews: [
          ...lawyer.ratings.reviews,
          {
            user: user._id,
            rating: validatedData.rating,
            review: validatedData.review,
            consultation: consultation._id,
            createdAt: new Date()
          }
        ]
      };

      await lawyer.save();
    }

    return NextResponse.json({ 
      success: true, 
      feedback: {
        rating: consultation.feedback.rating,
        review: consultation.feedback.review
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    if (!consultationId) {
      return NextResponse.json({ error: 'Consultation ID is required' }, { status: 400 });
    }

    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
    }

    // Verify if the user is the owner of the consultation
    if (consultation.user.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ 
      feedback: consultation.feedback 
    });

  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 