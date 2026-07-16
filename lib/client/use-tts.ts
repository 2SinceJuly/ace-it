'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 面试官语音播报：调用 /api/tts 合成音频并播放。
 * 合成失败静默降级为纯文字，不影响面试流程。
 */
export function useTts() {
  const [enabled, setEnabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (!enabledRef.current || !text.trim()) return
      stop()
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (!res.ok) return
        const blob = await res.blob()
        if (!enabledRef.current) return
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          setSpeaking(false)
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          setSpeaking(false)
        }
        setSpeaking(true)
        await audio.play().catch(() => setSpeaking(false))
      } catch {
        setSpeaking(false)
      }
    },
    [stop],
  )

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) stop()
      return !prev
    })
  }, [stop])

  useEffect(() => stop, [stop])

  return { enabled, speaking, speak, stop, toggle }
}
