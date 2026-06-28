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
  context: InterviewStreamContext
): ReadableStream {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const writer = new SSEWriter(controller, encoder, context.sessionId)
      let buffer = ''
      let answerContent = ''

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
        writer.error(error)
      }
    },
  })
}
