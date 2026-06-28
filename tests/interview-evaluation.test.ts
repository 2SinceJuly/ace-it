import assert from 'node:assert/strict'
import { extractJson, normalizeEvaluation } from '../server/services/interview/interview-evaluation.service'

const fencedJson = `\`\`\`json
{
  "score": "82",
  "summary": "候选人能结合项目回答。",
  "highlights": "说明了缓存优化；提到了首屏指标",
  "weaknesses": "缺少异常兜底",
  "suggestions": "补充压测数据。整理复盘结构。",
  "dimensions": [
    { "subject": "技术", "value": "82" },
    { "subject": "表达", "value": 76 }
  ]
}
\`\`\``

assert.equal(JSON.parse(extractJson(fencedJson)).score, '82')

const proseWrapped = `下面是评估结果：
{
  "score": 91,
  "summary": "回答结构清晰。",
  "highlights": ["能说明权衡"],
  "weaknesses": ["缺少边界条件"],
  "suggestions": ["补充监控方案"],
  "practicePlan": [{"day":"Day 1","title":"项目复盘","tasks":"整理链路；补充指标","goal":"讲清楚闭环"}],
  "recommendations": [{"title":"性能优化复盘","meta":"30 分钟","reason":"提升技术深度"}]
}
后续可以继续练习。`

assert.equal(JSON.parse(extractJson(proseWrapped)).score, 91)

const withExtraObject = `prefix {"score": 67, "summary": "ok", "highlights": [], "weaknesses": [], "suggestions": []} suffix {"ignored": true}`
assert.deepEqual(JSON.parse(extractJson(withExtraObject)), {
  score: 67,
  summary: 'ok',
  highlights: [],
  weaknesses: [],
  suggestions: [],
})

const normalized = normalizeEvaluation(JSON.parse(extractJson(fencedJson)), '前端开发')
assert.equal(normalized.score, 82)
assert.equal(normalized.dimensions.length, 5)
assert.deepEqual(
  normalized.dimensions.map((item) => item.subject),
  ['技术', '知识', '表达', '逻辑', '匹配']
)
assert.equal(normalized.dimensions[0].value, 82)
assert.equal(normalized.dimensions[2].value, 76)
assert.deepEqual(normalized.highlights, ['说明了缓存优化', '提到了首屏指标'])
assert.deepEqual(normalized.weaknesses, ['缺少异常兜底'])
assert.deepEqual(normalized.suggestions, ['补充压测数据', '整理复盘结构'])

const normalizedMissing = normalizeEvaluation({}, '后端开发')
assert.equal(normalizedMissing.score, 60)
assert.equal(normalizedMissing.dimensions.length, 5)
assert.match(normalizedMissing.summary, /后端开发/)

const normalizedPlans = normalizeEvaluation(JSON.parse(extractJson(proseWrapped)), '全栈开发')
assert.deepEqual(normalizedPlans.practicePlan[0], {
  day: 'Day 1',
  title: '项目复盘',
  tasks: ['整理链路', '补充指标'],
  goal: '讲清楚闭环',
})

console.log('interview evaluation tests passed')
