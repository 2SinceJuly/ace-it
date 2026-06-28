'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, Bot, FileText, Flag, Loader2, Send, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/features/interview/store/interview.store'
import { MessageContent } from '@/features/chat/components/MessageContent'

interface InterviewRoomProps {
  interviewId: string
}

const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const statusLabels: Record<string, string> = {
  draft: '未开始',
  in_progress: '进行中',
  completed: '已完成',
}

function summarizeMaterial(content: string) {
  const compact = content.replace(/\s+/g, ' ').trim()
  if (compact.length <= 360) return compact
  return `${compact.slice(0, 360)}...`
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const router = useRouter()
  const interview = useInterviewStore((state) => state.currentInterview)
  const isLoading = useInterviewStore((state) => state.currentInterviewLoading)
  const loadInterview = useInterviewStore((state) => state.loadInterview)
  const startInterviewStream = useInterviewStore((state) => state.startInterviewStream)
  const submitInterviewAnswerStream = useInterviewStore((state) => state.submitInterviewAnswerStream)
  const abortStream = useInterviewStore((state) => state.abortStream)
  const completeInterview = useInterviewStore((state) => state.completeInterview)
  const isCompleting = useInterviewStore((state) => state.isCompleting)
  const streamingMessageId = useInterviewStore((state) => state.streamingMessageId)
  const streamingPhase = useInterviewStore((state) => state.streamingPhase)
  const [answer, setAnswer] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)

  useEffect(() => {
    loadInterview(interviewId)
    // 离开页面时中止正在进行的流式请求，避免内存泄漏和服务端继续消耗配额
    return () => {
      abortStream()
    }
  }, [interviewId, loadInterview, abortStream])

  const messageScrollKey = useMemo(
    () => interview?.messages.map((message) => `${message.id}:${message.content.length}`).join('|') || '',
    [interview?.messages]
  )

  useLayoutEffect(() => {
    const viewport = messagesViewportRef.current
    if (!viewport || !shouldStickToBottomRef.current) return

    viewport.scrollTop = viewport.scrollHeight
  }, [messageScrollKey, streamingPhase])

  const handleMessagesScroll = () => {
    const viewport = messagesViewportRef.current
    if (!viewport) return

    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 96
  }

  const handleStartInterview = async () => {
    if (isStarting) return

    setError(null)
    setIsStarting(true)

    try {
      await startInterviewStream(interviewId)
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Failed to start interview.')
    } finally {
      setIsStarting(false)
    }
  }

  const handleSubmitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || !answer.trim()) return

    setError(null)
    setIsSubmitting(true)

    try {
      await submitInterviewAnswerStream(interviewId, answer)
      setAnswer('')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit answer.')
      await loadInterview(interviewId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteInterview = async () => {
    if (isCompleting) return
    setError(null)
    setIsSubmitting(true) // 复用 submitting 状态显示加载，避免新增 UI 状态

    try {
      const completed = await completeInterview(interviewId)
      if (!completed) {
        setError('结束面试失败，请重试。')
      }
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : '结束面试失败，请重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[560px] items-center justify-center text-[#667085]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        正在加载面试...
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex min-h-[560px] items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-[24px]">
          <CardHeader>
            <CardTitle>面试不存在</CardTitle>
            <CardDescription>这场面试可能已被删除，或当前账号无法访问。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/interviews')}>
              返回模拟面试
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const material = interview.materials[0]?.content || ''
  const hasMessages = interview.messages.length > 0
  const isBusy = isStarting || isSubmitting || isCompleting
  const isCompleted = interview.status === 'completed'
  const isStreaming = streamingMessageId !== null

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex shrink-0 flex-col gap-4 rounded-[24px] border-2 border-[#111318] bg-[#fffdf8] p-5 shadow-[4px_4px_0_rgba(17,19,24,0.10)] md:p-6">
        <Button variant="ghost" className="w-fit rounded-full text-[#4f4a43] hover:bg-[#f1ebe1] hover:text-[#111318]" onClick={() => router.push('/interviews')}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{interview.position}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="rounded-full border border-[#111318] bg-[#fff7e8] text-[#111318] hover:bg-[#fff7e8]">
                {difficultyLabels[interview.difficulty] || interview.difficulty}
              </Badge>
              <Badge
                className={cn(
                  'rounded-full hover:bg-opacity-100',
                  isCompleted
                    ? 'border border-[#111318] bg-[#e8f5df] text-[#111318] hover:bg-[#e8f5df]'
                    : 'border border-[#ded8cf] bg-white text-[#4f4a43] hover:bg-white'
                )}
              >
                {statusLabels[interview.status] || interview.status}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleStartInterview}
              disabled={isBusy || hasMessages || isCompleted}
              className="h-12 rounded-full bg-[#111318] px-6 text-white hover:bg-[#2a2d33]"
            >
              {isStarting && <Loader2 className="h-4 w-4 animate-spin" />}
              Start AI interview
            </Button>
            {hasMessages && !isCompleted && (
              <Button
                onClick={handleCompleteInterview}
                disabled={isBusy || isStreaming}
                variant="outline"
                className="h-12 rounded-full border-2 border-[#ef745d] bg-[#fffdf8] px-6 text-[#b83f2b] hover:bg-[#fff0eb] hover:text-[#8f2d1e]"
              >
                {isCompleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
                结束面试
              </Button>
            )}
            {isCompleted && (
              <Button
                onClick={() => router.push(`/interviews/report/${interviewId}`)}
                className="h-12 rounded-full bg-[#111318] px-6 text-white hover:bg-[#2a2d33]"
              >
                查看报告
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[18px] border-2 border-[#d92d20] bg-[#fff1ed] px-4 py-3 text-sm text-[#9b241c]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="flex min-h-0 flex-col rounded-[24px] border-2 border-[#111318] bg-[#fffdf8] shadow-none">
            <CardHeader className="shrink-0 border-b-2 border-[#111318]">
              <CardTitle className="text-xl">面试对话</CardTitle>
              <CardDescription>AI 会根据你的回答继续点评和追问。</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-5">
              {!hasMessages ? (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-[22px] border-2 border-dashed border-[#d7d0c6] bg-[#fbfaf8] px-6 text-center text-sm text-[#5d574f]">
                  {isStarting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在生成第一题...
                    </span>
                  ) : (
                    '还没有面试消息，点击右上角开始。'
                  )}
                </div>
              ) : (
                <div
                  ref={messagesViewportRef}
                  onScroll={handleMessagesScroll}
                  className="custom-scrollbar interview-message-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-2"
                >
                  {interview.messages.map((message) => {
                    const isUser = message.role === 'user'
                    const isMessageStreaming = message.id === streamingMessageId

                    return (
                      <div
                        key={message.id}
                        className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
                      >
                        {!isUser && (
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ef745d] bg-[#fff0eb] text-[#b83f2b]">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[82%] rounded-[20px] px-4 py-3 text-sm leading-6',
                            isMessageStreaming && 'min-h-24',
                            isUser
                              ? 'border-2 border-[#111318] bg-[#111318] text-white'
                              : 'border-2 border-[#111318] bg-white text-[#111318]'
                          )}
                        >
                          <div className={cn('mb-1 flex items-center justify-between gap-3 text-xs', isUser ? 'text-white/68' : 'text-[#6b675f]')}>
                            <span>{isUser ? '你' : '面试官'}</span>
                            <span>{formatMessageTime(message.createdAt)}</span>
                          </div>
                          {isUser ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : message.content ? (
                            <MessageContent
                              content={message.content}
                              isStreaming={isMessageStreaming}
                              disableMediaBlocks
                            />
                          ) : isMessageStreaming ? (
                            <span className="inline-flex items-center gap-2 text-[#6b675f]">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {streamingPhase === 'thinking'
                                ? '正在思考...'
                                : '正在输出...'}
                            </span>
                          ) : null}
                        </div>
                        {isUser && (
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#111318] bg-[#fff7e8] text-[#111318]">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {hasMessages && !isCompleted && (
                <form className="shrink-0 space-y-3 border-t-2 border-[#111318] pt-4" onSubmit={handleSubmitAnswer}>
                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="输入你的回答..."
                    disabled={isBusy}
                    className={cn(
                      'min-h-28 w-full resize-y rounded-[22px] border border-[#dfe4ee] bg-[#fbfcff] px-4 py-3 text-sm shadow-sm transition-colors',
                      'border-2 border-[#111318] bg-white text-[#111318] shadow-none transition-colors',
                      'placeholder:text-[#8c867c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef745d]',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isBusy || !answer.trim()}
                      className="h-11 rounded-full bg-[#111318] px-5 text-white hover:bg-[#2a2d33]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      提交回答
                    </Button>
                  </div>
                </form>
              )}

              {isCompleted && (
                <div className="shrink-0 rounded-[18px] border-2 border-[#ded8cf] bg-[#fbfaf8] px-4 py-3 text-sm text-[#5d574f]">
                  本场面试已结束，报告不会自动生成。点击上方&ldquo;查看报告&rdquo;后可按需生成 AI 评估报告。
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col rounded-[24px] border-2 border-[#111318] bg-[#fffdf8] shadow-none">
            <CardHeader className="shrink-0 border-b-2 border-[#111318]">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                面试材料
              </CardTitle>
              <CardDescription>本场面试使用的简历、项目和 JD 摘要。</CardDescription>
            </CardHeader>
            <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
              <p className="whitespace-pre-wrap rounded-[20px] border border-[#ded8cf] bg-white p-4 text-sm leading-6 text-[#4f4a43]">
                {summarizeMaterial(material)}
              </p>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}
