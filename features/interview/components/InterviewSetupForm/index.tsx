'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModelSelector } from '@/features/chat/components/ModelSelector'
import { getDefaultModel, getModelById } from '@/features/chat/constants/models'
import { cn } from '@/lib/utils'
import { useInterviewStore } from '@/features/interview/store/interview.store'

const difficultyOptions = [
  { value: 'easy', label: '简单', description: '基础概念和经历核验' },
  { value: 'medium', label: '中等', description: '项目细节和方案取舍' },
  { value: 'hard', label: '难', description: '压力追问和边界场景' },
]

const questionCountOptions = [3, 5, 8]
const durationOptions = [15, 20, 30]

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '难',
}

const presetPositions = ['前端开发', '后端开发', '算法工程', '运维 DevOps', '测试开发']

function buildPresetContext(position: string) {
  return `岗位：${position}。请围绕该岗位的核心技能、真实项目经历、问题拆解能力和沟通表达进行模拟面试。`
}

function buildConfigContent(input: {
  questionCount: number
  durationMinutes: number
  difficulty: string
  modelId: string
}) {
  const model = getModelById(input.modelId) || getDefaultModel()

  return [
    '## 面试配置',
    `题量：${input.questionCount} 题`,
    `时长：${input.durationMinutes} 分钟`,
    `难度：${difficultyLabels[input.difficulty] || input.difficulty}`,
    `模型：${model.name}`,
    `Model ID: ${model.id}`,
  ].join('\n')
}

const uploadCards = [
  {
    type: 'resume' as const,
    title: '上传简历 PDF',
    description: '只保存 PDF 文件归属，暂不解析文件内容',
    accept: '.pdf',
  },
  {
    type: 'project' as const,
    title: '上传项目文档',
    description: '支持 PDF、Markdown 和 TXT，暂不解析文件内容',
    accept: '.pdf,.md,.txt',
  },
]

interface UploadedMaterialFile {
  id: string
  materialType: 'resume' | 'project'
  name: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

type UploadStatus =
  | { state: 'idle' }
  | { state: 'uploading'; fileName: string }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string }
  | { state: 'removed'; message: string }

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function buildUploadedFileContent(files: UploadedMaterialFile[]) {
  if (files.length === 0) return ''

  return files
    .map((file) =>
      [
        `- 文件名：${file.name}`,
        `  - 类型：${file.materialType === 'resume' ? '简历材料' : '项目材料'}`,
        `  - 大小：${formatFileSize(file.size)}`,
        `  - MIME：${file.mimeType}`,
        `  - 文件 ID：${file.id}`,
      ].join('\n')
    )
    .join('\n')
}

