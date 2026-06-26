'use client'

import { create } from 'zustand'
import {
  createInterview as createInterviewAction,
  getInterviewById,
  getInterviews,
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
  reset: () => void
}

const initialState = {
  interviews: [],
  currentInterview: null,
  interviewsLoading: false,
  currentInterviewLoading: false,
  hasInitiallyLoaded: false,
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

  reset: () => set(initialState),
}))
