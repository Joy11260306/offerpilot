'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, User } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100">
              <Sparkles className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              开始你的简历之旅
            </h2>
            <p className="max-w-sm text-muted-foreground">
              我会像教练一样一步步引导你挖掘经历，不用担心没有实习经验，你一定有很多值得写的故事！
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex animate-fade-in',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-muted'
                )}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3',
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-muted/80 rounded-bl-md'
                )}
              >
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={cn(
                    'mt-1 text-xs',
                    message.role === 'user'
                      ? 'text-white/60'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatDate(message.createdAt)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-muted">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <Card className="flex items-center gap-2 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500" />
                </div>
                <span className="text-sm text-muted-foreground">
                  AI 正在思考...
                </span>
              </Card>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
