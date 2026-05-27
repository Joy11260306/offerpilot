import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { GENERATE_RESUME_PROMPT } from '@/lib/prompts/resumeCoach'

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
    const { chatHistory, userInfo } = body as { 
      chatHistory: Message[],
      userInfo?: { name?: string; email?: string; phone?: string }
    }

    if (!chatHistory || !Array.isArray(chatHistory)) {
      return NextResponse.json(
        { error: 'Invalid chat history format' },
        { status: 400 }
      )
    }

    // 构建系统提示
    const systemMessage: Message = {
      role: 'system',
      content: GENERATE_RESUME_PROMPT
    }

    // 用户信息提示
    const userInfoText = userInfo
      ? `\n用户基本信息：\n姓名：${userInfo.name || '未提供'}\n邮箱：${userInfo.email || '未提供'}\n手机：${userInfo.phone || '未提供'}`
      : ''

    // 构建请求
    const userMessage: Message = {
      role: 'user',
      content: `请根据以下对话历史生成结构化简历：\n\n${chatHistory.map((m: Message) => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n\n')}${userInfoText}\n\n请严格输出 JSON 格式的简历数据。`
    }

    const fullMessages = [systemMessage, userMessage]

    // 调用 DeepSeek API
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: fullMessages,
      temperature: 0.5,
      max_tokens: 2000,
      stream: false
    })

    const responseContent = completion.choices[0]?.message?.content || ''

    // 尝试解析 JSON
    let resumeData = null
    try {
      // 提取 JSON 部分
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        resumeData = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
    }

    return NextResponse.json({
      data: resumeData,
      rawText: responseContent,
      done: true
    })
  } catch (error: any) {
    console.error('DeepSeek API Error:', error)

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
