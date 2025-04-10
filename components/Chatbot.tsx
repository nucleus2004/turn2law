"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MessageSquare, Send, X, Bot, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  type?: 'text' | 'quick_reply'
  quickReplies?: { text: string; action: string }[]
}

const initialBotMessages: Message[] = [
  {
    id: '1',
    text: "Hello! I'm your AI legal assistant. I can help you with legal matters and general information. What would you like to know?",
    sender: 'bot',
    timestamp: new Date(),
    type: 'text'
  }
]

const fallbackResponses = {
  legal_info: "I can help you understand legal concepts. Here are some common areas I can explain:\n\n• Basic legal rights and responsibilities\n• Court procedures and processes\n• Legal documentation requirements\n• Different types of legal cases\n\nWhat specific legal concept would you like to know more about?",
  find_lawyer: "I can help you find a suitable lawyer. To provide better recommendations, please tell me:\n\n• The type of legal issue you're facing\n• Your preferred location\n• Any specific requirements (language, experience, etc.)\n\nWould you like to provide these details?",
  schedule: "I can help you schedule a consultation. Here's what you need to know:\n\n• We offer video, audio, and in-person consultations\n• Standard consultation duration is 30-60 minutes\n• You can choose your preferred date and time\n• Payment is required at the time of booking\n\nWould you like to proceed with scheduling?",
  default: "I understand you need legal assistance. I can help you with:\n\n• Finding the right lawyer\n• Understanding legal processes\n• Scheduling consultations\n• Answering general legal questions\n\nWhat would you like to know more about?"
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages(initialBotMessages)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getFallbackResponse = (action: string) => {
    return fallbackResponses[action as keyof typeof fallbackResponses] || fallbackResponses.default
  }

  const handleQuickReply = async (action: string) => {
    setCurrentFlow(action)
    
    let prompt = ""
    switch (action) {
      case 'legal_info':
        prompt = "I need information about legal concepts and processes. Can you help me understand the basics?"
        break
      case 'find_lawyer':
        prompt = "I'm looking for a lawyer. Can you help me find the right one based on my needs?"
        break
      case 'schedule':
        prompt = "I want to schedule a consultation with a lawyer. How can I do that?"
        break
      default:
        prompt = "I need help with a legal matter. Can you guide me?"
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const botResponse: Message = {
        id: Date.now().toString(),
        text: data.response || getFallbackResponse(action),
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }

      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: getFallbackResponse(action),
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.response || 'Failed to get response')
      }

      const data = await response.json()
      
      const botResponse: Message = {
        id: Date.now().toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }

      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error getting response:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm having trouble processing your request. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsLoading(false)
    }
  }

  return (
    <>
      <motion.button
        className="fixed bottom-4 right-4 p-4 bg-[#4FD1C5] text-white rounded-full shadow-lg hover:bg-[#38B2AC] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 right-4 w-96 z-50"
          >
            <Card className="h-[500px] flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="text-[#4FD1C5]" />
                  <h3 className="font-semibold">AI Legal Assistant</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close chat"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-[#4FD1C5] text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'user' ? (
                          <User size={16} />
                        ) : (
                          <Bot size={16} />
                        )}
                        <span className="text-xs">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {message.text.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(isTyping || isLoading) && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about legal matters..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage()
                      }
                    }}
                    disabled={isTyping || isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping || isLoading}
                    className="bg-[#4FD1C5] hover:bg-[#38B2AC]"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 