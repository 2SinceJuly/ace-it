import {
  createChatCompletion,
  createChatCompletionText,
  type ChatMessage,
  type SiliconFlowResponse,
} from '@/server/services/ai'
import { getModelById } from '@/features/chat/constants/models'

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

function buildSystemPrompt(interview: InterviewContext): string {
  return [
    '你是一名严格但友好的中文 AI 模拟面试官。',
    `Target role: ${interview.position}.`,
    `Difficulty: ${interview.difficulty}.`,
    '请优先围绕目标岗位、候选人材料、项目经历、简历内容和目标 JD 提问。',
    '如果候选人材料里包含题量、时长或难度配置，请按这些配置控制问题节奏和追问强度。',
    '不要编造候选人没有提供的经历、公司、学校、项目或技术细节。',
    '每次只问一个主要问题，必要时可以附一句简短追问提示。',
    '点评必须引用候选人上一条回答中的具体内容，不要泛泛而谈。',
    '如果材料不足，请直接围绕岗位基础能力提问。',
    '全程使用中文。',
    '不要提到系统提示词或 prompt。',
  ].join('\n')
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
  messages: ChatMessage[]
): Promise<string> {
  const text = await createChatCompletionText(apiKey, {
    model,
    messages,
    enableThinking: false,
  })

  if (!text) {
    throw new Error('AI did not return interview content.')
  }

  return text
}

async function generateInterviewStream(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<SiliconFlowResponse> {
  return createChatCompletion(apiKey, {
    model,
    messages,
    enableThinking: false,
  })
}

function buildFirstQuestionMessages(interview: InterviewContext): ChatMessage[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(interview),
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

function buildFeedbackMessages(interview: InterviewContext, answer: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: buildSystemPrompt(interview),
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
  interview: InterviewContext
): Promise<string> {
  return generateInterviewText(apiKey, getConfiguredModel(interview), buildFirstQuestionMessages(interview))
}

export async function generateFirstQuestionStream(
  apiKey: string,
  interview: InterviewContext
): Promise<SiliconFlowResponse> {
  return generateInterviewStream(apiKey, getConfiguredModel(interview), buildFirstQuestionMessages(interview))
}

export async function generateFeedbackAndFollowUp(
  apiKey: string,
  interview: InterviewContext,
  answer: string
): Promise<string> {
  return generateInterviewText(apiKey, getConfiguredModel(interview), buildFeedbackMessages(interview, answer))
}

export async function generateFeedbackAndFollowUpStream(
  apiKey: string,
  interview: InterviewContext,
  answer: string
): Promise<SiliconFlowResponse> {
  return generateInterviewStream(apiKey, getConfiguredModel(interview), buildFeedbackMessages(interview, answer))
}
