# OfferPilot

AI简历教练 - 帮助大学生通过AI对话挖掘经历，自动生成专业简历。

## 功能特性

- 🤖 **AI 智能对话** - 像教练一样引导你挖掘经历
- 📝 **经历卡片** - 自动生成专业的简历 bullet points
- 📄 **简历预览** - 实时预览完整简历
- 📥 **PDF 导出** - 一键导出，支持中文

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并添加你的 DeepSeek API Key：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

获取 API Key: [DeepSeek Platform](https://platform.deepseek.com/)

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # AI 对话 API
│   │   └── generate-resume/route.ts # 简历生成 API
│   ├── chat/page.tsx              # AI 聊天页
│   ├── experiences/page.tsx       # 经历卡片页
│   ├── resume/page.tsx            # 简历预览页
│   └── page.tsx                   # 首页
├── components/
│   ├── ui/                        # UI 组件
│   ├── ChatWindow.tsx             # 聊天窗口
│   ├── ChatInput.tsx              # 聊天输入框
│   ├── ExperienceCard.tsx         # 经历卡片
│   ├── Navbar.tsx                 # 导航栏
│   └── ResumePreview.tsx          # 简历预览
├── lib/
│   ├── types.ts                   # 类型定义
│   ├── utils.ts                   # 工具函数
│   ├── storage.ts                 # 本地存储
│   └── prompts/
│       └── resumeCoach.ts         # AI 提示词
└── .env.local                     # 本地环境变量
```

## 使用流程

1. **首页** - 点击"开始制作"进入 AI 聊天
2. **AI 聊天** - 回答 AI 的问题，描述你的经历
3. **经历卡片** - 查看和管理 AI 生成的内容
4. **简历预览** - 预览完整简历
5. **导出 PDF** - 一键下载中文简历

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量 `DEEPSEEK_API_KEY`
4. 部署

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- DeepSeek API

## License

MIT
