import { parseSSELine, splitSSEBuffer } from '@/lib/utils/sse'
import { InterviewRepository } from '@/server/repositories/interview.repository'
import { SSEWriter } from '@/server/services/chat/sse-writer'

export interface InterviewStreamContext {
  interviewId: string
  userId: string
  sessionId: string
}

interface SiliconFlowStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string
      reasoning_content?: string
    }
  }>
}

export function createInterviewSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  context: InterviewStreamContext,
  options?: { abortSignal?: AbortSignal }
): ReadableStream {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const abortSignal = options?.abortSignal

  return new ReadableStream({
    async start(controller) {
      const writer = new SSEWriter(controller, encoder, context.sessionId)
      let buffer = ''
      let answerContent = ''

      // 当客户端断开连接时取消上游 reader 并关闭 SSE 流
      const onAbort = () => {
        reader.cancel().catch(() => {
          /* reader 已经关闭，忽略 */
        })
        writer.close()
      }

      if (abortSignal) {
        if (abortSignal.aborted) {
          onAbort()
          return
        }
        abortSignal.addEventListener('abort', onAbort, { once: true })
      }

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            const finalContent = answerContent.trim()
            if (!finalContent) {
              throw new Error('AI did not return interview content.')
            }

            await InterviewRepository.addAssistantReplyAndMarkInProgress(
              context.interviewId,
              context.userId,
              finalContent
            )

            writer.sendComplete()
            writer.close()
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const { lines, remaining } = splitSSEBuffer(buffer)
          buffer = remaining

          for (const line of lines) {
            const data = parseSSELine(line)
            if (!data) continue

            try {
              const parsed = JSON.parse(data) as SiliconFlowStreamChunk
              const delta = parsed.choices?.[0]?.delta

              if (delta?.reasoning_content) {
                writer.sendThinking(delta.reasoning_content)
              }

              if (delta?.content) {
                answerContent += delta.content
                writer.sendAnswer(delta.content)
              }
            } catch {
              // Ignore malformed stream fragments and keep reading.
            }
          }
        }
      } catch (error) {
        // 客户端主动断开（AbortError）时不上报错误，直接关闭
        if (error instanceof Error && error.name === 'AbortError') {
          writer.close()
          return
        }
        writer.error(error)
      } finally {
        if (abortSignal) {
          abortSignal.removeEventListener('abort', onAbort)
        }
      }
    },
  })
}
