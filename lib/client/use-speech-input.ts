'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 基于浏览器 Web Speech Recognition 的语音输入。
 * - 实时把识别结果（含中间结果）回填给调用方，由用户编辑后手动提交，绝不自动提交。
 * - 浏览器不支持或权限被拒绝时 supported=false / error 有值，文字输入不受影响。
 */

type SpeechRecognitionResultItem = { transcript: string }
type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: SpeechRecognitionResultItem
}
type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
type SpeechRecognitionErrorEventLike = { error: string }

type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechInput({
  onTranscript,
}: {
  /** finalText: 本次会话累计确认文本；interimText: 当前中间结果 */
  onTranscript: (finalText: string, interimText: string) => void
}) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalTextRef = useRef('')
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null)
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setError('当前浏览器不支持语音识别，请直接输入文字')
      return
    }
    setError(null)
    finalTextRef.current = ''

    const recognition = new Ctor()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTextRef.current += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      onTranscriptRef.current(finalTextRef.current, interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('麦克风权限被拒绝，请使用文字输入或在浏览器设置中允许麦克风')
      } else if (event.error === 'no-speech') {
        // 无语音属于正常情况，静默处理
      } else if (event.error !== 'aborted') {
        setError('语音识别出错，请使用文字输入')
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setError('语音识别启动失败，请使用文字输入')
      setListening(false)
    }
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { supported, listening, error, start, stop, toggle }
}
