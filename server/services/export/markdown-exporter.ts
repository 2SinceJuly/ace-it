/**
 * Markdown 导出服务（后端）
 * 
 * 从数据库读取会话和消息，生成 Markdown 格式文件
 */

import { MessageRepository } from '@/server/repositories/message.repository'
import { ConversationRepository } from '@/server/repositories/conversation.repository'
import { prisma } from '@/server/db/client'

export interface MarkdownExportOptions {
  includeThinking?: boolean
  includeMetadata?: boolean
}

interface InterviewMarkdownExportData {
  id: string
  position: string
  difficulty: string
  status: string
  createdAt: Date
  updatedAt: Date
  materials: Array<{ content: string; createdAt: Date }>
  materialFiles: Array<{
    materialType: string
    originalName: string
    mimeType: string
    size: number
    url: string
    createdAt: Date
  }>
  messages: Array<{
    role: string
    content: string
    createdAt: Date
  }>
  report: {
    score: number
    dimensions: unknown
    summary: string
    highlights: unknown
    weaknesses: unknown
    suggestions: unknown
    practicePlan: unknown
    recommendations: unknown
    createdAt: Date
  } | null
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const statusLabels: Record<string, string> = {
  draft: '未开始',
  in_progress: '进行中',
  completed: '已完成',
}

function formatDate(value: Date): string {
  return value.toISOString()
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatJsonList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item
      return JSON.stringify(item)
    })
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }

  return []
}

function extractMaterialConfig(materials: Array<{ content: string }>) {
  const config: Record<string, string> = {}

  for (const material of materials) {
    const lines = material.content.split('\n')
    for (const line of lines) {
      const match = line.match(/^(Question count|Duration|Difficulty label|Model|Model ID):\s*(.+)$/)
      if (match) {
        config[match[1]] = match[2].trim()
      }
    }
  }

  return config
}

export function buildInterviewMarkdown(interview: InterviewMarkdownExportData): string {
  const config = extractMaterialConfig(interview.materials)
  let content = `# ${interview.position} 模拟面试\n\n`

  content += '## 面试信息\n\n'
  content += `- 岗位：${interview.position}\n`
  content += `- 状态：${statusLabels[interview.status] || interview.status}\n`
  content += `- 难度：${difficultyLabels[interview.difficulty] || interview.difficulty}\n`
  content += `- 创建时间：${formatDate(interview.createdAt)}\n`
  content += `- 更新时间：${formatDate(interview.updatedAt)}\n`

  if (config['Question count']) {
    content += `- 题量：${config['Question count']}\n`
  }

  if (config.Duration) {
    content += `- 时长：${config.Duration}\n`
  }

  if (config.Model) {
    content += `- 模型：${config.Model}\n`
  }

  if (config['Model ID']) {
    content += `- Model ID：${config['Model ID']}\n`
  }

  content += '\n'

  if (interview.materialFiles.length > 0) {
    content += '## 上传材料文件\n\n'
    interview.materialFiles.forEach((file, index) => {
      content += `${index + 1}. ${file.originalName}\n`
      content += `   - 类型：${file.materialType}\n`
      content += `   - MIME：${file.mimeType}\n`
      content += `   - 大小：${formatBytes(file.size)}\n`
      content += `   - 上传时间：${formatDate(file.createdAt)}\n`
      content += `   - URL：${file.url}\n`
    })
    content += '\n'
  }

  if (interview.materials.length > 0) {
    content += '## 面试材料\n\n'
    interview.materials.forEach((material, index) => {
      if (interview.materials.length > 1) {
        content += `### 材料 ${index + 1}\n\n`
      }
      content += `${material.content.trim() || '（空）'}\n\n`
    })
  }

  content += '## 面试对话\n\n'
  if (interview.messages.length === 0) {
    content += '暂无面试对话记录。\n\n'
  } else {
    interview.messages.forEach((message, index) => {
      if (index > 0) {
        content += '\n---\n\n'
      }

      const roleLabel = message.role === 'user' ? '候选人' : '面试官'
      content += `### ${roleLabel} · ${formatDate(message.createdAt)}\n\n`
      content += `${message.content.trim() || '（空）'}\n`
    })
    content += '\n\n'
  }

  if (interview.report) {
    content += '## 报告摘要\n\n'
    content += `- 总分：${interview.report.score}\n`
    content += `- 生成时间：${formatDate(interview.report.createdAt)}\n\n`
    content += `${interview.report.summary}\n\n`

    const highlights = formatJsonList(interview.report.highlights)
    const weaknesses = formatJsonList(interview.report.weaknesses)
    const suggestions = formatJsonList(interview.report.suggestions)

    if (highlights.length > 0) {
      content += '### 亮点\n\n'
      highlights.forEach((item) => {
        content += `- ${item}\n`
      })
      content += '\n'
    }

    if (weaknesses.length > 0) {
      content += '### 短板\n\n'
      weaknesses.forEach((item) => {
        content += `- ${item}\n`
      })
      content += '\n'
    }

    if (suggestions.length > 0) {
      content += '### 改进建议\n\n'
      suggestions.forEach((item) => {
        content += `- ${item}\n`
      })
      content += '\n'
    }
  }

  content += `---\n\n*Exported: ${new Date().toISOString()}*\n`

  return content
}

