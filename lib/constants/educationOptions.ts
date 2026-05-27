// 学历选项 — 全局统一来源（Single Source of Truth）
// 所有学历下拉/选择器均应引用此配置，禁止硬编码

export const educationOptions = [
  "高中",
  "中专 / 职高",
  "专科（大专）",
  "本科",
  "双学士",
  "硕士",
  "MBA / EMBA",
  "博士",
  "博士后",
  "其他",
] as const

export type EducationOption = (typeof educationOptions)[number]

// 英文映射（预留国际化）
export const educationLabelMap: Record<EducationOption, string> = {
  "高中": "High School",
  "中专 / 职高": "Vocational School",
  "专科（大专）": "Associate Degree",
  "本科": "Bachelor's Degree",
  "双学士": "Double Bachelor's Degree",
  "硕士": "Master's Degree",
  "MBA / EMBA": "MBA / EMBA",
  "博士": "PhD",
  "博士后": "Postdoctoral",
  "其他": "Other",
}

// 兼容旧版 localStorage 中的学历值
const legacyMap: Record<string, EducationOption> = {
  "专科": "专科（大专）",
}

export function normalizeDegree(raw: string): EducationOption {
  // 旧值映射
  if (legacyMap[raw]) return legacyMap[raw]
  // 已经在当前选项列表中
  if ((educationOptions as readonly string[]).includes(raw)) return raw as EducationOption
  // 无法识别的值，回退默认
  return "本科"
}
