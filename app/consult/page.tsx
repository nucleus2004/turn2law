"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle2, Star, MapPin, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Form validation schema
const formSchema = z.object({
  type: z.enum(['video', 'audio', 'chat', 'in_person'], {
    required_error: 'Please select a consultation type',
  }),
  schedule: z.object({
    date: z.string({
      required_error: 'Please select a date',
    }),
    startTime: z.string({
      required_error: 'Please select a start time',
    }),
    endTime: z.string({
      required_error: 'Please select an end time',
    }),
    timezone: z.string().default(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    duration: z.number().min(30).max(120)
  }),
  details: z.object({
    legalIssue: z.string().min(10, 'Please describe your legal issue in detail'),
    description: z.string().min(10, 'Please provide more details about your issue'),
    preferredLanguage: z.string({
      required_error: 'Please select your preferred language',
    }),
    location: z.string().min(1, 'Please enter your location'),
    budget: z.number().optional(),
    urgency: z.enum(['low', 'medium', 'high', 'urgent']).optional()
  }),
  lawyerId: z.string({
    required_error: 'Please select a lawyer',
  })
})

type FormValues = z.infer<typeof formSchema>

export default function ConsultPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lawyers, setLawyers] = useState<any[]>([])
  const [selectedLawyer, setSelectedLawyer] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedConsultationType, setSelectedConsultationType] = useState<'video' | 'in-person'>('video')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in')
    }
  }, [status, router])

  // Load selected lawyer from localStorage if exists
  useEffect(() => {
    const storedLawyer = localStorage.getItem('selectedLawyer')
    if (storedLawyer) {
      setSelectedLawyer(JSON.parse(storedLawyer))
      setStep(2) // Skip to step 2 if lawyer is already selected
      localStorage.removeItem('selectedLawyer') // Clear the stored lawyer
    }
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: undefined,
      schedule: {
        date: '',
        startTime: '',
        endTime: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        duration: 60
      },
      details: {
        legalIssue: '',
        description: '',
        preferredLanguage: '',
        urgency: 'medium'
      },
      lawyerId: ''
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 400 && error.error) {
          // Handle validation errors
          Object.entries(error.error).forEach(([key, value]) => {
            form.setError(key as any, {
              message: Array.isArray(value) ? value[0] : value as string,
            })
          })
          return
        }
        throw new Error(error.error || 'Failed to submit consultation')
      }

      const result = await response.json()
      toast.success('Consultation scheduled successfully!')
      router.push(`/dashboard/consultations/${result.consultation.id}`)
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to schedule consultation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFindLawyers = async () => {
    try {
      setRecommendationsLoading(true)
      
      const formData = form.getValues()
      
      // Validate location is provided
      if (!formData.details.location) {
        toast.error('Please enter a location to find lawyers')
        return
      }

      const response = await fetch('/api/lawyers/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          location: formData.details.location,
          preferredLanguage: formData.details.preferredLanguage,
          urgency: formData.details.urgency,
          budget: formData.details.budget ? Number(formData.details.budget) : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to find lawyers')
      }

      const result = await response.json()
      
      if (!result.lawyers || result.lawyers.length === 0) {
        toast.error('No lawyers found in this location. Please try a different location.')
        return
      }

      setRecommendations(result.lawyers)
      setStep(2)
      toast.success(`Found ${result.lawyers.length} lawyers in ${formData.details.location}`)
    } catch (error) {
      console.error('Error finding lawyers:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to find lawyers')
    } finally {
      setRecommendationsLoading(false)
    }
  }

  const handleLawyerSelect = (lawyer: any) => {
    setSelectedLawyer(lawyer)
    form.setValue('lawyerId', lawyer._id)
    setStep(2)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4FD1C5]" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Schedule a Consultation</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Legal Issue *
                </label>
                <textarea
                  {...form.register('details.legalIssue')}
                  className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                  rows={4}
                  placeholder="Describe your legal issue in detail..."
                />
                {form.formState.errors.details?.legalIssue && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.details.legalIssue.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  {...form.register('details.location')}
                  type="text"
                  className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                  placeholder="Enter city name (e.g., Mumbai, Delhi)"
                />
                {form.formState.errors.details?.location && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.details.location.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Language *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Punjabi'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => form.setValue('details.preferredLanguage', lang)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        form.watch('details.preferredLanguage') === lang
                          ? 'bg-[#4FD1C5] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                {form.formState.errors.details?.preferredLanguage && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.details.preferredLanguage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Budget (₹/hearing)
                </label>
                <input
                  {...form.register('details.budget', { valueAsNumber: true })}
                  type="number"
                  className="w-full bg-gray-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                  placeholder="Enter your budget per hearing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Urgency Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {['low', 'medium', 'high', 'urgent'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => form.setValue('details.urgency', level as any)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        form.watch('details.urgency') === level
                          ? 'bg-[#4FD1C5] text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFindLawyers}
                type="button"
                disabled={recommendationsLoading}
                className="w-full bg-[#4FD1C5] hover:bg-[#38B2AC] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recommendationsLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding Matching Lawyers...
                  </div>
                ) : (
                  'Find Matching Lawyers'
                )}
              </button>
            </div>
          )}

          {step === 2 && recommendations.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Matching Lawyers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((lawyer) => (
                  <div
                    key={lawyer._id}
                    className="bg-gray-700 rounded-lg p-6 space-y-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-[#4FD1C5] flex items-center justify-center">
                        <span className="text-lg font-bold text-black">
                          {(lawyer.name || lawyer.Lawyer_name || 'L').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {lawyer.name || lawyer.Lawyer_name || 'Unknown Lawyer'}
                        </h3>
                        <p className="text-gray-400">
                          {lawyer.specialization || lawyer.Practice_area || 'General Practice'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-400">
                        <MapPin className="w-4 h-4 mr-2" />
                        {lawyer.location || lawyer.Location || 'Location not specified'}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        {lawyer.experience || lawyer.Years_of_Experience || 0} years experience
                      </div>
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ₹{(lawyer.fees || lawyer.Nominal_fees_per_hearing || 0).toLocaleString('en-IN')}/hearing
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Star className="w-4 h-4 mr-2" />
                        {lawyer.rating ? lawyer.rating.toFixed(1) : '0.0'} / 5.0
                      </div>
                      {lawyer.cases && (
                        <div className="flex items-center text-gray-400">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Success Rate: {lawyer.cases.successful && lawyer.cases.total 
                            ? ((lawyer.cases.successful / lawyer.cases.total) * 100).toFixed(1)
                            : '0'}%
                        </div>
                      )}
                      <div className="mt-2 text-sm text-[#4FD1C5]">
                        Match Score: {lawyer.matchScore || '0'}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        form.setValue('lawyerId', lawyer._id)
                        setSelectedLawyer(lawyer)
                        setStep(3)
                      }}
                      className="w-full bg-[#4FD1C5] hover:bg-[#38B2AC] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Select & Continue
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Back to Search
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-6 bg-gray-900 border-gray-800">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2 text-[#4FD1C5]">Schedule Consultation</h2>
                  <p className="text-gray-400">Selected Lawyer: {selectedLawyer?.name}</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Consultation Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'video', label: 'Video Call' },
                          { value: 'audio', label: 'Audio Call' },
                          { value: 'chat', label: 'Chat' },
                          { value: 'in_person', label: 'In Person' }
                        ].map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => form.setValue('type', type.value)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              form.watch('type') === type.value
                                ? 'bg-[#4FD1C5] text-black'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date
                      </label>
                      <Input
                        type="date"
                        {...form.register('schedule.date')}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-gray-800 border-gray-700 text-white focus:border-[#4FD1C5] focus:ring-[#4FD1C5]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        {...form.register('schedule.startTime')}
                        className="bg-gray-800 border-gray-700 text-white focus:border-[#4FD1C5] focus:ring-[#4FD1C5]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        End Time
                      </label>
                      <Input
                        type="time"
                        {...form.register('schedule.endTime')}
                        className="bg-gray-800 border-gray-700 text-white focus:border-[#4FD1C5] focus:ring-[#4FD1C5]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="border-[#4FD1C5] text-[#4FD1C5] hover:bg-[#4FD1C5] hover:text-black"
                    >
                      Back to Lawyers
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#4FD1C5] hover:bg-[#38B2AC] text-black font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Schedule Consultation'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

