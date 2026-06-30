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
import {
  INTERVIEW_EVALUATOR_SYSTEM_PROMPT,
  INTERVIEW_EVALUATOR_USER_RULES,
} from './prompts/interview-evaluator.prompt'

const INTERVIEW_MODEL = 'zai-org/GLM-4.6'

/** AI 评估返回的原始结构（字段都可能缺失，需要校验） */
export interface RawEvaluation {
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
  if (typeof value === 'string') {
    return value
      .split(/\n|；|;|。|\.\s+|、/)
      .map((item) => item.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
  }

  if (!Array.isArray(value)) return []

  return value
    .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
    .map((item) => item.trim())
    .filter(Boolean)
}

function asDimensions(
  value: unknown
): Array<{ subject: string; value: number }> {
  if (!Array.isArray(value)) return DEFAULT_DIMENSIONS.map((subject) => ({ subject, value: 0 }))

  const parsed = value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const raw = item as Record<string, unknown>
      const subject = typeof raw.subject === 'string' ? raw.subject : ''
      const numValue = asNumber(raw.value, 0)
      return subject ? { subject, value: clamp(numValue) } : null
    })
    .filter((item): item is { subject: string; value: number } => item !== null)

  return DEFAULT_DIMENSIONS.map((subject, index) => {
    const bySubject = parsed.find((item) => item.subject === subject)
    const byIndex = parsed[index]
    return {
      subject,
      value: bySubject?.value ?? byIndex?.value ?? 0,
    }
  })
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
    '请基于以下面试记录生成结构化评估报告。',
    '只返回一个 JSON 对象，不要 Markdown，不要代码块，不要解释，不要前后缀。',
    '',
    INTERVIEW_EVALUATOR_USER_RULES,
    '',
    '最小 JSON 示例:',
    '{"score":75,"dimensions":[{"subject":"技术","value":75},{"subject":"知识","value":70},{"subject":"表达","value":78},{"subject":"逻辑","value":72},{"subject":"匹配","value":76}],"summary":"候选人回答覆盖了核心思路，但细节仍需补强。","highlights":["能结合项目经验回答问题"],"weaknesses":["关键技术细节展开不足"],"suggestions":["用 STAR 结构组织项目回答"],"practicePlan":[{"day":"Day 1","title":"复盘基础","tasks":["整理项目难点"],"goal":"形成清晰表达"}],"recommendations":[{"title":"项目复盘练习","meta":"30 分钟","reason":"提升回答结构"}]}',
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
      content: INTERVIEW_EVALUATOR_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: buildEvaluationPrompt(interview),
    },
  ]
}

function buildJsonRepairMessages(rawText: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        '你是 JSON 修复器。',
        '把用户提供的文本转换成一个合法 JSON 对象。',
        '只输出 JSON 对象本身，不要 Markdown，不要代码块，不要解释。',
        '必须保留字段含义，无法确定的字段用空数组、空字符串或 60 分兜底。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        '请把下面内容修复为合法 JSON 对象，字段必须包含：',
        'score, dimensions, summary, highlights, weaknesses, suggestions, practicePlan, recommendations。',
        '',
        rawText,
      ].join('\n'),
    },
  ]
}

/** 从 AI 返回的文本中提取 JSON（处理可能的代码块包裹和前后多余字符） */
export function extractJson(text: string): string {
  const trimmed = text.trim()

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const source = fenced?.[1]?.trim() || trimmed
  const start = source.indexOf('{')
  if (start < 0) return source

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const char = source[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return source.slice(start, index + 1)
      }
    }
  }

  return source.slice(start)
}

function stripJsonComments(text: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (!inString && char === '/' && next === '/') {
      while (index < text.length && text[index] !== '\n') {
        index += 1
      }
      result += '\n'
      continue
    }

    if (!inString && char === '/' && next === '*') {
      index += 2
      while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) {
        index += 1
      }
      index += 1
      continue
    }

    result += char
  }

  return result
}

function removeTrailingCommas(text: string): string {
  let result = ''
  let inString = false
  let escaped = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      result += char
      escaped = true
      continue
    }

    if (char === '"') {
      result += char
      inString = !inString
      continue
    }

    if (!inString && char === ',') {
      let lookahead = index + 1
      while (/\s/.test(text[lookahead] || '')) {
        lookahead += 1
      }

      if (text[lookahead] === '}' || text[lookahead] === ']') {
        continue
      }
    }

    result += char
  }

  return result
}

function normalizeJsonText(text: string): string {
  return removeTrailingCommas(stripJsonComments(extractJson(text).replace(/^\uFEFF/, '').trim()))
}

export function parseEvaluationJson(text: string): RawEvaluation {
  const candidates = Array.from(new Set([
    extractJson(text),
    normalizeJsonText(text),
  ]))

  let lastError: unknown

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as RawEvaluation
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Invalid evaluation JSON.')
}

/** 校验并补全 AI 返回的评估，确保返回结构完整 */
export function normalizeEvaluation(raw: RawEvaluation, position: string): InterviewEvaluation {
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
    parsed = parseEvaluationJson(rawText)
  } catch (firstError) {
    console.warn('[InterviewEvaluation] Primary JSON parse failed, requesting repair:', {
      length: rawText.length,
      preview: rawText.slice(0, 2000),
      error: firstError instanceof Error ? firstError.message : String(firstError),
    })

    try {
      const repairedText = await createChatCompletionText(apiKey, {
        model: INTERVIEW_MODEL,
        messages: buildJsonRepairMessages(rawText),
        enableThinking: false,
      })

      parsed = parseEvaluationJson(repairedText)
    } catch (repairError) {
      console.error('[InterviewEvaluation] Invalid AI evaluation JSON after repair:', {
        length: rawText.length,
        preview: rawText.slice(0, 2000),
        error: repairError instanceof Error ? repairError.message : String(repairError),
      })
      throw new Error('AI returned invalid JSON for interview evaluation.')
    }
  }

  return normalizeEvaluation(parsed, interview.position)
}
