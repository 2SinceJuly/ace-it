/**
 * SiliconFlow AI API 封装
 * 
 * 负责与 SiliconFlow API 的通信
 */

import { getDefaultModel, getModelById } from '@/features/chat/constants/models'

const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  model: string
  messages: ChatMessage[]
  enableThinking?: boolean
  thinkingBudget?: number
  tools?: unknown[]
  toolChoice?: 'auto' | 'required' | { type: 'function'; function: { name: string } }
}

export interface SiliconFlowResponse {
  reader: ReadableStreamDefaultReader<Uint8Array>
}

/**
 * 调用 SiliconFlow Chat Completion API（流式）
 */
export async function createChatCompletion(
  apiKey: string,
  options: ChatCompletionOptions
): Promise<SiliconFlowResponse> {
  const { model, messages, enableThinking = false, thinkingBudget = 4096, tools, toolChoice } = options

  const buildRequestBody = (candidateModel: string) => {
    const modelInfo = getModelById(candidateModel)

    const requestBody: Record<string, unknown> = {
      model: candidateModel,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: enableThinking || modelInfo?.isReasoningModel ? 4096 : 1024,
    }

    if (modelInfo?.isReasoningModel) {
      requestBody.thinking_budget = thinkingBudget
    } else if (enableThinking && modelInfo?.supportsThinkingToggle) {
      requestBody.enable_thinking = true
      requestBody.thinking_budget = thinkingBudget
    }

    if (tools && Array.isArray(tools) && tools.length > 0) {
      requestBody.tools = tools
      requestBody.tool_choice = toolChoice || 'auto'
    }

    return requestBody
  }

  const preferredModel = model || getDefaultModel().id
  const candidateModels = Array.from(new Set([
    preferredModel,
    'Qwen/Qwen2.5-7B-Instruct',
    'Qwen/Qwen2.5-14B-Instruct',
    'Qwen/Qwen2.5-32B-Instruct',
    'deepseek-ai/DeepSeek-V3.2',
  ]))

  let lastError: string | null = null

  for (const candidateModel of candidateModels) {
    const requestBody = buildRequestBody(candidateModel)

    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (response.ok) {
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No stream available')
      }

      return { reader }
    }

    const errorText = await response.text()
    lastError = `${response.status} - ${errorText}`

    const isModelDisabled = errorText.includes('Model disabled') || errorText.includes('model disabled')
    const shouldRetry = candidateModel !== candidateModels[candidateModels.length - 1] && (
      isModelDisabled || response.status === 404 || response.status === 400 || errorText.toLowerCase().includes('model')
    )

    if (!shouldRetry) {
      break
    }
  }

  throw new Error(`SiliconFlow API error: ${lastError || 'Unknown error'}`)
}
