import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import { z } from 'zod';

// Validation schema for payment
const paymentSchema = z.object({
  consultationId: z.string(),
  amount: z.number(),
  method: z.enum(['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet']),
  transactionId: z.string()
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const validatedData = paymentSchema.parse(body);

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

    // Update payment details
    consultation.payment = {
      amount: validatedData.amount,
      currency: 'INR',
      status: 'completed',
      method: validatedData.method,
      transactionId: validatedData.transactionId,
      paidAt: new Date()
    };

    // Update consultation status
    consultation.status = 'scheduled';

    await consultation.save();

    return NextResponse.json({ 
      success: true, 
      payment: {
        amount: consultation.payment.amount,
        status: consultation.payment.status,
        transactionId: consultation.payment.transactionId
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Payment processing error:', error);
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
      payment: consultation.payment 
    });

  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 