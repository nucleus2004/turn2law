import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Validation schema for signup
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Invalid phone number"),
});

export async function POST(req: Request) {
  try {
    console.log("Signup request received");
    const body = await req.json();
    console.log("Request body:", body);

    // Validate request body
    const validatedData = signupSchema.parse(body);
    console.log("Validated data:", validatedData);

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("Connected to MongoDB");

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      console.log("User already exists");
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create new user
    console.log("Creating new user...");
    const user = new User({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      phone: validatedData.phone,
      role: "user",
      isVerified: false,
    });

    await user.save();
    console.log("User saved successfully:", user._id);

    return NextResponse.json(
      { 
        message: "User created successfully", 
        userId: user._id,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
