import { prisma } from '@/server/db/client'

export interface CreateInterviewInput {
  position: string
  difficulty: string
  materialContent: string
}

const interviewInclude = {
  materials: {
    orderBy: { createdAt: 'asc' as const },
  },
  messages: {
    orderBy: { createdAt: 'asc' as const },
  },
}

export const InterviewRepository = {
  async create(userId: string, input: CreateInterviewInput) {
    return prisma.interviewSession.create({
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
}
