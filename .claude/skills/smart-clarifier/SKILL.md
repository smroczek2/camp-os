---
name: smart-clarifier
description: Asks 1-7 clarifying questions before building new features. Activates when user requests new functionality or describes something to build. Focuses on high-impact decisions like scope, data model, authentication requirements, and AI integrations. Uses AskUserQuestion tool for interactive selection. Makes smart assumptions for low-impact decisions.
---

# Smart Clarifier

Asks 1-7 clarifying questions before implementation to ensure correct understanding of requirements.

## ⚠️ CRITICAL: Use AskUserQuestion Tool

**YOU MUST USE THE AskUserQuestion TOOL - NOT MARKDOWN TEXT**

When this skill activates:
1. Identify 1-7 critical questions
2. **IMMEDIATELY call AskUserQuestion tool** with those questions
3. Do NOT write questions as markdown
4. The tool call IS your question - no explanation needed first

## When to Activate

**Activate when:**
- User describes a feature to build
- User requests new functionality
- About to implement something non-trivial
- Requirements could be interpreted multiple ways

**Even if the request seems clear**, ask 1-7 clarifying questions. Better to ask upfront than build the wrong thing.

## Question Framework

Ask **1-7 questions** about high-impact decisions based on the complexity of the feature request.

### High-Impact Areas (Always Consider)

**1. Scope & Boundaries**
- What's included vs excluded?
- MVP vs full feature?
- Which user actions are supported?

**2. Data Model & Persistence**
- What needs to be stored in the database?
- Relationships to user table?
- User-specific data or shared across users?
- Should records cascade delete with user?

**3. Authentication & Access**
- Protected routes or public?
- User-specific data filtering needed?
- Different permissions for different users?

**4. AI Integration Needs**
- Does this feature need OpenAI capabilities?
- Text generation, analysis, or chat?
- Real-time streaming or batch processing?

**5. User Experience**
- Primary user flow?
- Mobile-first, desktop-first, or both?
- Real-time updates or standard load/refresh?

### Low-Impact Areas (Make Smart Assumptions)

**Don't ask about these - just make good defaults:**
- **Styling** → Use shadcn/ui defaults and Tailwind patterns
- **Error messages** → User-friendly, standard patterns
- **Validation** → Industry-standard (email format, required fields, etc.)
- **Performance** → Standard web app expectations
- **Loading states** → Standard skeletons/spinners

## AskUserQuestion Tool Structure

```json
{
  "questions": [
    {
      "question": "Complete question with a question mark?",
      "header": "Short Label",
      "multiSelect": false,
      "options": [
        {
          "label": "Short option (1-5 words)",
          "description": "Detailed explanation with tradeoffs and recommendation"
        },
        {
          "label": "Another option",
          "description": "Explain implications. (Recommended) if this is your suggestion"
        }
      ]
    }
  ]
}
```

**Guidelines:**
- **question**: Full question text, clear and specific
- **header**: Very short (max 12 chars) - shows as a tag
- **multiSelect**: Usually `false` (only `true` if multiple can apply)
- **options**: 2-4 options with concise labels and detailed descriptions
- **label**: 1-5 words - what user sees in list
- **description**: Explain what this means, tradeoffs, your recommendation

Mark your recommended option with "(Recommended)" in the description.

## Question Selection Strategy

**Prioritize by impact:**

**CRITICAL** (fundamentally changes architecture):
- User-specific vs multi-tenant data
- Real-time vs request-response
- Public vs authenticated
- Core data model structure

**HIGH** (significantly affects implementation):
- Key user flows
- AI integration needs
- Major feature scope decisions

**Choose 1-7 questions from CRITICAL and HIGH categories based on feature complexity.**

## Making Smart Assumptions

For things you DON'T ask about, document your assumptions briefly:

**Example:**
```
Assumptions I'm making:
- Styling: shadcn/ui components with Tailwind defaults
- Validation: Standard email/required field validation
- Error handling: User-friendly messages, server-side logging
- Loading states: Standard spinners during async operations
- Mobile: Responsive design, mobile-first approach
```

## Recommendation Guidelines

**Always provide a recommendation** based on:
1. **Simplicity** - Simpler option if both solve the problem
2. **MVP mindset** - What's needed now vs later
3. **Existing patterns** - What fits the current tech stack
4. **Common use cases** - What's typical for this type of feature
5. **Risk reduction** - Lower complexity = lower risk

Be opinionated but flexible. User can override your recommendation.

## Example Questions

### Example 1: Task Management Feature

```json
{
  "questions": [
    {
      "question": "Should tasks be user-specific (each user has their own) or team-based (shared across users)?",
      "header": "Data Scope",
      "multiSelect": false,
      "options": [
        {
          "label": "User-specific tasks",
          "description": "Each user has private task list. Simplest for MVP, works well with existing Better Auth user system. (Recommended)"
        },
        {
          "label": "Team-based tasks",
          "description": "Tasks shared across users with permissions and assignments. More complex, requires role/permission system."
        }
      ]
    },
    {
      "question": "What core features should the MVP include?",
      "header": "MVP Scope",
      "multiSelect": false,
      "options": [
        {
          "label": "Create, edit, delete tasks",
          "description": "Basic CRUD operations only. Simple, focused MVP. (Recommended)"
        },
        {
          "label": "CRUD + categories/tags",
          "description": "Task organization with filtering. Moderate complexity."
        },
        {
          "label": "Full task management",
          "description": "CRUD + categories + due dates + priorities + attachments. High complexity."
        }
      ]
    }
  ]
}
```

### Example 2: Blog Feature

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
          "description": "Only you can create posts. Simplest for MVP. (Recommended)"
        },
        {
          "label": "Any authenticated user",
          "description": "All logged-in users can publish. Good for community blogs."
        },
        {
          "label": "Role-based permissions",
          "description": "Specific author role system. Most flexible but adds complexity."
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
          "description": "All posts immediately public. Simplest approach."
        },
        {
          "label": "Public or draft",
          "description": "Author controls publish state. Flexible without scheduling complexity. (Recommended)"
        }
      ]
    }
  ]
}
```

## After Questions Answered

1. **Acknowledge answers**: "Got it! Building with [summary of decisions]"
2. **State assumptions**: Briefly mention what you're assuming for non-asked items
3. **Proceed to planning**: "Let me plan the implementation..."
4. **Transition to feature-builder skill**

## Anti-Patterns (What NOT to Do)

❌ **Don't use markdown questions** - Always use AskUserQuestion tool

❌ **Don't ask about trivial things:**
- "What color should the button be?"
- "Should we use a modal or a drawer?"
- "What should the error message say?"

❌ **Don't ask obvious things:**
- "Should we use TypeScript?" (it's configured)
- "Should we use Better Auth?" (it's set up)
- "Should protected routes require login?" (obviously yes)

❌ **Don't ask more than 7 questions:**
- Can be overwhelming for user
- Most things can be assumed or iterated on

❌ **Don't ask without providing recommendations:**
- User shouldn't make every decision
- You're the expert on technical tradeoffs

## Remember

- **ALWAYS use AskUserQuestion tool** - Never plain text questions
- **Always ask 1-7 questions** - Focus on CRITICAL and HIGH impact areas based on feature complexity
- **Always provide recommendations** - Mark with "(Recommended)" in descriptions
- **Make smart assumptions** - Document briefly what you're assuming
- **Be opinionated but flexible** - Guide users, accept their choices

The goal: gather minimum information needed to build the right thing, without overwhelming the user or asking trivial details.
