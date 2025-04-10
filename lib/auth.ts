import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Get the current session
export async function getCurrentSession() {
  const session = await getServerSession(authOptions);
  return session;
}

// Check if user is authenticated
export async function isAuthenticated(req: NextRequest) {
  const session = await getCurrentSession();
  return !!session;
}

// Get current user
export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user;
}

// Check if user has required role
export async function hasRole(requiredRole: string) {
  const user = await getCurrentUser();
  return user?.role === requiredRole;
}

// Verify user authorization for consultation
export async function verifyConsultationAuth(consultationId: string, userId: string) {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }

  // Lawyers can access consultations assigned to them
  if (user.role === 'lawyer') {
    return true; // You may want to add additional checks here
  }

  // Users can only access their own consultations
  return user.id === userId;
}

// Helper to check if user is a lawyer
export async function isLawyer() {
  return await hasRole('lawyer');
}

// Helper to check if user is a client
export async function isClient() {
  return await hasRole('user');
} 