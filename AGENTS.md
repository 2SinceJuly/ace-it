# Tide-AI Agent Notes

这个文件是给 Claude Code、Codex 等 AI 编程助手看的项目说明。

如果你是新的 AI 窗口，先阅读：

- `docs/PROJECT_PROGRESS.md`

那里记录了当前做到哪一步、上次做了什么、下一步该做什么。

## 项目当前方向

当前目标是把 Tide-AI 从通用聊天应用，逐步改成一个 AI 模拟面试 MVP。

阶段 2 的目标闭环：

```text
创建面试 -> 进入面试房间 -> AI 出题 -> 用户回答 -> AI 点评/追问 -> 刷新后记录仍然存在
```

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
- `/chat` 现在仍然保留，面试 MVP 完整跑通前不要删除。
- 阶段 3 的产品收口和清理，要等阶段 2 完整可用后再做。
- 修改前先看 `docs/PROJECT_PROGRESS.md`，确认当前阶段和下一步。
- 每次完成一段实质工作后，更新 `docs/PROJECT_PROGRESS.md`。

## 当前已知状态

截至 2026-06-28：

- 阶段 2，提交 1：持久化面试消息，已完成并验证。
- 数据库已成功应用 `20260628100000_add_interview_messages`。
- `npm run build` 已通过。
- 阶段 2，提交 2：AI 面试出题和回答流程，还未开始。
