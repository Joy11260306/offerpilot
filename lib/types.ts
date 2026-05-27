// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

// 简历条目类型（向后兼容）
export interface ResumeItem {
  id: string;
  type: 'education' | 'campus' | 'project' | 'skill';
  content: string;
  role?: string;
  start?: string;
  end?: string;
  createdAt: string;
}

// 经历卡片类型 - 用于经历卡片页面
export interface ExperienceCard {
  id: string;
  type: 'education' | 'campus' | 'project' | 'internship';
  title: string;
  role?: string; // 身份/职位
  start: string; // YYYY.MM 格式
  end: string; // YYYY.MM 或 "至今"
  content: string[]; // ["贡献1", "贡献2"]
  createdAt: string;
}

// 用户个人信息
export interface UserProfile {
  name: string;
  phone?: string;
  email?: string;
  school: string;
  major: string;
  degree?: '高中' | '中专 / 职高' | '专科（大专）' | '本科' | '双学士' | '硕士' | 'MBA / EMBA' | '博士' | '博士后' | '其他' | string;
  graduationYear?: string;
  targetPosition?: string;
  age?: string; // 年龄
  photo?: string; // 照片 URL（base64 或网络地址）
  // 技能证书 - 用户手动填写，不由 AI 生成
  skills?: string[];
}

// 完整简历数据结构
// 注意：技能证书由用户在个人信息中手动填写，不在此处
export interface ResumeData {
  name?: string;
  phone?: string;
  email?: string;
  education: ResumeItem[];
  campus_experience: ResumeItem[];
  projects: ResumeItem[];
  // skills 已移除，由 UserProfile.skills 替代（用户手动填写）
}

// AI 对话请求
export interface ChatRequest {
  messages: Message[];
}

// AI 对话响应
export interface ChatResponse {
  content: string;
  error?: string;
}

// 简历生成结果
export interface GeneratedResume {
  data: ResumeData;
  rawText: string;
  createdAt: string;
}

// 分类后的简历条目
export interface CategorizedResumeItems {
  education: ResumeItem[];
  campus: ResumeItem[];
  project: ResumeItem[];
  skill: ResumeItem[];
}

// 分类后的经历卡片
export interface CategorizedExperienceCards {
  education: ExperienceCard[];
  campus: ExperienceCard[];
  project: ExperienceCard[];
  internship: ExperienceCard[];
}

// 教育经历补充信息
export interface EducationExtra {
  startDate: string;
  endDate: string;
  gpa: string;
  ranking: string;
  courses: string;
  honors: string;
  exchange: string;
  research: string;
}
