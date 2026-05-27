import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { RESUME_COACH_SYSTEM_PROMPT } from '@/lib/prompts/resumeCoach'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
})

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body as { messages: Message[] }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // 构建完整的消息列表，包含系统提示
    const systemMessage: Message = {
      role: 'system',
      content: RESUME_COACH_SYSTEM_PROMPT
    }

    const fullMessages = [systemMessage, ...messages]

    // 调用 DeepSeek API
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    })

    const responseContent = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      content: responseContent,
      done: true
    })
  } catch (error: any) {
    console.error('DeepSeek API Error:', error)

    // 处理 API 错误
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'API Key 无效或已过期，请检查环境配置' },
        { status: 401 }
      )
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: '请求过于频繁，请稍后再试' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'AI暂时开小差了，请稍后再试' },
      { status: 500 }
    )
  }
}
