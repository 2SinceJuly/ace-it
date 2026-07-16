'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { CircleNotch, Eye, EyeSlash } from '@phosphor-icons/react'

/** 演示环境预置账号：仅用于当前 Demo，不涉及任何真实凭据 */
const DEMO_USERNAME = 'demo'
const DEMO_PASSWORD = 'demo123'

export function LoginForm() {
  const router = useRouter()
  // 通过 state 初始值预填，首帧即渲染完成，无 useEffect 闪烁
  const [username, setUsername] = useState(DEMO_USERNAME)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '登录失败')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  function togglePassword() {
    setShowPassword((v) => !v)
    // 切换 type 后保持输入框焦点与光标位置
    requestAnimationFrame(() => {
      const el = passwordRef.current
      if (!el) return
      const pos = el.value.length
      el.focus({ preventScroll: true })
      el.setSelectionRange(pos, pos)
    })
  }

  const inputCls = [
    'h-11 w-full rounded-lg border bg-surface px-3.5 text-[15px] text-ink',
    'shadow-[inset_0_1px_2px_rgba(24,24,22,0.04)] outline-none transition-all duration-150',
    'placeholder:text-ink-muted/60',
    'hover:border-ink-muted/60',
    'focus-visible:border-accent-strong focus-visible:ring-[3px] focus-visible:ring-accent-strong/25',
    'disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60',
    error ? 'border-error' : 'border-divider',
  ].join(' ')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium text-ink">
          账号
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          placeholder="输入账号"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputCls}
          aria-invalid={!!error}
          disabled={loading}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-ink">
          密码
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputCls} pr-12`}
            aria-invalid={!!error}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={togglePassword}
            disabled={loading}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex min-h-11 min-w-11 items-center justify-center rounded-r-lg text-ink-muted transition-colors hover:text-accent-strong focus-visible:text-accent-strong focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong disabled:pointer-events-none disabled:opacity-50"
          >
            {showPassword ? (
              <EyeSlash className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-strong text-[15px] font-semibold text-primary-foreground shadow-[0_2px_8px_-2px_rgba(217,119,87,0.5)] transition-all duration-150 hover:bg-accent-hover hover:shadow-[0_4px_14px_-4px_rgba(217,119,87,0.6)] focus-visible:ring-[3px] focus-visible:ring-accent-strong/30 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {loading && <CircleNotch className="size-4 animate-spin" aria-hidden="true" />}
        {loading ? '登录中…' : '进入工作台'}
      </button>
    </form>
  )
}
