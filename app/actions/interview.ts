'use server'

import { getCurrentUserId } from '@/server/auth/utils'
import { audit } from '@/server/middleware/audit'
import { InterviewRepository } from '@/server/repositories/interview.repository'
import { UserRepository } from '@/server/repositories/user.repository'
import {
  generateFeedbackAndFollowUp,
  generateFirstQuestion,
} from '@/server/services/interview/interview-ai.service'
import { generateInterviewEvaluation } from '@/server/services/interview/interview-evaluation.service'

export interface InterviewMaterialData {
  id: string
  content: string
  createdAt: string
}

export interface InterviewMessageData {
  id: string
  role: 'assistant' | 'user'
  content: string
  createdAt: string
}

export interface InterviewReportData {
  id: string
  interviewId: string
  score: number
  dimensions: Array<{ subject: string; value: number }>
  summary: string
  highlights: string[]
  weaknesses: string[]
  suggestions: string[]
  practicePlan: Array<{ day: string; title: string; tasks: string[]; goal: string }>
  recommendations: Array<{ title: string; meta: string; reason: string }>
  createdAt: string
}

export interface InterviewData {
  id: string
  userId: string
  position: string
  difficulty: string
  status: string
  createdAt: string
  updatedAt: string
  materials: InterviewMaterialData[]
  messages: InterviewMessageData[]
  report: InterviewReportData | null
}

export interface CreateInterviewData {
  position: string
  difficulty: string
  materialContent: string
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

const DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
const API_KEY_ERROR = 'API Key not configured. Please set your SiliconFlow API Key in your profile or contact administrator.'

function serializeInterview(interview: {
  id: string
  userId: string
  position: string
  difficulty: string
  status: string
  createdAt: Date
  updatedAt: Date
  materials: Array<{ id: string; content: string; createdAt: Date }>
  messages?: Array<{ id: string; role: string; content: string; createdAt: Date }>
  report?: {
    id: string
    interviewId: string
    score: number
    dimensions: unknown
    summary: string
    highlights: unknown
    weaknesses: unknown
    suggestions: unknown
    practicePlan: unknown
    recommendations: unknown
    createdAt: Date
  } | null
}): InterviewData {
  return {
    id: interview.id,
    userId: interview.userId,
    position: interview.position,
    difficulty: interview.difficulty,
    status: interview.status,
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
    materials: interview.materials.map((material) => ({
      id: material.id,
      content: material.content,
      createdAt: material.createdAt.toISOString(),
    })),
    messages: (interview.messages || []).map((message) => ({
      id: message.id,
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
    report: interview.report
      ? {
          id: interview.report.id,
          interviewId: interview.report.interviewId,
          score: interview.report.score,
          dimensions: interview.report.dimensions as Array<{ subject: string; value: number }>,
          summary: interview.report.summary,
          highlights: interview.report.highlights as string[],
          weaknesses: interview.report.weaknesses as string[],
          suggestions: interview.report.suggestions as string[],
          practicePlan: interview.report.practicePlan as Array<{ day: string; title: string; tasks: string[]; goal: string }>,
          recommendations: interview.report.recommendations as Array<{ title: string; meta: string; reason: string }>,
          createdAt: interview.report.createdAt.toISOString(),
        }
      : null,
  }
}

function serializeActionError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return 'Please sign in before using interviews.'
    }
    return error.message
  }

  return fallback
}

function normalizeCreateInput(input: CreateInterviewData): CreateInterviewData {
  const position = input.position.trim()
  const materialContent = input.materialContent.trim()
  const difficulty = DIFFICULTIES.has(input.difficulty) ? input.difficulty : 'medium'

  if (!position) {
    throw new Error('Position is required.')
  }

  if (!materialContent) {
    throw new Error('Interview material is required.')
  }

  return { position, difficulty, materialContent }
}

async function getApiKey(userId: string): Promise<string> {
  const user = await UserRepository.findById(userId)
  const apiKey = user?.apiKey || process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(API_KEY_ERROR)
  }

  return apiKey
}

export async function createInterview(
  input: CreateInterviewData
): Promise<ActionResult<InterviewData>> {
  try {
    const userId = await getCurrentUserId()
    const normalized = normalizeCreateInput(input)
    const interview = await InterviewRepository.create(userId, normalized)

    await audit({
      userId,
      action: 'interview.create',
      resourceId: interview.id,
      metadata: {
        position: interview.position,
        difficulty: interview.difficulty,
      },
    })

    return { success: true, data: serializeInterview(interview) }
  } catch (error) {
    console.error('[Action] createInterview failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to create interview.') }
  }
}

