'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAudioRecorder } from '@/features/voice/hooks/use-audio-recorder'
import { VoiceAPI } from '@/features/voice/services/voice-api'

interface UseSpeechToTextOptions {
  onTranscript: (text: string) => void
  onError?: () => void
}

export function useSpeechToText({ onTranscript, onError }: UseSpeechToTextOptions) {
  const [isTranscribing, setIsTranscribing] = useState(false)

  const {
    isRecording,
    audioBlob,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
    cancelRecording,
    clearAudio,
  } = useAudioRecorder()

  const startRecording = useCallback(async () => {
    await startAudioRecording()
  }, [startAudioRecording])

  const stopRecording = useCallback(() => {
    stopAudioRecording()
  }, [stopAudioRecording])

  useEffect(() => {
    if (!audioBlob) return

    const transcribe = async () => {
      setIsTranscribing(true)

      try {
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        const result = await VoiceAPI.speechToText(audioFile)

        if (result.text) {
          onTranscript(result.text)
        }

        clearAudio()
      } catch {
        onError?.()
      } finally {
        setIsTranscribing(false)
      }
    }

    transcribe()
  }, [audioBlob, clearAudio, onError, onTranscript])

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
