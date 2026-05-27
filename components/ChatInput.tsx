'use client'

import { useState, KeyboardEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export function ChatInput({ onSend, disabled, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled && !isLoading) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const canSend = input.trim().length > 0 && !disabled && !isLoading

  return (
    <form onSubmit={handleSubmit} className="border-t bg-background/80 p-4 backdrop-blur-xl">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的回答..."
              disabled={disabled || isLoading}
              className="h-12 pr-12 rounded-2xl bg-muted/50 border-2 focus-visible:border-indigo-500 focus-visible:ring-0 transition-all"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl transition-all",
                canSend && "bg-gradient-to-br from-indigo-500 to-purple-600 hover:opacity-90"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </form>
  )
}
