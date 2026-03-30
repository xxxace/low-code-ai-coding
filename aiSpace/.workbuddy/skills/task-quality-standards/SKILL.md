---
name: task-quality-standards
description: Quality standards for task execution - task granularity, no placeholders, verification, and review principles
---

# Task Quality Standards

## Overview

These standards ensure tasks are executed with quality, clarity, and completeness. They're drawn from two powerful methodologies: `writing-plans` and `subagent-driven-development`.

**Core principle:** Small, complete, verifiable tasks with clear success criteria.

## When to Use

Apply these standards when:
- Planning implementation steps for a feature or bugfix
- Writing or reviewing task descriptions
- Executing multi-step work
- Delegating work to subagents

## 1. Task Granularity

**Each task should be 2-5 minutes of work.**

Too large:
- ❌ "Implement the drag-and-drop feature"
- ❌ "Refactor the renderer architecture"

Just right:
- ✅ "Add dragstart event handler to FieldRenderer"
- ✅ "Extract positioning logic to usePositioning composable"
- ✅ "Write test for drag-and-drop coordinate calculation"

**Why small tasks?**
- Easy to verify completion
- Clear success criteria
- Fast feedback loop
- Easy to rollback if needed
- Prevents scope creep

**Example breakdown:**

Instead of:
```
- [ ] Implement drag-and-drop feature
```

Break into:
```
- [ ] Add x/y/width/height fields to schema
- [ ] Implement useDraggable composable
- [ ] Add drag event handlers to FieldRenderer
- [ ] Write tests for coordinate calculation
- [ ] Integrate with DesignerEngine state
- [ ] Test drag-and-drop end-to-end
```

## 2. No Placeholders

Every step must contain complete information. These are **plan failures** — never write them:

**Forbidden patterns:**
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code)
- Steps that describe what to do without showing how (code blocks required)
- References to types, functions, or methods not defined in any task

**Examples:**

❌ **Bad:**
```
- [ ] Add error handling
```

✅ **Good:**
```
- [ ] Add try-catch around JSON.parse in loadSchema, log error with context
```

❌ **Bad:**
```
- [ ] Write tests for FieldRenderer
```

✅ **Good:**
```
- [ ] Write test: FieldRenderer renders label when schema.title is present
- [ ] Write test: FieldRenderer shows validation error when touched + invalid
```

## 3. Verification Before Completion

**Never claim a task is complete without verification.**

For each task completion:
1. Run the verification command (test, build, manual check)
2. Read the full output
3. Confirm success with evidence

**Examples:**

Tests:
```
✅ [Run: npx vitest run] [See: 149/149 pass] "All tests pass"
❌ "Tests should pass now"
```

Build:
```
✅ [Run: npx vue-tsc --noEmit] [See: 0 errors] "TypeScript build passes"
❌ "Build looks good"
```

Manual check:
```
✅ [Opened http://localhost:5173] [Verified: drag-and-drop works on Card component] "Interaction works"
❌ "I implemented it, should work"
```

**Red flags:**
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit/push without verification

## 4. Two-Stage Review (for subagent delegation)

When delegating tasks to subagents, use a two-stage review process:

**Stage 1: Spec Compliance Review**
- Does the implementation match requirements?
- Are all features implemented?
- Anything missing?
- Anything extra added?

**Stage 2: Code Quality Review**
- Does code follow project conventions?
- Are there obvious issues?
- Tests adequate?
- Performance concerns?

**Only after both stages pass, mark task complete.**

**Handling subagent status:**

- **DONE:** Proceed to Stage 1 review
- **DONE_WITH_CONCERNS:** Read concerns, address if critical, then review
- **NEEDS_CONTEXT:** Provide missing context and re-dispatch
- **BLOCKED:** Assess blocker, adjust task or escalate

## 5. Self-Review Checklist

After completing a task or writing a plan, run this quick self-review:

**Completeness:**
- [ ] All requirements implemented?
- [ ] No placeholders or TBDs?
- [ ] Code actually written (not just described)?
- [ ] Tests written (if applicable)?

**Quality:**
- [ ] Follows project coding conventions?
- [ ] Clear variable/function names?
- [ ] No obvious bugs?
- [ ] No magic numbers or hardcoded values?

**Verification:**
- [ ] Tests pass?
- [ ] Build succeeds?
- [ ] Manual verification done?
- [ ] Evidence documented?

If any check fails, fix before marking complete.

## 6. File Organization Principles

When planning multi-file work:

**Clear boundaries:**
- Each file has one clear responsibility
- Well-defined interfaces between files
- Can understand units without internals
- Can change internals without breaking consumers

**Cohesion:**
- Files that change together should live together
- Split by responsibility, not technical layer
- Prefer smaller, focused files

**Existing codebases:**
- Follow established patterns
- Don't unilaterally restructure (unless file is unwieldy)
- Include targeted improvements if working in problematic files

## Common Failures

| Failure Pattern | Better Practice |
|-----------------|-----------------|
| "Implement the feature" | Break into 2-5 minute tasks |
| "Add error handling" | Specify what to catch, how to handle |
| "Similar to X" | Repeat the code (don't force context switch) |
| "Should work now" | Run tests, report actual result |
| "I'll test later" | Test before claiming complete |
| "While I'm here" | Stay focused on task scope |

## Quick Reference

| Principle | Key Point |
|-----------|-----------|
| **Task size** | 2-5 minutes each |
| **No placeholders** | Complete code in every step |
| **Verification** | Evidence before claims |
| **Two-stage review** | Spec compliance → Code quality |
| **Self-review** | Completeness, Quality, Verification checklist |

## Bottom Line

Small tasks, complete information, verified execution, thorough review.

This is non-negotiable quality.
