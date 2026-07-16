// ============ 大纲生成 ============

export const OUTLINE_TOOL = {
  name: 'generate_interview_outline',
  description: '根据候选人简历生成定向技术面试大纲',
  parameters: {
    type: 'object',
    properties: {
      candidateName: { type: 'string', description: '候选人姓名，简历中无法确定时用"候选人"' },
      targetRole: { type: 'string', description: '目标岗位方向，如"前端开发工程师"' },
      techStack: {
        type: 'array',
        items: { type: 'string' },
        description: '从简历提炼的核心技术栈关键词，5-10 个',
      },
      questions: {
        type: 'array',
        description: '定向面试题列表，数量必须严格等于要求的题目数',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: '考察主题，如"React 状态管理"' },
            question: { type: 'string', description: '完整的面试问题文本' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            relatedResumePoint: {
              type: 'string',
              description: '该题挂靠的简历原文技术点或项目经历，必须具体',
            },
          },
          required: ['topic', 'question', 'difficulty', 'relatedResumePoint'],
        },
      },
    },
    required: ['candidateName', 'targetRole', 'techStack', 'questions'],
  },
} as const

export function outlineMessages(resumeText: string, questionCount: number) {
  return [
    {
      role: 'system' as const,
      content: [
        '你是一位资深技术面试官，负责根据候选人简历设计定向面试大纲。',
        '要求：',
        `1. 题目数量必须严格等于 ${questionCount} 道。`,
        '2. 每道题必须挂靠简历中的具体技术点或项目经历（relatedResumePoint 字段），杜绝与简历无关的泛化八股题。',
        '3. 题目难度整体循序渐进，覆盖简历中的核心技术栈与项目亮点。',
        '4. 问题表述口语化、像面试官当面提问，一次只问一个问题。',
      ].join('\n'),
    },
    {
      role: 'user' as const,
      content: `候选人简历如下：\n\n${resumeText}\n\n请生成 ${questionCount} 道定向面试题。`,
    },
  ]
}

// ============ 面试官发言（流式） ============

const INTERVIEWER_PERSONA = [
  '你是一位友善而专业的资深技术面试官，正在进行一场中文模拟技术面试。',
  '发言要求：口语化、自然、简洁，像真人面试官当面交流；不使用 markdown 格式、不使用列表符号；',
  '一次发言只围绕一个话题；不要透露任何评分或内部评估信息。',
].join('')

export function greetingMessages(candidateName: string, targetRole: string, questionCount: number) {
  return [
    { role: 'system' as const, content: INTERVIEWER_PERSONA },
    {
      role: 'user' as const,
      content: `面试即将开始。候选人是 ${candidateName}，目标岗位是 ${targetRole}，本场共 ${questionCount} 道题。请说一段简短的开场白：欢迎候选人、自我介绍（你可以叫"面试官"）、简单说明流程（逐题问答、可以追问），最后自然过渡到"准备好了我们就开始"。控制在 120 字以内。`,
    },
  ]
}

export function questionMessages(params: {
  question: string
  topic: string
  relatedResumePoint: string
  questionIndex: number
  questionCount: number
  isFirst: boolean
}) {
  const { question, topic, relatedResumePoint, questionIndex, questionCount, isFirst } = params
  return [
    { role: 'system' as const, content: INTERVIEWER_PERSONA },
    {
      role: 'user' as const,
      content: [
        `现在进入第 ${questionIndex + 1} 题（共 ${questionCount} 题）。`,
        `考察主题：${topic}`,
        `题目原文：${question}`,
        `该题挂靠候选人简历中的：${relatedResumePoint}`,
        isFirst
          ? '这是第一题，用一句话自然开启提问。'
          : '上一题刚结束，先用一句话自然衔接（如"好的，我们看下一个问题"），再提问。',
        '提问时可以先点一下这题与候选人简历经历的关联，让候选人感到题目是为他定制的。完整问出题目内容，不要缩写题目。',
      ].join('\n'),
    },
  ]
}

export function followUpMessages(params: {
  question: string
  answer: string
  followUpFocus: string
  followUpDepth: number
}) {
  const { question, answer, followUpFocus, followUpDepth } = params
  return [
    { role: 'system' as const, content: INTERVIEWER_PERSONA },
    {
      role: 'user' as const,
      content: [
        `候选人刚回答了这道题：${question}`,
        `候选人的回答：${answer}`,
        `内部评估建议的追问方向：${followUpFocus}`,
        `这是第 ${followUpDepth} 次追问（最多 2 次）。`,
        '请生成一句自然的追问：先简短回应候选人的回答（不评价好坏），再针对追问方向深挖。追问要具体、有针对性，控制在 80 字以内。',
      ].join('\n'),
    },
  ]
}

export function closingMessages(candidateName: string) {
  return [
    { role: 'system' as const, content: INTERVIEWER_PERSONA },
    {
      role: 'user' as const,
      content: `全部题目已问完。请对候选人 ${candidateName} 说一段简短的结束语：感谢参与、说明面试报告稍后生成、送上鼓励。控制在 80 字以内。`,
    },
  ]
}

// ============ 回答评估（Function Calling，面试中不可见） ============

