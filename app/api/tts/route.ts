import { NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/auth/session'

export const maxDuration = 60

/**
 * Qwen3-TTS 语音合成：输入文本，返回音频 URL（DashScope 生成，24 小时有效）。
 * 前端拿到 URL 后用 <audio> 播放。
 */
export async function POST(req: Request) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { text?: string } | null
  const text = body?.text?.trim()
  if (!text) return NextResponse.json({ error: '文本不能为空' }, { status: 400 })
  if (text.length > 2000) {
    return NextResponse.json({ error: '文本过长' }, { status: 400 })
  }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TTS 未配置' }, { status: 500 })

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
          input: {
            text,
            voice: 'Cherry',
            language_type: 'Chinese',
          },
        }),
      },
    )
    if (!res.ok) {
      const detail = await res.text()
      console.error('[tts] DashScope error:', res.status, detail.slice(0, 300))
      return NextResponse.json({ error: '语音合成失败' }, { status: 502 })
    }
    const data = (await res.json()) as {
      output?: { audio?: { url?: string } }
    }
    const url = data.output?.audio?.url
    if (!url) return NextResponse.json({ error: '语音合成结果异常' }, { status: 502 })

    // OSS 返回的是 http:// 链接，明文请求会被出口策略/混合内容拦截，
    // 统一升级为 https 后由服务端拉取音频字节透传给前端。
    const audioRes = await fetch(url.replace(/^http:\/\//, 'https://'))
    if (!audioRes.ok || !audioRes.body) {
      return NextResponse.json({ error: '音频下载失败' }, { status: 502 })
    }
    return new Response(audioRes.body, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[tts] request failed:', err)
    return NextResponse.json({ error: '语音合成失败' }, { status: 502 })
  }
}
