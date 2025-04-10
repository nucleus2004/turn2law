"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Loader2, Search, Star, MapPin, Clock, DollarSign, Filter } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LawyersPage() {
  const router = useRouter()
  const [lawyers, setLawyers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    specialization: '',
    language: '',
    location: '',
    minRating: 0,
    maxRate: 1000000
  })

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/lawyers')
        if (!response.ok) {
          throw new Error('Failed to fetch lawyers')
        }
        const data = await response.json()
        setLawyers(data.lawyers)
      } catch (error) {
        console.error('Error fetching lawyers:', error)
        toast.error('Failed to load lawyers. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchLawyers()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const filteredLawyers = lawyers.filter(lawyer => {
    const matchesSearch = 
      lawyer.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilters = 
      (!filters.specialization || lawyer.specialization === filters.specialization) &&
      (!filters.language || lawyer.languages.includes(filters.language)) &&
      (!filters.location || lawyer.location.includes(filters.location)) &&
      lawyer.ratings.average >= filters.minRating &&
      lawyer.hourlyRate <= filters.maxRate

    return matchesSearch && matchesFilters
  })

  const LawyerCard = ({ lawyer }: { lawyer: any }) => {
    const handleScheduleConsultation = () => {
      // Store selected lawyer in localStorage for the consult page
      localStorage.setItem('selectedLawyer', JSON.stringify({
        id: lawyer._id,
        name: lawyer.user.name,
        specialization: lawyer.specialization,
        hourlyRate: lawyer.hourlyRate
      }))
      
      // Navigate to consult page
      router.push('/consult')
    }

    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#4FD1C5] flex items-center justify-center">
                <span className="text-xl font-bold text-black">
                  {lawyer.user.name.charAt(0)}
                </span>
              </div>
              {lawyer.availability.isAvailable && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{lawyer.user.name}</h3>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">{lawyer.ratings.average.toFixed(1)}</span>
                <span className="text-gray-400">({lawyer.ratings.count} reviews)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Specialization:</span>
              <p className="text-white">{lawyer.specialization}</p>
            </div>
            <div>
              <span className="text-gray-400">Experience:</span>
              <p className="text-white">{lawyer.experience} years</p>
            </div>
            <div>
              <span className="text-gray-400">Location:</span>
              <p className="text-white">{lawyer.location}</p>
            </div>
            <div>
              <span className="text-gray-400">Languages:</span>
              <p className="text-white">{lawyer.languages.join(', ')}</p>
            </div>
            <div>
              <span className="text-gray-400">Hourly Rate:</span>
              <p className="text-white">₹{lawyer.hourlyRate}/hour</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleScheduleConsultation}
              className="w-full bg-[#4FD1C5] hover:bg-[#38B2AC] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Schedule Consultation
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-[#4FD1C5] animate-spin" />
          <p className="mt-4 text-gray-400">Loading lawyers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Find a Lawyer</h1>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialization, or location..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Specialization
                </label>
                <select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange('specialization', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                >
                  <option value="">All Specializations</option>
                  {Array.from(new Set(lawyers.map(l => l.specialization))).map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                >
                  <option value="">All Languages</option>
                  {Array.from(new Set(lawyers.flatMap(l => l.languages))).map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                >
                  <option value="">All Locations</option>
                  {Array.from(new Set(lawyers.map(l => l.location))).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Rating
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Rate (₹/hour)
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxRate}
                  onChange={(e) => handleFilterChange('maxRate', parseInt(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded-lg p-2 focus:ring-2 focus:ring-[#4FD1C5] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            {filteredLawyers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No lawyers found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredLawyers.map((lawyer) => (
                  <LawyerCard key={lawyer._id} lawyer={lawyer} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 