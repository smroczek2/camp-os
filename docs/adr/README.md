# Architecture Decision Records (ADRs)

This directory contains records of architectural decisions made for this project.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:
- **Title**: Short descriptive title
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: What is the issue we're seeing that is motivating this decision?
- **Decision**: What is the change that we're proposing/doing?
- **Consequences**: What becomes easier or more difficult to do because of this change?

## ADRs in this project

- [ADR-0001](./0001-use-better-auth.md) - Use Better Auth for authentication
- [ADR-0002](./0002-drizzle-over-prisma.md) - Use Drizzle ORM instead of Prisma
- [ADR-0003](./0003-nextjs-app-router.md) - Use Next.js App Router
- [ADR-0004](./0004-vercel-ai-sdk.md) - Use Vercel AI SDK for AI integration
- [ADR-0005](./0005-shadcn-ui.md) - Use shadcn/ui for UI components

## Creating a new ADR

1. Copy `template.md`
2. Name it `XXXX-short-title.md` (incrementing number)
3. Fill in the sections
4. Update this README
5. Commit with the code changes

## Why ADRs?

ADRs help:
- **New team members** understand why things are the way they are
- **AI coding assistants** understand project constraints and decisions
- **Future you** remember context when revisiting decisions
- **Avoid rehashing** old discussions
