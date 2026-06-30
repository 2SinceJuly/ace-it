'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'

interface InterviewExportButtonProps {
  interviewId: string
  disabled?: boolean
}

export function InterviewExportButton({
  interviewId,
  disabled = false,
}: InterviewExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting || disabled) return

    setIsExporting(true)

    try {
      const response = await fetch(`/api/interviews/${interviewId}/export?format=markdown`)

      if (!response.ok) {
        throw new Error('导出失败，请确认当前账号有权限访问这场面试。')
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `interview-${interviewId}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      toast({
        title: '导出成功',
        description: '面试对话已导出为 Markdown 格式',
      })
    } catch (error) {
      console.error('Interview export error:', error)
      toast({
        title: '导出失败',
        description: error instanceof Error ? error.message : '导出过程中出现错误',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={disabled || isExporting}
      className="h-10 rounded-full border-2 border-[#ded8cf] bg-[#fffdf8] px-4 text-[#4f4a43] hover:bg-[#f6efe5] hover:text-[#111318]"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isExporting ? '导出中' : '导出 Markdown'}
    </Button>
  )
}
