---
name: smart-clarifier
description: Use when the user requests a new feature or describes something to build. Always asks 2-3 critical clarifying questions with recommendations before implementation to ensure you understand requirements correctly. Focuses on high-impact decisions like scope, data model, authentication requirements, and integrations. Makes smart assumptions for low-impact decisions.
---

# Smart Clarifier

When building features, always ask 2-3 critical clarifying questions before implementation. This ensures you understand requirements correctly and make good decisions about scope, architecture, and integration.

## When to Use This Skill

**Activate when:**
- User describes a feature to build
- User requests new functionality
- About to implement something non-trivial
- Requirements could be interpreted multiple ways

**Even if the request seems clear**, take a moment to ask clarifying questions. It's better to ask upfront than build the wrong thing.

## ⚠️ MANDATORY TOOL USAGE

**YOU MUST USE THE AskUserQuestion TOOL - NOT MARKDOWN TEXT**

When this skill is invoked:
1. Identify 2-3 critical questions to ask
2. **IMMEDIATELY call the AskUserQuestion tool** with those questions
3. Do NOT write out questions as markdown
4. The tool call IS your question - no explanation needed first

See the "Execution Flow Example" section below for the exact right vs wrong approach.

## Question Framework

Ask **exactly 2-3 questions**. No more, no less. Focus on:

### CRITICAL: Always Use AskUserQuestion Tool

**You MUST use the AskUserQuestion tool** to present these questions to the user. This provides an interactive UI where users can:
- Use arrow keys to navigate between options
- Select their choice and press Enter
- Provide custom answers if needed

**DO NOT** present questions as markdown text. Always use the interactive tool.

**Tool Structure:**
```json
{
  "questions": [
    {
      "question": "The complete question with a question mark?",
      "header": "Short Label",
      "multiSelect": false,
      "options": [
        {
          "label": "Short option name (1-5 words)",
          "description": "Detailed explanation of this option and its implications"
        }
      ]
    }
  ]
}
```

**Guidelines for AskUserQuestion:**
- **question**: Full question text, clear and specific
- **header**: Very short (max 12 chars) - shows as a tag/chip
- **multiSelect**: Usually false (only true if multiple options can apply)
- **options**: 2-4 options, each with concise label and detailed description
- **label**: Short (1-5 words) - what user sees in the list
- **description**: Explain what this means, tradeoffs, and your recommendation if applicable
- Mark your recommended option in the description with "(Recommended)" or similar

### High-Impact Areas (Always consider these):

1. **Scope & Boundaries**
   - What's included vs. excluded?
   - MVP vs. full feature?
   - Which user actions are supported?

2. **Data Model & Persistence**
   - What needs to be stored?
   - Relationships between entities?
   - Who owns the data (user-specific vs. global)?

3. **Authentication & Access**
   - Protected routes or public?
   - User-specific data or shared?
   - Different permissions for different users?

4. **Integrations & Dependencies**
   - Does this need AI capabilities?
   - External APIs or services?
   - Real-time features or standard request/response?

5. **User Experience**
   - Primary user flow?
   - Mobile, desktop, or both?
   - Real-time updates needed?

### Low-Impact Areas (Make smart assumptions):

- **Styling details** → Use shadcn/ui defaults and Tailwind
- **Error messages** → User-friendly, standard patterns
- **Validation** → Industry-standard (email format, required fields, etc.)
- **Performance** → Standard web app expectations
- **Loading states** → Standard spinners/skeletons

## Question Format

For each question, provide:

1. **Clear question** about a specific decision
2. **2-4 concrete options** with brief descriptions
3. **Your recommendation** with reasoning (1-2 sentences)
4. **Why it matters** - explain the impact of this choice

### Example Question Format Using AskUserQuestion Tool

