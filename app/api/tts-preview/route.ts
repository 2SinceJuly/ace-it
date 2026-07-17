import { NextResponse } from 'next/server'

export const maxDuration = 60

/**
 * 落地页「面试官语音预览」专用端点。
 *
 * 与 /api/tts 的区别：
 * - 不接受任何用户输入，只合成下面这一句固定的演示问题，因此可以对未登录访客开放；
 * - 结果在模块级缓存，同一实例只调用一次 DashScope；
 * - 现有 /api/tts 的鉴权与行为完全不变。
 */
const PREVIEW_TEXT =
  '我看到你在简历中提到使用 Next.js 实现服务端渲染。你当时为什么选择这个方案？'

let cachedAudio: ArrayBuffer | null = null

export async function GET() {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TTS 未配置' }, { status: 503 })

  if (cachedAudio) {
    return new Response(cachedAudio.slice(0), {
      headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' },
    })
  }

  try {
    const res = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen3-tts-flash',
          input: { text: PREVIEW_TEXT, voice: 'Cherry', language_type: 'Chinese' },
        }),
      },
    )
    if (!res.ok) {
      const detail = await res.text()
      console.error('[tts-preview] DashScope error:', res.status, detail.slice(0, 300))
      return NextResponse.json({ error: '语音合成失败' }, { status: 502 })
    }
    const data = (await res.json()) as { output?: { audio?: { url?: string } } }
    const url = data.output?.audio?.url
    if (!url) return NextResponse.json({ error: '语音合成结果异常' }, { status: 502 })

    const audioRes = await fetch(url.replace(/^http:\/\//, 'https://'))
    if (!audioRes.ok) {
      return NextResponse.json({ error: '音频下载失败' }, { status: 502 })
    }
    cachedAudio = await audioRes.arrayBuffer()
    return new Response(cachedAudio.slice(0), {
      headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, max-age=3600' },
    })
  } catch (err) {
    console.error('[tts-preview] request failed:', err)
    return NextResponse.json({ error: '语音合成失败' }, { status: 502 })
  }
}
