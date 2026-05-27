'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageSquare, Briefcase, FileText, Sparkles, Trash2 } from 'lucide-react'
import { resetResumeSession } from '@/lib/storage'

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/chat', label: 'AI对话', icon: MessageSquare },
    { href: '/experiences', label: '经历卡片', icon: Briefcase },
    { href: '/resume', label: '简历预览', icon: FileText },
  ]

  const handleClearData = () => {
    if (confirm('确定要清除所有数据吗？这将重置整个简历会话，包括聊天记录、经历卡片、个人信息和照片。')) {
      resetResumeSession()
      window.location.href = '/'
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            OfferPilot
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2 transition-all',
                    isActive && 'shadow-soft'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearData}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>清除所有数据</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'flex flex-col gap-1 h-auto py-2 px-3',
                    isActive && 'text-primary'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
