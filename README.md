# Ace It

Ace It is an AI mock interview assistant built from an existing streaming chat foundation. The current MVP supports creating interview sessions from a target position, difficulty, and resume/JD/project material, then entering a dedicated interview room.

## Current MVP

- Create interview sessions with role, difficulty, and source material.
- Persist interview sessions and materials with PostgreSQL and Prisma.
- View interview history and reopen a saved interview room.
- Keep the existing streaming chat foundation available for later AI interview flow reuse.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS + shadcn/ui-style components
- Zustand
- PostgreSQL + Prisma
- NextAuth

## Development

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Required environment variables:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/aceit"
AUTH_SECRET="your-secret-key"
SILICONFLOW_API_KEY="your-api-key"
```

## Product Roadmap

1. Generate the first AI interview question inside `/interviews/[id]`.
2. Save interview questions and user answers.
3. Add follow-up questions and scoring.
4. Generate a structured interview report.
5. Add file upload and RAG over resume/JD/project materials.
6. Deploy with PostgreSQL, Nginx, HTTPS, and a public domain.
