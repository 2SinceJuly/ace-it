import type { Metadata } from 'next'
import { LandingPage } from '@/components/landing/landing-page'

export const metadata: Metadata = {
  title: 'Ace-it — 你的简历，就是这场面试的出题人',
  description:
    'Ace-it 是面向计算机求职者的 AI 模拟面试平台：从真实项目经历出题，流式问答、逐层追问、语音交流，结束后生成逐题复盘报告。',
}

/**
 * 公开入口：产品营销落地页（未登录用户由各受保护页面重定向到这里）。
 * 页面底部嵌入现有 LoginForm，认证逻辑完全不变。
 */
export default function LoginPage() {
  return <LandingPage />
}
