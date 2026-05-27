import { Message, ResumeItem, ResumeData, UserProfile, ExperienceCard, EducationExtra } from './types'

const STORAGE_KEYS = {
  MESSAGES: 'offerpilot_messages',
  RESUME_ITEMS: 'offerpilot_resume_items',
  RESUME_DATA: 'offerpilot_resume_data',
  USER_PROFILE: 'offerpilot_user_profile',
  EXPERIENCE_CARDS: 'experienceCards',
  EDUCATION_EXTRA: 'offerpilot_education_extra',
  RESUME_PHOTO: 'resumePhoto'
}

// 消息存储
export function saveMessages(messages: Message[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  } catch (error) {
    console.error('Failed to save messages:', error)
  }
}

export function loadMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load messages:', error)
    return []
  }
}

export function clearMessages(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.MESSAGES)
}

// 简历条目存储
export function saveResumeItems(items: ResumeItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.RESUME_ITEMS, JSON.stringify(items))
  } catch (error) {
    console.error('Failed to save resume items:', error)
  }
}

export function loadResumeItems(): ResumeItem[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESUME_ITEMS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load resume items:', error)
    return []
  }
}

// 简历数据存储
export function saveResumeData(data: ResumeData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.RESUME_DATA, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save resume data:', error)
  }
}

export function loadResumeData(): ResumeData | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RESUME_DATA)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load resume data:', error)
    return null
  }
}

// 用户信息存储
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
  } catch (error) {
    console.error('Failed to save user profile:', error)
  }
}

export function loadUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load user profile:', error)
    return null
  }
}

export function hasUserProfile(): boolean {
  const profile = loadUserProfile()
  return profile !== null && profile.name !== '' && profile.school !== ''
}

// 技能证书存储（已集成到 UserProfile.skills 中）
// 可独立获取技能证书列表
export function loadSkills(): string[] {
  const profile = loadUserProfile()
  return profile?.skills || []
}

export function saveSkills(skills: string[]): void {
  const profile = loadUserProfile()
  if (profile) {
    profile.skills = skills
    saveUserProfile(profile)
  }
}

// 清除所有数据
export function clearAllData(): void {
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

// ============================================
// 统一 Reset Session —— 重置整个简历会话
// 清除所有 localStorage 数据，让产品回到首次使用状态
// ============================================
export function resetResumeSession(): void {
  if (typeof window === 'undefined') return
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('🗑️ [resetResumeSession] 已清除所有简历数据')
}

// 照片存储（独立于 UserProfile，单独存储避免 base64 数据过大）
export function saveResumePhoto(photo: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.RESUME_PHOTO, photo)
  } catch (error) {
    console.error('Failed to save resume photo:', error)
  }
}

export function loadResumePhoto(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEYS.RESUME_PHOTO)
  } catch (error) {
    console.error('Failed to load resume photo:', error)
    return null
  }
}

export function clearResumePhoto(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.RESUME_PHOTO)
}

// 经历卡片存储
export function saveExperienceCards(cards: ExperienceCard[]): boolean {
  if (typeof window === 'undefined') {
    console.error('❌ saveExperienceCards: window 未定义（SSR 环境）')
    return false
  }
  try {
    const json = JSON.stringify(cards)
    console.log(`💾 saveExperienceCards: 写入 ${cards.length} 条卡片, 数据大小: ${json.length} bytes`)
    console.log(`💾 卡片详情:`, cards.map(c => `${c.type}:${c.title}`))
    localStorage.setItem(STORAGE_KEYS.EXPERIENCE_CARDS, json)
    
    // 验证写入
    const verify = localStorage.getItem(STORAGE_KEYS.EXPERIENCE_CARDS)
    const verifyParsed = verify ? JSON.parse(verify) : []
    if (verifyParsed.length !== cards.length) {
      console.error(`❌ 写入验证失败！expected=${cards.length}, actual=${verifyParsed.length}`)
      console.error(`❌ localStorage raw:`, localStorage.getItem('experienceCards')?.substring(0, 200))
      return false
    }
    console.log(`✅ 写入验证成功，${verifyParsed.length} 条卡片已存储`)
    return true
  } catch (error) {
    console.error('❌ saveExperienceCards 异常:', error)
    return false
  }
}

export function loadExperienceCards(): ExperienceCard[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPERIENCE_CARDS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load experience cards:', error)
    return []
  }
}

export function addExperienceCard(card: ExperienceCard): void {
  const cards = loadExperienceCards()
  cards.push(card)
  saveExperienceCards(cards)
}

// 原子 append：读取 → 追加 → 写入，一步完成，返回新数组
export function appendExperienceCard(newCard: ExperienceCard): ExperienceCard[] {
  const existing = loadExperienceCards() || []
  const updated = [...existing, newCard]
  localStorage.setItem(STORAGE_KEYS.EXPERIENCE_CARDS, JSON.stringify(updated))
  console.log("Appending card:", newCard.title)
  console.log("All cards after append:", updated.map(c => ({ id: c.id, type: c.type, title: c.title })))
  return updated
}

export function updateExperienceCard(id: string, updates: Partial<ExperienceCard>): void {
  const cards = loadExperienceCards()
  const index = cards.findIndex(c => c.id === id)
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updates }
    saveExperienceCards(cards)
  }
}

export function deleteExperienceCard(id: string): void {
  const cards = loadExperienceCards()
  const filtered = cards.filter(c => c.id !== id)
  saveExperienceCards(filtered)
}

export function clearExperienceCards(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEYS.EXPERIENCE_CARDS)
}

// 教育经历补充信息存储
export function saveEducationExtra(education: EducationExtra): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.EDUCATION_EXTRA, JSON.stringify(education))
  } catch (error) {
    console.error('Failed to save education extra:', error)
  }
}

export function loadEducationExtra(): EducationExtra | null {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EDUCATION_EXTRA)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load education extra:', error)
    return null
  }
}
