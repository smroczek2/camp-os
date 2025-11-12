# CLAUDE.md

**Claude Code specific instructions for this repository**

For universal project guidelines, architecture, and patterns, see **AGENTS.md**.

This file contains Claude Code specific workflows, skills, and tool usage instructions.

---

## Primary Documentation

**READ AGENTS.md FIRST** - Contains comprehensive project architecture, patterns, security requirements, and development workflows.

This file (CLAUDE.md) contains only Claude Code specific instructions.

---

## Claude Code Skills & Workflow

### Smart Clarifier Skill

**CRITICAL: When using the `smart-clarifier` skill, you MUST use the `AskUserQuestion` tool to present questions.**

- **Never** output clarifying questions as plain text
- **Always** use the `AskUserQuestion` tool with proper structure:
  - Present 1-7 questions using the tool
  - Each question should have 2-4 concrete options
  - Include your recommendation for each question
  - Set appropriate `multiSelect` values

**Example Pattern:**
```
When smart-clarifier skill activates:
1. Analyze the feature request
2. Identify 1-7 critical questions
3. Call AskUserQuestion tool with structured options
4. Wait for user response
5. Proceed with implementation
```

**Why this matters:** The `AskUserQuestion` tool provides a much better UX with clickable options, prevents misunderstandings, and ensures consistent question formatting.

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production (includes database migration)
- `npm run start` - Start production server

### Quality Checks
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- **Always run the LINT and TYPECHECK scripts after completing your changes. This is to check for any issues.**

### Database Operations
- `npm run db:generate` - Generate database migrations from schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database (alias: `db:dev`)
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:reset` - Reset database (drop all tables and push schema)

---

## Additional Resources

- **AGENTS.md** - Primary documentation (universal patterns, architecture, security)
- **docs/** - Additional documentation
- **README.md** - Setup and getting started
- **.claude/skills/** - Claude Code skills

---

**Remember**: Read AGENTS.md for comprehensive project patterns. This starter kit is designed for rapid, secure development. Follow the patterns, check authentication, validate input, and always filter by userId.
