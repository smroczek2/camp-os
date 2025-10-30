# Claude Code Skills

This starter kit includes specialized Claude Code skills that make Claude better at building features for this specific project.

## What Are Skills?

Skills are **automatically activated** by Claude when your requests match their purpose. You don't invoke them manually - Claude uses them to understand your tech stack, ask smart questions, and build features properly.

## The 4 Skills

### 1. **starter-kit-intelligence**
Deep knowledge of your tech stack and how everything is wired together.

**What Claude knows:**
- Next.js 15 + React 19 + TypeScript setup
- Better Auth with Google OAuth (already configured)
- Drizzle ORM + PostgreSQL (ready to extend)
- Vercel AI SDK + OpenAI (configured with env var)
- shadcn/ui components (installed and ready)
- Project structure and integration patterns

**Why it matters:** Claude understands what's already set up and how to extend it properly.

---

### 2. **smart-clarifier**
Asks 2-3 critical questions before building to avoid mistakes.

**What Claude asks about:**
- Scope and boundaries
- Data model and relationships
- Authentication requirements
- AI or external integrations

**Why it matters:** Better to clarify upfront than build the wrong thing.

---

### 3. **feature-builder**
Plans and implements features that integrate seamlessly.

**What Claude does:**
- Designs data models that work with existing schema
- Creates API routes with proper authentication
- Builds UI with shadcn/ui components
- Ensures security (session checks, user ownership)
- Produces working code (no tests unless requested)

**Why it matters:** Features work together with existing auth, database, and AI systems.

---

### 4. **ui-developer**
Ensures polished, consistent UI with responsive design and reusability.

**What Claude does:**
- Uses shadcn/ui components following the design system
- Applies Tailwind CSS with semantic color tokens
- Implements responsive, mobile-first layouts
- Builds accessible, composable components
- Handles loading states, errors, and empty states
- Maintains consistency across the application

**Why it matters:** UI stays consistent, accessible, and integrates perfectly with the existing design system.

---

## How It Works

Just describe what you want to build:

```
You: "I want to add a blog feature where users can create posts"

Claude: [smart-clarifier activates]
"Let me ask a few questions to make sure I understand:

1. Should posts be private to each user or public?
2. What content should posts support - just text, or text + images?
3. Should there be drafts or just published posts?"

You: "Public posts with text and images, and draft support"

Claude: [feature-builder activates, using starter-kit-intelligence]
"Got it! I'll build a blog feature that:
- Uses the existing auth system
- Adds a posts table to the database
- Creates API routes for CRUD operations
- Builds the UI with shadcn components

Let me start..."
```

No commands to remember. No workflow to learn. Just describe what you want.

## For Developers

Skills are Claude Code's native extensibility feature. They're markdown files with YAML frontmatter that guide Claude's behavior.

Learn more: [Claude Code Skills Documentation](https://docs.claude.com/en/docs/claude-code/skills)