```typescript
// Example: Asking about data ownership for a task management feature
{
  "questions": [
    {
      "question": "Should tasks be user-specific (each user has their own tasks) or team-based (shared across users)?",
      "header": "Data Scope",
      "multiSelect": false,
      "options": [
        {
          "label": "User-specific tasks",
          "description": "Each user has their own private task list. Simplest for MVP, works well with existing Better Auth user system. (Recommended)"
        },
        {
          "label": "Team-based tasks",
          "description": "Tasks are shared across users with permissions and assignments. More complex, requires role/permission system."
        },
        {
          "label": "Hybrid approach",
          "description": "Personal tasks plus optional team workspaces. Most flexible but highest complexity."
        }
      ]
    }
  ]
}
```

**Impact explanation:** Include in your message before calling the tool what each choice affects (database schema, UI complexity, permission systems, etc.)

## Question Selection Strategy

### Prioritize questions by impact:

1. **CRITICAL** - Fundamentally changes architecture or scope
   - User-specific vs. multi-tenant
   - Real-time vs. request-response
   - Public vs. authenticated
   - Data model structure

2. **HIGH** - Significantly affects implementation
   - Key user flows
   - Integration requirements (AI, external APIs)
   - Major feature scope decisions

3. **MEDIUM** - Some impact on implementation
   - UI patterns
   - Specific feature behaviors
   - Edge case handling

4. **LOW** - Minimal impact (make assumptions)
   - Styling preferences
   - Exact wording
   - Minor validation rules

**Choose your 2-3 questions from CRITICAL and HIGH categories only.**

## Making Smart Assumptions

For things you DON'T ask about, document your assumptions briefly:

```markdown
## Assumptions I'm Making:

- **Styling:** Using shadcn/ui components with default Tailwind styling
- **Validation:** Standard email/required field validation
- **Error handling:** User-friendly messages, log errors server-side
- **Loading states:** Standard spinners during async operations
- **Mobile:** Responsive design, mobile-first approach
```

## Recommendation Guidelines

**Always provide a recommendation** for each question based on:

1. **Simplicity** - Simpler option if both solve the problem
2. **MVP mindset** - What's needed now vs. later
3. **Existing patterns** - What fits the current tech stack
4. **Common use cases** - What's typical for this type of feature
5. **Risk reduction** - Lower complexity = lower risk

**Be opinionated but flexible.** The user can override your recommendation.

## Response Handling

After user answers all questions:

1. **Acknowledge answers:** "Got it! Building with [summary of decisions]"
2. **State assumptions:** Briefly mention what you're assuming
3. **Proceed to planning:** "Let me plan the implementation..."
4. **Transition to feature-builder skill**

## Anti-Patterns (What NOT to do)

❌ **Don't ask about things that don't matter:**
- "What color should the button be?"
- "Should we use a modal or a drawer?"
- "What should the error message say?"

