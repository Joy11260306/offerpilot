'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ExperienceCard, CategorizedExperienceCards } from '@/lib/types'
import { ExperienceCard as ExperienceCardComponent } from '@/components/ExperienceCard'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { saveExperienceCards, loadExperienceCards, deleteExperienceCard, updateExperienceCard } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { Plus, MessageSquare, FileText, ArrowRight, Sparkles, X, Edit3, Check, Calendar, Briefcase, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

// 生成唯一 ID
const generateUniqueId = (): string => {
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return generateId()
}

// 生成经历卡片的唯一标识（用于去重）
const getCardSignature = (card: ExperienceCard): string => {
  return `${card.type}_${card.title}_${card.role || ''}_${card.start || ''}_${card.end || ''}`.toLowerCase().trim()
}

export default function ExperiencesPage() {
  const [cards, setCards] = useState<ExperienceCard[]>([])
  const [mounted, setMounted] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editContent, setEditContent] = useState('')

  // 加载数据 - 实时读取
  const loadCards = useCallback(() => {
    // ★ 直接用原始 key 读取，确认 localStorage 有无数据
    const rawData = localStorage.getItem('experienceCards')
    console.log("📋 经历卡片页 - 原生读取:", rawData ? `${rawData.length} 字节` : "null 或不存在")
    
    const savedCards = loadExperienceCards()
    console.log("📋 经历卡片页 - loadExperienceCards:", savedCards.length, "条")
    console.log("📋 详情:", JSON.stringify(savedCards.map(c => ({ id: c.id, type: c.type, title: c.title }))))
    // 只从 localStorage 同步，不写回（避免覆盖聊天页面的保存）
    // 手动操作（删除/编辑/添加）才写回 localStorage
    setCards(savedCards)
  }, [])

  useEffect(() => {
    setMounted(true)
    loadCards()
    
    // 每秒检查一次 localStorage 变化（用于从聊天页面同步）
    const interval = setInterval(loadCards, 1000)
    return () => clearInterval(interval)
  }, [loadCards])

  // 不自动保存 cards 到 localStorage（避免覆盖聊天页面刚写入的数据）
  // 只有用户手动操作（删除/编辑/添加）才触发保存

  // 开始编辑
  const handleStartEdit = (card: ExperienceCard) => {
    setEditingId(card.id)
    setEditTitle(card.title)
    setEditRole(card.role || '')
    setEditStart(card.start || '')
    setEditEnd(card.end || '至今')
    setEditContent(card.content.join('\n'))
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (editingId) {
      const contentLines = editContent.split('\n').filter(l => l.trim())
      updateExperienceCard(editingId, {
        title: editTitle || '未命名经历',
        role: editRole,
        start: editStart,
        end: editEnd || '至今',
        content: contentLines
      })
      setCards(prev => prev.map(c => 
        c.id === editingId 
          ? { ...c, title: editTitle || '未命名经历', role: editRole, start: editStart, end: editEnd || '至今', content: contentLines }
          : c
      ))
      toast.success('已更新')
      setEditingId(null)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditRole('')
    setEditStart('')
    setEditEnd('')
    setEditContent('')
  }

  // 删除卡片
  const handleDelete = useCallback((id: string) => {
    deleteExperienceCard(id)
    setCards(prev => prev.filter(card => card.id !== id))
    toast.success('已删除')
  }, [])

  // 调整卡片顺序（上移 / 下移）
  const moveCard = (cardId: string, direction: 'up' | 'down') => {
    const index = cards.findIndex(c => c.id === cardId)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= cards.length) return

    const newCards = [...cards]
    ;[newCards[index], newCards[targetIndex]] = [newCards[targetIndex], newCards[index]]

    setCards(newCards)
    saveExperienceCards(newCards)
  }

  // 手动添加卡片（带去重检查）
  const handleAddCard = (type: ExperienceCard['type']) => {
    // 检查是否已存在同名卡片
    const currentCards = loadExperienceCards()
    const exists = currentCards.some(c => c.type === type && c.title === '新经历')
    if (exists) {
      toast.error('已存在新经历卡片，请编辑现有卡片')
      return
    }

    const newCard: ExperienceCard = {
      id: generateUniqueId(),
      type,
      title: '新经历',
      role: '',
      start: '',
      end: '至今',
      content: ['点击编辑添加内容'],
      createdAt: new Date().toISOString()
    }
    const updatedCards = [...currentCards, newCard]
    saveExperienceCards(updatedCards)
    setCards(updatedCards)
    toast.success('已添加空白卡片，请点击编辑填写内容')
  }

  // 按类型分组
  const categorizedCards: CategorizedExperienceCards = {
    education: cards.filter(card => card.type === 'education'),
    campus: cards.filter(card => card.type === 'campus'),
    project: cards.filter(card => card.type === 'project'),
    internship: cards.filter(card => card.type === 'internship')
  }

  // 只显示有内容的分类
  const categories = [
    { key: 'education', label: '教育经历', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { key: 'campus', label: '校园经历', color: 'bg-green-100 text-green-700 border-green-200' },
    { key: 'project', label: '项目经历', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { key: 'internship', label: '实习经历', color: 'bg-orange-100 text-orange-700 border-orange-200' }
  ].filter(cat => categorizedCards[cat.key as keyof CategorizedExperienceCards].length > 0)

  const totalCards = cards.length

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">经历卡片</h1>
            <p className="text-muted-foreground mt-1">
              共 {totalCards} 条经历，AI 帮你整理的专业内容
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/chat">
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                继续对话
              </Button>
            </Link>
            <Link href="/resume">
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                预览简历
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs - 只显示有内容的分类 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeFilter === null ? 'default' : 'outline'}
            onClick={() => setActiveFilter(null)}
            className="rounded-xl"
          >
            全部 ({totalCards})
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.key}
              size="sm"
              variant={activeFilter === cat.key ? 'default' : 'outline'}
              onClick={() => setActiveFilter(activeFilter === cat.key ? null : cat.key)}
              className="rounded-xl"
            >
              {cat.label} ({categorizedCards[cat.key as keyof CategorizedExperienceCards].length})
            </Button>
          ))}
        </div>

        {/* Empty State */}
        {totalCards === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
                <Sparkles className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                还没有经历卡片
              </h2>
              <p className="mb-6 max-w-sm text-center text-muted-foreground">
                先去和 AI 聊聊你的经历，我会帮你整理成专业的简历内容
              </p>
              <Link href="/chat">
                <Button className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  开始对话
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Experience Cards by Category */}
        {categories.map(category => {
          const categoryCards = categorizedCards[category.key as keyof CategorizedExperienceCards]
          if (categoryCards.length === 0) return null
          if (activeFilter && activeFilter !== category.key) return null

          return (
            <div key={category.key} className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <Badge
                  variant={category.key as any}
                  className={`${category.color} font-semibold px-3 py-1`}
                >
                  {category.label}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddCard(category.key as ExperienceCard['type'])}
                  className="gap-1 text-muted-foreground"
                >
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryCards.map(card => (
                  <div key={card.id} className="relative">
                    {/* 编辑模式 */}
                    {editingId === card.id ? (
                      <Card className="border-2 border-primary">
                        <CardContent className="p-4 space-y-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">标题</label>
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="经历标题"
                              className="text-sm"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                身份/角色
                              </label>
                              <Input
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                placeholder="如：社长/负责人"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                结束时间
                              </label>
                              <Input
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                                placeholder="至今"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">开始时间</label>
                              <Input
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                placeholder="2022.09"
                                className="text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">经历描述（每行一条）</label>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              placeholder="• 具体做了什么&#10;• 产生了什么效果"
                              rows={5}
                              className="w-full px-2 py-1.5 text-sm border rounded-md resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="h-4 w-4 mr-1" />
                              保存
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      (() => {
                        const cardIdx = cards.findIndex(c => c.id === card.id)
                        return (
                          <>
                            <ExperienceCardComponent card={card} />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-black"
                                onClick={() => moveCard(card.id, 'up')}
                                disabled={cardIdx === 0}
                                title="上移"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-black"
                                onClick={() => moveCard(card.id, 'down')}
                                disabled={cardIdx === cards.length - 1}
                                title="下移"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0"
                                onClick={() => handleStartEdit(card)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDelete(card.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )
                      })()
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Bottom Actions */}
        {totalCards > 0 && (
          <div className="mt-12 flex justify-center">
            <Link href="/resume">
              <Button size="lg" className="gap-2 shadow-soft">
                <FileText className="h-5 w-5" />
                生成完整简历
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
