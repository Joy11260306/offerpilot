'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkillsInput } from '@/components/SkillsInput'
import { saveUserProfile, loadUserProfile } from '@/lib/storage'
import { educationOptions, normalizeDegree } from '@/lib/constants/educationOptions'
import { Sparkles, User, Award } from 'lucide-react'

interface ProfileFormProps {
  onComplete: () => void
}

export function ProfileForm({ onComplete }: ProfileFormProps) {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    email: '',
    school: '',
    major: '',
    degree: '本科',
    graduationYear: '',
    targetPosition: '',
    skills: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 加载已有信息
    const savedProfile = loadUserProfile()
    if (savedProfile) {
      if (savedProfile.degree) {
        savedProfile.degree = normalizeDegree(savedProfile.degree)
      }
      setProfile(savedProfile)
    }
  }, [])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!profile.name.trim()) newErrors.name = '请输入姓名'
    if (!profile.school.trim()) newErrors.school = '请输入学校'
    if (!profile.major.trim()) newErrors.major = '请输入专业'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    saveUserProfile(profile)
    onComplete()
  }

  const updateField = (field: keyof UserProfile, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-4 shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            欢迎使用 OfferPilot
          </h1>
          <p className="text-gray-500">
            先填写一些基本信息，我们开始制作你的简历
          </p>
        </div>

        <Card className="shadow-soft-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              个人信息
            </CardTitle>
            <CardDescription>
              带 * 的为必填项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 姓名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                姓名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={profile.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="张三"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 学校和专业 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  学校 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={profile.school}
                  onChange={(e) => updateField('school', e.target.value)}
                  placeholder="XX大学"
                  className={errors.school ? 'border-red-500' : ''}
                />
                {errors.school && (
                  <p className="text-xs text-red-500">{errors.school}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  专业 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={profile.major}
                  onChange={(e) => updateField('major', e.target.value)}
                  placeholder="计算机科学"
                  className={errors.major ? 'border-red-500' : ''}
                />
                {errors.major && (
                  <p className="text-xs text-red-500">{errors.major}</p>
                )}
              </div>
            </div>

            {/* 学历和毕业时间 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">学历</label>
                <select
                  value={profile.degree || '本科'}
                  onChange={(e) => updateField('degree', e.target.value as any)}
                  className="flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {educationOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">毕业年份</label>
                <Input
                  value={profile.graduationYear}
                  onChange={(e) => updateField('graduationYear', e.target.value)}
                  placeholder="2025"
                />
              </div>
            </div>

            {/* 求职方向 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">求职方向</label>
              <Input
                value={profile.targetPosition}
                onChange={(e) => updateField('targetPosition', e.target.value)}
                placeholder="例如：产品经理、前端开发、运营"
              />
            </div>

            {/* 联系方式 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input
                  value={profile.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="138-0000-0000"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱</label>
                <Input
                  value={profile.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@email.com"
                  type="email"
                />
              </div>
            </div>

            {/* 技能证书（可选） */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-orange-500" />
                技能证书（可选）
              </label>
              <SkillsInput
                value={profile.skills || []}
                onChange={(skills) => updateField('skills', skills)}
                placeholder="输入后按 Enter 添加技能或证书"
              />
            </div>

            {/* 提交按钮 */}
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base gap-2 shadow-glow mt-6"
              size="lg"
            >
              <Sparkles className="h-5 w-5" />
              保存并开始生成简历
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          你的信息仅保存在本地浏览器中，不会上传到任何服务器
        </p>
      </div>
    </div>
  )
}
