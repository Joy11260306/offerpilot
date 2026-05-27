import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 截断文本
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 判断是否为空字符串
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

// 提取简历类别标签
export function extractCategoryLabel(type: string): string {
  const labels: Record<string, string> = {
    education: '教育经历',
    campus: '校园经历',
    project: '项目经历',
    skill: '技能证书'
  }
  return labels[type] || type
}

// 提取简历类别的颜色
export function getCategoryColor(type: string): string {
  const colors: Record<string, string> = {
    education: 'bg-blue-100 text-blue-700 border-blue-200',
    campus: 'bg-green-100 text-green-700 border-green-200',
    project: 'bg-purple-100 text-purple-700 border-purple-200',
    skill: 'bg-orange-100 text-orange-700 border-orange-200'
  }
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200'
}
