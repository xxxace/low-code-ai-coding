---
name: brainstorming
description: Use when implementing new features that don't have existing design documents - explores user intent and requirements before implementation, preventing wrong-direction work
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs through natural collaborative dialogue.

**Trigger condition:** ONLY use this skill when implementing a new feature that has NO existing design document in `D:\demo\ai\aiSpace\design\`. If there's already a design doc, skip brainstorming and proceed directly to implementation.

**Core purpose:** Prevent you from heading in the wrong direction when working on undocumented features. A 5-10 minute design discussion can save hours of rework.

<HARD-GATE>
Do NOT write any code or take any implementation action until you have presented a design and the user has approved it.
</HARD-GATE>

## The Process (Lightweight Version)

When a new feature request comes in with no existing design doc:

**1. Quick Context Check (30 seconds)**
   - Verify there's no design doc in `design/` directory
   - Briefly recall current project state and architecture

**2. One Clarifying Question (1-2 minutes)**
   - Ask ONE key question to understand the core intent
   - Focus on: purpose, constraints, success criteria
   - Prefer multiple choice when possible

**3. Propose Your Approach (2-3 minutes)**
   - Present 2-3 approaches with trade-offs
   - Lead with your recommendation and reasoning
   - Be concise - this is not a full design document

**4. Get Confirmation**
   - Wait for user to approve the approach
   - If they have concerns, iterate quickly

**5. Proceed to Implementation**
   - Once approved, start coding
   - NO full design document required
   - NO writing to `docs/superpowers/specs/` (that's for larger, multi-stage projects)

## Key Differences from Full Brainstorming

This is a lightweight, conditional version of brainstorming:

| Aspect | Full Brainstorming | Lightweight (This Version) |
|--------|-------------------|---------------------------|
| Trigger | EVERY feature | Only undocumented features |
| Questions | Multiple questions | ONE clarifying question |
| Design Doc | Full spec written to file | No document required |
| Next Step | Invoke writing-plans skill | Direct implementation |
| Time | 15-30 minutes | 5-10 minutes |

## Example Usage

**User request:** "Add a 'duplicate node' button to the context menu"

**Your response:**
```
Let me think about this design quickly.

**Clarifying question:**
Should the duplicated node be placed:
- Option A: Immediately below the original node (same parent, next position)
- Option B: As a sibling at the end of the same container
- Option C: Added to the root of the canvas

**My recommendation:** Option B - added to the end of the same container. This is intuitive (same location) but doesn't disrupt existing order. Option A can cause confusion when the container has specific sorting, and Option C feels disconnected from the context.

Which approach do you prefer?
```

**User:** "Option B sounds good"

**Your response:**
```
Got it. I'll implement the duplicate button with Option B behavior. Let me write the code.
```

## Red Flags - When You Should Still Do Full Brainstorming

Even though this is the lightweight version, some situations still need full brainstorming:

- The feature affects core architecture
- Multiple independent subsystems are involved
- User requests a "large feature" without clear scope
- You genuinely don't understand the problem domain

If any of these apply, use the full brainstorming process instead of the lightweight version.

## Anti-Pattern: "This Is Too Simple To Need Design"

Even "simple" features can have wrong implementations. The lightweight design check (one question + your recommendation) takes only 2-3 minutes and can prevent hours of rework.

Examples of "simple" features that had design implications:
- Add a "delete" button → Should it show confirmation? Should it move to trash?
- Add hover effects → Should they apply to all nodes or only when selected?
- Change a default value → Does this affect existing saved schemas?

## The Bottom Line

When implementing a new feature without existing design docs:

1. Ask ONE clarifying question
2. Present your recommended approach (2-3 options)
3. Get user approval
4. Start coding

This is NOT a full design process. It's a quick sanity check to ensure you're heading in the right direction.
