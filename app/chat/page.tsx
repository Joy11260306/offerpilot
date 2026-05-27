'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Message, ResumeItem, ExperienceCard } from '@/lib/types'
import { ChatWindow } from '@/components/ChatWindow'
import { ChatInput } from '@/components/ChatInput'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { saveMessages, loadMessages, resetResumeSession, saveResumeItems, loadResumeItems, saveExperienceCards, loadExperienceCards } from '@/lib/storage'
import { generateId, isEmpty } from '@/lib/utils'
import { ArrowRight, Wand2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

// 生成唯一 ID
const generateUniqueId = (): string => {
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return generateId()
}

// ============================================
// 【第一部分】聊天话术过滤
// ============================================

// 扩展的聊天话术关键词列表
const CHAT_FILLER_KEYWORDS = [
  // 对话确认类
  '你觉得贴切吗', '这个版本', '如果没问题', '你还有其他', '我们可以继续',
  '还有什么', '这样可以吗', '你觉得怎么样', '还有其他想说的吗', '还有其他经历',
  // 语气词类
  '很好', '不错', '好的', '太棒了', '接下来', '下面我们来', '让我们继续',
  '有没有其他', '还有没有', '暂时没有', '先这样吧', '差不多就这些',
  // 对话开头类
  '你希望', '你想', '要不要', '哈哈', '嘿嘿', '嗯嗯', '好的好的', '收到', '了解',
  // AI 引导类
  '我来帮你', '让我来', '我来总结', '我来生成', '总结一下', '生成一条',
  '这条经历', '这份经历', '这段经历', '这个经历', '继续聊', '继续说',
  '我来问一下', '我们来聊聊', '继续聊聊',
  // 模板废话类
  '根据你提供的信息', '根据您的描述', '根据你的描述', '以下是一条', '以下是这段',
  '这段经历', '这条内容', '这份简历', '专业简历 bullet', '专业的简历内容',
  '我将为你', '我会帮你', '帮你整理', '帮你生成'
]

// 检查是否为聊天话术
const isChatFiller = (text: string): boolean => {
  const trimmed = text.trim()
  if (!trimmed) return true

  // 太短的内容可能是话术
  if (trimmed.length < 5) return true

  // 检查是否包含聊天话术关键词
  for (const keyword of CHAT_FILLER_KEYWORDS) {
    if (trimmed.includes(keyword)) return true
  }

  // 检查是否全是以问号结尾（AI 问题）
  if (/^[^？?]*[？?]$/.test(trimmed) && trimmed.length < 50) {
    if (!trimmed.includes('：') && !trimmed.includes(':')) {
      return true
    }
  }

  // 检查对话式开头
  if (/^(你觉得|你觉得怎|我们|接下来|下面|好的|那我们|我来|请问|能否|可以不可以)/.test(trimmed)) {
    return true
  }

  // 检查是否只有"内容"、"描述"等占位符
  if (/^(内容|描述|详情|说明)[：:]?$/i.test(trimmed)) return true

  return false
}

// 清理格式化符号
const cleanFormatting = (line: string): string => {
  return line
    .replace(/^#{1,6}\s+/g, '')
    .replace(/^\*{1,2}\s+/g, '')
    .replace(/^_{1,2}\s+/g, '')
    .replace(/^`{1,3}\s*/g, '')
    .replace(/^\~\~\s*/g, '')
    .replace(/^>\s*/g, '')
    .replace(/^[一二三四五六七八九十百千0-9点]+[.、:：]\s*/g, '')
    .replace(/^[0-9]+[.、:：]\s*/g, '')
    .replace(/^[●○•◉◆◇✓✔★☆†‡‡§¶]+[\s]+/g, '')
    .replace(/^[\|│┄┈_-]+[\s]*/g, '')
    .trim()
}

// 过滤内容行（增强版）
const filterContentLines = (lines: string[], title: string): string[] => {
  const normalizedTitle = title.toLowerCase().trim()
  const shortTitle = normalizedTitle.substring(0, Math.min(8, normalizedTitle.length))
  const seen = new Set<string>()

  return lines.filter(line => {
    let trimmed = line.trim()
    if (!trimmed) return false

    // 清理格式化符号
    trimmed = cleanFormatting(trimmed)
    if (!trimmed || trimmed.length < 6) return false

    // 精确去重
    const normalized = trimmed.toLowerCase().replace(/\s+/g, '').substring(0, 15)
    if (seen.has(normalized)) return false
    seen.add(normalized)

    // 过滤与标题重复的内容
    if (shortTitle && normalized.includes(shortTitle.replace(/\s+/g, ''))) {
      return false
    }

    // 过滤聊天话术
    if (isChatFiller(trimmed)) return false

    // 过滤纯数字或纯符号行
    if (/^[\d\s\-\.]+$/.test(trimmed)) return false

    // 过滤包含 URL 的行
    if (/https?:\/\//.test(trimmed)) return false

    // 过滤纯英文单词（除非是技术术语）
    if (/^[a-zA-Z]{2,15}$/.test(trimmed) && 
        !/^(React|Vue|Angular|Node|Python|Java|JS|TS|SQL|Git|K8s|Docker|AWS|GCP|Vue3|React18)$/i.test(trimmed)) {
      return false
    }

    return true
  })
}

// ============================================
// 【第二部分】经历分类
// ============================================

// 根据内容智能分类经历类型
const classifyContent = (text: string): 'education' | 'campus' | 'project' | 'internship' => {
  const fullText = text.toLowerCase()

  // 1. 校园经历（最高优先级）
  const campusKeywords = [
    '学生会', '社团', '志愿者', '志愿', '迎新晚会', '校园招聘', '活动策划', '比赛组织',
    '班委', '班长', '部长', '主席', '会长', '书记', '干事', '团支', '文体', '外联', '宣传',
    '组织部', '文艺部', '体育部', '社团联合', '协会', '球队', '乐团', '乐队',
    '朗诵', '演讲', '辩论', '朗诵队', '合唱团', '志愿队', '社会实践队',
    '社团活动', '校园活动', '班级活动', '团日活动', '志愿活动', '义工', '支教',
    '学生干部', '学生组织', '学生社团'
  ]
  const isCampus = campusKeywords.some(keyword => fullText.includes(keyword))
  if (isCampus) {
    return 'campus'
  }

  // 2. 实习经历
  const internshipKeywords = [
    '实习', '公司实习', '企业实习', '岗位实习', '参加实习', '试用期',
    '转正', '正式员工', '实习工作'
  ]
  const isInternship = internshipKeywords.some(keyword => fullText.includes(keyword))
  if (isInternship) {
    return 'internship'
  }

  // 3. 项目经历
  const projectKeywords = [
    '科研', '企业合作', '课程项目', 'AI项目', '产品项目', '毕设', '课程设计',
    '竞赛', '算法', '系统设计', '系统开发', 'APP开发', '网站开发', '小程序开发',
    '作品集', '科创', '创新项目', '科研项目', '横向课题', '纵向课题',
    '论文', '期刊', '发表', '专利', '软著', '编程', '代码',
    '项目经验', '项目经历', '项目实践', '课题研究'
  ]
  const isProject = projectKeywords.some(keyword => fullText.includes(keyword))
  if (isProject) {
    return 'project'
  }

  // 4. 教育经历（最严格，只有明确匹配才归类）
  const hasSchool = /大学|学院|学校/.test(fullText)
  const hasMajor = /专业|学历|gpa|绩点|GPA|成绩|排名/.test(fullText)
  const hasDegree = /本科|硕士|博士|专科|研究生/.test(fullText)

  if (hasSchool && (hasMajor || hasDegree)) {
    return 'education'
  }

  // 默认归类为校园经历
  return 'campus'
}

// ============================================
// 【第三部分】标题提取
// ============================================

// 从内容中提取标题
const extractTitle = (text: string, type?: string): string => {
  const lines = text.split('\n').filter(l => l.trim())
  const fullText = text.trim()
  
  // 1. 优先从明确的项目/活动名称提取
  const patterns = [
    // 项目名称
    /(?:项目名称|项目名)[:：]\s*(.+)/i,
    /(?:参与|负责|主持|执行)(?:的|了)?(.+?)(?:项目|专项)/,
    // 活动名称
    /(?:活动名称|活动名)[:：]\s*(.+)/i,
    /(?:组织|策划|执行)(?:的|了)?(.+?)(?:活动|晚会|比赛|招聘会)/,
    // 公司+岗位
    /(?:公司|企业)[:：]\s*(.+?)(?:[\/|\\]|$)/,
    // 组织+角色
    /(?:担任|作为)(?:的|)?(.+?)(?:部长|主席|会长|书记|干事|成员|负责人)/,
  ]
  
  for (const pattern of patterns) {
    const match = fullText.match(pattern)
    if (match && match[1] && match[1].length > 2 && match[1].length < 30) {
      return match[1].trim()
    }
  }
  
  // 2. 从第一行提取（清理格式符号）
  if (lines.length > 0) {
    const firstLine = lines[0]
      .replace(/^[#\-*\d.、●○•]+/, '')
      .replace(/\[(校园|项目|实习|教育)经历\]/gi, '')
      .trim()
    
    if (firstLine.length > 2 && firstLine.length < 40 && !isChatFiller(firstLine)) {
      return firstLine
    }
  }
  
  // 3. 根据类型生成默认标题
  if (type === 'campus') {
    const orgMatch = fullText.match(/(学生会|团委|社团|协会|组织)(.+?)(?:担任|负责|组织)/)
    if (orgMatch) return orgMatch[0].substring(0, 20)
    return '校园活动经历'
  }
  if (type === 'project') {
    const projMatch = fullText.match(/(.+?)(?:项目|专项|课题|竞赛)/)
    if (projMatch) return projMatch[1] + '项目'
    return '项目经历'
  }
  if (type === 'internship') {
    const internMatch = fullText.match(/(.+?)(?:实习|工作)/)
    if (internMatch) return internMatch[1] + '实习'
    return '实习经历'
  }
  if (type === 'education') {
    const eduMatch = fullText.match(/(.+大学|.+学院)/)
    if (eduMatch) return eduMatch[1]
    return '教育经历'
  }
  
  // 4. 最后手段：从关键词拼凑
  const keywordMatch = fullText.match(/(?:负责|参与|担任|组织)(.+)/)
  if (keywordMatch && keywordMatch[1].length > 3) {
    return keywordMatch[1].substring(0, 20).trim()
  }
  
  // 5. 绝对禁止返回空标题
  return '经历卡片'
}

// ============================================
// 【第四部分】时间提取
// ============================================

// 提取时间范围
const extractTimeRange = (text: string): { start: string; end: string } => {
  // 匹配 YYYY.MM - YYYY.MM 或 YYYY.MM - 至今
  const timePattern = /(\d{4}[.\-]\d{2})\s*[-~至]\s*(\d{4}[.\-]\d{2}|至今|现在)/i
  const match = text.match(timePattern)
  
  if (match) {
    return {
      start: match[1].replace('-', '.'),
      end: match[2] === '至今' || match[2] === '现在' ? '至今' : match[2].replace('-', '.')
    }
  }
  
  // 尝试匹配只有年份的格式
  const yearPattern = /(\d{4})\s*[-~至]\s*(\d{4}|至今|现在)/i
  const yearMatch = text.match(yearPattern)
  if (yearMatch) {
    return {
      start: yearMatch[1] + '.09',
      end: yearMatch[2] === '至今' || yearMatch[2] === '现在' ? '至今' : yearMatch[2] + '.06'
    }
  }
  
  return { start: '', end: '至今' }
}

// ============================================
// 【第五部分】经历卡片生成核心逻辑
// ============================================

// 新经历信号检测（用户开始讲述新经历时触发）
const NEW_EXPERIENCE_SIGNALS = [
  /我还参加/, /我还参与/, /我还有/, /另外(一个|些|的)/,
  /另一个(项目|活动|经历|实习|工作)/, /除此之外/,
  /之前(还|也|有)/, /之前参加/, /之前做过/,
  /除了(这个|上述|以上)/, /接下来说/, /再说一个/,
  /再讲一个/, /还有一段/, /还有一次/
]

// 检测是否为新经历开始
const isNewExperienceStart = (text: string): boolean => {
  for (const signal of NEW_EXPERIENCE_SIGNALS) {
    if (signal.test(text)) return true
  }
  return false
}

// 检测是否在补充现有经历
const isSupplementing = (text: string, lastCard: ExperienceCard | null): boolean => {
  if (!lastCard) return false
  
  // 检查是否提到上一张卡片的关键词
  const lastTitle = lastCard.title
  if (lastTitle && text.includes(lastTitle.substring(0, Math.min(6, lastTitle.length)))) {
    return true
  }
  
  // 检查是否有补充信号
  const supplementSignals = [
    /继续/, /补充/, /还有/, /另外/, /此外/,
    /另外还/, /除此之外/, /补充一下/
  ]
  
  for (const signal of supplementSignals) {
    if (signal.test(text)) {
      // 但如果标题完全不同，则不是补充
      const normalized = text.toLowerCase().replace(/\s+/g, '')
      const lastNorm = lastTitle.toLowerCase().replace(/\s+/g, '')
      if (!normalized.includes(lastNorm.substring(0, Math.min(4, lastNorm.length)))) {
        return false
      }
      return true
    }
  }
  
  return false
}

// 标准化标题用于比较
const normalizeTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, '')
    .substring(0, 15)
}

// 检查标题是否实质相同（用于判断是否同一经历）
const isSameExperience = (title1: string, title2: string): boolean => {
  const n1 = normalizeTitle(title1)
  const n2 = normalizeTitle(title2)
  
  // 精确匹配
  if (n1 === n2) return true
  
  // 一个完全包含另一个
  if (n1.includes(n2) || n2.includes(n1)) return true
  
  // 核心词匹配（前4个中文字符）
  const core1 = n1.replace(/[\u4e00-\u9fa5]+/g, (m) => m.substring(0, 2))
  const core2 = n2.replace(/[\u4e00-\u9fa5]+/g, (m) => m.substring(0, 2))
  if (core1.length >= 4 && core2.length >= 4) {
    if (core1.includes(core2.substring(0, 4)) || core2.includes(core1.substring(0, 4))) {
      return true
    }
  }
  
  return false
}

// 解析 AI 返回的多行内容为数组
const parseContentLines = (text: string): string[] => {
  return text.split('\n')
    .map(line => line.replace(/^[#\-*\d.、●○•]+/, '').trim())
    .filter(line => line.length > 5)
}

// ============================================
// 【第六部分】JSON 解析
// ============================================

// 解析 JSON 格式的简历数据
const parseJSONResume = (content: string): ExperienceCard[] => {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                      content.match(/(\{[\s\S]*\})/)

    if (jsonMatch) {
      const jsonStr = jsonMatch[1]
      const parsed = JSON.parse(jsonStr)

      if (parsed.experiences && Array.isArray(parsed.experiences)) {
        return parsed.experiences.map((exp: any) => {
          const rawContent = Array.isArray(exp.content) ? exp.content : parseContentLines(exp.content || '')
          const type = exp.type || 'campus'
          const title = exp.title || extractTitle(rawContent.join('\n'), type)
          const filteredContent = filterContentLines(rawContent, title)

          return {
            id: generateUniqueId(),
            type,
            title,
            role: exp.role || '',
            start: exp.start || '',
            end: exp.end || '至今',
            content: filteredContent,
            createdAt: new Date().toISOString()
          }
        })
      }
    }
  } catch (e) {
    console.log('JSON parsing failed')
  }
  return []
}

// ============================================
// 【第七部分】内容块解析
// ============================================

// 从 AI 响应中提取经历块
interface ExperienceBlock {
  type: string
  title: string
  rawContent: string[]
  timeRange: { start: string; end: string }
}

// 解析经历内容块
const parseExperienceBlocks = (content: string): ExperienceBlock[] => {
  const blocks: ExperienceBlock[] = []
  
  // 1. 先检测 [类型经历] 标记格式
  const markedPatterns = [
    { pattern: /\[校园经历\][\s\n]*([\s\S]*?)(?=\n\[|$)/gi, type: 'campus' },
    { pattern: /\[项目经历\][\s\n]*([\s\S]*?)(?=\n\[|$)/gi, type: 'project' },
    { pattern: /\[实习经历\][\s\n]*([\s\S]*?)(?=\n\[|$)/gi, type: 'internship' },
    { pattern: /\[教育经历\][\s\n]*([\s\S]*?)(?=\n\[|$)/gi, type: 'education' }
  ]

  for (const { pattern, type } of markedPatterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1].trim()
      if (text && text.length > 15) {
        const title = extractTitle(text, type)
        const rawLines = parseContentLines(text)
        const timeRange = extractTimeRange(text)
        blocks.push({ type, title, rawContent: rawLines, timeRange })
      }
    }
  }

  // 2. 检测多行简历描述格式（无标记但有多行内容）
  const allLines = content.split('\n')
  let currentBlock = ''
  let inBlock = false

  for (const line of allLines) {
    const trimmed = line.trim()

    if (/^[#\-*\d.、●○•]/.test(trimmed) || /^[a-zA-Z\d]+[.、:]/.test(trimmed)) {
      currentBlock += trimmed + '\n'
      inBlock = true
    } else if (inBlock && trimmed.length > 0) {
      if (currentBlock.trim().length > 20) {
        const type = classifyContent(currentBlock)
        const title = extractTitle(currentBlock, type)
        const rawLines = parseContentLines(currentBlock)
        const timeRange = extractTimeRange(currentBlock)
        blocks.push({ type, title, rawContent: rawLines, timeRange })
      }
      currentBlock = ''
      inBlock = false
    }
  }

  if (currentBlock.trim().length > 20) {
    const type = classifyContent(currentBlock)
    const title = extractTitle(currentBlock, type)
    const rawLines = parseContentLines(currentBlock)
    const timeRange = extractTimeRange(currentBlock)
    blocks.push({ type, title, rawContent: rawLines, timeRange })
  }

  return blocks
}

// 首次欢迎消息
const WELCOME_MESSAGE = `你好，我是你的 AI 简历教练。

我会通过几轮简单对话，帮你挖掘经历并整理成专业简历。

不用担心自己没有经验，很多校园经历都可以变成简历亮点。

先从一个简单的问题开始：

你最近做过的一件最有成就感的事情是什么？
（例如社团活动、课程项目、兼职、比赛、志愿服务等）`

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ★ React state 作为经历卡片的唯一数据源
  const [experienceCards, setExperienceCards] = useState<ExperienceCard[]>(() => loadExperienceCards())

  // ★ 待补全经历：AI 追问时间后，缓存用户原始输入，等用户回复时间后拼回上下文
  const [pendingExperience, setPendingExperience] = useState<string | null>(null)

  // 防重复调用标记
  const lastProcessedRef = useRef<string>('')

  // 加载保存的消息 & 首次欢迎
  useEffect(() => {
    console.log("chat page mounted")
    setMounted(true)
    const savedMessages = loadMessages()

    // 首次进入且无消息时，自动插入欢迎消息
    if (savedMessages.length === 0) {
      const welcomeMsg: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: WELCOME_MESSAGE,
        createdAt: new Date().toISOString()
      }
      setMessages([welcomeMsg])
      saveMessages([welcomeMsg])
    } else {
      setMessages(savedMessages)
    }
  }, [])

  // 保存消息到本地
  useEffect(() => {
    if (mounted) {
      saveMessages(messages)
    }
  }, [messages, mounted])

  // ★ state 变更自动同步到 localStorage（单向：state → localStorage）
  useEffect(() => {
    saveExperienceCards(experienceCards)
    console.log("Saving cards:", experienceCards.length, "条")
    console.log("Saving:", experienceCards.length)
  }, [experienceCards])

  // 发送消息
  const handleSendMessage = useCallback(async (content: string) => {
    if (isEmpty(content) || isLoading) return

    // 添加用户消息
    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    // ★ 如果有待补全的经历，把原始经历 + 用户补充拼成完整上下文发给 AI
    let apiMessages = newMessages
    if (pendingExperience) {
      const mergedContent = `这是同一段经历的补充信息，请整合后重新生成完整 experienceCard。

原始经历：
${pendingExperience}

补充时间：
${content}

请务必把时间写入 experienceCard 的 "time" 字段。
格式示例："time": "2024.09-2024.12"

并返回完整 experienceCard JSON。`
      apiMessages = [
        ...messages,
        { ...userMessage, content: mergedContent } as Message
      ]
      console.log("🔗 合并待补全上下文，发送给 AI:", mergedContent.substring(0, 200))
    }

    try {
      // 调用 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: apiMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '请求失败')
      }

      const data = await response.json()
      const rawContent: string = data.content || ''

      // ============================================
      // 【STEP 1】先直接尝试解析 AI 返回的 JSON
      // 确保聊天框始终显示 reply 文本，而不是 JSON 字符串
      // ============================================
      let displayContent = rawContent   // 默认用原始内容兜底

      try {
        const start = rawContent.indexOf('{')
        const end = rawContent.lastIndexOf('}')
        if (start !== -1 && end !== -1 && end > start) {
          const jsonStr = rawContent.slice(start, end + 1)
          const parsed = JSON.parse(jsonStr)
          // 根据 JSON 内容决定显示文本
          if (parsed && parsed.needMoreInfo && parsed.question) {
            // 情况 B：缺少时间，显示追问，同时缓存用户原始输入
            displayContent = parsed.question
            setPendingExperience(userMessage.content)
            console.log("✅ 显示追问问题:", displayContent)
          } else if (parsed && parsed.reply) {
            // 情况 A：信息完整，显示 reply
            displayContent = parsed.reply
            console.log("✅ 直接从 AI 响应解析到 reply:", displayContent.substring(0, 100))
          }
        }
      } catch (e) {
        console.log("ℹ️ AI 响应不是 JSON 格式，使用原始文本显示")
      }

      // ============================================
      // 【STEP 2】提取经历卡片 → 通过 setExperienceCards 更新 state
      // state 变更后由 useEffect 自动同步 localStorage
      // ============================================
      const newCard = checkForResumeItems(rawContent, userMessage.content)
      console.log("checkForResumeItems 返回:", newCard ? `card: ${newCard.title}` : "null")

      if (newCard) {
        console.log("Adding:", JSON.stringify(newCard, null, 2))
        console.log("Appending card...")

        // ★ 卡片生成成功，清空待补全经历
        setPendingExperience(null)

        // ★ 使用 prev => [...] 避免 stale closure，确保追加而非覆盖
        setExperienceCards(prev => {
          console.log("prev length:", prev.length)
          console.log("新增卡片标题:", newCard.title)
          const updated = [...prev, newCard]
          console.log("保存后数量:", updated.length)
          toast.success(`已提取经历卡片：${newCard.title}`)
          return updated
        })

        // 保存兼容性格式（ResumeItem）
        const resumeItem: ResumeItem = {
          id: newCard.id,
          type: newCard.type === 'internship' ? 'project' : newCard.type,
          content: newCard.content.join('\n'),
          role: newCard.role,
          start: newCard.start,
          end: newCard.end,
          createdAt: newCard.createdAt
        }
        const existingItems = loadResumeItems()
        saveResumeItems([...existingItems, resumeItem])
      }

      // 添加 AI 响应到聊天
      const assistantMessage: Message = {
        id: generateUniqueId(),
        role: 'assistant',
        content: displayContent,
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Chat Error:', error)
      toast.error(error.message || 'AI暂时开小差了，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, pendingExperience])

  // ============================================
  // 【核心】检查并提取经历卡片
  // 从 AI 回复中检测 JSON 格式经历，返回新卡片（不写 localStorage）
  // 返回 ExperienceCard | null
  // ============================================
  const checkForResumeItems = (aiContent: string, userContent: string): ExperienceCard | null => {
    // 防重复：相同内容不再处理
    if (aiContent === lastProcessedRef.current) {
      console.warn("⚠️ 与上次处理的 AI 内容完全相同，跳过")
      return null
    }

    lastProcessedRef.current = aiContent

    console.log("===== checkForResumeItems 开始 =====")
    console.log("AI回复原文:", aiContent)

    try {
      // 完整提取最外层 JSON（用贪婪匹配找第一个 { 到最后一个 }）
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        console.log("!!! 没有找到 JSON，返回 null")
        return null
      }

      const jsonString = jsonMatch[0]
      console.log("JSON 提取位置:", { start: jsonMatch.index, end: jsonMatch.index! + jsonString.length })
      console.log("Full extracted JSON:", jsonString)

      // 尝试解析 JSON
      let parsed: any
      try {
        parsed = JSON.parse(jsonString)
        console.log("JSON解析成功:", JSON.stringify(parsed).substring(0, 500))
      } catch (err) {
        console.error("!!! JSON解析失败:", err)
        return null
      }

      // 提取 experienceCard（兼容新旧两种格式）
      // 新格式：{ experienceCard: {...}, reply: "..." }
      // 旧格式：{ type, title, content, ... }
      const cardData = parsed.experienceCard || parsed
      console.log(">>> cardData 提取结果:", {
        hasExperienceCard: !!parsed.experienceCard,
        cardDataType: cardData?.type,
        cardDataTitle: cardData?.title,
        cardDataContentType: typeof cardData?.content,
        cardDataContentIsArray: Array.isArray(cardData?.content)
      })
      
      if (!cardData || !cardData.type || !cardData.title || !cardData.content) {
        console.log("!!! 缺少必要字段:", { 
          hasType: !!cardData?.type, 
          hasTitle: !!cardData?.title, 
          hasContent: !!cardData?.content,
          isArray: Array.isArray(cardData?.content)
        })
        return null
      }

      // 处理 content（支持多种 AI 返回格式）
      let filteredContent: string[] = []

      if (Array.isArray(cardData.content)) {
        for (const item of cardData.content) {
          if (typeof item === 'string') {
            const trimmed = item.trim()
            if (trimmed) filteredContent.push(trimmed)
          } else if (typeof item === 'object' && item !== null) {
            const text = item.text || item.content || item.description || item.detail || item.value || ''
            if (typeof text === 'string') {
              const trimmed = text.trim()
              if (trimmed) filteredContent.push(trimmed)
            }
          }
        }
      } else if (typeof cardData.content === 'string') {
        filteredContent = cardData.content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
      }

      console.log(`>>> content 解析完成，共 ${filteredContent.length} 条`)

      if (filteredContent.length === 0) {
        console.warn("!!! content 解析后为空，原始 content:", JSON.stringify(cardData.content).substring(0, 300))
        return null
      }

      // ★ 解析时间字段：兼容 prompt 中的 "time" 和旧格式的 "start"/"end"
      // prompt 要求 AI 返回 "time": "2024.09-2024.12"，但卡片存储用 start/end
      let cardStart = cardData.start || ''
      let cardEnd = cardData.end || ''
      if (!cardStart && cardData.time) {
        // 从 "time" 字段解析：支持 "2024.09-2024.12" 或 "2024.09-至今"
        const timeStr: string = cardData.time
        const parts = timeStr.split('-')
        if (parts.length >= 2) {
          cardStart = parts[0].trim()
          cardEnd = parts.slice(1).join('-').trim()
        } else {
          cardStart = timeStr.trim()
        }
      }
      if (!cardEnd) cardEnd = '至今'
      console.log(`⏰ 时间解析: time="${cardData.time || '-'}" → start="${cardStart}" end="${cardEnd}"`)

      const newCard: ExperienceCard = {
        id: generateUniqueId(),
        type: cardData.type,
        title: cardData.title,
        role: cardData.role || '',
        start: cardStart,
        end: cardEnd,
        content: filteredContent,
        createdAt: new Date().toISOString()
      }
      console.log(">>> 返回卡片:", JSON.stringify({
        id: newCard.id,
        type: newCard.type,
        title: newCard.title,
        role: newCard.role,
        contentCount: newCard.content.length
      }))

      return newCard

    } catch (error) {
      console.error("❌ 提取经历卡片失败:", error)
      return null
    }
  }

  // 生成完整简历
  const handleGenerateResume = async () => {
    if (messages.length === 0) {
      toast.error('请先和 AI 聊聊你的经历')
      return
    }

    setIsGeneratingResume(true)

    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '生成失败')
      }

      const data = await response.json()

      if (data.data) {
        // 保存到本地存储
        localStorage.setItem('offerpilot_resume_data', JSON.stringify(data.data))
        toast.success('简历已生成！')
        router.push('/resume')
      } else {
        toast.error('无法解析简历数据，请稍后重试')
      }
    } catch (error: any) {
      console.error('Generate Resume Error:', error)
      toast.error(error.message || '生成失败，请稍后重试')
    } finally {
      setIsGeneratingResume(false)
    }
  }

  // 开始新对话 → 统一重置整个简历会话
  const handleNewChat = () => {
    if (confirm('确定要开始新对话吗？这将重置整个会话，包括聊天记录、经历卡片、个人信息和照片。')) {
      resetResumeSession()
      setMessages([])
      setExperienceCards([])
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow messages={messages} isLoading={isLoading} />
        
        <div className="border-t bg-background/80 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 py-3 flex gap-3">
            <Button
              onClick={handleGenerateResume}
              disabled={isLoading || isGeneratingResume || messages.length === 0}
              variant="outline"
              className="gap-2"
            >
              {isGeneratingResume ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              生成简历
            </Button>
            <Button
              onClick={() => router.push('/experiences')}
              variant="outline"
              className="gap-2"
            >
              查看经历卡片
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ChatInput
          onSend={handleSendMessage}
          disabled={isLoading}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
