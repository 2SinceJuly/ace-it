'use client'

import { create } from 'zustand'
import {
  createInterview as createInterviewAction,
  getInterviewById,
  getInterviews,
  startInterview as startInterviewAction,
  submitInterviewAnswer as submitInterviewAnswerAction,
  type CreateInterviewData,
  type InterviewData,
  type InterviewMessageData,
} from '@/app/actions/interview'
import { SSEParser } from '@/features/chat/utils/sse-parser'
import { StreamBuffer } from '@/features/chat/utils/stream-buffer'

interface InterviewState {
  interviews: InterviewData[]
  currentInterview: InterviewData | null
  interviewsLoading: boolean
  currentInterviewLoading: boolean
  hasInitiallyLoaded: boolean
  streamingMessageId: string | null
  streamingPhase: 'idle' | 'thinking' | 'answering'
  abortController: AbortController | null
  loadInterviews: () => Promise<void>
  loadInterview: (id: string) => Promise<InterviewData | null>
  createInterview: (input: CreateInterviewData) => Promise<string>
  startInterview: (id: string) => Promise<void>
  submitInterviewAnswer: (id: string, content: string) => Promise<void>
  startInterviewStream: (id: string) => Promise<void>
  submitInterviewAnswerStream: (id: string, content: string) => Promise<void>
  abortStream: () => void
  reset: () => void
}

const initialState = {
  interviews: [],
  currentInterview: null,
  interviewsLoading: false,
  currentInterviewLoading: false,
  hasInitiallyLoaded: false,
  streamingMessageId: null,
  streamingPhase: 'idle' as const,
  abortController: null,
}

function mergeInterview(interviews: InterviewData[], updatedInterview: InterviewData) {
  return interviews.map((interview) =>
    interview.id === updatedInterview.id ? updatedInterview : interview
  )
}

