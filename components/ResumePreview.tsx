'use client'

import { useRef, useMemo } from 'react'
import { ResumeData, UserProfile, ExperienceCard, EducationExtra } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Download, Edit3, Mail, Phone, FileText } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { loadExperienceCards } from '@/lib/storage'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  TabStopType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
} from 'docx'
import { saveAs } from 'file-saver'

interface ResumePreviewProps {
  data: ResumeData | null
  profile?: UserProfile | null
  educationExtra?: EducationExtra | null
  showActions?: boolean
}

// 格式化日期显示
const formatDate = (date: string) => {
  if (!date) return ''
  // 如果是"至今"，保持原样
  if (date === '至今' || date === '现在') return '至今'
  return date
}

export function ResumePreview({ data, profile, educationExtra, showActions = true }: ResumePreviewProps) {
  const resumeRef = useRef<HTMLDivElement>(null)

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return

    try {
      const element = resumeRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = pdfHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      pdf.save(`${profile?.name || '简历'}_OfferPilot.pdf`)
    } catch (error) {
      console.error('PDF 生成失败:', error)
      alert('PDF 生成失败，请稍后重试')
    }
  }

  const handleDownloadWord = async () => {
    try {
      const FONT = 'Microsoft YaHei'

      // 辅助：正文段落
      const textPara = (text: string, opts?: { bold?: boolean; size?: number; spacing?: number; color?: string }) =>
        new Paragraph({
          spacing: { after: opts?.spacing ?? 80 },
          children: [
            new TextRun({
              text,
              bold: opts?.bold ?? false,
              size: opts?.size ?? 22,
              font: FONT,
              color: opts?.color,
            }),
          ],
        })

      // 辅助：bullet item
      const bulletPara = (text: string) =>
        new Paragraph({
          spacing: { after: 60, before: 0 },
          indent: { left: 480 },
          children: [new TextRun({ text: `• ${text}`, size: 22, font: FONT, color: '555555' })],
        })

      // 辅助：section 标题
      const sectionHeading = (text: string) =>
        new Paragraph({
          spacing: { before: 360, after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, space: 6, color: '333333' } },
          children: [new TextRun({ text, bold: true, size: 28, font: FONT })],
        })

      // 辅助：经历头部三列对齐（时间 | 标题 | 角色），用 TabStop 无表格线
      const expHeaderPara = (timeStr: string, title: string, role: string) =>
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [
            { type: TabStopType.LEFT, position: 1500 },
            { type: TabStopType.CENTER, position: 5000 },
            { type: TabStopType.RIGHT, position: 9000 },
          ],
          children: [
            new TextRun({ text: timeStr + '\t', size: 22, font: FONT, color: '888888' }),
            new TextRun({ text: title + '\t', bold: true, size: 22, font: FONT }),
            new TextRun({ text: role, size: 22, font: FONT, color: '555555' }),
          ],
        })

      // ===== 处理照片 =====
      let photoBytes: Uint8Array | null = null
      let photoType: string | null = null
      if (photo && photo.startsWith('data:')) {
        try {
          // 从 data URL 提取 MIME 类型
          const mimeMatch = photo.match(/^data:image\/(png|jpeg|jpg|gif);/i)
          photoType = mimeMatch ? mimeMatch[1].toLowerCase() : 'png'
          if (photoType === 'jpg') photoType = 'jpeg'

          const base64 = photo.split(',')[1]
          const binary = atob(base64)
          photoBytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            photoBytes[i] = binary.charCodeAt(i)
          }
        } catch {
          // 照片解析失败，忽略
        }
      }

      // ===== 个人信息区（Paragraph + TabStop，无表格线） =====
      const docChildren: Paragraph[] = []

      // 姓名（大标题）
      docChildren.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: name || '姓名', bold: true, size: 36, font: FONT })],
        })
      )

      // 求职意向
      if (targetPosition) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: `求职意向：${targetPosition}`, size: 22, font: FONT, color: '555555' })],
          })
        )
      }

      // 学历 + 年龄（TabStop 两列）
      docChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [
            { type: TabStopType.LEFT, position: 1000 },
            { type: TabStopType.LEFT, position: 5000 },
          ],
          children: [
            new TextRun({ text: '学历：', bold: true, size: 22, font: FONT }),
            new TextRun({ text: (eduDegree || '—') + '\t', size: 22, font: FONT }),
            new TextRun({ text: '年龄：', bold: true, size: 22, font: FONT }),
            new TextRun({ text: age ? `${age}岁` : '—', size: 22, font: FONT }),
          ],
        })
      )

      // 手机 + 邮箱（TabStop 两列）
      docChildren.push(
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [
            { type: TabStopType.LEFT, position: 1000 },
            { type: TabStopType.LEFT, position: 5000 },
          ],
          children: [
            new TextRun({ text: '手机：', bold: true, size: 22, font: FONT }),
            new TextRun({ text: (phone || '—') + '\t', size: 22, font: FONT }),
            new TextRun({ text: '邮箱：', bold: true, size: 22, font: FONT }),
            new TextRun({ text: email || '—', size: 22, font: FONT }),
          ],
        })
      )

      // 照片（floating 定位到右上角，固定尺寸）
      if (photoBytes) {
        docChildren.push(
          new Paragraph({
            spacing: { after: 0 },
            children: [
              // @ts-ignore — docx 类型推断对 bitmap ImageRun 有时不准确，运行时正常
              new ImageRun({
                data: photoBytes,
                transformation: { width: 100, height: 130 },
                floating: {
                  horizontalPosition: {
                    relative: HorizontalPositionRelativeFrom.PAGE,
                    offset: 8500000,
                  },
                  verticalPosition: {
                    relative: VerticalPositionRelativeFrom.PAGE,
                    offset: 300000,
                  },
                },
              }),
            ],
          })
        )
      }

      // ===== 教育背景 =====
      if (eduSchool) {
        docChildren.push(sectionHeading('教育背景'))
        docChildren.push(
          textPara(
            `${eduSchool}${eduMajor ? ' | ' + eduMajor : ''}${eduDegree ? ' | ' + eduDegree : ''}`,
            { bold: true }
          )
        )
        if (eduStartDate || eduEndDate) {
          docChildren.push(textPara(`在校时间：${eduStartDate || '—'} - ${eduEndDate || '—'}`))
        }
        if (eduGpa) docChildren.push(textPara(`GPA：${eduGpa}`))
        if (eduRanking) docChildren.push(textPara(`专业排名：${eduRanking}`))
        if (eduCourses) docChildren.push(textPara(`核心课程：${eduCourses}`))
        if (eduHonors) docChildren.push(textPara(`荣誉奖项：${eduHonors}`))
        if (eduExchange) docChildren.push(textPara(`交换经历：${eduExchange}`))
        if (eduResearch) docChildren.push(textPara(`科研经历：${eduResearch}`))
      }

      // ===== 实习经历 =====
      if (internshipCards.length > 0) {
        docChildren.push(sectionHeading('实习经历'))
        for (const item of sortByTime(internshipCards)) {
          const timeStr = item.start && item.end
            ? `${item.start} - ${item.end === '至今' ? '至今' : item.end}`
            : ''
          docChildren.push(expHeaderPara(timeStr, item.title, item.role || ''))
          for (const line of item.content) {
            docChildren.push(bulletPara(line))
          }
        }
      }

      // ===== 项目经历 =====
      if (projectCards.length > 0) {
        docChildren.push(sectionHeading('项目经历'))
        for (const item of sortByTime(projectCards)) {
          const timeStr = item.start && item.end
            ? `${item.start} - ${item.end === '至今' ? '至今' : item.end}`
            : ''
          docChildren.push(expHeaderPara(timeStr, item.title, item.role || ''))
          for (const line of item.content) {
            docChildren.push(bulletPara(line))
          }
        }
      }

      // ===== 校园经历 =====
      if (campusCards.length > 0) {
        docChildren.push(sectionHeading('校园经历'))
        for (const item of sortByTime(campusCards)) {
          const timeStr = item.start && item.end
            ? `${item.start} - ${item.end === '至今' ? '至今' : item.end}`
            : ''
          docChildren.push(expHeaderPara(timeStr, item.title, item.role || ''))
          for (const line of item.content) {
            docChildren.push(bulletPara(line))
          }
        }
      }

      // ===== 技能证书 =====
      if (skills.length > 0) {
        docChildren.push(sectionHeading('技能证书'))
        docChildren.push(textPara(skills.join('、')))
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docChildren,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, `${name}_Resume.docx`)
    } catch (error) {
      console.error('Word 生成失败:', error)
      alert('Word 生成失败，请稍后重试')
    }
  }

  // 获取经历卡片数据
  const experienceCards = useMemo(() => {
    try {
      return loadExperienceCards()
    } catch {
      return []
    }
  }, [data])

  // 基本信息
  const name = profile?.name || data?.name || '姓名'
  const email = profile?.email || data?.email || ''
  const phone = profile?.phone || data?.phone || ''
  const targetPosition = profile?.targetPosition || ''
  const age = profile?.age || ''
  const photo = profile?.photo || ''
  const skills = profile?.skills || []

  // 教育基础信息（从 profile 读取）
  const eduSchool = profile?.school || ''
  const eduMajor = profile?.major || ''
  const eduDegree = profile?.degree || ''

  // 教育补充信息（独立模块）
  const eduStartDate = educationExtra?.startDate || ''
  const eduEndDate = educationExtra?.endDate || ''
  const eduGpa = educationExtra?.gpa || ''
  const eduRanking = educationExtra?.ranking || ''
  const eduCourses = educationExtra?.courses || ''
  const eduHonors = educationExtra?.honors || ''
  const eduExchange = educationExtra?.exchange || ''
  const eduResearch = educationExtra?.research || ''

  // 分类经历卡片
  const educationCards = experienceCards.filter(c => c.type === 'education')
  const campusCards = experienceCards.filter(c => c.type === 'campus')
  const projectCards = experienceCards.filter(c => c.type === 'project')
  const internshipCards = experienceCards.filter(c => c.type === 'internship')

  // 按时间排序（晚到早）
  const sortByTime = (cards: ExperienceCard[]) =>
    [...cards].sort((a, b) => (b.start || '').localeCompare(a.start || ''))

  // 检查是否有任何内容
  const hasAnyContent = eduSchool || educationCards.length > 0 || campusCards.length > 0 || projectCards.length > 0 || internshipCards.length > 0 || skills.length > 0

  if (!data && !profile && experienceCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
          <Edit3 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">
          还没有简历内容
        </h2>
        <p className="max-w-sm text-muted-foreground">
          先去和 AI 聊聊你的经历，我会帮你整理成专业简历
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showActions && (
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3">
            <Button
              onClick={handleDownloadWord}
              variant="outline"
              className="gap-2 shadow-soft"
              size="lg"
              title="Word 导出仍在优化中，部分排版可能与预览略有差异，推荐优先使用 PDF"
            >
              <FileText className="h-5 w-5" />
              下载 Word
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2 shadow-soft" size="lg">
              <Download className="h-5 w-5" />
              下载 PDF
            </Button>
          </div>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            <span>ℹ️</span>
            Word 可能存在格式差异，建议优先使用 PDF
          </p>
        </div>
      )}

      {/* ===== 简历主体 - 模拟 A4 纸 ===== */}
      <div
        id="resume-preview"
        ref={resumeRef}
        className="mx-auto bg-white"
        style={{
          fontFamily: 'system-ui, -apple-system, "Microsoft YaHei", sans-serif',
          width: '210mm',
          minHeight: '297mm',
          maxWidth: '100%',
          padding: '40px',
          color: '#333',
        }}
      >
        {/* ===== 顶部个人信息区域 ===== */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            {/* 左侧：姓名 + 两列信息 */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-6">{name}</h1>

              {targetPosition && (
                <div className="text-sm text-gray-700 mb-3">
                  求职意向：{targetPosition}
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-sm text-gray-700">
                {eduDegree && <div>学历：{eduDegree}</div>}
                {age && <div>年龄：{age}岁</div>}
                {phone && <div>手机：{phone}</div>}
                {email && <div>邮箱：{email}</div>}
              </div>
            </div>

            {/* 右侧：照片 */}
            <div className="flex-shrink-0 ml-8">
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="w-24 h-32 object-cover border border-gray-300 shadow-sm"
                />
              ) : (
                <div className="w-24 h-32 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                  <span className="text-xs">证件照</span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* ===== 教育背景 ===== */}
        {eduSchool && (
          <section className="mb-3">
            {/* 章节标题 */}
            <h2 className="text-base font-bold mb-2">
              教育背景
            </h2>
            <div className="border-b-2 border-black mb-3" />

            {/* 教育经历内容 */}
            <div>
              {/* 第一行：三栏 Grid 布局 */}
              <div className="grid grid-cols-[160px_1fr_160px] items-center mb-1">
                <div className="font-bold text-sm">
                  {eduStartDate}-{eduEndDate}
                </div>
                <div className="text-center font-bold text-sm">
                  {eduSchool}
                </div>
                <div className="text-right font-bold text-sm">
                  {eduMajor}
                </div>
              </div>

              {/* 第二行：学业成绩 */}
              {(eduGpa || eduRanking) && (
                <div className="text-sm text-gray-700">
                  学业成绩：{eduGpa && `平均学分绩点 ${eduGpa}`}{eduRanking && `，专业排名 ${eduRanking}`}
                </div>
              )}

              {/* 第三行：核心课程 */}
              {eduCourses && (
                <div className="text-sm text-gray-700">
                  核心课程：{eduCourses}
                </div>
              )}

              {/* 第四行：荣誉奖项 */}
              {eduHonors && (
                <div className="text-sm text-gray-700">
                  荣誉奖项：{eduHonors}
                </div>
              )}

              {/* 第五行：交换经历 */}
              {eduExchange && (
                <div className="text-sm text-gray-700">
                  交换经历：{eduExchange}
                </div>
              )}

              {/* 第六行：科研经历 */}
              {eduResearch && (
                <div className="text-sm text-gray-700">
                  科研经历：{eduResearch}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== 实习经历 ===== */}
        {internshipCards.length > 0 && (
          <section className="mb-5">
            {/* 章节标题 */}
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '2px solid #333',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}>
              实习经历
            </h2>

            {/* 经历列表 */}
            <div>
              {sortByTime(internshipCards).map((item) => (
                <div key={item.id} style={{ marginBottom: '10px' }}>
                  {/* 三栏 Grid：时间 | 标题 | 角色，对齐教育背景样式 */}
                  <div className="grid grid-cols-3 items-center mb-1">
                    <div className="font-bold text-sm text-left">
                      {formatDate(item.start)}-{formatDate(item.end)}
                    </div>
                    <div className="font-bold text-sm text-center">
                      {item.title}
                    </div>
                    <div className="font-bold text-sm text-right">
                      {item.role || ''}
                    </div>
                  </div>
                  {/* 内容 bullets */}
                  {item.content.length > 0 && (
                    <ul style={{ marginTop: '4px', paddingLeft: '20px', marginBottom: 0 }}>
                      {item.content.map((line, idx) => (
                        <li key={idx} style={{ fontSize: '13px', marginBottom: '2px', lineHeight: 1.5, color: '#555' }}>
                          • {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 项目经历 ===== */}
        {projectCards.length > 0 && (
          <section className="mb-5">
            {/* 章节标题 */}
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '2px solid #333',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}>
              项目经历
            </h2>

            {/* 经历列表 */}
            <div>
              {sortByTime(projectCards).map((item) => (
                <div key={item.id} style={{ marginBottom: '10px' }}>
                  {/* 三栏 Grid：时间 | 标题 | 角色，对齐教育背景样式 */}
                  <div className="grid grid-cols-3 items-center mb-1">
                    <div className="font-bold text-sm text-left">
                      {formatDate(item.start)}-{formatDate(item.end)}
                    </div>
                    <div className="font-bold text-sm text-center">
                      {item.title}
                    </div>
                    <div className="font-bold text-sm text-right">
                      {item.role || ''}
                    </div>
                  </div>
                  {/* 内容 bullets */}
                  {item.content.length > 0 && (
                    <ul style={{ marginTop: '4px', paddingLeft: '20px', marginBottom: 0 }}>
                      {item.content.map((line, idx) => (
                        <li key={idx} style={{ fontSize: '13px', marginBottom: '2px', lineHeight: 1.5, color: '#555' }}>
                          • {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 校园经历 ===== */}
        {campusCards.length > 0 && (
          <section className="mb-5">
            {/* 章节标题 */}
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '2px solid #333',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}>
              校园经历
            </h2>

            {/* 经历列表 */}
            <div>
              {sortByTime(campusCards).map((item) => (
                <div key={item.id} style={{ marginBottom: '10px' }}>
                  {/* 三栏 Grid：时间 | 标题 | 角色，对齐教育背景样式 */}
                  <div className="grid grid-cols-3 items-center mb-1">
                    <div className="font-bold text-sm text-left">
                      {formatDate(item.start)}-{formatDate(item.end)}
                    </div>
                    <div className="font-bold text-sm text-center">
                      {item.title}
                    </div>
                    <div className="font-bold text-sm text-right">
                      {item.role || ''}
                    </div>
                  </div>
                  {/* 内容 bullets */}
                  {item.content.length > 0 && (
                    <ul style={{ marginTop: '4px', paddingLeft: '20px', marginBottom: 0 }}>
                      {item.content.map((line, idx) => (
                        <li key={idx} style={{ fontSize: '13px', marginBottom: '2px', lineHeight: 1.5, color: '#555' }}>
                          • {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== 技能证书 ===== */}
        {skills.length > 0 && (
          <section className="mb-5">
            {/* 章节标题 */}
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              borderBottom: '2px solid #333',
              paddingBottom: '6px',
              marginBottom: '12px',
            }}>
              技能证书
            </h2>

            {/* 技能列表 - 横向排列 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
              {skills.map((skill, index) => (
                <span
                  key={index}
                  style={{ fontSize: '13px', color: '#555' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 空状态 */}
        {!hasAnyContent && (
          <div className="text-center py-12 text-gray-500">
            <p>暂无内容</p>
            <p className="text-sm mt-2">先去和 AI 聊聊你的经历吧</p>
          </div>
        )}


      </div>
    </div>
  )
}
