import { NextResponse } from 'next/server'
import { GoogleGenAI } from "@google/genai"

// Initialize Gemini with the new SDK
const genAI = new GoogleGenAI({ 
  apiKey: 'AIzaSyDIeGqE4JRVRATJYXHztUmawcKyNR2LKB8'
})

const systemPrompt = `You are a helpful AI assistant for Turn2Law, a legal consultation platform. Your role is to:
1. Provide accurate and helpful responses to legal questions
2. Maintain a professional and friendly tone
3. Break down complex legal concepts into easy-to-understand explanations
4. Admit when you don't know something
5. Ask clarifying questions when needed
6. Provide examples and analogies to illustrate points
7. Format responses with proper spacing and structure
8. Use bullet points or numbered lists when appropriate
9. Be concise but thorough in your explanations

Remember to:
- Be professional and empathetic
- Keep responses clear and well-structured
- Use appropriate formatting for readability
- Provide context and background when relevant
- Ask follow-up questions to better understand the user's needs
- Focus on Indian legal system and laws when relevant`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    // Get the last user message
    const lastUserMessage = messages
      .filter((msg: any) => msg.sender === 'user')
      .pop()

    if (!lastUserMessage) {
      return NextResponse.json(
        { response: "I didn't receive your message. Please try again." },
        { status: 400 }
      )
    }

    console.log('Sending request to Gemini API with message:', lastUserMessage.text)
    
    // Prepare the prompt with system instructions and user message
    const prompt = `${systemPrompt}\n\nUser: ${lastUserMessage.text}\n\nAssistant:`

    // Generate content using the new model
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    })

    const generatedText = response.text

    if (!generatedText) {
      throw new Error('No response generated from Gemini')
    }

    console.log('Received response from Gemini API:', generatedText)

    return NextResponse.json({
      response: generatedText
    })
  } catch (error: any) {
    console.error('Error in chat API:', error)
    
    // Log the full error for debugging
    console.error('Full error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    })
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      return NextResponse.json({
        response: "There's an issue with the API key. Please check if it's valid and properly configured."
      }, { status: 500 })
    }
    
    if (error.response?.status === 404) {
      return NextResponse.json({
        response: "The API endpoint is not found. Please check the API configuration."
      }, { status: 500 })
    }
    
    if (error.response?.status === 429) {
      return NextResponse.json({
        response: "I'm getting too many requests right now. Please try again in a few moments."
      })
    }

    return NextResponse.json({
      response: `I apologize, but I'm having trouble processing your request. Error: ${error.message}`
    })
  }
} 