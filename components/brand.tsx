import { cn } from '@/lib/utils'

/**
 * 产品品牌标识：Ace-it（写法固定，不得变体）。
 * Ace 为深墨色，-it 为珊瑚橙强调；不使用额外 Logo 图标。
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('whitespace-nowrap', className)}>
      Ace
      <span className="text-accent-strong">-it</span>
    </span>
  )
}
