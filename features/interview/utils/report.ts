import type { InterviewData } from '@/app/actions/interview'

export interface ReportDimension {
  subject: string
  value: number
}

export interface ReportInsight {
  title: string
  items: string[]
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function stableOffset(id: string) {
  return id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9
}

export function getInterviewScore(interview: InterviewData, index = 0) {
  if (interview.messages.length === 0) return 0

  const userCount = interview.messages.filter((message) => message.role === 'user').length
  const assistantCount = interview.messages.filter((message) => message.role === 'assistant').length
  const materialLength = interview.materials.reduce((sum, material) => sum + material.content.length, 0)

  return clamp(
    54 + userCount * 10 + assistantCount * 5 + Math.min(Math.floor(materialLength / 320), 8) + stableOffset(interview.id) - index,
    18,
    96
  )
}

export function getInterviewDurationMinutes(interview: InterviewData) {
  const start = new Date(interview.createdAt).getTime()
  const end = new Date(interview.updatedAt).getTime()
  const minutes = Math.max(1, Math.round((end - start) / 60000))

  return minutes
}

export function getQuestionCount(interview: InterviewData) {
  return Math.max(1, interview.messages.filter((message) => message.role === 'assistant').length)
}

export function getDimensionData(score: number): ReportDimension[] {
  return [
    { subject: '技术', value: clamp(score + 4) },
    { subject: '知识', value: clamp(score + 8) },
    { subject: '表达', value: clamp(score - 6) },
    { subject: '逻辑', value: clamp(score - 2) },
    { subject: '匹配', value: clamp(score + 1) },
  ]
}

export function formatInterviewDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function getLatestAssistantText(interview: InterviewData) {
  return (
    [...interview.messages]
      .reverse()
      .find((message) => message.role === 'assistant')
      ?.content.trim() || ''
  )
}

export function getMaterialPreview(interview: InterviewData) {
  const content = interview.materials[0]?.content.trim()

  if (!content) {
    return `当前面试围绕 ${interview.position} 岗位进行，建议补充简历、项目或 JD 作为后续报告依据。`
  }

  return content.length > 120 ? `${content.slice(0, 120)}...` : content
}

export function getReportInsights(interview: InterviewData): {
  highlights: string[]
  weaknesses: string[]
  suggestions: string[]
  practicePlan: Array<{ day: string; title: string; tasks: string[]; goal: string }>
  recommendations: Array<{ title: string; meta: string; reason: string }>
} {
  const position = interview.position || '目标岗位'
  const hasAnswers = interview.messages.some((message) => message.role === 'user')

  return {
    highlights: [
      `能围绕 ${position} 的职责展开回答，说明候选人已经具备岗位语境。`,
      hasAnswers
        ? '已经完成至少一轮回答和追问，可用于复盘表达结构和技术细节。'
        : '已经创建面试材料，下一步需要完成问答来生成更完整的评估。',
      '材料、问题和回答保存在同一条面试记录中，刷新后仍可继续查看。',
    ],
    weaknesses: [
      '回答中需要补充更具体的项目背景、约束条件和结果指标。',
      '遇到追问时建议先给结论，再补关键依据，减少泛泛而谈。',
      '技术方案需要更明确地区分取舍、边界和风险。',
    ],
    suggestions: [
      '每道题先用一句话给出结论，再展开实现细节。',
      '补充项目中的真实数据、性能指标或协作约束。',
      '把“为什么这样做”和“有没有替代方案”作为固定回答模块。',
      '复盘最近一次追问，把薄弱点整理成下一场面试的练习清单。',
    ],
    practicePlan: [
      {
        day: 'Day 1',
        title: '整理岗位素材',
        tasks: ['提炼 3 个与岗位最相关的项目经历', '为每个项目补充职责、难点和结果', '准备 1 分钟项目介绍'],
        goal: '让回答从“做过什么”变成“为什么这样做”。',
      },
      {
        day: 'Day 2',
        title: '强化追问',
        tasks: ['对同一题连续追问 2 轮', '补充异常、性能、协作和边界条件', '记录答不上来的知识点'],
        goal: '减少被追问后卡壳的情况。',
      },
      {
        day: 'Day 3',
        title: '完整模拟',
        tasks: ['重新开始一场模拟面试', '按结论、依据、例子、风险组织答案', '结束后查看报告并更新练习清单'],
        goal: '把零散知识点串成稳定表达。',
      },
    ],
    recommendations: [
      {
        title: `${position} 高频追问清单`,
        meta: '岗位知识库 · 面试复盘',
        reason: '命中当前岗位与最近一次问答，适合在下一场面试前快速过一遍。',
      },
      {
        title: '项目经历结构化表达模板',
        meta: '表达训练 · STAR / 技术取舍',
        reason: '用于补强项目背景、职责边界、结果指标和技术取舍。',
      },
      {
        title: '追问应对与风险边界卡片',
        meta: '练习卡片 · 深挖题',
        reason: '针对回答中容易被继续追问的点，训练更稳的二轮回答。',
      },
    ],
  }
}
