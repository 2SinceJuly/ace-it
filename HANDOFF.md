# Ace It 项目交接文档（给 Codex / 新 AI 助手）

> 交接时间：2026-06-28 13:54 ｜ 项目根目录：`C:\Users\29293\Desktop\QZ\Tide-AI`
> 上一棒：WorkBuddy（GLM-5.2）已完成 Part A 全部工作，下一步交给 Codex

---

## 一、项目基本盘

### 1.1 产品定位
**Ace It**（前身 Tide-AI）— AI 模拟面试平台 MVP，目标用户是中国求职者。从通用聊天应用改造而来，保留原 chat 模块作为底层能力，模拟面试是新的主入口。

### 1.2 技术栈
- **框架**：Next.js 15.1.6 App Router + React 19.2.0 + TypeScript
- **数据库**：PostgreSQL（Docker 容器，**实际容器名 `tide-ai-postgres`**，端口 5433→5432，用户/库/密码 = `tideai/password123/tideai`）
- **ORM**：Prisma 6.19（prisma.config.ts 不自动加载 .env，所有 prisma 命令必须带 dotenv 前缀）
- **认证**：Auth.js v5（NextAuth）+ 双轨 JWT（jose）+ HttpOnly Cookie。支持 Google/GitHub OAuth 弹窗 + 邮箱登录
- **状态**：Zustand
- **UI**：Tailwind + shadcn/ui（new-york 风格）+ next-themes 双主题
- **AI**：硅基流动 API（模型 `zai-org/GLM-4.6`，enableThinking:false）
- **图表**：recharts（已装，用于未来报告页）
- **Markdown**：react-markdown + remark-gfm + rehype-highlight + rehype-raw

### 1.3 关键目录约定
- `app/` — 页面 + API 路由（App Router）
- `features/` — 按功能模块组织（chat/conversation/auth/share/voice/interview），每模块含 components/store/services
- `components/ui/` — shadcn/ui 组件库（当前 16 个组件）
- `components/` — 通用组件（MainLayout/Header/Sidebar 等）
- `server/` — 服务端代码（auth/db/services/repositories）
- `prisma/schema.prisma` — 数据模型
- `lib/monitor/` — 监控（import `@jerry_aurora/sky-monitor-sdk` npm 包，**不是** `@/lib/monitor/sky-monitor` 这个已删除的路径）
- `docs/` — **被 .gitignore 排除**，PROJECT_PROGRESS.md 不入 git 但本地保留

### 1.4 启动命令（Windows）
```bash
# 启动数据库（已配置好的 Docker 容器，开机自启）
docker start tide-ai-postgres

# 启动 dev server（必须 NODE_OPTIONS= 解决 Win11 环境变量冲突）
NODE_OPTIONS= pnpm.cmd dev
# 注意：端口 3000/3001 可能被旧进程占用，新实例会自动跳到 3002/3003
# 关掉旧 node 进程：任务管理器找 node.exe 全部结束，或 netstat -ano | grep :3000 找 PID kill

# 数据库命令（必须 dotenv 前缀）
pnpm.cmd db:generate      # prisma generate
pnpm.cmd db:migrate       # prisma migrate dev
pnpm.cmd db:seed          # 灌种子数据

# Build & Lint
npm run build
pnpm.cmd lint             # ESLint，当前 4 个 warning（原本就有）
```

### 1.5 测试账号
- `admin` / `admin`（仅 username+password，无 email，走 /api/auth/login JWT 分支）

---

## 二、当前 Git 状态（截止 2026-06-28 13:54）

### 2.1 已完成的 4 个 commit（本地领先 origin/main 4 个）
```
799a0fe chore: stabilize foundation - ESLint fix, auth hardening, docs   ← CP-A3
a521783 chore(interview): make mock interview the primary entry point   ← CP-A2
a5ac157 feat(interview): wire AI question/feedback flow via server actions  ← CP-A1
a2079fc feat: persist interview messages
```

**工作区当前干净**，没有未提交改动。**未 push 到 GitHub**（origin = `2SinceJuly/ace-it`）。