export class MarkdownExporter {
  /**
   * 导出单个会话为 Markdown
   */
  async exportConversation(
    conversationId: string,
    userId: string,
    options: MarkdownExportOptions = {}
  ): Promise<string> {
    const { includeThinking = false, includeMetadata = false } = options

    // 获取会话信息
    const conversation = await ConversationRepository.findById(conversationId, userId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // 获取所有消息
    const messages = await MessageRepository.findByConversationId(conversationId)

    // 生成 Markdown 内容
    let content = `# ${conversation.title}\n\n`

    // 添加元数据
    if (includeMetadata) {
      content += `**Created:** ${conversation.createdAt.toISOString()}\n`
      content += `**Updated:** ${conversation.updatedAt.toISOString()}\n`
      content += `**Messages:** ${messages.length}\n\n`
      content += '---\n\n'
    }

    // 添加消息
    messages.forEach((msg, index) => {
      if (index > 0) {
        content += '\n---\n\n'
      }

      // 角色标签
      const roleLabel = msg.role === 'user' ? '**User**' : '**Assistant**'
      content += `${roleLabel}\n\n`

      // Thinking 内容（如果有）
      if (includeThinking && msg.thinking) {
        content += '<details>\n'
        content += '<summary>💭 Thinking Process</summary>\n\n'
        content += msg.thinking
        content += '\n\n</details>\n\n'
      }

      // 消息内容
      content += msg.content + '\n'
    })

    // 添加导出时间戳
    content += `\n---\n\n*Exported: ${new Date().toISOString()}*\n`

    return content
  }

  /**
   * 批量导出多个会话
   */
  async exportBatch(
    conversationIds: string[],
    userId: string,
    options: MarkdownExportOptions = {}
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>()

    for (const id of conversationIds) {
      try {
        const markdown = await this.exportConversation(id, userId, options)
        results.set(id, markdown)
      } catch (error) {
        console.error(`Failed to export conversation ${id}:`, error)
        // 跳过失败的会话，继续导出其他会话
      }
    }

    return results
  }

  async exportInterview(interviewId: string, userId: string): Promise<string> {
    const interview = await prisma.interviewSession.findFirst({
      where: { id: interviewId, userId },
      include: {
        materials: {
          orderBy: { createdAt: 'asc' },
        },
        materialFiles: {
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        report: true,
      },
    })

    if (!interview) {
      throw new Error('Interview not found')
    }

    return buildInterviewMarkdown(interview)
  }
}
