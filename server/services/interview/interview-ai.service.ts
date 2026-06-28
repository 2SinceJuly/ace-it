import { createChatCompletionText, type ChatMessage } from '@/server/services/ai'

const INTERVIEW_MODEL = 'zai-org/GLM-4.6'

interface InterviewMaterial {
  content: string
}

interface InterviewMessage {
  role: string
  content: string
}

interface InterviewContext {
  position: string
  difficulty: string
  materials: InterviewMaterial[]
  messages?: InterviewMessage[]
}

function buildSystemPrompt(interview: InterviewContext): string {
  return [
    'You are a realistic AI mock interviewer.',
    `Target role: ${interview.position}.`,
    `Difficulty: ${interview.difficulty}.`,
    'Use the candidate material to ask role-specific questions.',
    'Keep the conversation focused and practical.',
    'Write in English.',
    'Do not mention that you are reading a prompt.',
  ].join('\n')
}

function buildMaterialText(interview: InterviewContext): string {
  const material = interview.materials.map((item) => item.content.trim()).filter(Boolean).join('\n\n---\n\n')
  return material || 'No candidate material was provided.'
}

function buildHistoryText(messages: InterviewMessage[] = []): string {
  if (messages.length === 0) return 'No previous interview messages.'

  return messages
    .map((message) => `${message.role === 'user' ? 'Candidate' : 'Interviewer'}: ${message.content}`)
    .join('\n\n')
}

async function generateInterviewText(apiKey: string, messages: ChatMessage[]): Promise<string> {
  const text = await createChatCompletionText(apiKey, {
    model: INTERVIEW_MODEL,
    messages,
    enableThinking: false,
  })

  if (!text) {
    throw new Error('AI did not return interview content.')
  }

  return text
}

export async function generateFirstQuestion(
  apiKey: string,
  interview: InterviewContext
): Promise<string> {
  return generateInterviewText(apiKey, [
    {
      role: 'system',
      content: buildSystemPrompt(interview),
    },
    {
      role: 'user',
      content: [
        'Create the opening question for this mock interview.',
        'Ask exactly one question.',
        'The question should be specific to the role and candidate material.',
        'Do not include feedback yet.',
        '',
        'Candidate material:',
        buildMaterialText(interview),
      ].join('\n'),
    },
  ])
}

export async function generateFeedbackAndFollowUp(
  apiKey: string,
  interview: InterviewContext,
  answer: string
): Promise<string> {
  return generateInterviewText(apiKey, [
    {
      role: 'system',
      content: buildSystemPrompt(interview),
    },
    {
      role: 'user',
      content: [
        'Review the candidate answer and continue the mock interview.',
        '',
        'Return two short sections:',
        'Feedback: one concise, useful evaluation of the answer.',
        'Follow-up question: exactly one next question.',
        '',
        'Candidate material:',
        buildMaterialText(interview),
        '',
        'Interview history:',
        buildHistoryText(interview.messages),
        '',
        'Latest candidate answer:',
        answer,
      ].join('\n'),
    },
  ])
}