### 2.2 Part A 完成清单
| 任务 | 状态 |
|---|---|
| A1 commit 拆分（防代码丢失） | ✅ CP-A1 + CP-A2 两个 commit |
| A2 dev server 验证 | ✅ 页面 HTTP 200（但用户手测 8 步闭环被打断，**未完成**） |
| A3 AGENTS.md 状态修正 | ✅ 品牌 Tide-AI→Ace It；提交2状态更正 |
| A4 ESLint 治本 | ✅ 加 `eslint-plugin-react-hooks@5.1.0` 到 devDependencies + pnpm.overrides |
| A5 安全修复 | ✅ .env 加 JWT_SECRET；middleware 加 `/interviews/:path*` 鉴权 |
| CP-A3 commit | ✅ `chore: stabilize foundation` |

### 2.3 A4 根因（与原计划不同，重要！）
原计划说锁 `5.1.3`——**这个版本不存在**。真正根因不是 5.2.0 的 bug，而是：

> 全局 `C:\Users\29293\node_modules\eslint-plugin-react-hooks@4.6.2`（用户主目录的全局安装）被 eslint 错误加载，4.6.2 用了 eslint 9.39 已移除的 `context.getSource` API → 崩溃。

**解决方案**：`package.json` 显式加 `eslint-plugin-react-hooks@5.1.0` 到 devDependencies，pnpm 链接到项目顶层 node_modules，优先于全局版本。

---

## 三、未完成的工作（Codex 接手的起点）

### 3.1 ⚠️ 用户手测 8 步闭环（最高优先，未完成）

Part A 期间遇到两次 dev server 缓存导致的黑屏问题，用户手测被打断。**Codex 接手后第一件事**：确认 dev server 跑起来，让用户完成手测。

**8 步检查清单**：
1. [ ] 登录后 `/` 重定向到 `/interviews`（不是 `/chat`）
2. [ ] `/interviews` 列表加载/空状态正常
3. [ ] `/interviews/new` 填表提交跳 `/interviews/[id]`
4. [ ] 点 `Start AI interview` 看到第一题（3-8 秒）
5. [ ] 输入回答 Submit 看到 AI 点评+追问
6. [ ] F5 刷新历史消息仍在
7. [ ] chat 侧边栏点"新建模拟面试"进 `/interviews/new`
8. [ ] `/interviews/new?context=xxx` JD 框预填

任一步失败 → 不进 Part B，先修闭环。

### 3.2 已知的两个坑（必看）

**坑 1：dev server 端口占用**
当前 3000/3001/3002 三个端口都被 node.exe 占用（旧进程没清理）。新启动的 dev server 会跳到 3003。**建议先让用户在任务管理器结束所有 node.exe，再重启 dev**，保证只用一个端口。

**坑 2：build 后不能直接 dev**
`npm run build` 后 `.next/` 是 build 产物，直接 `pnpm.cmd dev` 会和 dev 模式的 webpack 缓存冲突，导致静态资源 404 → 页面黑屏。
**正确顺序**：`rm -rf .next` → `pnpm.cmd dev`。

**坑 3：浏览器缓存残留**
`@/lib/monitor/sky-monitor` 这个路径在源码里**不存在**（已重构为 npm 包），但浏览器/dev 缓存里还引用它，导致 chunk 加载失败 → 级联 9 个错误。
**解决方案**：让用户用**隐身窗口**打开 dev server 地址，或在 DevTools → Application → Clear site data。

---

## 四、未来计划：Part B（核心，下一个工作）

### 4.1 目标
把面试房间从"server action 整段返回"升级为"SSE 流式 + Markdown 渲染"。这是用户最痛的体验短板，复用 chat 模块已有的流式管道，成本最低收益最大。

### 4.2 目标架构
```
现状: InterviewRoom --await--> submitInterviewAnswer(action) --createChatCompletionText--> 整段返回
目标: InterviewRoom --fetch--> /api/interviews/[id]/stream --createChatCompletion--> reader --> SSE流 --> 客户端 StreamBuffer --> MessageContent(流式)
```

### 4.3 分步实施

**B1. 服务端流式 API**
- 新建 `app/api/interviews/[id]/stream/route.ts`（仿 `app/api/chat/route.ts`，POST 处理）
- 新建 `server/services/interview/interview-stream.service.ts`（仿 `chat.service.ts` 的 handleChatRequest）
- 新建 `server/services/interview/interview-stream.handler.ts`（**面试专用精简版，~60 行**）
  - ✅ 复用：`SSEWriter`（`server/services/chat/sse-writer.ts`）、`lib/utils/sse.ts` 的 splitSSEBuffer/parseSSELine
  - ❌ 不复用 `createSSEStream`（其 persistMessage 硬编码写 Message 表，面试要写 InterviewMessage 表）
  - 自写：读 reader chunk → delta.content 调 `writer.sendAnswer` → done 调 `InterviewRepository.addAssistantReplyAndMarkInProgress` 持久化

