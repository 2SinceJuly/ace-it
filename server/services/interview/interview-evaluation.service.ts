/**
 * 面试报告生成服务
 *
 * 在面试结束时调用 AI 生成结构化评估，包含：
 * - 总分（0-100）
 * - 5 维度雷达图数据（技术 / 知识 / 表达 / 逻辑 / 匹配）
 * - 整体复盘摘要
 * - 亮点 / 短板 / 改进建议
 * - 3 天练习路径
 * - 3 条推荐练习
 *
 * AI 返回 JSON，本模块负责校验和补全字段，确保数据库写入的永远是合法结构。
 */

import { createChatCompletionText, type ChatMessage } from '@/server/services/ai'

const INTERVIEW_MODEL = 'zai-org/GLM-4.6'

/** AI 评估返回的原始结构（字段都可能缺失，需要校验） */
interface RawEvaluation {
  score?: unknown
  dimensions?: unknown
  summary?: unknown
  highlights?: unknown
  weaknesses?: unknown
  suggestions?: unknown
  practicePlan?: unknown
  recommendations?: unknown
}

/** 校验后的结构化评估（类型安全，所有字段都保证存在且类型正确） */
export interface InterviewEvaluation {
  score: number
  dimensions: Array<{ subject: string; value: number }>
  summary: string
  highlights: string[]
  weaknesses: string[]
  suggestions: string[]
  practicePlan: Array<{ day: string; title: string; tasks: string[]; goal: string }>
  recommendations: Array<{ title: string; meta: string; reason: string }>
}

interface InterviewMessageForEval {
  role: string
  content: string
}

interface InterviewContextForEval {
  position: string
  difficulty: string
  materials: Array<{ content: string }>
  messages: InterviewMessageForEval[]
}

/** 默认维度列表，AI 返回缺失时使用 */
const DEFAULT_DIMENSIONS = ['技术', '知识', '表达', '逻辑', '匹配']

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
    .filter((item) => item.trim().length > 0)
}

function asDimensions(
  value: unknown
): Array<{ subject: string; value: number }> {
  if (!Array.isArray(value)) {
    // 没有维度数据时用默认维度 + 0 分占位
    return DEFAULT_DIMENSIONS.map((subject) => ({ subject, value: 0 }))
  }

  const parsed = value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const raw = item as Record<string, unknown>
      const subject = typeof raw.subject === 'string' ? raw.subject : ''
      const numValue = asNumber(raw.value, 0)
      return subject ? { subject, value: clamp(numValue) } : null
    })
    .filter((item): item is { subject: string; value: number } => item !== null)

  return parsed.length > 0 ? parsed : DEFAULT_DIMENSIONS.map((subject) => ({ subject, value: 0 }))
}

