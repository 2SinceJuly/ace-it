/**
 * 文件上传 API
 * POST /api/upload - 上传文件并读取内容
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import path from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { getCurrentUserId } from '@/server/auth/utils'
import { prisma } from '@/server/db/client'

const CHAT_MAX_SIZE = 1024 * 1024
const INTERVIEW_MATERIAL_MAX_SIZE = 5 * 1024 * 1024
const INTERVIEW_MATERIAL_DIR = 'public/generated/interview-materials'
const INTERVIEW_MATERIAL_URL_PREFIX = '/generated/interview-materials'

type InterviewMaterialType = 'resume' | 'project'

function getExtension(fileName: string) {
  return path.extname(fileName).toLowerCase()
}

function isValidChatFile(file: File) {
  const validTypes = ['text/plain', 'text/markdown']
  const validExtensions = ['.txt', '.md']
  return validTypes.includes(file.type) || validExtensions.includes(getExtension(file.name))
}

function isValidInterviewMaterial(file: File, materialType: InterviewMaterialType) {
  const extension = getExtension(file.name)

  if (materialType === 'resume') {
    return extension === '.pdf' || file.type === 'application/pdf'
  }

  return ['.pdf', '.md', '.txt'].includes(extension) ||
    ['application/pdf', 'text/markdown', 'text/plain'].includes(file.type)
}

function normalizeMaterialType(value: FormDataEntryValue | null): InterviewMaterialType | null {
  return value === 'resume' || value === 'project' ? value : null
}

async function handleInterviewMaterialUpload(file: File, userId: string, formData: FormData) {
  const materialType = normalizeMaterialType(formData.get('materialType'))

  if (!materialType) {
    return NextResponse.json(
      { error: 'Invalid material type. Use resume or project.' },
      { status: 400 }
    )
  }

  if (!isValidInterviewMaterial(file, materialType)) {
    return NextResponse.json(
      {
        error:
          materialType === 'resume'
            ? 'Invalid file type. Resume material only supports PDF.'
            : 'Invalid file type. Project material supports PDF, MD, and TXT.',
      },
      { status: 400 }
    )
  }

  if (file.size > INTERVIEW_MATERIAL_MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5MB.' },
      { status: 400 }
    )
  }

  const extension = getExtension(file.name)
  const storedName = `${Date.now()}-${randomUUID()}${extension || '.bin'}`
  const storagePath = path.join(INTERVIEW_MATERIAL_DIR, storedName)
  const absolutePath = path.join(process.cwd(), storagePath)
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, buffer)

  const materialFile = await prisma.interviewMaterialFile.create({
    data: {
      userId,
      materialType,
      originalName: file.name,
      storedName,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      url: `${INTERVIEW_MATERIAL_URL_PREFIX}/${storedName}`,
      storagePath,
    },
  })

  return NextResponse.json({
    id: materialFile.id,
    materialType: materialFile.materialType,
    name: materialFile.originalName,
    mimeType: materialFile.mimeType,
    size: materialFile.size,
    url: materialFile.url,
    createdAt: materialFile.createdAt.toISOString(),
  })
}

export async function POST(req: Request) {
  try {
    // 验证用户身份
    const userId = await getCurrentUserId()

    const formData = await req.formData()
    const file = formData.get('file') as File
    const purpose = formData.get('purpose')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (purpose === 'interview-material') {
      return handleInterviewMaterialUpload(file, userId, formData)
    }

    // 验证文件类型
    if (!isValidChatFile(file)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .txt and .md files are supported.' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大 1MB）
    if (file.size > CHAT_MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 1MB.' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const content = await file.text()

    // 确定文件类型
    const fileType = getExtension(file.name) === '.md' ? 'md' : 'txt'

    // 返回文件信息
    return NextResponse.json({
      name: file.name,
      type: fileType,
      size: file.size,
      content,
    })
  } catch (error) {
    console.error('Upload error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
