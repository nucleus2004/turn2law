import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { z } from 'zod'

const requestSchema = z.object({
  location: z.string(),
  preferredLanguage: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  budget: z.number().optional()
})

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const body = await req.json().catch(() => ({}))
    console.log('Received request body:', body)
    
    if (!body.location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    const validationResult = requestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { location, budget, urgency } = validationResult.data
    
    // Connect to MongoDB
    const { db } = await connectToDatabase()
    const lawyersCollection = db.collection('lawyers')

    // First, let's log the total number of lawyers
    const totalLawyers = await lawyersCollection.countDocuments()
    console.log(`Total lawyers in database: ${totalLawyers}`)

    if (totalLawyers === 0) {
      return NextResponse.json(
        { error: 'No lawyers found in the database' },
        { status: 404 }
      )
    }

    // Prepare location search terms
    const locationTerms = location.toLowerCase().split(/[,\s]+/).filter(Boolean)
    console.log('Searching for location terms:', locationTerms)

    // Build the location query
    const locationQuery = {
      $or: [
        // Search in Location field
        { Location: { $regex: locationTerms[0], $options: 'i' } },
        { location: { $regex: locationTerms[0], $options: 'i' } },
        
        // Search in city field
        { city: { $regex: locationTerms[0], $options: 'i' } },
        { City: { $regex: locationTerms[0], $options: 'i' } },
        
        // Search in state field
        { state: { $regex: locationTerms[0], $options: 'i' } },
        { State: { $regex: locationTerms[0], $options: 'i' } },
        
        // Search in Address object
        { "Address.City": { $regex: locationTerms[0], $options: 'i' } },
        { "Address.State": { $regex: locationTerms[0], $options: 'i' } },
        
        // Search in address field
        { address: { $regex: locationTerms[0], $options: 'i' } },
        { Address: { $regex: locationTerms[0], $options: 'i' } }
      ]
    }

    // Build the complete query
    const query: any = locationQuery

    // Add budget filter if provided
    if (budget) {
      query.$and = [{
        $or: [
          { Nominal_fees_per_hearing: { $lte: budget } },
          { nominal_fees_per_hearing: { $lte: budget } },
          { fees: { $lte: budget } }
        ]
      }]
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2))

    try {
      // Find matching lawyers
      const lawyers = await lawyersCollection
        .find(query)
        .limit(50)
        .toArray()

      console.log(`Found ${lawyers.length} lawyers matching the criteria`)

      // Log a sample lawyer if any found
      if (lawyers.length > 0) {
        console.log('Sample matching lawyer:', JSON.stringify(lawyers[0], null, 2))
      }

      if (lawyers.length === 0) {
        // If no results, try a broader search
        console.log('No results found, trying broader search...')
        const broadQuery = {
          $or: [
            { Location: { $regex: '.*' + locationTerms[0] + '.*', $options: 'i' } },
            { location: { $regex: '.*' + locationTerms[0] + '.*', $options: 'i' } },
            { city: { $regex: '.*' + locationTerms[0] + '.*', $options: 'i' } },
            { address: { $regex: '.*' + locationTerms[0] + '.*', $options: 'i' } }
          ]
        }
        
        const broadResults = await lawyersCollection
          .find(broadQuery)
          .limit(50)
          .toArray()

        console.log(`Found ${broadResults.length} lawyers with broader search`)
        
        if (broadResults.length > 0) {
          return NextResponse.json({
            lawyers: formatLawyers(broadResults, budget, urgency),
            total: broadResults.length,
            message: `Found ${broadResults.length} lawyers near ${location}`
          })
        }

        return NextResponse.json({
          lawyers: [],
          total: 0,
          message: `No lawyers found in ${location}. Please try a different location or broaden your search criteria.`
        })
      }

      const formattedLawyers = formatLawyers(lawyers, budget, urgency)

      return NextResponse.json({
        lawyers: formattedLawyers,
        total: formattedLawyers.length,
        message: `Found ${formattedLawyers.length} lawyers in ${location}`
      })

    } catch (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { error: 'Failed to search lawyers database' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Lawyer recommendation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process lawyer recommendation request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function formatLawyers(lawyers: any[], budget?: number, urgency?: string) {
  return lawyers.map(lawyer => {
    try {
      let score = 0

      // Success rate score (0-40 points)
      const totalCases = lawyer.Total_cases || lawyer.total_cases || lawyer.cases_handled || 1
      const successfulCases = lawyer.Successful_cases || lawyer.successful_cases || Math.floor(totalCases * 0.7)
      const successRate = successfulCases / totalCases
      score += (successRate * 40)

      // Experience score (0-30 points)
      const experience = lawyer.Years_of_Experience || lawyer.years_of_experience || 
                        lawyer.experience || lawyer.Experience || 0
      score += Math.min(experience * 3, 30)

      // Budget match score (0-20 points)
      if (budget) {
        const fees = lawyer.Nominal_fees_per_hearing || lawyer.nominal_fees_per_hearing || 
                    lawyer.fees || lawyer.Fees || 5000
        const budgetRatio = 1 - (fees / budget)
        score += Math.max(0, budgetRatio * 20)
      }

      // Urgency score (0-10 points)
      if (urgency) {
        const urgencyScores = { low: 2.5, medium: 5, high: 7.5, urgent: 10 }
        score += urgencyScores[urgency]
      }

      return {
        _id: lawyer._id,
        name: lawyer.Lawyer_name || lawyer.lawyer_name || lawyer.name || lawyer.Name,
        specialization: lawyer.Practice_area || lawyer.practice_area || 
                       lawyer.specialization || lawyer.Specialization,
        firmName: lawyer.Firm_name || lawyer.firm_name || lawyer.firm || lawyer.Firm,
        experience: experience,
        location: lawyer.Location || lawyer.location || 
                 (lawyer.Address ? `${lawyer.Address.City}, ${lawyer.Address.State}` : '') ||
                 `${lawyer.city || ''}, ${lawyer.state || ''}`,
        fees: lawyer.Nominal_fees_per_hearing || lawyer.nominal_fees_per_hearing || 
              lawyer.fees || lawyer.Fees,
        cases: {
          total: totalCases,
          successful: successfulCases
        },
        rating: ((lawyer.sentiment_score || lawyer.Sentiment_score || 
                  lawyer.rating || lawyer.Rating || 0) + 1) * 2.5,
        matchScore: score.toFixed(1),
        contact: lawyer.contact || lawyer.Contact || lawyer.phone || lawyer.Phone,
        email: lawyer.email || lawyer.Email
      }
    } catch (error) {
      console.error('Error formatting lawyer:', error)
      return null
    }
  })
  .filter(lawyer => lawyer !== null)
  .sort((a, b) => parseFloat(b!.matchScore) - parseFloat(a!.matchScore))
} 