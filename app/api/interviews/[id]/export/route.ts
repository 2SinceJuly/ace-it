import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/server/auth/utils'
import { MarkdownExporter } from '@/server/services/export/markdown-exporter'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'markdown'

    if (format !== 'markdown') {
      return NextResponse.json(
        { error: 'Only markdown format is supported currently' },
        { status: 400 }
      )
    }

    const exporter = new MarkdownExporter()
    const markdown = await exporter.exportInterview(id, userId)

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="interview-${id}.md"; filename*=UTF-8''interview-${id}.md`,
      },
    })
  } catch (error) {
    console.error('Interview export error:', error)

    if (error instanceof Error && error.message === 'Interview not found') {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
