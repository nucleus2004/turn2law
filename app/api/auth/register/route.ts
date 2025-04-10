import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'lawyer']).default('user')
})

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, email, password, role } = validation.data

    // Connect to MongoDB
    const { db } = await connectToDatabase()
    const usersCollection = db.collection('users')

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create new user
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emailVerified: false,
      profile: {
        avatar: null,
        phone: null,
        address: null,
        bio: null
      }
    }

    // Insert user into database
    const result = await usersCollection.insertOne(newUser)

    if (!result.insertedId) {
      throw new Error('Failed to create user')
    }

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        ...userWithoutPassword,
        _id: result.insertedId
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to register user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 