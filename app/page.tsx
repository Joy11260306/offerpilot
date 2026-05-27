'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, MessageSquare, PenLine, FileCheck, ArrowRight, CheckCircle2, Users, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ProfileForm } from '@/components/ProfileForm'
import { hasUserProfile } from '@/lib/storage'

export default function HomePage() {
  const router = useRouter()
  const [needsProfile, setNeedsProfile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 检查是否需要填写个人信息
    if (!hasUserProfile()) {
      setNeedsProfile(true)
    }
  }, [])

  // 首次用户显示个人信息表单
  if (mounted && needsProfile) {
    return (
      <ProfileForm onComplete={() => router.push('/chat')} />
    )
  }

  const features = [
    {
      icon: MessageSquare,
      title: '不知道怎么写？',
      description: 'AI 会像聊天一样一步步帮你挖掘经历，不用自己硬想。',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: PenLine,
      title: '普通经历也能有亮点',
      description: '社团、课程、项目、兼职，都能整理成专业简历表达。',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FileCheck,
      title: '直接生成可投递简历',
      description: '自动排版、实时预览，一键导出 PDF。',
      color: 'from-orange-500 to-pink-500'
    }
  ]

  const steps = [
    {
      number: '01',
      title: '输入经历',
      description: '告诉 AI 你做过什么'
    },
    {
      number: '02',
      title: 'AI 深度追问',
      description: '像教练一样帮你挖掘细节'
    },
    {
      number: '03',
      title: '生成专业简历',
      description: '把校园经历变成专业简历表达'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          {/* Badge */}
          <div className="mb-8 flex justify-center animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-1.5 text-sm font-medium shadow-soft backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Resume Coach · 简历生成工具
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="mx-auto mb-4 text-center font-bold tracking-tight animate-slide-up">
            <span className="text-3xl sm:text-4xl lg:text-5xl text-gray-900">
              不会写简历？
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent text-3xl sm:text-4xl lg:text-5xl mt-1 block">
              AI 帮你整理成专业版本
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-xl text-center text-base text-gray-500 sm:text-lg animate-slide-up [animation-delay:100ms] leading-relaxed">
            通过对话挖掘你的经历，自动生成专业简历内容。
          </p>

          {/* CTA + Input */}
          <div className="flex flex-col items-center gap-3 animate-slide-up [animation-delay:200ms]">
            <Link href="/chat">
              <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-glow hover:shadow-glow-lg transition-all">
                <Sparkles className="h-5 w-5" />
                免费生成我的简历
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>

          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-400 animate-fade-in [animation-delay:300ms]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              无需登录
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              数据本地存储
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              免费使用
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-0 bg-white/80 shadow-soft hover:shadow-soft-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardContent className="relative p-6">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-14 px-4 bg-gradient-to-b from-transparent via-indigo-50/20 to-transparent">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
            三步搞定
          </h2>
          <p className="mb-12 text-center text-sm text-gray-400">
            像和朋友聊天一样，轻松生成简历
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200" />
                )}
                <div className="relative z-10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-md">
                  {step.number}
                </div>
                <h3 className="mb-1 text-base font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empathy Section */}
      <section className="py-10 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-5">
            <Heart className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-medium text-gray-700 leading-relaxed">
            是不是觉得自己没有东西能写进简历？
          </p>
          <p className="mt-3 text-base text-gray-500">
            其实很多校园经历，都值得被认真表达。
          </p>
        </div>
      </section>

      {/* Audience Section */}
      <section className="py-8 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Users className="h-4 w-4" />
            适合这样的你
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['大学生', '实习求职', '校招准备', '应届生', '简历小白'].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 px-8 py-16 shadow-glow overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="relative">
              <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                还不知道怎么写？让 AI 帮你试试
              </h2>
              <p className="mb-8 text-indigo-100">
                你只需要说出做过什么，剩下的交给 OfferPilot
              </p>
              <Link href="/chat">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="h-5 w-5" />
                  看看我的经历能怎么写
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="mx-auto max-w-5xl text-center text-sm text-gray-400">
          <p>OfferPilot — 帮大学生写出更好的简历</p>
        </div>
      </footer>
    </div>
  )
}
