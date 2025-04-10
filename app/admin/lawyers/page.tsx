'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Lawyer {
  _id: string
  name: string
  specialization: string
  location: string
  experience: number
  fees: number
  contact: string
  email: string
}

export default function LawyersListPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLawyers, setTotalLawyers] = useState(0)

  useEffect(() => {
    fetchLawyers(page)
  }, [page])

  const fetchLawyers = async (pageNum: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lawyers/list?page=${pageNum}&limit=50`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setLawyers(data.lawyers)
      setTotalPages(data.totalPages)
      setTotalLawyers(data.total)
      setError('')
    } catch (err) {
      setError('Failed to fetch lawyers')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading lawyers data...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Lawyers Database</h1>
          <p className="text-gray-400">Total Lawyers: {totalLawyers}</p>
        </div>

        <div className="grid gap-6 mb-8">
          {lawyers.map((lawyer) => (
            <div key={lawyer._id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-[#4FD1C5] mb-2">{lawyer.name}</h2>
                  <p className="text-gray-400 mb-1">Specialization: {lawyer.specialization}</p>
                  <p className="text-gray-400 mb-1">Location: {lawyer.location}</p>
                  <p className="text-gray-400 mb-1">Experience: {lawyer.experience} years</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 mb-1">Fees: ₹{lawyer.fees?.toLocaleString('en-IN')}</p>
                  <p className="text-gray-400 mb-1">Contact: {lawyer.contact}</p>
                  <p className="text-gray-400">{lawyer.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>
          <p className="text-gray-400">
            Page {page} of {totalPages}
          </p>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
} 