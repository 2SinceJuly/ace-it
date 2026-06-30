import {
  createChatCompletion,
  createChatCompletionText,
  type ChatMessage,
  type SiliconFlowResponse,
} from '@/server/services/ai'
import { getModelById } from '@/features/chat/constants/models'
import { buildInterviewConductorSystemPrompt } from './prompts/interview-conductor.prompt'

const INTERVIEW_MODEL = 'zai-org/GLM-4.6'

interface InterviewMaterial {
  content: string
}

interface InterviewMessage {
  role: string
  content: string
}

interface InterviewContext {
  position: string
  difficulty: string
  materials: InterviewMaterial[]
  messages?: InterviewMessage[]
}

interface InterviewAIOptions {
  enableThinking?: boolean
  thinkingBudget?: number
  enableWebSearch?: boolean
}

export function buildInterviewWebSearchBoundaryNote(enableWebSearch?: boolean): string {
  if (!enableWebSearch) return ''

  return [
    '',
    'Web search boundary:',
    '- The candidate enabled web search for this interview turn.',
    '- The interview stream currently receives this flag, but the chat web_search tool execution loop has not yet been attached to InterviewMessage persistence.',
    '- Do not claim that you searched the web unless explicit search results are present in the prompt.',
    '- If current external facts are needed, ask for the exact source/link or state that live verification is needed.',
  ].join('\n')
}

function buildSystemPrompt(interview: InterviewContext, options: InterviewAIOptions = {}): string {
  return `${buildInterviewConductorSystemPrompt({
    position: interview.position,
    difficulty: interview.difficulty,
  })}${buildInterviewWebSearchBoundaryNote(options.enableWebSearch)}`
}

function buildMaterialText(interview: InterviewContext): string {
  const material = interview.materials.map((item) => item.content.trim()).filter(Boolean).join('\n\n---\n\n')
  return material || 'No candidate material was provided.'
}

function buildHistoryText(messages: InterviewMessage[] = []): string {
  if (messages.length === 0) return 'No previous interview messages.'

  return messages
    .map((message) => `${message.role === 'user' ? 'Candidate' : 'Interviewer'}: ${message.content}`)
    .join('\n\n')
}

function getConfiguredModel(interview: InterviewContext): string {
  for (const material of interview.materials) {
    const match = material.content.match(/^Model ID:\s*(.+)$/m)
    const candidate = match?.[1]?.trim()

    if (candidate && getModelById(candidate)) {
      return candidate
    }
  }

  return INTERVIEW_MODEL
}

async function generateInterviewText(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: InterviewAIOptions = {}
): Promise<string> {
  const text = await createChatCompletionText(apiKey, {
    model,
    messages,
    enableThinking: options.enableThinking,
    thinkingBudget: options.thinkingBudget,
  })

  if (!text) {
    throw new Error('AI did not return interview content.')
  }

  return text
}

async function generateInterviewStream(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  options: InterviewAIOptions = {}
): Promise<SiliconFlowResponse> {
  return createChatCompletion(apiKey, {
    model,
    messages,
    enableThinking: options.enableThinking,
    thinkingBudget: options.thinkingBudget,
  })
}

function buildFirstQuestionMessages(interview: InterviewContext, options: InterviewAIOptions = {}): ChatMessage[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(interview, options),
    },
    {
      role: 'user',
      content: [
        '请生成这场模拟面试的开场问题。',
        '只问一个问题。',
        '问题必须贴合目标岗位和候选人材料。',
        '不要点评，因为候选人还没有回答。',
        '',
        '候选人材料：',
        buildMaterialText(interview),
      ].join('\n'),
    },
  ]
}

function buildFeedbackMessages(
  interview: InterviewContext,
  answer: string,
  options: InterviewAIOptions = {}
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(interview, options),
    },
    {
      role: 'user',
      content: [
        '请点评候选人的最新回答，并继续模拟面试。',
        '',
        '请按两个短段落返回：',
        '点评：结合候选人回答中的具体内容，指出一个优点和一个可以补强的点。',
        '追问：只问一个下一题，必须围绕刚才回答中不够具体或值得深入的地方。',
        '',
        '候选人材料：',
        buildMaterialText(interview),
        '',
        '面试历史：',
        buildHistoryText(interview.messages),
        '',
        '候选人最新回答：',
        answer,
      ].join('\n'),
    },
  ]
}

export async function generateFirstQuestion(
  apiKey: string,
  interview: InterviewContext,
  options: InterviewAIOptions = {}
): Promise<string> {
  return generateInterviewText(
    apiKey,
    getConfiguredModel(interview),
    buildFirstQuestionMessages(interview, options),
    options
  )
}

export async function generateFirstQuestionStream(
  apiKey: string,
  interview: InterviewContext,
  options: InterviewAIOptions = {}
): Promise<SiliconFlowResponse> {
  return generateInterviewStream(
    apiKey,
    getConfiguredModel(interview),
    buildFirstQuestionMessages(interview, options),
    options
  )
}

export async function generateFeedbackAndFollowUp(
  apiKey: string,
  interview: InterviewContext,
  answer: string,
  options: InterviewAIOptions = {}
): Promise<string> {
  return generateInterviewText(
    apiKey,
    getConfiguredModel(interview),
    buildFeedbackMessages(interview, answer, options),
    options
  )
}

export async function generateFeedbackAndFollowUpStream(
  apiKey: string,
  interview: InterviewContext,
  answer: string,
  options: InterviewAIOptions = {}
): Promise<SiliconFlowResponse> {
  return generateInterviewStream(
    apiKey,
    getConfiguredModel(interview),
    buildFeedbackMessages(interview, answer, options),
    options
  )
}
