/**
 * SSE 响应工具：把一个异步生产过程包装成 text/event-stream 响应。
 * 事件统一为 JSON：{ type: 'delta' | 'message_done' | 'stage' | 'error' | 'done', ... }
 */

export type SseEvent =
  | { type: 'delta'; text: string }
  | {
      type: 'message_done'
      messageId: string
      kind: string
      questionIndex: number
      content: string
    }
  | { type: 'stage'; stage: string; questionIndex?: number }
  | { type: 'error'; message: string }
  | { type: 'done' }

export function sseResponse(
  producer: (emit: (event: SseEvent) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: SseEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      try {
        await producer(emit)
        emit({ type: 'done' })
      } catch (err) {
        emit({
          type: 'error',
          message: err instanceof Error ? err.message : '服务器内部错误',
        })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
