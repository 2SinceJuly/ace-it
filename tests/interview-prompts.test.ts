import assert from 'node:assert/strict'

import { buildInterviewConductorSystemPrompt } from '../server/services/interview/prompts/interview-conductor.prompt'
import { buildInterviewWebSearchBoundaryNote } from '../server/services/interview/interview-ai.service'
import {
  INTERVIEW_EVALUATOR_SYSTEM_PROMPT,
  INTERVIEW_EVALUATOR_USER_RULES,
} from '../server/services/interview/prompts/interview-evaluator.prompt'

const conductorPrompt = buildInterviewConductorSystemPrompt({
  position: '前端工程师',
  difficulty: 'hard',
})

assert.match(conductorPrompt, /每轮只问一个主要问题/)
assert.match(conductorPrompt, /不要提供标准答案/)
assert.match(conductorPrompt, /不要编造候选人没有提供的经历/)
assert.match(conductorPrompt, /不要预测通过率/)
assert.match(conductorPrompt, /Target role: 前端工程师/)
assert.match(conductorPrompt, /Difficulty: hard/)

assert.match(INTERVIEW_EVALUATOR_SYSTEM_PROMPT, /只评价候选人实际回答/)
assert.match(INTERVIEW_EVALUATOR_SYSTEM_PROMPT, /不要编造项目经历/)
assert.match(INTERVIEW_EVALUATOR_SYSTEM_PROMPT, /不要预测真实招聘结果/)
assert.match(INTERVIEW_EVALUATOR_SYSTEM_PROMPT, /输出必须是合法 JSON/)

assert.match(INTERVIEW_EVALUATOR_USER_RULES, /score: 整体得分/)
assert.match(INTERVIEW_EVALUATOR_USER_RULES, /highlights: 亮点数组/)
assert.match(INTERVIEW_EVALUATOR_USER_RULES, /weaknesses: 短板数组/)
assert.match(INTERVIEW_EVALUATOR_USER_RULES, /不要输出“稳过”/)

assert.equal(buildInterviewWebSearchBoundaryNote(false), '')

const webSearchBoundaryNote = buildInterviewWebSearchBoundaryNote(true)
assert.match(webSearchBoundaryNote, /candidate enabled web search/i)
assert.match(webSearchBoundaryNote, /has not yet been attached to InterviewMessage persistence/)
assert.match(webSearchBoundaryNote, /Do not claim that you searched the web/)

console.log('interview prompt tests passed')
