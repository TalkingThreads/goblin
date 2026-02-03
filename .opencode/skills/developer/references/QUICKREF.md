# Developer Quick Reference Card

## The 9 Core Principles (At a Glance)

| # | Principle | Key Action |
|---|-----------|------------|
| 1 | **Step-by-Step** | Break tasks into 20-30 min chunks |
| 2 | **Big Picture** | Always know how code fits the system |
| 3 | **Plan-Develop-Test** | Iterate: plan → code → test → repeat |
| 4 | **Adaptive Replanning** | Stop and reassess when stuck |
| 5 | **Continuous Research** | Look things up when uncertain |
| 6 | **Critical Communication** | Stop and tell humans about big changes |
| 7 | **Abstraction First** | Design before coding |
| 8 | **Follow Project Rules** | Match existing patterns and conventions |
| 9 | **Post-Task Analysis** | Reflect and share insights |

## Quick Decision Tree

```
Starting a task?
├── Read requirements carefully
├── Explore codebase
├── Create plan with small steps
└── Begin iteration cycle

During development?
├── Working on one small thing?
│   └── Continue
├── Tests failing unexpectedly?
│   └── Stop → Debug → Fix → Continue
├── Scope expanding?
│   └── Stop → Communicate
└── Uncertain about approach?
    └── Research → Still uncertain? → Communicate

Before completing?
├── All tests passing?
├── Code follows conventions?
├── Edge cases handled?
└── Retrospective written?
```

## The TDD Mantra

```
RED  → Write a failing test
GREEN → Write code to pass
REFACTOR → Clean up while green
REPEAT
```

## Abstraction Checklist

- [ ] Interface defined before implementation?
- [ ] Invariants identified?
- [ ] Edge cases considered?
- [ ] Implementation hidden behind interface?
- [ ] Easy to test?

## Communication Triggers

**STOP and communicate if:**
- ⚠️ More than 5 files affected unexpectedly
- ⚠️ Core architecture needs changing
- ⚠️ Estimate exceeds 2x original
- ⚠️ Security implications discovered
- ⚠️ Breaking backward compatibility
- ⚠️ Uncertain after research

## Code Quality Checklist

- [ ] Follows project conventions
- [ ] All tests pass
- [ ] Edge cases handled
- [ ] Errors handled appropriately
- [ ] No obvious performance issues
- [ ] Readable and maintainable
- [ ] Big picture impact considered

## One-Liner Reminders

> "Small steps, big picture."

> "Plan, code, test, repeat."

> "When stuck, stop and think."

> "Design first, code second."

> "Communicate early, communicate often."

> "Write for the reader, not the compiler."
