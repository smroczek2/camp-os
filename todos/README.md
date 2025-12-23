# Todos Directory

This directory contains individual todo items tracked using the file-based todo system. Each todo is a markdown file with frontmatter for metadata.

## Structure

```
todos/
├── README.md (this file)
├── archive/ (completed todos)
└── NNN-status-priority-description.md (active todos)
```

## Naming Convention

Todo files follow this pattern:
```
{number}-{status}-{priority}-{description}.md
```

Examples:
- `029-active-p1-fix-registration-bug.md`
- `030-blocked-p2-add-attendance-tracking.md`
- `031-complete-p1-setup-email-service.md`

## Status Values

- **active** - Currently being worked on
- **pending** - Ready to start but not yet begun
- **blocked** - Waiting on dependency or decision
- **complete** - Finished and moved to archive

## Priority Values

- **p0** - Critical (blocks production/users)
- **p1** - High (important feature/fix)
- **p2** - Medium (nice to have)
- **p3** - Low (future enhancement)

## Frontmatter Format

Each todo file should have frontmatter at the top:

```yaml
---
status: active|pending|blocked|complete
priority: p0|p1|p2|p3
issue_id: "029"
tags: [registration, bug, parent-dashboard]
dependencies: ["028", "027"]
---
```

## File Structure

```markdown
---
status: active
priority: p1
issue_id: "029"
tags: [registration, parent-dashboard]
dependencies: []
---

# Todo Title

Brief description of what needs to be done.

## Problem Statement

What problem are we solving?

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Details

Files to modify:
- `src/path/to/file.ts`

Approach:
- Step by step plan

## Work Log

### 2024-12-22 - Initial Creation
**By:** Developer Name
**Actions:**
- Created todo file
- Identified approach
```

## Current Status

**Active Todos:** 0
**Archived Todos:** 25

All current todos have been completed! 🎉

## Recently Completed

- Waitlist management system (024)
- Email notification infrastructure (026)
- Attendance check-in UI (027)
- Code quality improvements (028)
- All security and RBAC fixes (001-017)
- Database performance optimizations (008, 025)
- Form builder completion (various)

## Creating a New Todo

When creating a new todo:

1. **Determine next number** - Check last todo in archive, increment
2. **Set initial status** - Usually `active` or `pending`
3. **Set priority** - p0 (critical) to p3 (low)
4. **Add frontmatter** - status, priority, issue_id, tags, dependencies
5. **Write clear description** - What needs to be done and why
6. **Define acceptance criteria** - How do we know it's done?

## Archiving a Todo

Move a todo to `archive/` when:
- Status is `complete`
- Implementation is verified
- All acceptance criteria met

Rename file to include "complete" status:
```bash
mv todos/029-active-p1-feature.md todos/archive/029-complete-p1-feature.md
```

## Integration with Claude Code

Claude Code can:
- Read todos to understand work in progress
- Create new todos during feature discovery
- Update todo status and work logs
- Archive completed todos

The file-based system allows version control and collaboration while maintaining structure.

## Tips

- Keep todos focused (single feature/fix)
- Break large features into multiple todos
- Link related todos via dependencies
- Update work log with progress notes
- Archive promptly when complete
