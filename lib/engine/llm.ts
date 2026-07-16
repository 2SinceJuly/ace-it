import OpenAI from 'openai'

export const CHAT_MODEL = 'qwen-plus'

let _client: OpenAI | null = null

export function getQwen(): OpenAI {
  if (!_client) {
    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) throw new Error('DASHSCOPE_API_KEY is not set')
    _client = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  }
  return _client
}

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam

/**
 * Function Calling：强制模型调用指定函数并返回解析后的 JSON 参数。
 * 解析失败自动重试 1 次，再失败抛错由调用方兜底。
 */
export async function callFunction<T>(options: {
  messages: ChatMessage[]
  name: string
  description: string
  parameters: Record<string, unknown>
}): Promise<T> {
  const { messages, name, description, parameters } = options
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await getQwen().chat.completions.create({
        model: CHAT_MODEL,
        messages,
        tools: [
          {
            type: 'function',
            function: { name, description, parameters },
          },
        ],
        tool_choice: { type: 'function', function: { name } },
      })
      const call = res.choices[0]?.message?.tool_calls?.[0]
      if (!call || call.type !== 'function') throw new Error('模型未返回函数调用')
      return JSON.parse(call.function.arguments) as T
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

/** 流式对话：返回增量文本的异步迭代器 */
export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const stream = await getQwen().chat.completions.create({
    model: CHAT_MODEL,
    messages,
    stream: true,
  })
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) yield delta
  }
}