**B2. AI service 改签名**
`server/services/interview/interview-ai.service.ts`：
```ts
// 现状: Promise<string>（用 createChatCompletionText）
// 改为: Promise<{ reader, messages }>（用 createChatCompletion 返回 raw reader）
generateFirstQuestion(apiKey, interview): Promise<{ reader, messages }>
generateFeedbackAndFollowUp(apiKey, interview, answer): Promise<{ reader, messages }>
```
**prompt 构造逻辑完全不动**，只换底层调用。

**B3. 客户端流式消费**
复用 chat 资产（直接 import，不搬动）：
- `features/chat/utils/sse-parser.ts` 的 `SSEParser.parseStream` — fetch+ReadableStream 消费
- `features/chat/utils/stream-buffer.ts` 的 `StreamBuffer` — rAF 节流渲染

改造 `features/interview/store/interview.store.ts` 加流式状态：
```ts
streamingMessageId: string | null
streamingPhase: 'idle' | 'thinking' | 'answering'
startInterviewStream(id) / submitAnswerStream(id, content) / abortStream() / appendStreamingContent(id, chunk)
```
**不用 FSM 状态机**（chat 的 5 态过重），store 里直接用三态字符串切换。

**B4. Markdown 渲染接入**
直接 import `features/chat/components/MessageContent`，替换 `<p className="whitespace-pre-wrap">`：
```tsx
<MessageContent content={message.content} isStreaming={/* 流式目标消息 */} />
```
**补 hljs 代码高亮样式**（必做）：`app/globals.css` 末尾追加亮色+暗色 hljs 主题（从 highlight.js/styles/atom-one-{light,dark}.css 拷贝）。当前 globals.css **无 .hljs 样式块**。

**B5. 组件拆分**
`features/interview/components/InterviewRoom/index.tsx`（252 行单文件）拆成：
```
InterviewRoom/
  index.tsx                    // 容器：loadInterview + 状态编排 + 流式接入（~120行）
  InterviewMessageList.tsx     // 消息列表（含流式临时气泡）
  InterviewMessageBubble.tsx   // 单条气泡：头像 + MessageContent
  InterviewAnswerInput.tsx     // 底部 textarea + Submit/Stop（自写轻量）
  InterviewMaterialPanel.tsx   // 右侧材料侧栏
  InterviewRoomHeader.tsx      // 顶部：position/difficulty/status + Start/End
```

**B6. 数据模型：零 migration**
- thinking 字段不加（enableThinking:false）
- phase 字段不加（留到复盘报告阶段）
- 结论：Part B 不动数据库

**B7. Part B commit 拆分**
- `CP-B1` `refactor(interview-ai): return reader, add stream service + route`
- `CP-B2` `feat(interview): stream SSE to room + markdown rendering`
- `CP-B3`（可选）`feat(interview): add End Interview button + completed status`

---

## 五、未来计划：Part C 及以后

### 5.1 Part C：应用外壳（B 之后，适合请 UI 专家）

`/interviews/*` 当前不渲染 Sidebar/Header，导航断层。方案：
```tsx
// app/interviews/[id]/page.tsx
<AuthGuard redirectTo="/">
  <MainLayout sidebar={<InterviewSidebar/>} header={<InterviewHeader/>}>
    <InterviewRoom interviewId={id} />
  </MainLayout>
</AuthGuard>
```
- 复用 `components/MainLayout`（已存在，chat 页在用）
- 新建 `features/interview/components/InterviewSidebar`（新建按钮+面试列表）
- 新建 `features/interview/components/InterviewHeader`（岗位+难度+计时器+主题切换+用户菜单，**不依赖 useChatStore**）
- 主题切换：next-themes 已全局接入，套 MainLayout 后自动可用

### 5.2 阶段3：复盘报告（MVP 差异化核心）

参考 Face It (limp.top) 的报告体系：
- **统计卡片行**：完成次数 / 平均分 / 最高分 / 最近得分 / 提升幅度
- **历史趋势折线图**：X轴日期 Y轴分数，面积填充（用 recharts）
- **能力雷达图**：5维度（技术/知识/表达/逻辑/匹配），六边形雷达图
- **亮点与优势 vs 短板与建议**：左右两栏对比
- **推荐练习与掌握度**：知识点卡片
- **历史场次表格**：时间/得分/题量/时长/操作