export async function getInterviews(): Promise<ActionResult<InterviewData[]>> {
  try {
    const userId = await getCurrentUserId()
    const interviews = await InterviewRepository.findByUserId(userId)
    return { success: true, data: interviews.map(serializeInterview) }
  } catch (error) {
    console.error('[Action] getInterviews failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to load interviews.') }
  }
}

export async function getInterviewById(id: string): Promise<ActionResult<InterviewData>> {
  try {
    const userId = await getCurrentUserId()
    const interview = await InterviewRepository.findById(id, userId)

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    await audit({
      userId,
      action: 'interview.view',
      resourceId: id,
    })

    return { success: true, data: serializeInterview(interview) }
  } catch (error) {
    console.error('[Action] getInterviewById failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to load interview.') }
  }
}

export async function startInterview(interviewId: string): Promise<ActionResult<InterviewData>> {
  try {
    const userId = await getCurrentUserId()
    const interview = await InterviewRepository.findById(interviewId, userId)

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    if (interview.messages.length > 0) {
      return { success: true, data: serializeInterview(interview) }
    }

    const apiKey = await getApiKey(userId)
    const firstQuestion = await generateFirstQuestion(apiKey, interview)
    const updatedInterview = await InterviewRepository.startWithAssistantMessage(
      interview.id,
      userId,
      firstQuestion
    )

    await audit({
      userId,
      action: 'interview.start',
      resourceId: interview.id,
    })

    return { success: true, data: serializeInterview(updatedInterview) }
  } catch (error) {
    console.error('[Action] startInterview failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to start interview.') }
  }
}

export async function submitInterviewAnswer(
  interviewId: string,
  content: string
): Promise<ActionResult<InterviewData>> {
  try {
    const answer = content.trim()

    if (!answer) {
      return { success: false, error: 'Answer is required.' }
    }

    const userId = await getCurrentUserId()
    const interview = await InterviewRepository.findById(interviewId, userId)

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    await InterviewRepository.addMessage(interview.id, 'user', answer)

    const apiKey = await getApiKey(userId)
    const assistantReply = await generateFeedbackAndFollowUp(apiKey, interview, answer)
    const updatedInterview = await InterviewRepository.addAssistantReplyAndMarkInProgress(
      interview.id,
      userId,
      assistantReply
    )

    await audit({
      userId,
      action: 'interview.answer',
      resourceId: interview.id,
    })

    return { success: true, data: serializeInterview(updatedInterview) }
  } catch (error) {
    console.error('[Action] submitInterviewAnswer failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to submit answer.') }
  }
}

export async function completeInterview(
  interviewId: string
): Promise<ActionResult<InterviewData>> {
  try {
    const userId = await getCurrentUserId()
    const interview = await InterviewRepository.findById(interviewId, userId)

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    const updatedInterview = await InterviewRepository.markCompleted(interview.id, userId)

    await audit({
      userId,
      action: 'interview.complete',
      resourceId: interview.id,
    })

    return { success: true, data: serializeInterview(updatedInterview) }
  } catch (error) {
    console.error('[Action] completeInterview failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to complete interview.') }
  }
}

export async function generateInterviewReport(
  interviewId: string
): Promise<ActionResult<InterviewData>> {
  try {
    const userId = await getCurrentUserId()
    const interview = await InterviewRepository.findById(interviewId, userId)

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    if (interview.report) {
      return { success: true, data: serializeInterview(interview) }
    }

    const hasUserAnswers = interview.messages.some((message) => message.role === 'user')
    if (!hasUserAnswers) {
      return { success: false, error: '至少完成一轮回答后才能生成评估报告。' }
    }

    const apiKey = await getApiKey(userId)
    const evaluation = await generateInterviewEvaluation(apiKey, {
      position: interview.position,
      difficulty: interview.difficulty,
      materials: interview.materials.map((material) => ({ content: material.content })),
      messages: interview.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    })

    await InterviewRepository.saveReport(interview.id, evaluation)
    const updatedInterview = await InterviewRepository.findById(interview.id, userId)

    if (!updatedInterview) {
      return { success: false, error: 'Interview not found after report generation.' }
    }

    await audit({
      userId,
      action: 'interview.report.generate',
      resourceId: interview.id,
    })

    return { success: true, data: serializeInterview(updatedInterview) }
  } catch (error) {
    console.error('[Action] generateInterviewReport failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to generate interview report.') }
  }
}

export async function deleteInterview(interviewId: string): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId()
    const deleted = await InterviewRepository.deleteById(interviewId, userId)

    if (!deleted) {
      return { success: false, error: 'Interview not found.' }
    }

    await audit({
      userId,
      action: 'interview.delete',
      resourceId: interviewId,
    })

    return { success: true, data: { id: interviewId } }
  } catch (error) {
    console.error('[Action] deleteInterview failed:', error)
    return { success: false, error: serializeActionError(error, 'Failed to delete interview.') }
  }
}
