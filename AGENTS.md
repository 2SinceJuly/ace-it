# Ace It Agent Notes

这个文件是给 Claude Code、Codex 等 AI 编程助手看的项目说明。

如果你是新的 AI 窗口，先阅读：

- `docs/PROJECT_PROGRESS.md`

那里记录了当前做到哪一步、上次做了什么、下一步该做什么。

## 项目当前方向

当前目标不是从 0 到 1 重做模拟面试平台，而是把原 AI 对话平台做产品域迁移：保留已经搭好的模拟面试页面外壳和核心流程，复用原 `/chat` 已跑通的能力，把入口和数据归属逐步迁到 interview 域。

阶段 2 的目标闭环：

```text
创建面试 -> 进入面试房间 -> AI 出题 -> 用户回答 -> AI 点评/追问 -> 刷新后记录仍然存在
```

后续迁移原则：

- 不要重新实现上传、语音、思考模式、联网搜索、模型选择、Markdown、SSE、消息渲染、分享、导出这些能力；优先复用原 chat 已跑通的实现。
- 每个后续迁移切片必须先检查 chat 是否已有成熟实现；如果已有，优先并入/改造，不允许重写一套 interview 版轮子。
- 上传能力复用 `/api/upload`，新增 `purpose=interview-material`，并补 `InterviewMaterialFile` 元信息表来记录 interview 域归属。
- 语音能力复用现有 voice hooks / speech API，接到面试回答输入框。
- 思考模式和联网搜索复用 chat 发送框旁边的开关逻辑，放到面试房间发送区。
- 模型选择复用现有模型选择能力，放到创建面试页的题量 / 时长 / 难度配置区。
- Markdown / SSE / 消息渲染继续复用 chat 已有实现，不要急着复制一套 interview 专用实现。
- 分享 / 导出保留能力，但数据源从 `Conversation` / `Message` 改为 `InterviewSession` / `InterviewMessage`。
- `/chat` 先重定向到 `/interviews`；等上述能力都迁到 interview 域后，再删除通用聊天页面和 `Conversation` / `Message` 模型。

## 常用命令

Windows / PowerShell 下优先使用 `.cmd` 命令：

```powershell
pnpm.cmd db:generate
pnpm.cmd db:migrate
npm run build
```

本地数据库来自 Docker Postgres，当前见过的容器名是：

```text
tide-ai-postgres
```

## 重要规则

- 不要随便执行 `prisma migrate reset`，这会清空本地数据库。
- `/chat` 现在仍然保留；先做重定向和能力迁移，等 interview 域接住原 chat 能力后再删除通用聊天页面和旧数据模型。
- 当前任务重点是“产品域迁移 + 数据归属调整”，不要把原 chat 已跑通的能力当新功能重造。
- 阶段 3 的产品收口和清理，要等阶段 2 完整可用、且 chat 能力迁移完成后再做。
- 修改前先看 `docs/PROJECT_PROGRESS.md`，确认当前阶段和下一步。
- 每次完成一段实质工作后，更新 `docs/PROJECT_PROGRESS.md`。
- 涉及架构决策、产品流程取舍、数据模型变更、异步/同步方案、第三方服务接入方式、测试体系或 CI/CD 引入时，必须先列出方案、影响和推荐理由，由用户明确拍板后再实现；不要替用户默认决定。
- 每次完成或交接时，必须明确写清楚“已完成什么、验证了什么、还没有实现什么、下一步建议是什么”，避免用户反复追问当前进度。

## 当前已知状态

截至 2026-06-29：

- 阶段 2，提交 1：持久化面试消息，已完成并验证。
- 数据库已成功应用 `20260628100000_add_interview_messages`。
- `npm run build` 已通过。
- 阶段 2，提交 2：AI 面试出题和回答流程，已完成并 build 通过。
- 面试房间页面外壳、SSE 流式输出、Markdown 渲染、报告生成、历史面试、删除和 UI 收口已推进多轮；最新细节以 `docs/PROJECT_PROGRESS.md` 为准。
- 当前方向已调整为复用原 chat 能力做 interview 域迁移，下一步不要重新实现上传、语音、联网搜索、思考模式、模型选择、分享或导出。
