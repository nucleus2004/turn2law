import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Lawyer from '@/models/Lawyer';

export async function GET() {
  try {
    await connectDB();

    const lawyers = await Lawyer.find({})
      .populate('user', 'name email image phone')
      .sort({ 'ratings.average': -1, experience: -1 });

    return NextResponse.json({ lawyers });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch lawyers' 
    }, { status: 500 });
  }
} 