数据模型新增 `InterviewReport`：overallScore/technicalDepth/communication/projectAuthenticity/strengths/weaknesses/suggestions/recommendedFollowUps。

### 5.3 阶段路线图（修正后优先级）

| 顺序 | 阶段 | 优先级 |
|---|---|---|
| 1 | Part A 稳定基础 | ✅ 已完成 |
| 2 | Part B 流式+markdown | 必做（Codex 下一步） |
| 3 | Part C 应用外壳 | 高 |
| 4 | 阶段3 复盘报告 InterviewReport | 高 |
| 5 | 阶段5 简历/JD 上传 | 中 |
| 6 | 阶段6 UI 产品化（移动端） | 中 |
| 7 | 阶段7 部署上线 | 中 |
| 8 | 阶段8 RAG 增强 | 低（长期） |

---

## 六、用户的产品构想与 UI 方向（重要！）

### 6.1 用户身份与目标
- 用户名：肖洪进，面前端岗位实习
- 项目用途：写简历用（部署网址，不写 github）
- 技术水平：前端还在学，**不学 Java**（已明确）
- 语言：**全部中文界面**，面向中国用户

### 6.2 三个参考网站

**① Face It (limp.top)** — 面试分析报告的样板
- 来源：基于开源 [nageoffer/ragent](https://github.com/nageoffer/ragent)（企业级 RAG 平台，Java+React）改造
- 借鉴点：雷达图、趋势折线图、统计卡片、亮点vs短板两栏、推荐练习、历史表格
- 在 Ace It 中对应：阶段3 复盘报告

**② Huru AI (appv2.huru.ai)** — 整体 UI 风格参考
- 左侧固定深色导航栏（~220px）+ 右侧主区
- 岗位卡片网格（图标+名称+"探索面试"+题数标签）
- 暖色调珊瑚橙主色（#F0997B），圆角大卡片
- 在 Ace It 中对应：Part C 应用外壳 + 模拟面试入口页

**③ interview-guide (Snailclimb)** — 不 fork，仅参考 RAG 架构思路
- Java Spring Boot 4 + Java 21 + Spring AI 2.0 + pgvector + Redis Stream + SSE + WebSocket 语音面试
- 用户已明确**不 fork**，理由：面前端岗位，Java 后端黑盒面试讲不透
- 可参考的架构思路：文档分块+向量化+查询改写+TopK+阈值过滤

### 6.3 用户的产品构想（已确认）

**左侧三入口导航**：
```
┌─────────────────┐
│   Ace It        │
├─────────────────┤
│ 🎯 模拟面试     │ ← 参考 Huru 选岗即开面
│   选岗后直接进入 │    Part B 先跑通这个
├─────────────────┤
│ 📋 定制面试     │ ← 上传 JD/项目文档
│   RAG 出题      │    阶段8 长期目标
├─────────────────┤
│ 📊 面试分析     │ ← 参考 Face It 报告
│   雷达图·趋势   │    阶段3 Part B 之后
├─────────────────┤
│ 👤 用户信息     │
└─────────────────┘
```

### 6.4 UI 设计决策
1. **整体风格**：参考 Huru AI 的左右分栏布局（左侧固定深色导航 + 右侧主区）
2. **模拟面试入口页**：参考 Huru 的岗位卡片网格，用 shadcn/ui Card 实现（不用插画）
3. **面试房间**：Part B 流式改造后的双栏（消息流+材料侧栏）
4. **面试分析页**：参考 Face It 完整报告体系，用 recharts 实现
5. **全部中文界面**
6. **RAG 定制面试**：留到核心闭环稳定后再做

### 6.5 已安装的资源

**taste-skill（防 AI 化 UI 设计 skill）**
- 用户特别要求安装，防止生成的 UI 太"AI 化"
- 位置：`C:\Users\29293\.workbuddy\skills\taste-skill\SKILL.md`
- 使用方式：做 UI 改造前先读这个 skill，它有 anti-slop 规则、设计系统选择指南、Three Dials 配置（VARIANCE/MOTION/DENSITY）
- 仓库还有 redesign-skill/brandkit/brutalist-skill 等多个 UI skill，按需从 `C:\Users\29293\.workbuddy\skills\` 安装

**recharts**：已在 dependencies，做报告页直接用

---

## 七、用户明确说过的偏好（重要约束）

1. **不要 fork interview-guide**：继续 Ace It，RAG 架构思路可参考但代码自己写
2. **不学 Java**：面前端岗位，Next.js 全栈够用，后端能力用 Node.js 生态补
3. **全部中文界面**：面向中国用户
4. **简历只写部署网址，不写 github**
5. **先 Part A 稳定基础再 Part B 流式**：不要直接上 RAG，不要先部署
6. **房间页体验升级优先**：复用 chat 的 SSE 流式 + MessageContent markdown 渲染
7. **UI 防止 AI 化**：用 taste-skill 指导 UI 设计
8. **改 UI 前先 commit + 手测**：避免代码丢失
9. **dev server 启动必须 `NODE_OPTIONS= pnpm.cmd dev`**：Win11 环境变量冲突
10. **不要随便 `prisma migrate reset`**：会清空本地数据库

---

## 八、Codex 接手后的建议工作流

### 第 1 步：环境验证（5 分钟）
```bash
cd C:/Users/29293/Desktop/QZ/Tide-AI
git status                  # 确认工作区干净
git log --oneline -6        # 看到 799a0fe 是最新 commit
docker ps | grep postgres   # 确认 tide-ai-postgres 在跑
```

### 第 2 步：清理端口 + 启动 dev
```bash
# 让用户在任务管理器结束所有 node.exe，或：
# Windows: netstat -ano | findstr :3000 → taskkill /PID xxx /F
rm -rf .next                # 必须删，避免缓存冲突
NODE_OPTIONS= pnpm.cmd dev  # 监听 3000
```

### 第 3 步：让用户手测 8 步闭环（用隐身窗口）
见第三节 3.1 的 8 步清单。任一步失败先修。

### 第 4 步：进入 Part B
手测通过后，按第四节 4.3 的 B1-B7 顺序实施。建议每个子步骤单独 commit。

### 第 5 步：UI 改造时读 taste-skill
做 Part C 或阶段3 报告页前，先读 `C:\Users\29293\.workbuddy\skills\taste-skill\SKILL.md`，按它的 anti-slop 规则做设计。

---

## 九、关键文件清单（绝对路径）

### Part A 已改（4 个 commit 已提交）
- `AGENTS.md` — 品牌+状态修正
- `package.json` — ESLint 治本
- `eslint.config.mjs` — 移除绕过
- `middleware.ts` — 加 /interviews 鉴权
- `.env` — 加 JWT_SECRET

### Part B 将新建
- `app/api/interviews/[id]/stream/route.ts`
- `server/services/interview/interview-stream.service.ts`
- `server/services/interview/interview-stream.handler.ts`
- `features/interview/components/InterviewRoom/InterviewMessageList.tsx`
- `features/interview/components/InterviewRoom/InterviewMessageBubble.tsx`
- `features/interview/components/InterviewRoom/InterviewAnswerInput.tsx`
- `features/interview/components/InterviewRoom/InterviewMaterialPanel.tsx`
- `features/interview/components/InterviewRoom/InterviewRoomHeader.tsx`

### Part B 将改造
- `server/services/interview/interview-ai.service.ts`（改签名）
- `features/interview/store/interview.store.ts`（加流式状态）
- `features/interview/components/InterviewRoom/index.tsx`（拆分）
- `app/globals.css`（补 hljs 样式）

### Part B 直接 import 复用（不动）
- `features/chat/components/MessageContent/index.tsx`
- `features/chat/utils/stream-buffer.ts`
- `features/chat/utils/sse-parser.ts`
- `server/services/chat/sse-writer.ts`
- `lib/utils/sse.ts`
- `server/services/ai/siliconflow.ts`（createChatCompletion）

### 必读文档
- `AGENTS.md` — 项目说明（已修正品牌和状态）
- `docs/PROJECT_PROGRESS.md` — 进度记录（被 gitignore 排除但本地保留）
- `C:\Users\29293\.workbuddy\plans\toasty-nebula-tesla.md` — Part A-E 完整实施计划
- `C:\Users\29293\.workbuddy\skills\taste-skill\SKILL.md` — UI 设计 anti-slop skill

---

## 十、一句话总结

**Part A 已完成（4 commit），用户手测被打断未完成，dev server 端口混乱。Codex 接手后：先清端口+重启 dev+让用户用隐身窗口完成 8 步手测，然后进 Part B 把面试房间从 server action 改成 SSE 流式+Markdown 渲染（复用 chat 已有管道），之后再做 Part C 外壳和阶段3 复盘报告。全程中文界面，UI 参考 Huru+Face It，用 taste-skill 防 AI 化。**
