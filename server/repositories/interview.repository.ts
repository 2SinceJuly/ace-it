import { prisma } from '@/server/db/client'

export interface CreateInterviewInput {
  position: string
  difficulty: string
  materialContent: string
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
      },
    })
  },

  async findById(id: string, userId: string) {
    return prisma.interviewSession.findFirst({
      where: { id, userId },
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
}
