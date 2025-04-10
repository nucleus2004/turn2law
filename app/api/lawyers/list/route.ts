import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const db = await connectToDatabase()
    const lawyersCollection = db.collection('lawyers')

    // Get total count
    const totalLawyers = await lawyersCollection.countDocuments()
    console.log(`Total lawyers in database: ${totalLawyers}`)

    // Get sample of lawyers
    const lawyers = await lawyersCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get a sample document to show structure
    if (lawyers.length > 0) {
      console.log('Sample lawyer document structure:', JSON.stringify(lawyers[0], null, 2))
    }

    return NextResponse.json({
      total: totalLawyers,
      page,
      totalPages: Math.ceil(totalLawyers / limit),
      lawyers: lawyers.map(lawyer => ({
        _id: lawyer._id,
        name: lawyer.Lawyer_name || lawyer.lawyer_name || lawyer.name || lawyer.Name,
        specialization: lawyer.Practice_area || lawyer.practice_area || lawyer.specialization,
        location: lawyer.Location || lawyer.location || 
                 (lawyer.Address ? `${lawyer.Address.City}, ${lawyer.Address.State}` : '') ||
                 `${lawyer.city || ''}, ${lawyer.state || ''}`,
        experience: lawyer.Years_of_Experience || lawyer.years_of_experience || 
                   lawyer.experience || lawyer.Experience,
        fees: lawyer.Nominal_fees_per_hearing || lawyer.nominal_fees_per_hearing || 
              lawyer.fees || lawyer.Fees,
        contact: lawyer.contact || lawyer.Contact || lawyer.phone || lawyer.Phone,
        email: lawyer.email || lawyer.Email
      }))
    })

  } catch (error) {
    console.error('Error fetching lawyers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch lawyers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 