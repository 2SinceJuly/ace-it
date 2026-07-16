'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CircleNotch,
  ListDashes,
  Microphone,
  PaperPlaneRight,
  SpeakerHigh,
  SpeakerSlash,
  X,
} from '@phosphor-icons/react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { readSseStream } from '@/lib/client/sse'
import { useTts } from '@/lib/client/use-tts'
import { useSpeechInput } from '@/lib/client/use-speech-input'
import { InterviewRail, type OutlineNode } from '@/components/interview-rail'
import { BrandMark } from '@/components/brand'
import { cn } from '@/lib/utils'

export interface ChatMessage {
  id: string
  role: 'INTERVIEWER' | 'CANDIDATE'
  kind: string
  questionIndex: number
  content: string
}

interface Props {
  interviewId: string
  candidateName: string
  targetRole: string
  questionCount: number
  initialState: string
  initialQuestionIndex: number
  initialFollowUpDepth: number
  outline: OutlineNode[]
  initialMessages: ChatMessage[]
}

type Phase = 'idle' | 'streaming' | 'awaiting_answer' | 'closed' | 'error'
/** SSE stage 事件下发的真实业务子阶段 */
type SubStage = 'none' | 'evaluating' | 'follow_up' | 'question' | 'closing'

export function InterviewRoom({
  interviewId,
  candidateName,
  targetRole,
  questionCount,
  initialState,
  initialQuestionIndex,
  initialFollowUpDepth,
  outline,
  initialMessages,
}: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [streamingText, setStreamingText] = useState('')
  const [questionIndex, setQuestionIndex] = useState(initialQuestionIndex)
  const [followUpDepth, setFollowUpDepth] = useState(initialFollowUpDepth)
  const [subStage, setSubStage] = useState<SubStage>('none')
  const [phase, setPhase] = useState<Phase>(() => {
    if (initialState === 'CLOSING' || initialState === 'REPORTING') return 'closed'
    if (initialState === 'QUESTIONING') return 'awaiting_answer'
    return 'idle'
  })
  const [input, setInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [transcriptEditable, setTranscriptEditable] = useState(false)
  const startedRef = useRef(false)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const tts = useTts()

  // 语音回答：识别结果实时回填 textarea，用户可编辑后手动提交，不自动提交
  const speechBaseRef = useRef('')
  const speech = useSpeechInput({
    onTranscript: (finalText, interimText) => {
      setInput(speechBaseRef.current + finalText + interimText)
    },
  })
  const toggleSpeech = useCallback(() => {
    if (!speech.listening) {
      // 记录开始识别时已有的文字，识别内容追加在其后
      speechBaseRef.current = input ? `${input}` : ''
      setTranscriptEditable(false)
    } else {
      setTranscriptEditable(true)
    }
    speech.toggle()
  }, [speech, input])

  // 虚拟列表条目 = 消息 + （流式中）一个临时条目
  const listItems: ChatMessage[] = streamingText
    ? [
        ...messages,
        {
          id: 'streaming',
          role: 'INTERVIEWER' as const,
          kind: 'STREAMING',
          questionIndex,
          content: streamingText,
        },
      ]
    : messages

  useEffect(() => {
    virtuosoRef.current?.scrollToIndex({ index: 'LAST', behavior: 'auto', align: 'end' })
  }, [listItems.length, streamingText])

  const consumeStream = useCallback(
    async (res: Response) => {
      setPhase('streaming')
      setStreamingText('')
      let finalKind = ''
      const spokenTexts: string[] = []
      await readSseStream(res, (event) => {
        if (event.type === 'delta') {
          setStreamingText((prev) => prev + event.text)
        } else if (event.type === 'stage') {
          setSubStage(event.stage as SubStage)
        } else if (event.type === 'message_done') {
          finalKind = event.kind
          spokenTexts.push(event.content)
          setStreamingText('')
          setMessages((prev) => [
            ...prev,
            {
              id: event.messageId,
              role: 'INTERVIEWER',
              kind: event.kind,
              questionIndex: event.questionIndex,
              content: event.content,
            },
          ])
          setQuestionIndex(event.questionIndex)
          // 追问深度跟随真实消息类型：追问 +1，新主问题归零
          if (event.kind === 'FOLLOW_UP') {
            setFollowUpDepth((d) => Math.min(2, d + 1))
          } else if (event.kind === 'QUESTION') {
            setFollowUpDepth(0)
          }
        } else if (event.type === 'error') {
          setErrorMsg(event.message)
          setPhase('error')
        }
      })
      setStreamingText('')
      setSubStage('none')
      if (spokenTexts.length > 0) {
        // 一次 SSE 可能包含多段发言（如开场白+第一题），合并成一次播报
        tts.speak(spokenTexts.join('\n'))
      }
      if (finalKind === 'CLOSING') {
        setPhase('closed')
      } else if (finalKind) {
        setPhase('awaiting_answer')
      }
    },
    [tts],
  )

  // 首次进入且面试未开始：自动触发开场
  useEffect(() => {
    if (initialState !== 'CREATED' || startedRef.current) return
    startedRef.current = true
    ;(async () => {
      try {
        const res = await fetch(`/api/interviews/${interviewId}/start`, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setErrorMsg(data?.error ?? '面试启动失败')
          setPhase('error')
          return
        }
        await consumeStream(res)
      } catch {
        setErrorMsg('网络异常，请刷新重试')
        setPhase('error')
      }
    })()
  }, [initialState, interviewId, consumeStream])

  const submitAnswer = useCallback(async () => {
    const answer = input.trim()
    if (!answer || phase !== 'awaiting_answer') return
    if (speech.listening) speech.stop()
    setTranscriptEditable(false)
    setInput('')
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        role: 'CANDIDATE',
        kind: 'ANSWER',
        questionIndex,
        content: answer,
      },
    ])
    try {
      const res = await fetch(`/api/interviews/${interviewId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErrorMsg(data?.error ?? '提交失败')
        setPhase('error')
        return
      }
      await consumeStream(res)
    } catch {
      setErrorMsg('网络异常，请刷新重试')
      setPhase('error')
    }
  }, [input, phase, questionIndex, interviewId, consumeStream, speech])

  const generateReport = useCallback(async () => {
    setPhase('streaming')
    try {
      const res = await fetch(`/api/interviews/${interviewId}/report`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErrorMsg(data?.error ?? '报告生成失败')
        setPhase('error')
        return
      }
      router.push(`/report/${interviewId}`)
    } catch {
      setErrorMsg('网络异常，请重试')
      setPhase('error')
    }
  }, [interviewId, router])

  const greetingDone = messages.length > 0
  const live = phase === 'streaming' || tts.speaking
  const currentTopic = outline[questionIndex]

  /* ——— 暂存并返回 ———
     已提交问答与 FSM 状态均已在服务端持久化，离开页面本身即"暂存"；
     此处只负责：忙碌时禁用、有未提交输入时确认、离开前停止录音与 TTS。 */
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  // 正在提交回答 / 每轮评估 / 接收 SSE / 推进 FSM 时不允许离开
  const busy = phase === 'streaming'

  const doLeave = useCallback(() => {
    // 停止录音，不得在后台继续占用麦克风
    if (speech.listening) speech.stop()
    // 停止当前播报并丢弃待播音频，避免离开后继续出声
    tts.stop()
    router.push('/?paused=1')
  }, [speech, tts, router])

  const handleLeaveClick = useCallback(() => {
    if (busy) return
    if (input.trim()) {
      // 输入框有未提交文字：先停录音再弹确认
      if (speech.listening) speech.stop()
      setLeaveConfirmOpen(true)
      return
    }
    doLeave()
  }, [busy, input, speech, doLeave])

  /** 语音/流程状态（全部来自真实业务状态） */
  const voiceStatus: { key: string; label: string; tone: 'accent' | 'warning' | 'muted' } | null =
    (() => {
      if (subStage === 'evaluating') return { key: 'eval', label: '正在评估回答', tone: 'warning' }
      if (phase === 'streaming') return { key: 'gen', label: 'AI 正在生成', tone: 'accent' }
      if (tts.speaking) return { key: 'tts', label: 'AI 正在播报', tone: 'accent' }
      if (speech.listening) return { key: 'rec', label: '正在录音 · 实时识别', tone: 'warning' }
      if (phase === 'awaiting_answer' && transcriptEditable && input.trim())
        return { key: 'edit', label: '可修改转写结果后提交', tone: 'muted' }
      if (phase === 'awaiting_answer') return { key: 'wait', label: '等待回答', tone: 'muted' }
      return null
    })()

  const sidePanel = (
    <>
      <InterviewRail
        outline={outline}
        questionCount={questionCount}
        questionIndex={questionIndex}
        followUpDepth={followUpDepth}
        greetingDone={greetingDone}
        closed={phase === 'closed'}
        live={live}
      />
    </>
  )

  const contextPanel = (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-xs font-medium tracking-widest text-ink-muted">
          当前题目
        </p>
        {phase === 'closed' ? (
          <p className="mt-2 text-sm text-ink-muted">面试已结束，可生成报告</p>
        ) : currentTopic && greetingDone ? (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-sm font-semibold text-ink">
              <span className="font-mono text-accent-strong">Q{questionIndex + 1}</span>{' '}
              {currentTopic.topic}
            </p>
            <p className="font-mono text-xs text-ink-muted">
              难度 {currentTopic.difficulty} · 追问 {followUpDepth}/2
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">开场中…</p>
        )}
      </div>

      <hr className="border-divider" />

      <div>
        <p className="font-mono text-xs font-medium tracking-widest text-ink-muted">状态</p>
        <div className="mt-2 min-h-6" aria-live="polite">
          {voiceStatus ? (
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                voiceStatus.tone === 'accent' && 'bg-accent-soft text-accent-strong',
                voiceStatus.tone === 'warning' && 'bg-warning/10 text-warning',
                voiceStatus.tone === 'muted' && 'bg-surface-subtle text-ink-muted',
              )}
            >
              {voiceStatus.key === 'rec' ? (
                <span aria-hidden="true" className="flex h-3 items-end gap-0.5">
                  <span className="rec-bar h-full w-0.5 bg-warning" />
                  <span className="rec-bar h-full w-0.5 bg-warning" />
                  <span className="rec-bar h-full w-0.5 bg-warning" />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 rounded-full',
                    voiceStatus.tone === 'accent' && 'bg-accent-strong',
                    voiceStatus.tone === 'warning' && 'bg-warning',
                    voiceStatus.tone === 'muted' && 'bg-ink-muted',
                    (voiceStatus.key === 'gen' || voiceStatus.key === 'tts') && 'rail-breathe',
                  )}
                />
              )}
              {voiceStatus.label}
            </span>
          ) : (
            <span className="text-xs text-ink-muted">—</span>
          )}
        </div>
      </div>

      <hr className="border-divider" />

      <div>
        <p className="font-mono text-xs font-medium tracking-widest text-ink-muted">控制</p>
        <button
          type="button"
          onClick={tts.toggle}
          aria-pressed={tts.enabled}
          className="mt-2 flex w-full items-center justify-between rounded-md border border-divider px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-subtle"
        >
          <span className="flex items-center gap-2">
            {tts.enabled ? (
              <SpeakerHigh className="size-4 text-accent-strong" aria-hidden="true" />
            ) : (
              <SpeakerSlash className="size-4 text-ink-muted" aria-hidden="true" />
            )}
            语音播报
          </span>
          <span className="font-mono text-xs text-ink-muted">
            {tts.enabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-canvas" style={{ height: '100dvh' }}>
      {/* 顶栏 */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-divider bg-surface px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-serif text-sm font-semibold text-ink">
            <BrandMark />
          </span>
          <span aria-hidden="true" className="hidden text-ink-muted/50 sm:inline">
            /
          </span>
          <h1 className="hidden truncate text-sm font-medium text-ink sm:block">
            {candidateName} · {targetRole}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLeaveClick}
            disabled={busy}
            aria-label="暂存并返回创建面试页面"
            className="flex h-8 items-center gap-1.5 rounded-md border border-divider bg-transparent px-3 text-xs font-medium text-ink-muted transition-colors hover:bg-accent-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong active:bg-accent-soft/70 disabled:pointer-events-none disabled:opacity-50"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {busy ? (
              '处理中…'
            ) : (
              <>
                <span className="hidden sm:inline">暂存并返回</span>
                <span className="sm:hidden">返回</span>
              </>
            )}
          </button>
          <span className="font-mono text-xs text-ink-muted">
            {phase === 'closed'
              ? 'DONE'
              : `Q${Math.min(questionIndex + 1, questionCount)}/${questionCount}`}
          </span>
          {/* 移动端：打开进度与控制抽屉 */}
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-label="打开面试进度与控制"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-subtle lg:hidden"
          >
            <ListDashes className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 三段式工作台 */}
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[15rem_minmax(0,1fr)_17rem]">
        {/* 左：Interview Rail（桌面） */}
        <aside className="hidden overflow-y-auto border-r border-divider px-5 py-6 lg:block">
          {sidePanel}
        </aside>

        {/* 中：访谈记录 + 输入区 */}
        <section className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1" aria-live="polite">
            <Virtuoso
              ref={virtuosoRef}
              className="h-full"
              data={listItems}
              followOutput="auto"
              initialTopMostItemIndex={Math.max(listItems.length - 1, 0)}
              itemContent={(_index, m) => (
                <TranscriptRow message={m} streaming={m.id === 'streaming'} />
              )}
              components={{
                Header: () => <div className="h-5" aria-hidden="true" />,
                Footer: () => (
                  <div className="px-5 pb-5 pt-1 md:px-8">
                    {phase === 'streaming' && !streamingText && (
                      <div className="flex items-center gap-2 text-sm text-ink-muted">
                        <CircleNotch className="size-4 animate-spin" aria-hidden="true" />
                        {subStage === 'evaluating' ? '面试官正在评估你的回答…' : '面试官思考中…'}
                      </div>
                    )}
                    {phase === 'error' && (
                      <div className="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                        {errorMsg}
                      </div>
                    )}
                  </div>
                ),
              }}
            />
          </div>

          {/* ��部回答输入区：固定但不遮挡内容 */}
          <footer className="shrink-0 border-t border-divider bg-surface px-4 py-3 md:px-6">
            {phase === 'closed' ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <p className="text-sm text-ink-muted">本场面试已全部完成</p>
                <button
                  type="button"
                  onClick={generateReport}
                  className="flex h-10 items-center gap-2 rounded-md bg-accent-strong px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                >
                  生成面试报告
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      e.keyCode !== 229
                    ) {
                      e.preventDefault()
                      submitAnswer()
                    }
                  }}
                  placeholder={
                    phase === 'awaiting_answer'
                      ? '输入你的回答，Enter 发送，Shift+Enter 换行'
                      : '请等待面试官发言…'
                  }
                  disabled={phase !== 'awaiting_answer'}
                  rows={3}
                  className="w-full resize-none rounded-md border border-divider bg-canvas px-3 py-2 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-accent-strong focus-visible:ring-2 focus-visible:ring-accent-strong/30 disabled:opacity-50"
                  aria-label="回答输入框"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {speech.supported && (
                      <button
                        type="button"
                        onClick={toggleSpeech}
                        disabled={phase !== 'awaiting_answer'}
                        aria-label={speech.listening ? '停止语音输入' : '开始语音输入'}
                        aria-pressed={speech.listening}
                        className={cn(
                          'flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors disabled:opacity-50',
                          speech.listening
                            ? 'border-warning/40 bg-warning/10 text-warning'
                            : 'border-divider text-ink-muted hover:bg-surface-subtle hover:text-ink',
                        )}
                      >
                        <Microphone
                          weight={speech.listening ? 'fill' : 'regular'}
                          className="size-4"
                          aria-hidden="true"
                        />
                        {speech.listening ? '停止录音' : '语音回答'}
                      </button>
                    )}
                    {speech.error && (
                      <p className="truncate text-xs text-ink-muted" role="status">
                        {speech.error}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={phase !== 'awaiting_answer' || !input.trim()}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-accent-strong px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong disabled:pointer-events-none disabled:opacity-50"
                  >
                    <PaperPlaneRight className="size-3.5" aria-hidden="true" />
                    提交回答
                  </button>
                </div>
              </div>
            )}
          </footer>
        </section>

        {/* 右：当前题目上下文 + 语音状态 + 控制（桌面） */}
        <aside className="hidden overflow-y-auto border-l border-divider px-5 py-6 lg:block">
          {contextPanel}
        </aside>
      </div>

      {/* 移动端抽屉：Rail + 上下文 + 控制 */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="面试进度与控制">
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setPanelOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">面试进度</span>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="关闭面板"
                className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-subtle"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            {sidePanel}
            <hr className="border-divider" />
            {contextPanel}
          </div>
        </div>
      )}

      {/* 暂存并返回：未提交输入确认弹窗 */}
      {leaveConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-confirm-title"
          aria-describedby="leave-confirm-desc"
        >
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setLeaveConfirmOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="relative w-full max-w-sm rounded-lg border border-divider bg-surface p-5 shadow-xl">
            <h2 id="leave-confirm-title" className="font-serif text-base font-semibold text-ink">
              暂存并返回？
            </h2>
            <p id="leave-confirm-desc" className="mt-2 text-sm leading-relaxed text-ink-muted">
              已提交的问答和面试进度会被保留。当前输入的回答尚未提交，返回后可能丢失。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="flex h-9 items-center rounded-md bg-accent-strong px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                继续面试
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveConfirmOpen(false)
                  doLeave()
                }}
                className="flex h-9 items-center rounded-md border border-divider px-4 text-sm text-ink-muted transition-colors hover:bg-accent-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                放弃当前输入并返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 访谈记录排版：左侧说话者标识 + 右侧内容块，非聊天气泡 */
function TranscriptRow({
  message,
  streaming = false,
}: {
  message: ChatMessage
  streaming?: boolean
}) {
  const isInterviewer = message.role === 'INTERVIEWER'
  const isQuestion = message.kind === 'QUESTION' || message.kind === 'FOLLOW_UP'

  return (
    <div className="entry-rise px-5 py-2.5 md:px-8">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-4">
        <div className="pt-0.5 text-right">
          <span
            className={cn(
              'font-mono text-xs font-semibold',
              isInterviewer ? 'text-accent-strong' : 'text-ink-muted',
            )}
          >
            {isInterviewer ? '面试官' : '你'}
          </span>
          {isInterviewer && isQuestion && (
            <p className="mt-0.5 font-mono text-[10px] text-ink-muted">
              {message.kind === 'FOLLOW_UP' ? '追问' : `Q${message.questionIndex + 1}`}
            </p>
          )}
        </div>
        <div
          className={cn(
            'text-sm leading-relaxed',
            isInterviewer
              ? isQuestion || message.kind === 'STREAMING'
                ? 'rounded-md bg-surface px-4 py-3 text-ink shadow-[0_1px_2px_rgba(24,24,22,0.05)] border border-divider'
                : 'text-ink py-0.5'
              : 'border-l-2 border-divider pl-4 text-ink-muted py-0.5',
          )}
        >
          <p className="whitespace-pre-wrap">
            {message.content}
            {streaming && (
              <span
                aria-hidden="true"
                className="stream-caret ml-0.5 inline-block h-4 w-0.5 bg-accent-strong align-text-bottom"
              />
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