function buildMaterialContent(input: {
  questionCount: number
  durationMinutes: number
  difficulty: string
  modelId: string
  resumeContent: string
  projectContent: string
  jobDescription: string
  uploadedFiles: UploadedMaterialFile[]
}) {
  return [
    ['配置', buildConfigContent(input)],
    ['上传文件元信息', buildUploadedFileContent(input.uploadedFiles)],
    ['简历', input.resumeContent],
    ['项目和补充材料', input.projectContent],
    ['目标 JD / 岗位描述', input.jobDescription],
  ]
    .map(([title, content]) => {
      const trimmed = content.trim()
      return trimmed ? `## ${title}\n${trimmed}` : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

export function InterviewSetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createInterview = useInterviewStore((state) => state.createInterview)
  const [position, setPosition] = useState(searchParams.get('position') || '')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(5)
  const [durationMinutes, setDurationMinutes] = useState(20)
  const [selectedModel, setSelectedModel] = useState(getDefaultModel().id)
  const [resumeContent, setResumeContent] = useState('')
  const [projectContent, setProjectContent] = useState('')
  const [jobDescription, setJobDescription] = useState(searchParams.get('context') || '')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMaterialFile[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<Record<'resume' | 'project', UploadStatus>>({
    resume: { state: 'idle' },
    project: { state: 'idle' },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUploading = Object.values(uploadStatuses).some((status) => status.state === 'uploading')

  const handleUpload = async (
    materialType: 'resume' | 'project',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setUploadStatuses((current) => ({
      ...current,
      [materialType]: { state: 'uploading', fileName: file.name },
    }))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', 'interview-material')
      formData.append('materialType', materialType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : '上传失败。')
      }

      const uploadedFile = body as UploadedMaterialFile
      setUploadedFiles((current) => [...current, uploadedFile])
      setUploadStatuses((current) => ({
        ...current,
        [materialType]: { state: 'success', message: `${uploadedFile.name} 上传成功` },
      }))
    } catch (uploadError) {
      setUploadStatuses((current) => ({
        ...current,
        [materialType]: {
          state: 'error',
          message: uploadError instanceof Error ? uploadError.message : '上传失败。',
        },
      }))
    }
  }

  const handleRemoveUploadedFile = (fileId: string) => {
    const removedFile = uploadedFiles.find((file) => file.id === fileId)
    if (!removedFile) return

    setUploadedFiles((current) => current.filter((file) => file.id !== fileId))
    setUploadStatuses((current) => ({
      ...current,
      [removedFile.materialType]: { state: 'removed', message: `${removedFile.name} 已从本次面试移除` },
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting || isUploading) return

    setError(null)
    setIsSubmitting(true)

    try {
      const materialContent = buildMaterialContent({
        questionCount,
        durationMinutes,
        difficulty,
        modelId: selectedModel,
        resumeContent,
        projectContent,
        jobDescription,
        uploadedFiles,
      })

      if (!materialContent) {
        throw new Error('请至少填写简历、项目材料或目标 JD 中的一项。')
      }

      const interviewId = await createInterview({
        position,
        difficulty,
        materialContent,
        materialFileIds: uploadedFiles.map((file) => file.id),
      })
      router.push(`/interviews/${interviewId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '创建面试失败。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <section className="space-y-5">
        <div className="rounded-[28px] border border-[#111318] bg-[#fff7e8] p-6 shadow-[6px_6px_0_rgba(17,19,24,0.12)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#111318] bg-white text-[#111318]">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight">把这场面试先定准</h2>
          <p className="mt-3 text-sm leading-6 text-[#6b675f]">
            题量、时长和难度会写入面试上下文。AI 会按这些参数控制问题节奏，再结合简历、项目和 JD 追问。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          {uploadCards.map((item) => {
            const status = uploadStatuses[item.type]

            return (
              <label
                key={item.title}
                className="group block cursor-pointer rounded-[24px] border border-dashed border-[#d7d0c6] bg-white p-5 transition hover:border-[#111318] hover:bg-[#fbfaf8]"
              >
                <input
                  type="file"
                  accept={item.accept}
                  className="sr-only"
                  disabled={isSubmitting || isUploading}
                  onChange={(event) => handleUpload(item.type, event)}
                />
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#ffe9e4] text-[#bf4f3e]">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-[#6b675f]">{item.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                      {status.state === 'uploading' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#bf4f3e]" />
                          <span className="truncate text-[#bf4f3e]">
                            正在上传 {status.fileName}
                          </span>
                        </>
                      ) : status.state === 'success' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#26865a]" />
                          <span className="truncate text-[#26865a]">
                            {status.message}
                          </span>
                        </>
                      ) : status.state === 'error' ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="truncate text-red-600">
                            {status.message}
                          </span>
                        </>
                      ) : status.state === 'removed' ? (
                        <>
                          <X className="h-4 w-4 text-[#6b675f]" />
                          <span className="truncate text-[#6b675f]">
                            {status.message}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#bf4f3e]">点击选择文件</span>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="rounded-[24px] border border-[#d8d1c7] bg-white p-5">
            <div className="font-semibold">已上传材料</div>
            <div className="mt-3 space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-[#ece6dd] bg-[#fbfaf8] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[#111318]">{file.name}</div>
                    <div className="text-xs text-[#6b675f]">
                      {file.materialType === 'resume' ? '简历材料' : '项目材料'} · {formatFileSize(file.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || isUploading}
                    onClick={() => handleRemoveUploadedFile(file.id)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ded8cf] bg-white text-[#6b675f] transition hover:border-[#111318] hover:text-[#111318] disabled:cursor-not-allowed disabled:opacity-50"
                    title="从本次面试移除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[24px] border border-[#d8d1c7] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#ecfdf3] text-[#26865a]">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">推荐填写顺序</div>
              <div className="text-sm text-[#6b675f]">岗位、参数、JD、项目、简历</div>
            </div>
          </div>
        </div>
      </section>

      <form
        className="rounded-[28px] border border-[#111318] bg-white p-5 shadow-[7px_7px_0_rgba(17,19,24,0.1)] md:p-7"
        onSubmit={handleSubmit}
      >
        <div className="mb-7">
          <div className="mb-3 inline-flex rounded-full border border-[#ded8cf] bg-[#fbfaf8] px-3 py-1 text-xs font-medium uppercase text-[#6b675f]">
            Custom interview
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">生成新面试</h2>
          <p className="mt-2 text-sm text-[#6b675f]">材料越具体，AI 的追问越像真实面试。</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="position">岗位名称</Label>
            <Input
              id="position"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder="例如：Web 前端开发实习生"
              disabled={isSubmitting || isUploading}
              required
              className="h-12 rounded-[18px] border-[#d8d1c7] bg-[#fbfaf8]"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {presetPositions.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={isSubmitting || isUploading}
                  onClick={() => {
                    setPosition(item)
                    if (!jobDescription.trim()) {
                      setJobDescription(buildPresetContext(item))
                    }
                  }}
                  className="rounded-full border border-[#ded8cf] bg-white px-3 py-1.5 text-xs font-medium text-[#6b675f] transition hover:border-[#111318] hover:text-[#111318]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d8d1c7] bg-[#fbfaf8] p-4">
            <div className="grid gap-4 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>题量</Label>
                <div className="grid grid-cols-3 gap-2">
                  {questionCountOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isSubmitting || isUploading}
                      onClick={() => setQuestionCount(option)}
                      className={cn(
                        'h-12 rounded-[16px] border text-sm font-semibold transition',
                        questionCount === option
                          ? 'border-[#111318] bg-[#111318] text-white shadow-[3px_3px_0_rgba(239,116,93,0.5)]'
                          : 'border-[#ded8cf] bg-white text-[#6b675f] hover:border-[#111318] hover:text-[#111318]'
                      )}
                    >
                      {option} 题
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>时长</Label>
                <div className="grid grid-cols-3 gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={isSubmitting || isUploading}
                      onClick={() => setDurationMinutes(option)}
                      className={cn(
                        'h-12 rounded-[16px] border text-sm font-semibold transition',
                        durationMinutes === option
                          ? 'border-[#111318] bg-[#111318] text-white shadow-[3px_3px_0_rgba(239,116,93,0.5)]'
                          : 'border-[#ded8cf] bg-white text-[#6b675f] hover:border-[#111318] hover:text-[#111318]'
                      )}
                    >
                      {option} 分
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>难度</Label>
                <div className="grid grid-cols-3 gap-2">
                  {difficultyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isSubmitting || isUploading}
                      onClick={() => setDifficulty(option.value)}
                      className={cn(
                        'h-12 rounded-[16px] border text-sm font-semibold transition',
                        difficulty === option.value
                          ? 'border-[#111318] bg-[#111318] text-white shadow-[3px_3px_0_rgba(239,116,93,0.5)]'
                          : 'border-[#ded8cf] bg-white text-[#6b675f] hover:border-[#111318] hover:text-[#111318]'
                      )}
                      title={option.description}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[#ece6dd] bg-white px-4 py-3 text-sm text-[#6b675f] lg:flex-row lg:items-center lg:justify-between">
              <span>
                当前配置：{questionCount} 题，{durationMinutes} 分钟，难度 {difficultyLabels[difficulty]}。
              </span>
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                className="h-9 justify-start rounded-full border border-[#ded8cf] bg-[#fbfaf8] px-3 text-[#111318] hover:border-[#111318] hover:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resume">简历内容</Label>
              <textarea
                id="resume"
                value={resumeContent}
                onChange={(event) => setResumeContent(event.target.value)}
                placeholder="粘贴教育背景、实习经历、技术栈和项目职责..."
                disabled={isSubmitting || isUploading}
                className="min-h-44 w-full rounded-[18px] border border-[#d8d1c7] bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-[#8c867c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef745d] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">项目文档</Label>
              <textarea
                id="project"
                value={projectContent}
                onChange={(event) => setProjectContent(event.target.value)}
                placeholder="粘贴项目介绍、技术方案、架构说明、难点和取舍..."
                disabled={isSubmitting || isUploading}
                className="min-h-44 w-full rounded-[18px] border border-[#d8d1c7] bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-[#8c867c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef745d] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jd">目标 JD / 岗位描述</Label>
            <textarea
              id="jd"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="粘贴岗位要求、职责、技术栈和加分项..."
              disabled={isSubmitting || isUploading}
              className="min-h-40 w-full rounded-[18px] border border-[#d8d1c7] bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-[#8c867c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef745d] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isUploading} className="h-13 rounded-full bg-[#111318] px-7 text-white shadow-[4px_4px_0_rgba(239,116,93,0.55)] hover:bg-[#22252c]">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              生成面试
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
