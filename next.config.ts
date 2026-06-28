import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * 安全响应头
 *
 * - X-Frame-Options: 禁止被嵌入 iframe，防点击劫持
 * - X-Content-Type-Options: 禁止 MIME 嗅探
 * - Referrer-Policy: 只向同源站点发送完整 referrer
 * - X-DNS-Prefetch-Control: 关闭 DNS 预取，降低隐私泄漏
 * - Permissions-Policy: 关闭摄像头/麦克风/地理位置等敏感 API
 * - Strict-Transport-Security: 强制 HTTPS（生产环境生效）
 *
 * 注：CSP 未在此处配置，因为 Next.js 内联脚本和样式需要 nonce 计算，
 * 配置不当会直接破坏页面。如需启用 CSP，建议配合 next-safe-middleware
 * 或在 middleware.ts 中动态生成 nonce。
 */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // HSTS 仅在 HTTPS 生产环境生效，避免 dev 模式锁死 http://localhost
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
]

const nextConfig: NextConfig = {
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,

  // 隐藏 X-Powered-By: Next.js 响应头，降低指纹信息
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
