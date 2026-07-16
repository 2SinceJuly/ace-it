import type { SseEvent } from '@/lib/engine/sse'

/** 读取 fetch 返回的 SSE 流，逐事件回调 */
export async function readSseStream(
  res: Response,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const reader = res.body?.getReader()
  if (!reader) throw new Error('响应不包含流')
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      try {
        onEvent(JSON.parse(line.slice(6)) as SseEvent)
      } catch {
        // 忽略无法解析的事件
      }
    }
  }
}
