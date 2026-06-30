import { InterviewRepository } from '@/server/repositories/interview.repository'
import {
  generateFeedbackAndFollowUpStream,
  generateFirstQuestionStream,
} from '@/server/services/interview/interview-ai.service'
import { createInterviewSSEStream } from './interview-stream.handler'

export type InterviewStreamAction = 'start' | 'answer'

export interface InterviewStreamRequest {
  action: InterviewStreamAction
  content?: string
  enableThinking?: boolean
  enableWebSearch?: boolean
}

export interface InterviewStreamResponse {
  stream: ReadableStream
  sessionId: string
  interviewId: string
}

export class InterviewStreamNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterviewStreamNotFoundError'
  }
}

export async function handleInterviewStreamRequest(
  userId: string,
  apiKey: string,
  interviewId: string,
  request: InterviewStreamRequest,
  options?: { abortSignal?: AbortSignal }
): Promise<InterviewStreamResponse> {
  const interview = await InterviewRepository.findById(interviewId, userId)

  if (!interview) {
    throw new InterviewStreamNotFoundError('Interview not found.')
  }

  if (request.action === 'start') {
    if (interview.messages.length > 0) {
      throw new Error('Interview has already started.')
    }

    const { reader } = await generateFirstQuestionStream(apiKey, interview, {
      enableThinking: request.enableThinking,
      enableWebSearch: request.enableWebSearch,
    })
    const sessionId = Date.now().toString()

    return {
      stream: createInterviewSSEStream(reader, { interviewId, userId, sessionId }, options),
      sessionId,
      interviewId,
    }
  }

  if (request.action === 'answer') {
    const answer = request.content?.trim()
    if (!answer) {
      throw new Error('Answer is required.')
    }

    await InterviewRepository.addMessage(interview.id, 'user', answer)
    const { reader } = await generateFeedbackAndFollowUpStream(apiKey, interview, answer, {
      enableThinking: request.enableThinking,
      enableWebSearch: request.enableWebSearch,
    })
    const sessionId = Date.now().toString()

    return {
      stream: createInterviewSSEStream(reader, { interviewId, userId, sessionId }, options),
      sessionId,
      interviewId,
    }
  }

  throw new Error('Unsupported interview stream action.')
}
