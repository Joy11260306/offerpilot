'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface SkillsInputProps {
  value: string[]
  onChange: (skills: string[]) => void
  placeholder?: string
}

export function SkillsInput({ value, onChange, placeholder = '输入后按 Enter 添加' }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const addSkill = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue])
      setInputValue('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter(skill => skill !== skillToRemove))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[44px] p-3 border-2 rounded-xl bg-muted/30">
        {value.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="ml-1 hover:bg-orange-100 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {value.length === 0 && (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addSkill}
        placeholder="例如：CET-6、计算机二级、教师资格证..."
        className="h-11"
      />
      <p className="text-xs text-muted-foreground">
        输入后按 <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> 添加，可添加多个
      </p>
    </div>
  )
}
