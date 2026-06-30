import assert from 'node:assert/strict'
import { buildInterviewMarkdown } from '../server/services/export/markdown-exporter'

const baseInterview = {
  id: 'interview-1',
  position: '前端工程师',
  difficulty: 'hard',
  status: 'completed',
  createdAt: new Date('2026-06-30T01:00:00.000Z'),
  updatedAt: new Date('2026-06-30T02:00:00.000Z'),
  materials: [
    {
      content: `## Interview configuration
Question count: 6
Duration: 45 minutes
Difficulty label: 困难
Model: GLM-4.6
Model ID: zai-org/GLM-4.6

## Resume
候选人有 React 和 Next.js 项目经验。`,
      createdAt: new Date('2026-06-30T01:00:00.000Z'),
    },
  ],
  materialFiles: [
    {
      materialType: 'resume',
      originalName: 'resume.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      url: '/generated/interview-materials/resume.pdf',
      createdAt: new Date('2026-06-30T01:01:00.000Z'),
    },
  ],
  messages: [
    {
      role: 'assistant',
      content: '请介绍一个你做过的性能优化项目。',
      createdAt: new Date('2026-06-30T01:02:00.000Z'),
    },
    {
      role: 'user',
      content: '我优化过首屏加载和缓存策略。',
      createdAt: new Date('2026-06-30T01:03:00.000Z'),
    },
  ],
  report: null,
}

const withoutReport = buildInterviewMarkdown(baseInterview)

assert.match(withoutReport, /# 前端工程师 模拟面试/)
assert.match(withoutReport, /- 状态：已完成/)
assert.match(withoutReport, /- 难度：困难/)
assert.match(withoutReport, /- 题量：6/)
assert.match(withoutReport, /- 时长：45 minutes/)
assert.match(withoutReport, /- 模型：GLM-4.6/)
assert.match(withoutReport, /- Model ID：zai-org\/GLM-4\.6/)
assert.match(withoutReport, /resume\.pdf/)
assert.match(withoutReport, /2\.0 KB/)
assert.match(withoutReport, /### 面试官 · 2026-06-30T01:02:00\.000Z/)
assert.match(withoutReport, /请介绍一个你做过的性能优化项目。/)
assert.match(withoutReport, /### 候选人 · 2026-06-30T01:03:00\.000Z/)
assert.match(withoutReport, /我优化过首屏加载和缓存策略。/)
assert.doesNotMatch(withoutReport, /## 报告摘要/)

const withReport = buildInterviewMarkdown({
  ...baseInterview,
  report: {
    score: 86,
    dimensions: [],
    summary: '候选人能结合项目回答，但指标细节还可以补充。',
    highlights: ['能说明优化目标'],
    weaknesses: ['缺少压测数据'],
    suggestions: ['补充量化指标'],
    practicePlan: [],
    recommendations: [],
    createdAt: new Date('2026-06-30T02:05:00.000Z'),
  },
})

assert.match(withReport, /## 报告摘要/)
assert.match(withReport, /- 总分：86/)
assert.match(withReport, /候选人能结合项目回答/)
assert.match(withReport, /### 亮点/)
assert.match(withReport, /- 能说明优化目标/)
assert.match(withReport, /### 短板/)
assert.match(withReport, /- 缺少压测数据/)
assert.match(withReport, /### 改进建议/)
assert.match(withReport, /- 补充量化指标/)

console.log('interview export tests passed')
