import { prisma } from '@/server/db/client'
import type { InterviewEvaluation } from '@/server/services/interview/interview-evaluation.service'

export interface CreateInterviewInput {
  position: string
  difficulty: string
  materialContent: string
  materialFileIds?: string[]
}

const interviewInclude = {
  materials: {
    orderBy: { createdAt: 'asc' as const },
  },
  messages: {
    orderBy: { createdAt: 'asc' as const },
  },
  report: true,
}

export const InterviewRepository = {
  async create(userId: string, input: CreateInterviewInput) {
    return prisma.$transaction(async (tx) => {
      const materialFileIds = Array.from(new Set(input.materialFileIds || []))

      if (materialFileIds.length > 0) {
        const ownedFiles = await tx.interviewMaterialFile.findMany({
          where: {
            id: { in: materialFileIds },
            userId,
            interviewId: null,
          },
          select: { id: true },
        })

        if (ownedFiles.length !== materialFileIds.length) {
          throw new Error('One or more material files are invalid or already bound.')
        }
      }

      const interview = await tx.interviewSession.create({
        data: {
          userId,
          position: input.position,
          difficulty: input.difficulty,
          status: 'draft',
          materials: {
            create: {
              content: input.materialContent,
            },
          },
        },
        include: {
          materials: {
            orderBy: { createdAt: 'asc' },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (materialFileIds.length > 0) {
        await tx.interviewMaterialFile.updateMany({
          where: {
            id: { in: materialFileIds },
            userId,
            interviewId: null,
          },
          data: {
            interviewId: interview.id,
          },
        })
      }

      return interview
    })
  },

  async findByUserId(userId: string) {
    return prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        materials: {
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  },

  async findById(id: string, userId: string) {
    return prisma.interviewSession.findFirst({
      where: { id, userId },
      include: interviewInclude,
    })
  },

  async addMessage(interviewId: string, role: 'assistant' | 'user', content: string) {
    return prisma.interviewMessage.create({
      data: {
        interviewId,
        role,
        content,
      },
    })
  },

  async startWithAssistantMessage(id: string, _userId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      await tx.interviewMessage.create({
        data: {
          interviewId: id,
          role: 'assistant',
          content,
        },
      })

      return tx.interviewSession.update({
        where: { id },
        data: { status: 'in_progress' },
        include: interviewInclude,
      })
    })
  },

  async addAssistantReplyAndMarkInProgress(
    id: string,
    _userId: string,
    assistantReply: string
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.interviewMessage.create({
        data: {
          interviewId: id,
          role: 'assistant',
          content: assistantReply,
        },
      })

      return tx.interviewSession.update({
        where: { id },
        data: { status: 'in_progress' },
        include: interviewInclude,
      })
    })
  },

  async markCompleted(id: string, _userId: string) {
    return prisma.interviewSession.update({
      where: { id },
      data: { status: 'completed' },
      include: interviewInclude,
    })
  },

  async deleteById(id: string, userId: string) {
    const result = await prisma.interviewSession.deleteMany({
      where: { id, userId },
    })

    return result.count > 0
  },

  /**
   * 把 AI 生成的结构化评估写入 InterviewReport 表
   * upsert 保证幂等：重复调用不会报错，会覆盖旧报告
   */
  async saveReport(
    interviewId: string,
    evaluation: InterviewEvaluation
  ) {
    return prisma.interviewReport.upsert({
      where: { interviewId },
      create: {
        interviewId,
        score: evaluation.score,
        dimensions: evaluation.dimensions,
        summary: evaluation.summary,
        highlights: evaluation.highlights,
        weaknesses: evaluation.weaknesses,
        suggestions: evaluation.suggestions,
        practicePlan: evaluation.practicePlan,
        recommendations: evaluation.recommendations,
      },
      update: {
        score: evaluation.score,
        dimensions: evaluation.dimensions,
        summary: evaluation.summary,
        highlights: evaluation.highlights,
        weaknesses: evaluation.weaknesses,
        suggestions: evaluation.suggestions,
        practicePlan: evaluation.practicePlan,
        recommendations: evaluation.recommendations,
      },
    })
  },
}
