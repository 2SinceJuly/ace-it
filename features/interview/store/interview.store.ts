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
} from '@/app/actions/interview'

interface InterviewState {
  interviews: InterviewData[]
  currentInterview: InterviewData | null
  interviewsLoading: boolean
  currentInterviewLoading: boolean
  hasInitiallyLoaded: boolean
  loadInterviews: () => Promise<void>
  loadInterview: (id: string) => Promise<InterviewData | null>
  createInterview: (input: CreateInterviewData) => Promise<string>
  startInterview: (id: string) => Promise<void>
  submitInterviewAnswer: (id: string, content: string) => Promise<void>
  reset: () => void
}

const initialState = {
  interviews: [],
  currentInterview: null,
  interviewsLoading: false,
  currentInterviewLoading: false,
  hasInitiallyLoaded: false,
}

function mergeInterview(interviews: InterviewData[], updatedInterview: InterviewData) {
  return interviews.map((interview) =>
    interview.id === updatedInterview.id ? updatedInterview : interview
  )
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

  reset: () => set(initialState),
}))