export const EVALUATION_TOOL = {
  name: 'evaluate_answer',
  description: '对候选人的回答进行内部评估，评估结果对候选人不可见',
  parameters: {
    type: 'object',
    properties: {
      score: { type: 'integer', minimum: 0, maximum: 10, description: '回答质量评分 0-10' },
      comment: { type: 'string', description: '内部点评：回答的优点与不足，供最终报告使用' },
      needsFollowUp: {
        type: 'boolean',
        description:
          '是否值得追问。回答中存在模糊、浅尝辄止但有深挖价值的点时为 true；回答已充分完整、或差到追问无意义时为 false',
      },
      followUpFocus: {
        type: 'string',
        description: '若 needsFollowUp 为 true，给出具体的追问切入点；否则为空字符串',
      },
      coveredPoints: {
        type: 'array',
        items: { type: 'string' },
        description: '候选人回答中已覆盖到的关键知识点/要点列表',
      },
    },
    required: ['score', 'comment', 'needsFollowUp', 'followUpFocus', 'coveredPoints'],
  },
} as const

export function evaluationMessages(params: {
  question: string
  answer: string
  topic: string
  relatedResumePoint: string
  previousRounds: { question: string; answer: string }[]
}) {
  const { question, answer, topic, relatedResumePoint, previousRounds } = params
  const history =
    previousRounds.length > 0
      ? `\n本题此前的问答轮次：\n${previousRounds
          .map((r, i) => `第${i + 1}轮 问：${r.question}\n第${i + 1}轮 答：${r.answer}`)
          .join('\n')}`
      : ''
  return [
    {
      role: 'system' as const,
      content: [
        '你是技术面试的内部评估员。你的评估候选人永远看不到，请客观严格。',
        '评估维度：技术准确性、深度、结构化表达、与简历经历的印证。',
        '判断 needsFollowUp 时注意：不要机械按分数决定——高分回答若有值得深挖的亮点也可以追问；',
        '低分回答若候选人明显不会（如直接说不知道），追问无意义，应为 false。',
      ].join('\n'),
    },
    {
      role: 'user' as const,
      content: [
        `考察主题：${topic}`,
        `题目挂靠的简历点：${relatedResumePoint}`,
        `当前问题：${question}`,
        history,
        `候选人本轮回答：${answer}`,
        '请调用函数给出评估。',
      ].join('\n'),
    },
  ]
}

// ============ 最终报告（Function Calling） ============

export const REPORT_TOOL = {
  name: 'generate_interview_report',
  description: '基于完整问答记录、面试大纲和每轮内部评估，统一生成最终面试报告',
  parameters: {
    type: 'object',
    properties: {
      overallScore: { type: 'integer', minimum: 0, maximum: 100, description: '总评分 0-100' },
      summary: { type: 'string', description: '总评：整体表现的综合评价，150-300 字' },
      strengths: { type: 'array', items: { type: 'string' }, description: '亮点优势，3-5 条' },
      weaknesses: { type: 'array', items: { type: 'string' }, description: '不足与短板，3-5 条' },
      suggestions: { type: 'array', items: { type: 'string' }, description: '针对性改进建议，3-5 条' },
      perQuestion: {
        type: 'array',
        description: '逐题评价，与大纲题目一一对应',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string', description: '题目原文' },
            score: { type: 'integer', minimum: 0, maximum: 10, description: '该题最终得分 0-10' },
            comment: { type: 'string', description: '该题的最终点评（综合主答与追问表现）' },
          },
          required: ['question', 'score', 'comment'],
        },
      },
    },
    required: ['overallScore', 'summary', 'strengths', 'weaknesses', 'suggestions', 'perQuestion'],
  },
} as const

export function reportMessages(params: {
  candidateName: string
  targetRole: string
  outline: { topic: string; question: string; difficulty: string; relatedResumePoint: string }[]
  transcript: { role: string; kind: string; questionIndex: number; content: string }[]
  evaluations: {
    questionIndex: number
    followUpDepth: number
    score: number
    comment: string
    coveredPoints: string[]
  }[]
}) {
  const { candidateName, targetRole, outline, transcript, evaluations } = params
  return [
    {
      role: 'system' as const,
      content: [
        '你是技术面试报告撰写专家。基于完整问答记录、面试大纲和每轮内部评估，统一生成最终评分与报告。',
        '要求：perQuestion 必须与大纲题目一一对应且顺序一致；最终评分要综合每轮内部评估，但以完整问答记录为准重新统一权衡，不是简单平均；',
        '点评具体、指向候选人的原话表现，避免空泛套话。',
      ].join('\n'),
    },
    {
      role: 'user' as const,
      content: [
        `候选人：${candidateName}，目标岗位：${targetRole}`,
        `\n== 面试大纲 ==\n${outline
          .map((o, i) => `${i + 1}. [${o.topic} / ${o.difficulty}] ${o.question}（挂靠：${o.relatedResumePoint}）`)
          .join('\n')}`,
        `\n== 完整问答记录 ==\n${transcript
          .map((m) => `[第${m.questionIndex + 1}题][${m.role === 'INTERVIEWER' ? '面试官' : '候选人'}/${m.kind}] ${m.content}`)
          .join('\n')}`,
        `\n== 每轮内部评估 ==\n${evaluations
          .map(
            (e) =>
              `第${e.questionIndex + 1}题 追问深度${e.followUpDepth}：${e.score}/10 分；点评：${e.comment}；已覆盖要点：${e.coveredPoints.join('、') || '无'}`,
          )
          .join('\n')}`,
        '\n请调用函数生成最终报告。',
      ].join('\n'),
    },
  ]
}