function createOptimisticMessage(role: 'assistant' | 'user', content: string): InterviewMessageData {
  return {
    id: `optimistic-${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}

function appendMessage(interview: InterviewData | null, message: InterviewMessageData) {
  if (!interview) return interview

  return {
    ...interview,
    status: 'in_progress',
    messages: [...interview.messages, message],
  }
}

function updateMessageContent(
  interview: InterviewData | null,
  messageId: string,
  appendContent: string
) {
  if (!interview) return interview

  return {
    ...interview,
    messages: interview.messages.map((message) =>
      message.id === messageId
        ? { ...message, content: `${message.content}${appendContent}` }
        : message
    ),
  }
}

async function parseErrorResponse(response: Response, fallback: string) {
  try {
    const body = await response.json()
    return typeof body.error === 'string' ? body.error : fallback
  } catch {
    return fallback
  }
}

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,

  loadInterviews: async () => {
    set({ interviewsLoading: true })
    try {
      const result = await getInterviews()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load interviews.')
      }
      set({
        interviews: result.data,
        interviewsLoading: false,
        hasInitiallyLoaded: true,
      })
    } catch (error) {
      console.error('[InterviewStore] loadInterviews failed:', error)
      set({ interviewsLoading: false, hasInitiallyLoaded: true })
    }
  },

  loadInterview: async (id: string) => {
    set({ currentInterviewLoading: true })
    try {
      const result = await getInterviewById(id)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load interview.')
      }
      set({ currentInterview: result.data, currentInterviewLoading: false })
      return result.data
    } catch (error) {
      console.error('[InterviewStore] loadInterview failed:', error)
      set({ currentInterview: null, currentInterviewLoading: false })
      return null
    }
  },

  createInterview: async (input) => {
    const result = await createInterviewAction(input)
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create interview.')
    }

    set((state) => ({
      interviews: [result.data!, ...state.interviews],
      currentInterview: result.data!,
    }))

    return result.data.id
  },

  startInterview: async (id) => {
    const result = await startInterviewAction(id)
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to start interview.')
    }

    set((state) => ({
      currentInterview: result.data!,
      interviews: mergeInterview(state.interviews, result.data!),
    }))
  },

  submitInterviewAnswer: async (id, content) => {
    const result = await submitInterviewAnswerAction(id, content)
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to submit answer.')
    }

    set((state) => ({
      currentInterview: result.data!,
      interviews: mergeInterview(state.interviews, result.data!),
    }))
  },

  startInterviewStream: async (id) => {
    const controller = new AbortController()
    const assistantMessage = createOptimisticMessage('assistant', '')

    set((state) => ({
      currentInterview: appendMessage(state.currentInterview, assistantMessage),
      streamingMessageId: assistantMessage.id,
      streamingPhase: 'thinking',
      abortController: controller,
    }))

    const buffer = new StreamBuffer({
      onFlush: (chunk) => {
        set((state) => ({
          currentInterview: updateMessageContent(
            state.currentInterview,
            assistantMessage.id,
            chunk
          ),
        }))
      },
    })

    try {
      const response = await fetch(`/api/interviews/${id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response, 'Failed to start interview.'))
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No interview stream available.')
      }

      await SSEParser.parseStream(reader, {
        onData: (data) => {
          if (data.type === 'answer' && data.content) {
            set({ streamingPhase: 'answering' })
            buffer.append(data.content)
          }
        },
      })

      buffer.forceFlush()
      await useInterviewStore.getState().loadInterview(id)
    } catch (error) {
      buffer.forceFlush()
      if (!(error instanceof Error && error.name === 'AbortError')) {
        set((state) => ({
          currentInterview: state.currentInterview
            ? {
                ...state.currentInterview,
                messages: state.currentInterview.messages.filter(
                  (message) => message.id !== assistantMessage.id
                ),
              }
            : null,
        }))
        throw error
      }
    } finally {
      buffer.destroy()
      set({ streamingMessageId: null, streamingPhase: 'idle', abortController: null })
    }
  },

  submitInterviewAnswerStream: async (id, content) => {
    const answer = content.trim()
    if (!answer) {
      throw new Error('Answer is required.')
    }

    const controller = new AbortController()
    const userMessage = createOptimisticMessage('user', answer)
    const assistantMessage = createOptimisticMessage('assistant', '')

    set((state) => ({
      currentInterview: appendMessage(appendMessage(state.currentInterview, userMessage), assistantMessage),
      streamingMessageId: assistantMessage.id,
      streamingPhase: 'thinking',
      abortController: controller,
    }))

    const buffer = new StreamBuffer({
      onFlush: (chunk) => {
        set((state) => ({
          currentInterview: updateMessageContent(
            state.currentInterview,
            assistantMessage.id,
            chunk
          ),
        }))
      },
    })

    try {
      const response = await fetch(`/api/interviews/${id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'answer', content: answer }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response, 'Failed to submit answer.'))
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No interview stream available.')
      }

      await SSEParser.parseStream(reader, {
        onData: (data) => {
          if (data.type === 'answer' && data.content) {
            set({ streamingPhase: 'answering' })
            buffer.append(data.content)
          }
        },
      })

      buffer.forceFlush()
      await useInterviewStore.getState().loadInterview(id)
    } catch (error) {
      buffer.forceFlush()
      if (!(error instanceof Error && error.name === 'AbortError')) {
        set((state) => ({
          currentInterview: state.currentInterview
            ? {
                ...state.currentInterview,
                messages: state.currentInterview.messages.filter(
                  (message) =>
                    message.id !== userMessage.id && message.id !== assistantMessage.id
                ),
              }
            : null,
        }))
        throw error
      }
    } finally {
      buffer.destroy()
      set({ streamingMessageId: null, streamingPhase: 'idle', abortController: null })
    }
  },

  abortStream: () => {
    const controller = useInterviewStore.getState().abortController
    controller?.abort()
    set({ streamingMessageId: null, streamingPhase: 'idle', abortController: null })
  },

  reset: () => set(initialState),
}))