function asPracticePlan(
  value: unknown
): Array<{ day: string; title: string; tasks: string[]; goal: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const raw = item as Record<string, unknown>
      const day = typeof raw.day === 'string' ? raw.day : ''
      const title = typeof raw.title === 'string' ? raw.title : ''
      const goal = typeof raw.goal === 'string' ? raw.goal : ''
      const tasks = asStringArray(raw.tasks)
      if (!day || !title) return null
      return { day, title, tasks, goal }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function asRecommendations(
  value: unknown
): Array<{ title: string; meta: string; reason: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const raw = item as Record<string, unknown>
      const title = typeof raw.title === 'string' ? raw.title : ''
      const meta = typeof raw.meta === 'string' ? raw.meta : ''
      const reason = typeof raw.reason === 'string' ? raw.reason : ''
      if (!title) return null
      return { title, meta, reason }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

function buildHistoryText(messages: InterviewMessageForEval[]): string {
  if (messages.length === 0) return 'No previous interview messages.'
  return messages
    .map((message) => `${message.role === 'user' ? '候选人' : '面试官'}: ${message.content}`)
    .join('\n\n')
}

function buildMaterialText(interview: InterviewContextForEval): string {
  const material = interview.materials
    .map((item) => item.content.trim())
    .filter(Boolean)
    .join('\n\n---\n\n')
  return material || '候选人未提供材料。'
}

function buildEvaluationPrompt(interview: InterviewContextForEval): string {
  return [
    '请基于以下面试记录生成结构化评估报告，只返回 JSON，不要任何解释文字、Markdown 代码块或前后缀。',
    '',
    'JSON 字段说明：',
    '- score: 整体得分，整数 0-100',
    '- dimensions: 5 维度雷达图数据，数组，每项 { subject, value }，subject 从 ["技术", "知识", "表达", "逻辑", "匹配"] 中选，value 为 0-100 整数',
    '- summary: 一段话复盘摘要，100-200 字，结合候选人具体回答内容',
    '- highlights: 亮点数组，3 条，每条一句话，必须引用候选人具体回答内容',
    '- weaknesses: 短板数组，3 条，每条一句话，必须引用候选人具体回答内容',
    '- suggestions: 改进建议数组，4 条，每条一句话，可执行',
    '- practicePlan: 3 天练习路径数组，每项 { day, title, tasks, goal }，tasks 是字符串数组',
    '- recommendations: 3 条推荐练习数组，每项 { title, meta, reason }',
    '',
    '岗位:', interview.position,
    '难度:', interview.difficulty,
    '',
    '候选人材料:',
    buildMaterialText(interview),
    '',
    '面试记录:',
    buildHistoryText(interview.messages),
  ].join('\n')
}

function buildEvaluationMessages(
  interview: InterviewContextForEval
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        '你是一名资深技术面试官，正在为候选人写模拟面试复盘报告。',
        '评分必须严格、客观，结合候选人实际回答内容，不要泛泛而谈。',
        '所有字段必须填写，缺失字段用空字符串或空数组占位。',
        '输出必须是合法 JSON，不能包含注释、代码块标记或解释文字。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: buildEvaluationPrompt(interview),
    },
  ]
}

/** 从 AI 返回的文本中提取 JSON（处理可能的代码块包裹和前后多余字符） */
function extractJson(text: string): string {
  const trimmed = text.trim()
  // 处理 ```json ... ``` 包裹
  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n')
    // 移除首行 ``` 和末行 ```
    const middle = lines.slice(1, lines.length - 1).join('\n')
    return middle.trim()
  }
  // 找到第一个 { 和最后一个 }，截取中间部分
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1)
  }
  return trimmed
}

/** 校验并补全 AI 返回的评估，确保返回结构完整 */
function normalizeEvaluation(raw: RawEvaluation, position: string): InterviewEvaluation {
  const score = clamp(Math.round(asNumber(raw.score, 60)))
  const dimensions = asDimensions(raw.dimensions)
  const summary = typeof raw.summary === 'string' && raw.summary.trim()
    ? raw.summary.trim()
    : `本场面试围绕 ${position} 展开，建议补充更多回答以生成完整评估。`
  const highlights = asStringArray(raw.highlights)
  const weaknesses = asStringArray(raw.weaknesses)
  const suggestions = asStringArray(raw.suggestions)
  const practicePlan = asPracticePlan(raw.practicePlan)
  const recommendations = asRecommendations(raw.recommendations)

  return {
    score,
    dimensions,
    summary,
    highlights,
    weaknesses,
    suggestions,
    practicePlan,
    recommendations,
  }
}

/**
 * 调用 AI 生成面试评估
 *
 * @throws Error 当 AI 调用失败或返回无法解析时抛出
 */
export async function generateInterviewEvaluation(
  apiKey: string,
  interview: InterviewContextForEval
): Promise<InterviewEvaluation> {
  const messages = buildEvaluationMessages(interview)
  const rawText = await createChatCompletionText(apiKey, {
    model: INTERVIEW_MODEL,
    messages,
    enableThinking: false,
  })

  if (!rawText) {
    throw new Error('AI did not return evaluation content.')
  }

  let parsed: RawEvaluation
  try {
    parsed = JSON.parse(extractJson(rawText)) as RawEvaluation
  } catch {
    throw new Error('AI returned invalid JSON for interview evaluation.')
  }

  return normalizeEvaluation(parsed, interview.position)
}
