/**
 * 面试有限状态机（纯函数，无副作用，可单测）。
 *
 * CREATED → GREETING → QUESTIONING → CLOSING → REPORTING → FINISHED
 *
 * 关键原则：LLM 永远不掌控流程。追问与否由程序根据评估结果的
 * needsFollowUp 决定，并强制两条硬约束：
 *   1. 每道主问题最多追问 MAX_FOLLOW_UPS 次；
 *   2. 主问题总数不超过用户选择的题目数量（大纲长度）。
 */

export const MAX_FOLLOW_UPS = 2

export type NextAction = 'follow_up' | 'next_question' | 'closing'

export interface AnswerDecisionInput {
  /** LLM 评估：是否值得追问（程序仅参考，不盲从） */
  needsFollowUp: boolean
  /** 当前题已进行的追问深度（0 = 刚答完主问题） */
  followUpDepth: number
  /** 当前主问题游标（0 起） */
  currentQuestionIndex: number
  /** 用户选择的主问题总数 */
  questionCount: number
}

export interface AnswerDecision {
  action: NextAction
  nextQuestionIndex: number
  nextFollowUpDepth: number
}

/**
 * 候选人提交回答后的流程决策。
 * 不按数字分数阈值决定追问 —— 依据评估的 needsFollowUp，
 * 同时程序强制追问上限与题目总数上限。
 */
export function decideAfterAnswer(input: AnswerDecisionInput): AnswerDecision {
  const { needsFollowUp, followUpDepth, currentQuestionIndex, questionCount } = input

  if (needsFollowUp && followUpDepth < MAX_FOLLOW_UPS) {
    return {
      action: 'follow_up',
      nextQuestionIndex: currentQuestionIndex,
      nextFollowUpDepth: followUpDepth + 1,
    }
  }

  const nextIndex = currentQuestionIndex + 1
  if (nextIndex >= questionCount) {
    return { action: 'closing', nextQuestionIndex: currentQuestionIndex, nextFollowUpDepth: 0 }
  }
  return { action: 'next_question', nextQuestionIndex: nextIndex, nextFollowUpDepth: 0 }
}
