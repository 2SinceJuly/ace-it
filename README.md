# Ace-it

**面向计算机求职者的 AI 模拟面试平台**

粘贴简历即可开始一场围绕你真实项目经历的技术面试：AI 流式提问、语音播报、
文字或语音回答、智能追问，结束后生成结构化复盘报告。

技术栈：`Next.js` · `TypeScript` · `Function Calling` · `FSM` · `SSE` · `Qwen3-TTS` · `Web Speech` · `PostgreSQL` · `Prisma`

![Ace-it 面试房间](docs/screenshots/03-interview-room.webp)

**快速导航**：
[产品概览](#产品概览) ·
[工程亮点](#核心工程亮点) ·
[系统架构](#系统架构) ·
[状态机](#面试有限状态机) ·
[代码导航](#关键实现入口) ·
[本地运行](#本地运行)

---

## 产品概览

| 问题 | Ace-it 的处理方式 |
| --- | --- |
| 通用模型出题与候选人经历脱节 | 解析简历，生成关联具体技术栈和项目经历的面试大纲 |
| 模型自由对话容易导致流程失控 | 服务端有限状态机控制阶段、题目数量和追问上限 |
| 完整响应返回等待时间长 | SSE 流式传输，前端逐字增量渲染 |
| 纯文字交互沉浸感不足 | TTS 播报面试官提问，支持语音转文字回答 |
| 面试结束后缺少系统复盘 | 汇总完整记录和逐轮内部评估，生成结构化报告 |

```
登录 → 粘贴简历 → 生成定向大纲 → AI 流式提问
→ 文字或语音回答 → 内部评估 → FSM 决定追问或下一题 → 生成面试报告
```

## 核心工程亮点

### 1. 简历驱动的定向面试

简历解析不走自由文本生成，而是通过 OpenAI 兼容接口的 Function Calling
（`tool_choice` 强制指定函数）让 `qwen-plus` 返回结构化大纲——每道题都带
`topic / question / difficulty / relatedResumePoint`，与候选人的真实项目经历强关联。
原始简历全文与结构化大纲分别入库：前者作为后续每轮提问的上下文素材，后者作为 FSM 的题目轨道。

实现入口：[lib/engine/llm.ts](lib/engine/llm.ts) · [lib/engine/prompts.ts](lib/engine/prompts.ts)

### 2. 有限状态机控制流程

LLM 负责生成和评估内容，服务端 FSM 负责题目游标、追问上限与阶段流转：
评估结果中的 `needsFollowUp` 只是参考信号，"每题最多追问 2 次、总题数不超过用户选择"
由纯函数 `decideAfterAnswer` 硬约束执行。面试状态和消息持续落库，
用户离开后可以从历史记录恢复现场，而不会把流程控制权交给模型。

实现入口：[lib/engine/fsm.ts](lib/engine/fsm.ts)

### 3. SSE 流式输出

服务端把生成过程包装成 `text/event-stream`，事件统一为 JSON：
`delta`（增量文本）、`message_done`（整条消息落库确认）、`stage`（阶段切换）。
浏览器侧用 `ReadableStream` + `TextDecoder(stream: true)` 读取，以 `\n\n` 分帧，
未完整的半包留在缓冲区等待下一个 chunk。消息流使用 react-virtuoso 虚拟列表渲染，
长对话只渲染可视区域，新消息自动跟随到底部且不打断用户回看历史。

实现入口：[lib/engine/sse.ts](lib/engine/sse.ts) · [lib/client/sse.ts](lib/client/sse.ts)

### 4. TTS 播报与语音回答

面试官每条完整消息生成后，由服务端代理 `qwen3-tts-flash` 合成音频（API Key 不暴露给浏览器），
前端以单一 `HTMLAudioElement` 实例播放：新播报自动停止上一条，离开页面时清停并释放资源，
合成失败静默降级为纯文字。语音回答使用浏览器原生 Web Speech API，
识别结果只回填到输入框，由用户确认修改后手动提交，避免识别错字直接影响评估。

实现入口：[lib/client/use-tts.ts](lib/client/use-tts.ts) · [lib/client/use-speech-input.ts](lib/client/use-speech-input.ts)

### 5. 逐轮评估与最终报告

候选人每次提交回答后，服务端用 Function Calling 做一次对用户隐藏的结构化评估
（`score / comment / needsFollowUp / followUpFocus / coveredPoints`），
其中 `followUpFocus` 会注入追问 Prompt，让追问围绕答案薄弱点展开。
面试结束后汇总大纲、完整问答与全部逐轮评估，统一生成结构化报告
（总分、等级、优势、短板、建议、逐题复盘）——分数只在报告阶段展示，面试过程中不可见。

实现入口：[app/api/interviews/[id]/answer/route.ts](app/api/interviews/[id]/answer/route.ts) · [app/api/interviews/[id]/report/route.ts](app/api/interviews/[id]/report/route.ts)

## 页面截图

| 登录 | 创建面试 |
| --- | --- |
| ![登录页：简历到追问的可视化叙事](docs/screenshots/01-login.webp) | ![创建面试：粘贴简历并选择题量](docs/screenshots/02-create-interview.webp) |

| 面试报告 | 历史面试 |
| --- | --- |
| ![面试报告：总分、优劣势与逐题复盘](docs/screenshots/04-report.webp) | ![历史面试：回看报告或继续未完成面试](docs/screenshots/05-history.webp) |

所有截图来自真实运行环境与 Demo 数据（人物均为虚构）。

## 系统架构

```mermaid
flowchart TB
  subgraph browser["浏览器层"]
    UI["React UI（面试房间 / 报告）"]
    SSEC["SSE 消费（ReadableStream + TextDecoder）"]
    TTSC["TTS 播放（HTMLAudioElement）"]
    WS["Web Speech API（语音转文字）"]
  end

  subgraph server["Next.js 服务端（App Router）"]
    RH["Route Handlers（app/api/*）"]
    AUTH["Auth / Session（JWT Cookie）"]
    subgraph engine["面试领域层（lib/engine）"]
      FSM["FSM（fsm.ts）"]
      PROMPT["Prompts（prompts.ts）"]
      LLMC["LLM Client（llm.ts）"]
      SSES["SSE 封装（sse.ts）"]
    end
  end

  subgraph data["数据层"]
    PRISMA["Prisma Client"]
    PG[("PostgreSQL")]
  end

  subgraph ai["外部 AI 服务（DashScope）"]
    QWEN["qwen-plus（对话 / Function Calling）"]
    QTTS["qwen3-tts-flash（语音合成）"]
  end

  UI --> RH
  SSEC --> RH
  TTSC --> RH
  WS --> UI
  RH --> AUTH
  RH --> FSM
  RH --> SSES
  FSM --> PROMPT
  PROMPT --> LLMC
  LLMC --> QWEN
  RH --> QTTS
  RH --> PRISMA
  PRISMA --> PG
```

## 回答评估与追问数据流

```mermaid
sequenceDiagram
  actor User
  participant UI as 面试房间
  participant API as POST /api/interviews/[id]/answer
  participant LLM as qwen-plus
  participant FSM as decideAfterAnswer（程序规则）
  participant DB as Prisma / PostgreSQL

  User->>UI: 提交回答（文字或语音回填）
  UI->>API: answer
  API->>DB: 保存 CANDIDATE Message
  API->>LLM: Function Calling 内部评估
  LLM-->>API: score / needsFollowUp / followUpFocus
  API->>DB: 保存 Score（对用户隐藏）
  API->>FSM: 评估信号 + 追问深度 + 题目游标
  Note over FSM: LLM 只提供评估信息，<br/>流程由 FSM 硬约束决定
  FSM-->>API: follow_up / next_question / closing
  API->>LLM: streamChat 生成下一轮内容
  LLM-->>API: 增量 token
  API-->>UI: SSE delta 事件（逐字渲染）
  API->>DB: 保存完整 INTERVIEWER Message + 更新游标
  API-->>UI: message_done + stage
  UI->>UI: TTS 播报新消息
```

## 面试有限状态机

数据库中的业务状态（`InterviewState`，与 [prisma/schema.prisma](prisma/schema.prisma) 一致）：

```mermaid
stateDiagram-v2
  [*] --> CREATED: 简历解析成功，大纲落库
  CREATED --> GREETING: 首次进入面试间（start）
  GREETING --> QUESTIONING: 开场白 + 第一题生成完毕
  QUESTIONING --> QUESTIONING: 追问（≤2 次 / 题）或下一题
  QUESTIONING --> CLOSING: 最后一题回答完毕
  CLOSING --> REPORTING: 用户点击生成报告
  REPORTING --> FINISHED: 报告落库
  FINISHED --> [*]

  note right of QUESTIONING
    暂存与恢复：消息与游标实时落库，
    任意时刻离开后重新进入
    即从当前题目与追问深度继续
  end note
```

## 关键实现入口

| 能力 | 说明 | 代码入口 |
| --- | --- | --- |
| 面试 FSM | 状态迁移与追问硬约束（纯函数） | [lib/engine/fsm.ts](lib/engine/fsm.ts) |
| 简历解析 | Function Calling Schema 与 Prompt | [lib/engine/prompts.ts](lib/engine/prompts.ts) · [app/api/interviews/route.ts](app/api/interviews/route.ts) |
| LLM 客户端 | 强制函数调用 / 流式对话封装 | [lib/engine/llm.ts](lib/engine/llm.ts) |
| SSE 服务端 | 增量事件输出与统一事件协议 | [lib/engine/sse.ts](lib/engine/sse.ts) |
| SSE 前端 | 半包缓冲与事件解析 | [lib/client/sse.ts](lib/client/sse.ts) |
| 回答处理 | 评估 → FSM 决策 → 流式下一轮 | [app/api/interviews/[id]/answer/route.ts](app/api/interviews/[id]/answer/route.ts) |
| TTS | 服务端代理合成 / 前端播放管理 | [app/api/tts/route.ts](app/api/tts/route.ts) · [lib/client/use-tts.ts](lib/client/use-tts.ts) |
| 语音回答 | Web Speech 录音与文本回填 | [lib/client/use-speech-input.ts](lib/client/use-speech-input.ts) |
| 虚拟列表 | 长对话渲染与自动跟随 | [components/interview-room.tsx](components/interview-room.tsx) |
| 报告生成 | 汇总问答与评估生成结构化报告 | [app/api/interviews/[id]/report/route.ts](app/api/interviews/[id]/report/route.ts) |
| 认证与会话 | 登录、JWT Session Cookie | [app/api/auth/login/route.ts](app/api/auth/login/route.ts) · [lib/auth/session.ts](lib/auth/session.ts) |

## 本地运行

前置要求：Node.js 20+、[pnpm](https://pnpm.io/)、Docker Desktop。

```powershell
# 1. 克隆并安装依赖
git clone <repo-url> ace-it
cd ace-it
pnpm install

# 2. 配置环境变量（填入 DASHSCOPE_API_KEY，其余默认值可直接用于本地）
Copy-Item .env.example .env

# 3. 启动 PostgreSQL
docker compose up -d

# 4. 初始化数据库并写入 Demo 账号
pnpm prisma migrate dev
pnpm prisma db seed

# 5. 启动开发服务器
pnpm dev
```

打开 http://localhost:3000，使用 Demo 账号登录（登录页已自动填充）：

| 账号 | 密码 |
| --- | --- |
| `demo` | `demo123` |

macOS / Linux 用户将第 2 步替换为 `cp .env.example .env` 即可，其余命令相同。

| 环境变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串，docker compose 默认对应 `postgresql://postgres:postgres@localhost:5432/ai_interview` |
| `SESSION_SECRET` | 是 | Session JWT 签名密钥，32 位以上随机字符串 |
| `DASHSCOPE_API_KEY` | 是 | 阿里云百炼 API Key，驱动 `qwen-plus` 对话与 `qwen3-tts-flash` 语音合成 |

## License

[MIT](LICENSE)