❌ **Don't ask obvious things:**
- "Should we use TypeScript?" (it's configured)
- "Should we use Better Auth?" (it's set up)
- "Should protected routes require login?" (obviously yes)

❌ **Don't ask more than 3 questions:**
- Overwhelming for user
- Most things can be assumed or iterated on

❌ **Don't ask without providing recommendations:**
- User shouldn't have to make every decision
- You're the expert on technical tradeoffs

❌ **Don't skip this step:**
- Even if request seems clear, ask 2-3 questions
- Prevents building the wrong thing

## Execution Flow Example

**CRITICAL: This shows the EXACT process you must follow**

```
User: "I want to add magic link authentication"

❌ WRONG APPROACH:
Assistant: Let me ask some questions:
## Question 1: ...
[writes out markdown questions]

✅ CORRECT APPROACH:
Assistant: I'll help you add magic link authentication! I need to clarify a few things first.
[Immediately uses AskUserQuestion tool with 2-3 questions]
[Tool renders interactive UI for user to select options]
```

**Key principle:**
- When you need to ask clarifying questions → Use AskUserQuestion tool IMMEDIATELY
- Do NOT write questions as text
- Do NOT explain what you're going to ask - just ask it with the tool
- The tool call IS your question to the user

## Examples

### Example 1: "Build a blog feature"

Use AskUserQuestion tool with these questions:

```json
{
  "questions": [
    {
      "question": "Who should be able to create and publish blog posts?",
      "header": "Authoring",
      "multiSelect": false,
      "options": [
        {
          "label": "Single admin only",
          "description": "Only you can create posts. Simplest for MVP, you can add multi-author later. (Recommended)"
        },
        {
          "label": "Any authenticated user",
          "description": "All logged-in users can publish. Good for community blogs, requires moderation."
        },
        {
          "label": "Specific author role",
          "description": "Role-based permissions for authors. Most flexible but adds complexity."
        }
      ]
    },
    {
      "question": "What types of content should blog posts support?",
      "header": "Content Type",
      "multiSelect": false,
      "options": [
        {
          "label": "Text only",
          "description": "Markdown or rich text editor. Simplest, focuses on writing."
        },
        {
          "label": "Text + images",
          "description": "Text with image uploads. Covers most blogging needs without too much complexity. (Recommended)"
        },
        {
          "label": "Rich media",
          "description": "Text + images + code blocks + embeds. Most powerful but more complex."
        }
      ]
    },
    {
      "question": "How should blog post visibility work?",
      "header": "Visibility",
      "multiSelect": false,
      "options": [
        {
          "label": "Always public",
          "description": "All posts are immediately public. Simplest approach."
        },
        {
          "label": "Public or draft",
          "description": "Author controls publish state. Gives flexibility without scheduling complexity. (Recommended)"
        },
        {
          "label": "Scheduled publishing",
          "description": "Public/draft/scheduled with specific publish times. Most flexible but adds complexity."
        }
      ]
    }
  ]
}
```

### Example 2: "Add a dashboard with analytics"

Use AskUserQuestion tool with these questions:

```json
{
  "questions": [
    {
      "question": "What scope of analytics should the dashboard show?",
      "header": "Data Scope",
      "multiSelect": false,
      "options": [
        {
          "label": "User's own activity",
          "description": "Only show each user their own metrics. Simpler, privacy-friendly, fits auth model well. (Recommended)"
        },
        {
          "label": "Global site-wide metrics",
          "description": "Show aggregate stats for all users. Better for admin dashboards."
        },
        {
          "label": "Both views",
          "description": "User-specific and global metrics. Most comprehensive but more complex."
        }
      ]
    },
    {
      "question": "Which types of metrics are most important?",
      "header": "Metrics",
      "multiSelect": false,
      "options": [
        {
          "label": "Charts over time",
          "description": "Activity graphs and trend lines. Visual but requires charting library."
        },
        {
          "label": "Summary numbers",
          "description": "Total counts and key stats. Simplest to implement."
        },
        {
          "label": "Both charts and stats",
          "description": "Comprehensive dashboard with graphs and summary numbers. Best UX. (Recommended)"
        }
      ]
    },
    {
      "question": "How should analytics data be updated?",
      "header": "Updates",
      "multiSelect": false,
      "options": [
        {
          "label": "On page load only",
          "description": "Data refreshes when user loads the page. Simplest, sufficient for most analytics. (Recommended)"
        },
        {
          "label": "Real-time updates",
          "description": "Live updates via websockets or polling. More complex, useful for monitoring."
        },
        {
          "label": "Manual refresh button",
          "description": "User clicks to update. Simple but less convenient than auto-load."
        }
      ]
    }
  ]
}
```

## Remember

- **ALWAYS use the AskUserQuestion tool** - Never present questions as plain text
- **Always ask 2-3 questions** - No more, no less
- **Always provide recommendations** - Mark with "(Recommended)" in descriptions
- **Explain impact of each choice** - In your message before the tool call
- **Make smart assumptions for low-impact decisions** - Document these briefly
- **Focus on CRITICAL and HIGH impact areas** - Skip trivial decisions
- **Be opinionated but flexible** - Guide users but accept their choices

The goal is to gather the minimum information needed to build the right thing, without overwhelming the user or asking about trivial details. The interactive AskUserQuestion tool makes this process smooth and efficient.
