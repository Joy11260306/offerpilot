'use client'

import { ResumeItem, ExperienceCard as ExperienceCardType } from '@/lib/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Calendar, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExperienceCardProps {
  // 支持新格式或旧格式
  item?: ResumeItem
  card?: ExperienceCardType
  onEdit?: (id: string, newContent: string) => void
  onDelete?: (id: string) => void
  onRegenerate?: (id: string) => void
  className?: string
}

export function ExperienceCard({
  item,
  card,
  onEdit,
  onDelete,
  onRegenerate,
  className
}: ExperienceCardProps) {
  // 兼容新旧格式
  const data = card || item
  const id = card?.id || item?.id || ''
  const type = card?.type || item?.type || 'campus'
  const createdAt = card?.createdAt || item?.createdAt || new Date().toISOString()

  // 新格式：title + role + start + end + content[]
  // 旧格式：content string
  const title = card?.title || ''
  const role = card?.role || item?.role || ''
  const start = card?.start || item?.start || ''
  const end = card?.end || item?.end || ''
  const contentArray = card?.content || (item?.content ? item.content.split('\n') : [])

  const categoryLabels: Record<string, string> = {
    education: '教育经历',
    campus: '校园经历',
    project: '项目经历',
    internship: '实习经历',
    skill: '技能证书'
  }

  const typeColors: Record<string, string> = {
    education: 'bg-blue-100 text-blue-700 border-blue-200',
    campus: 'bg-green-100 text-green-700 border-green-200',
    project: 'bg-purple-100 text-purple-700 border-purple-200',
    internship: 'bg-orange-100 text-orange-700 border-orange-200',
    skill: 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200 hover:shadow-soft",
      className
    )}>
      <CardHeader className="pb-2">
        {/* 标题 - 左对齐 */}
        {title && (
          <h3 className="font-semibold text-foreground text-base">
            {title}
          </h3>
        )}

        {/* 时间和角色 - 左对齐 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
          {start && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {start} - {end || '至今'}
            </span>
          )}
          {role && (
            <span className="flex items-center gap-1 text-gray-600">
              <Briefcase className="h-3.5 w-3.5" />
              {role}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 类型标签 */}
        <div className="mb-2">
          <Badge
            variant={type as any}
            className={cn("font-medium text-xs", typeColors[type])}
          >
            {categoryLabels[type] || type}
          </Badge>
        </div>

        {/* 内容 */}
        <div className="space-y-1.5">
          {contentArray.map((line, index) => (
            <p key={index} className="text-sm leading-relaxed text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{line}</span>
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 简化的展示组件（不包含操作按钮）
export function SimpleExperienceCard({ card }: { card: ExperienceCardType }) {
  const categoryLabels: Record<string, string> = {
    education: '教育经历',
    campus: '校园经历',
    project: '项目经历',
    internship: '实习经历'
  }

  const typeColors: Record<string, string> = {
    education: 'bg-blue-100 text-blue-700 border-blue-200',
    campus: 'bg-green-100 text-green-700 border-green-200',
    project: 'bg-purple-100 text-purple-700 border-purple-200',
    internship: 'bg-orange-100 text-orange-700 border-orange-200'
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-muted/30">
        {/* 标题 - 左对齐 */}
        {card.title && (
          <h3 className="font-semibold text-foreground text-base">
            {card.title}
          </h3>
        )}

        {/* 时间和角色 - 左对齐 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
          {card.start && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {card.start} - {card.end || '至今'}
            </span>
          )}
          {card.role && (
            <span className="flex items-center gap-1 text-gray-600">
              <Briefcase className="h-3.5 w-3.5" />
              {card.role}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 类型标签 */}
        <div className="mb-2">
          <Badge
            variant={card.type as any}
            className={cn("font-medium text-xs", typeColors[card.type])}
          >
            {categoryLabels[card.type] || card.type}
          </Badge>
        </div>

        {/* 内容 */}
        <div className="space-y-1.5">
          {card.content.map((line, index) => (
            <p key={index} className="text-sm leading-relaxed text-gray-600 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{line}</span>
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
