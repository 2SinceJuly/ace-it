/**
 * 认证工具函数
 * 
 * 支持两套并行的认证机制：
 * 1. NextAuth.js v4 (OAuth2 + Credentials) - 优先
 * 2. 传统 JWT token (向后兼容) - 备选
 */

import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { verifyJWT } from './jwt'
import { prisma } from '@/server/db/client'

/**
 * 获取当前用户 ID（支持双认证机制）
 * 
 * @throws Error 如果未认证
 */
export async function getCurrentUserId(): Promise<string> {
  const resolveUserId = async (userId?: string | null, email?: string | null) => {
    if (userId) {
      const existingUser = await prisma.user.findUnique({ where: { id: userId } })
      if (existingUser) {
        return existingUser.id
      }
    }

    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) {
        return existingUser.id
      }
    }

    return null
  }

  // 方案1: 尝试从 NextAuth session 获取（优先）
  try {
    const session = await getServerSession(authOptions)
    const resolvedUserId = await resolveUserId(session?.user?.id, session?.user?.email)
    if (resolvedUserId) {
      return resolvedUserId
    }
  } catch {
    // NextAuth 失败时继续尝试旧的 JWT token
  }

  // 方案2: 尝试从传统 JWT token 获取（向后兼容）
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (token) {
      const payload = await verifyJWT(token)
      const resolvedUserId = await resolveUserId(payload.userId)
      if (resolvedUserId) {
        return resolvedUserId
      }
    }
  } catch {
    // JWT token 验证失败
  }

  // 开发环境下，允许自动使用一个本地开发用户，避免本地调试被登录拦住
  if (process.env.NODE_ENV !== 'production') {
    const devUserEmail = process.env.DEV_AUTH_EMAIL || 'dev@local.test'
    const devUserName = process.env.DEV_AUTH_NAME || 'Local Dev User'

    let devUser = await prisma.user.findUnique({ where: { email: devUserEmail } })

    if (!devUser) {
      devUser = await prisma.user.create({
        data: {
          email: devUserEmail,
          name: devUserName,
        },
      })
    }

    return devUser.id
  }

  // 两种方案都失败
  throw new Error('Unauthorized')
}

/**
 * 尝试获取当前用户 ID（不抛出异常）
 * 
 * @returns userId 或 null
 */
export async function tryGetCurrentUserId(): Promise<string | null> {
  try {
    return await getCurrentUserId()
  } catch {
    return null
  }
}
