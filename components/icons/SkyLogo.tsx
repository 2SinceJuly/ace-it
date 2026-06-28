/**
 * Ace It Logo Component
 * 
 * 设计理念：
 * - 云朵形状代表"Tide"（潮汐）
 * - 对话气泡代表 AI 对话体验
 * - 渐变色从浅蓝到深蓝，象征现代智能产品的层次感
 * - 流畅的曲线体现 AI 的智能和流动性
 * 
 * @module components/icons/SkyLogo
 */

import * as React from 'react'
import Image from 'next/image'

interface SkyLogoProps {
  /** 宽度 */
  width?: number
  /** 高度 */
  height?: number
  /** 类名 */
  className?: string
  /** 是否显示文字 */
  showText?: boolean
}

/**
 * Ace It Logo component
 */
export function SkyLogo({ 
  width = 120, 
  height = 120, 
  className = '',
  showText = false 
}: SkyLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 渐变定义 */}
      <defs>
        {/* 主渐变 - 天空蓝 */}
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        
        {/* 高光渐变 */}
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        
        {/* 阴影 */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* 主图形 - 云朵对话气泡 */}
      <g filter="url(#shadow)">
        {/* 云朵主体 */}
        <path
          d="M 35 50 
             C 35 40, 42 32, 52 32
             C 54 25, 61 20, 70 20
             C 80 20, 88 27, 90 36
             C 98 36, 105 43, 105 52
             C 105 61, 98 68, 90 68
             L 45 68
             C 38 68, 32 62, 32 55
             C 32 52, 33 50, 35 50 Z"
          fill="url(#skyGradient)"
        />
        
        {/* 对话气泡尾巴 */}
        <path
          d="M 45 68 
             L 38 78
             L 48 72
             Z"
          fill="url(#skyGradient)"
        />
        
        {/* 高光效果 */}
        <ellipse
          cx="65"
          cy="40"
          rx="25"
          ry="15"
          fill="url(#highlightGradient)"
          opacity="0.6"
        />
        
        {/* 对话点 - 三个小圆点 */}
        <circle cx="55" cy="50" r="4" fill="white" opacity="0.9" />
        <circle cx="68" cy="50" r="4" fill="white" opacity="0.9" />
        <circle cx="81" cy="50" r="4" fill="white" opacity="0.9" />
      </g>
      
      {/* 文字（可选） */}
      {showText && (
        <g>
          <text
            x="60"
            y="95"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="16"
            fontWeight="600"
            fill="url(#skyGradient)"
            textAnchor="middle"
          >
            Ace It
          </text>
        </g>
      )}
    </svg>
  )
}

/**
 * Ace It Logo Icon - compact version
 */
export function SkyLogoIcon({
  width = 32,
  height = 32,
  className = ''
}: Omit<SkyLogoProps, 'showText'>) {
  return (
    <Image
      src="/logo.svg"
      alt="Ace It"
      width={width}
      height={height}
      className={className}
    />
  )
}
