import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OfferPilot - AI 简历教练',
  description: '帮助没有实习经验的大学生，通过 AI 对话挖掘经历，自动生成专业简历',
  keywords: ['AI', '简历', '简历教练', '求职', '大学生就业'],
  authors: [{ name: 'OfferPilot' }],
  openGraph: {
    title: 'OfferPilot - AI 简历教练',
    description: '通过对话挖掘你的经历，自动生成专业简历',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <TooltipProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                borderRadius: '1rem',
                padding: '12px 20px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'white',
                },
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  )
}
