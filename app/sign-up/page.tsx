'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, Eye, EyeOff, Check, X, Scale, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'

const signUpSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(50, 'Email must be less than 50 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(50, 'Password must be less than 50 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['user', 'lawyer']).default('user')
})

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setValue,
    trigger
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'user'
    },
    mode: 'onChange'
  })

  const selectedRole = watch('role')
  
  // Password strength indicators
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)
  const isLongEnough = password.length >= 8

  useEffect(() => {
    // Trigger validation when password changes
    if (password) {
      trigger('password')
    }
  }, [password, trigger])

  const onSubmit = async (data: SignUpValues) => {
    try {
      setIsLoading(true)
      
      // Show loading toast
      const loadingToast = toast.loading('Creating your account...')

      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.dismiss(loadingToast)
        throw new Error(result.error || 'Failed to register')
      }

      // Sign in the user after successful registration
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.dismiss(loadingToast)
        throw new Error(signInResult.error)
      }

      toast.dismiss(loadingToast)
      toast.success('Welcome to Turn2Law! Your account has been created successfully.')
      
      // Delay redirect slightly to show success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-10" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#4FD1C5] rounded-full filter blur-[128px] opacity-20 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500 rounded-full filter blur-[128px] opacity-20 translate-x-1/2 translate-y-1/2" />

      <div className="relative min-h-screen flex">
        {/* Left Section - Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/assets/logo.png"
                  alt="Turn2Law Logo"
                  width={150}
                  height={40}
                  className="mx-auto"
                />
              </Link>
              <h1 className="text-3xl font-bold text-white">Create an Account</h1>
              <p className="text-gray-400 mt-2">Join our legal consultation platform</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full bg-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none border ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full bg-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full bg-gray-800 text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none border ${
                      errors.password ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                )}
                
                {/* Password strength indicators */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-sm">
                    {hasUpperCase ? (
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={hasUpperCase ? "text-green-500" : "text-red-500"}>
                      Uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    {hasLowerCase ? (
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={hasLowerCase ? "text-green-500" : "text-red-500"}>
                      Lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    {hasNumber ? (
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={hasNumber ? "text-green-500" : "text-red-500"}>
                      Number
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    {hasSpecialChar ? (
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={hasSpecialChar ? "text-green-500" : "text-red-500"}>
                      Special character
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    {isLongEnough ? (
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    <span className={isLongEnough ? "text-green-500" : "text-red-500"}>
                      At least 8 characters
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setValue('role', 'user')}
                    disabled={isLoading}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      selectedRole === 'user'
                        ? 'bg-[#4FD1C5] text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('role', 'lawyer')}
                    disabled={isLoading}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      selectedRole === 'lawyer'
                        ? 'bg-[#4FD1C5] text-black'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Lawyer
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full bg-[#4FD1C5] hover:bg-[#38B2AC] text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="text-center text-gray-400">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-[#4FD1C5] hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Right Section - Features */}
        <div className="hidden lg:flex flex-1 bg-gray-800 items-center justify-center p-8">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-white mb-8">Why Choose Turn2Law?</h2>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#4FD1C5] bg-opacity-20 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-[#4FD1C5]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Expert Legal Advice</h3>
                  <p className="text-gray-400">Connect with experienced lawyers who specialize in various legal domains.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#4FD1C5] bg-opacity-20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#4FD1C5]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Verified Professionals</h3>
                  <p className="text-gray-400">All lawyers on our platform are thoroughly vetted and verified.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#4FD1C5] bg-opacity-20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#4FD1C5]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Secure Consultations</h3>
                  <p className="text-gray-400">Your privacy and data security are our top priorities.</p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-12 bg-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#4FD1C5] flex items-center justify-center text-black font-bold text-lg">
                    RS
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-semibold">Rahul Singh</h4>
                    <p className="text-gray-400 text-sm">Business Owner</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">
                  "Turn2Law made it incredibly easy to find the right lawyer for my business needs. 
                  The platform is user-friendly and the lawyers are highly professional."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}