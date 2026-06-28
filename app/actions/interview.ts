'use server'

import { getCurrentUserId } from '@/server/auth/utils'
import { audit } from '@/server/middleware/audit'
import { InterviewRepository } from '@/server/repositories/interview.repository'
import { UserRepository } from '@/server/repositories/user.repository'
import {
  generateFeedbackAndFollowUp,
  generateFirstQuestion,
} from '@/server/services/interview/interview-ai.service'

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
