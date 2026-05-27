'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ResumeData, UserProfile, ExperienceCard, EducationExtra } from '@/lib/types'
import { ResumePreview } from '@/components/ResumePreview'
import { SkillsInput } from '@/components/SkillsInput'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { loadResumeData, loadUserProfile, saveUserProfile, loadExperienceCards, loadEducationExtra, saveEducationExtra, loadResumePhoto, saveResumePhoto, clearResumePhoto } from '@/lib/storage'
import { educationOptions, normalizeDegree } from '@/lib/constants/educationOptions'
import { User, Mail, Phone, GraduationCap, Target, Sparkles, Loader2, Edit3, Award, BookOpen, Trash2, Image } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResumePage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editProfile, setEditProfile] = useState<UserProfile>({
    name: '',
    age: '',
    phone: '',
    email: '',
    school: '',
    major: '',
    degree: '本科',
    graduationYear: '',
    targetPosition: '',
    skills: []
  })
  const [isEditingEducation, setIsEditingEducation] = useState(false)
  const [editEducation, setEditEducation] = useState<EducationExtra>({
    startDate: '',
    endDate: '',
    gpa: '',
    ranking: '',
    courses: '',
    honors: '',
    exchange: '',
    research: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 照片：独立 state + localStorage 持久化（单一数据源）
  const [photo, setPhoto] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return loadResumePhoto()
    }
    return null
  })

  // photo 变更时自动持久化
  useEffect(() => {
    if (photo) {
      saveResumePhoto(photo)
    } else {
      clearResumePhoto()
    }
  }, [photo])

  // 加载数据
  useEffect(() => {
    setMounted(true)
    const savedData = loadResumeData()
    const savedProfile = loadUserProfile()
    const savedEducationExtra = loadEducationExtra()

    if (savedData) {
      setResumeData(savedData)
    }
    if (savedProfile) {
      if (savedProfile.degree) {
        savedProfile.degree = normalizeDegree(savedProfile.degree)
      }
      setProfile(savedProfile)
      setEditProfile(savedProfile)
    }
    if (savedEducationExtra) {
      setEditEducation(savedEducationExtra)
    }
  }, [])

  // 保存编辑后的用户信息
  const handleSaveProfile = () => {
    if (!editProfile.name.trim() || !editProfile.school.trim()) {
      toast.error('姓名和学校为必填项')
      return
    }
    const updatedProfile = { ...editProfile, photo: photo ?? undefined }
    saveUserProfile(updatedProfile)
    setProfile(updatedProfile)
    setIsEditing(false)
    toast.success('个人信息已更新')
  }

  // 保存教育经历补充信息
  const handleSaveEducation = () => {
    saveEducationExtra(editEducation)
    setIsEditingEducation(false)
    toast.success('教育经历已保存')
  }

  // 从经历卡片生成简历 - 使用新的 experienceCards 数据
  const handleGenerateFromItems = () => {
    // 优先从新的 experienceCards 读取
    const cards = loadExperienceCards()

    if (cards.length === 0) {
      // 兼容旧格式
      const items = JSON.parse(localStorage.getItem('offerpilot_resume_items') || '[]')
      if (items.length === 0) {
        toast.error('没有可用的经历内容，请先去和 AI 聊聊')
        return
      }

      const newResumeData: ResumeData = {
        education: items.filter((i: any) => i.type === 'education'),
        campus_experience: items.filter((i: any) => i.type === 'campus'),
        projects: items.filter((i: any) => i.type === 'project')
      }

      setResumeData(newResumeData)
      localStorage.setItem('offerpilot_resume_data', JSON.stringify(newResumeData))
      toast.success('简历已生成！')
      return
    }

    // 从新的 experienceCards 转换为 ResumeData
    const convertToResumeItem = (card: ExperienceCard) => ({
      id: card.id,
      type: card.type === 'internship' ? 'project' : card.type,
      content: card.content.join('\n'),
      createdAt: card.createdAt
    })

    const newResumeData: ResumeData = {
      name: profile?.name,
      phone: profile?.phone,
      email: profile?.email,
      education: cards.filter(c => c.type === 'education').map(convertToResumeItem),
      campus_experience: cards.filter(c => c.type === 'campus').map(convertToResumeItem),
      projects: cards.filter(c => c.type === 'project' || c.type === 'internship').map(convertToResumeItem)
    }

    setResumeData(newResumeData)
    localStorage.setItem('offerpilot_resume_data', JSON.stringify(newResumeData))
    toast.success('简历已生成！')
  }

  // AI 生成完整简历
  const handleAIGenerate = async () => {
    const messages = JSON.parse(localStorage.getItem('offerpilot_messages') || '[]')

    if (messages.length === 0) {
      toast.error('请先和 AI 聊聊你的经历')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatHistory: messages.map((m: any) => ({
            role: m.role,
            content: m.content
          })),
          userInfo: profile
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '生成失败')
      }

      const data = await response.json()

      if (data.data) {
        setResumeData(data.data)
        localStorage.setItem('offerpilot_resume_data', JSON.stringify(data.data))
        toast.success('简历已生成！')
      } else {
        toast.error('无法解析简历数据')
      }
    } catch (error: any) {
      console.error('Generate Error:', error)
      toast.error(error.message || '生成失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/20 to-white">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* User Profile Card */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                个人信息
              </CardTitle>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1"
                >
                  <Edit3 className="h-4 w-4" />
                  编辑
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">姓名 *</label>
                    <Input
                      value={editProfile.name}
                      onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                      placeholder="张三"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">求职方向</label>
                    <Input
                      value={editProfile.targetPosition}
                      onChange={(e) => setEditProfile({ ...editProfile, targetPosition: e.target.value })}
                      placeholder="产品经理"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">学校 *</label>
                    <Input
                      value={editProfile.school}
                      onChange={(e) => setEditProfile({ ...editProfile, school: e.target.value })}
                      placeholder="XX大学"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">专业</label>
                    <Input
                      value={editProfile.major}
                      onChange={(e) => setEditProfile({ ...editProfile, major: e.target.value })}
                      placeholder="市场营销"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">学历</label>
                    <select
                      value={editProfile.degree || '本科'}
                      onChange={(e) => setEditProfile({ ...editProfile, degree: e.target.value as any })}
                      className="flex h-11 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm"
                    >
                      {educationOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">年龄</label>
                    <Input
                      value={editProfile.age || ''}
                      onChange={(e) => setEditProfile({ ...editProfile, age: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">毕业年份</label>
                    <Input
                      value={editProfile.graduationYear}
                      onChange={(e) => setEditProfile({ ...editProfile, graduationYear: e.target.value })}
                      placeholder="2025"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">手机号</label>
                    <Input
                      value={editProfile.phone}
                      onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                      placeholder="138-0000-0000"
                      type="tel"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">邮箱</label>
                  <Input
                    value={editProfile.email}
                    onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                    placeholder="example@email.com"
                    type="email"
                  />
                </div>

                {/* 上传照片 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">证件照</label>
                  <div className="flex items-start gap-4">
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt="头像预览"
                          className="w-24 h-32 object-cover border rounded"
                        />
                        <div className="flex flex-col gap-2">
                          <label className="cursor-pointer">
                            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                              <span>
                                <Image className="h-3.5 w-3.5" />
                                更换照片
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const reader = new FileReader()
                                reader.onload = () => setPhoto(reader.result as string)
                                reader.readAsDataURL(file)
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setPhoto(null)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除照片
                          </Button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                          <span>
                            <Image className="h-3.5 w-3.5" />
                            上传照片
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = () => setPhoto(reader.result as string)
                            reader.readAsDataURL(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* 技能证书 */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-orange-500" />
                    技能证书（可选）
                  </label>
                  <SkillsInput
                    value={editProfile.skills || []}
                    onChange={(skills) => setEditProfile({ ...editProfile, skills })}
                    placeholder="输入后按 Enter 添加"
                  />
                </div>

                <div className="flex gap-3 pt-2 sm:col-span-2">
                  <Button onClick={handleSaveProfile}>保存</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>取消</Button>
                </div>
              </div>
            ) : profile ? (
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.school}</span>
                  {profile.major && <span className="text-muted-foreground">｜{profile.major}</span>}
                  {profile.degree && <span className="text-muted-foreground">（{profile.degree}）</span>}
                </div>
                {profile.targetPosition && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.targetPosition}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">暂无个人信息</p>
            )}
          </CardContent>
        </Card>

        {/* 教育经历补充信息 Card */}
        <Card className="mb-8 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                教育经历补充信息
              </CardTitle>
              {!isEditingEducation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingEducation(true)}
                  className="gap-1"
                >
                  <Edit3 className="h-4 w-4" />
                  编辑
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingEducation ? (
              <div className="space-y-4">
                {/* 显示基础信息（只读） */}
                {profile?.school && (
                  <div className="text-sm text-muted-foreground mb-4 pb-3">
                    {profile.school} | {profile.major || '专业未填写'} | {profile.degree || '学历未填写'}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">入学时间</label>
                    <Input
                      value={editEducation.startDate}
                      onChange={(e) => setEditEducation({ ...editEducation, startDate: e.target.value })}
                      placeholder="2024.09"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">预计毕业时间</label>
                    <Input
                      value={editEducation.endDate}
                      onChange={(e) => setEditEducation({ ...editEducation, endDate: e.target.value })}
                      placeholder="2028.06"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GPA（可选）</label>
                    <Input
                      value={editEducation.gpa}
                      onChange={(e) => setEditEducation({ ...editEducation, gpa: e.target.value })}
                      placeholder="3.46/4.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">专业排名（可选）</label>
                    <Input
                      value={editEducation.ranking}
                      onChange={(e) => setEditEducation({ ...editEducation, ranking: e.target.value })}
                      placeholder="25/106（前25%）"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">核心课程（可选）</label>
                  <Input
                    value={editEducation.courses}
                    onChange={(e) => setEditEducation({ ...editEducation, courses: e.target.value })}
                    placeholder="国际金融、微观经济学、计量经济学..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">荣誉奖项（可选）</label>
                  <Input
                    value={editEducation.honors}
                    onChange={(e) => setEditEducation({ ...editEducation, honors: e.target.value })}
                    placeholder="一等奖学金、优秀学生干部..."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">交换经历（可选）</label>
                    <Input
                      value={editEducation.exchange}
                      onChange={(e) => setEditEducation({ ...editEducation, exchange: e.target.value })}
                      placeholder="2024.09-2025.01 香港大学交换"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">科研经历（可选）</label>
                    <Input
                      value={editEducation.research}
                      onChange={(e) => setEditEducation({ ...editEducation, research: e.target.value })}
                      placeholder="参与国家社科基金项目研究"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveEducation}>保存</Button>
                  <Button variant="outline" onClick={() => setIsEditingEducation(false)}>取消</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground space-y-2">
                {/* 显示基础信息（只读） */}
                {profile?.school ? (
                  <div className="mb-2 pb-2">
                    {profile.school} | {profile.major || '专业未填写'} | {profile.degree || '学历未填写'}
                  </div>
                ) : (
                  <div className="mb-2 text-orange-500">请先在个人信息中填写学校、专业、学历</div>
                )}
                {(editEducation.startDate || editEducation.endDate) && (
                  <div>在校时间：{editEducation.startDate} - {editEducation.endDate}</div>
                )}
                {editEducation.gpa && <div>GPA：{editEducation.gpa}</div>}
                {editEducation.ranking && <div>专业排名：{editEducation.ranking}</div>}
                {editEducation.courses && <div>核心课程：{editEducation.courses}</div>}
                {editEducation.honors && <div>荣誉奖项：{editEducation.honors}</div>}
                {editEducation.exchange && <div>交换经历：{editEducation.exchange}</div>}
                {editEducation.research && <div>科研经历：{editEducation.research}</div>}
                {!editEducation.startDate && !editEducation.gpa && !editEducation.ranking && !editEducation.courses && !editEducation.honors && !editEducation.exchange && !editEducation.research && (
                  <p>暂无补充信息</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Actions */}
        {!resumeData && (
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGenerateFromItems}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              从经历卡片生成
            </Button>
            <Button
              onClick={handleAIGenerate}
              size="lg"
              className="gap-2 shadow-glow"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI 生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  AI 智能生成
                </>
              )}
            </Button>
          </div>
        )}

        {resumeData && (
          <div className="mb-6 flex gap-3 justify-center">
            <Button
              onClick={handleAIGenerate}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              重新生成
            </Button>
            <Link href="/experiences">
              <Button variant="outline" size="sm" className="gap-2">
                编辑经历卡片
              </Button>
            </Link>
          </div>
        )}

        {/* Resume Preview */}
        <ResumePreview data={resumeData} profile={profile ? { ...profile, photo: photo ?? undefined } : { name: '', school: '', major: '', photo: photo ?? undefined }} educationExtra={editEducation} />

        {/* Quick Links */}
        {resumeData && (
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/chat">
              <Button variant="outline" className="gap-2">
                继续对话
              </Button>
            </Link>
            <Link href="/experiences">
              <Button variant="outline" className="gap-2">
                编辑经历卡片
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
