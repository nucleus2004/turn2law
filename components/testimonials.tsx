"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Business Owner",
    image: "/placeholder.svg",
    text: "Turn2Law made handling legal documents incredibly easy. Their lawyer matching system found me the perfect attorney for my business needs.",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Startup Founder",
    image: "/placeholder.svg",
    text: "The platform simplified complex legal processes. Quick responses and professional service throughout.",
  },
  {
    id: 3,
    name: "Priya Patel",
    role: "Real Estate Agent",
    image: "/placeholder.svg",
    text: "Outstanding service! The virtual consultations saved me so much time, and the legal advice was top-notch.",
  },
  {
    id: 4,
    name: "Alex Thompson",
    role: "Tech Entrepreneur",
    image: "/placeholder.svg",
    text: "Their subscription model is perfect for growing businesses. Access to legal expertise whenever needed.",
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => (prevIndex + newDirection + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative overflow-hidden py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold mb-4">Turn2Law has helped hundred's of clients</h2>
        <p className="text-gray-400">Here's what they have to say about us</p>
      </motion.div>

      <div className="relative max-w-4xl mx-auto px-4">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x)

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1)
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1)
              }
            }}
            className="absolute w-full"
          >
            <Card className="bg-gray-900 border-gray-800 p-8">
              <div className="flex items-start gap-6">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={testimonials[currentIndex].image || "/placeholder.svg"}
                    alt={testimonials[currentIndex].name}
                    fill
                    className="object-cover rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <Quote className="w-10 h-10 text-[#4FD1C5] mb-4" />
                  <p className="text-lg mb-4">{testimonials[currentIndex].text}</p>
                  <div>
                    <h4 className="font-semibold">{testimonials[currentIndex].name}</h4>
                    <p className="text-sm text-gray-400">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#4FD1C5] text-black flex items-center justify-center hover:bg-[#4FD1C5]/90 transition-colors"
          onClick={() => paginate(-1)}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 rounded-full bg-[#4FD1C5] text-black flex items-center justify-center hover:bg-[#4FD1C5]/90 transition-colors"
          onClick={() => paginate(1)}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex justify-center mt-8 gap-2">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-[#4FD1C5]" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

