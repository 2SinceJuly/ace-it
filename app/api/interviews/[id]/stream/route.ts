import { getCurrentUserId } from '@/server/auth/utils'
import { UserRepository } from '@/server/repositories/user.repository'
import {
  handleInterviewStreamRequest,
  InterviewStreamNotFoundError,
  type InterviewStreamAction,
} from '@/server/services/interview/interview-stream.service'

const API_KEY_ERROR =
  'API Key not configured. Please set your SiliconFlow API Key in your profile or contact administrator.'

interface RouteContext {
  params: Promise<{ id: string }>
}

function isInterviewStreamAction(value: unknown): value is InterviewStreamAction {
  return value === 'start' || value === 'answer'
}

export async function POST(req: Request, context: RouteContext) {
  let userId: string

  try {
    userId = await getCurrentUserId()
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await UserRepository.findById(userId)
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  const apiKey = user.apiKey || process.env.SILICONFLOW_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: API_KEY_ERROR }, { status: 400 })
  }

  const { id } = await context.params
  const body = await req.json()

  if (!isInterviewStreamAction(body.action)) {
    return Response.json({ error: 'Invalid interview stream action.' }, { status: 400 })
  }

  try {
    const { stream, sessionId, interviewId } = await handleInterviewStreamRequest(
      userId,
      apiKey,
      id,
      {
        action: body.action,
        content: body.content,
        enableThinking: body.enableThinking === true,
        enableWebSearch: body.enableWebSearch === true,
      },
      { abortSignal: req.signal }
    )

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Session-ID': sessionId,
        'X-Interview-ID': interviewId,
      },
    })
  } catch (error) {
    if (error instanceof InterviewStreamNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 })
    }

    const message = error instanceof Error ? error.message : 'Failed to stream interview.'
    console.error('[InterviewStreamRoute] failed:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
