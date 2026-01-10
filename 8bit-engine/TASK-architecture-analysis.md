# Task: Analyze Codebase Architecture and Recommend Next Steps

## Priority
High - architectural clarity needed before adding more features

## Time Estimate
2-3 hours (research and writeup)

## Background

This codebase has grown through multiple feature branches being merged:
- Original engine (Engine, ScreenManager, BaseScreen)
- ECS system (Entity, Component, System, EntityManager, SystemManager)
- Input strategy (gamepad support)
- Scene system (Game, SceneManager, Scene)

The result is overlapping abstractions with no clear guidance on which to use.

## Your Task

Analyze the current codebase and write a short document (1-2 pages) answering:

### 1. Inventory the Abstractions

List all the ways a developer could structure a game with this engine:

| Approach | Entry Point | State Management | Entity Model |
|----------|-------------|------------------|--------------|
| A | ? | ? | ? |
| B | ? | ? | ? |
| ... | | | |

### 2. Identify Redundancy

Which abstractions overlap? Be specific:
- Do `Engine` and `Game` serve the same purpose?
- Do `ScreenManager` and `SceneManager` serve the same purpose?
- Does ECS replace or complement the Screen system?

### 3. Find the Gaps

What's missing regardless of which approach you use?
- Camera/scrolling system?
- Collision system?
- Audio?
- Asset loading?

### 4. Recommend a Path Forward

Pick ONE of these options and justify it:

**Option A: Consolidate**
- Pick the best abstraction for each concern
- Deprecate or remove the others
- Document the "one true way"

**Option B: Layered Architecture**
- Define clear layers (low-level, mid-level, high-level)
- Each abstraction lives at a specific layer
- Document when to use each

**Option C: Modular/Optional**
- Keep all abstractions as opt-in modules
- Document trade-offs of each
- Let users pick based on their game's needs

### 5. Propose the Next Concrete Task

Based on your analysis, what's the single most impactful task to do next? Write it up as a task description like this file.

## Files to Read

Start with these, but explore beyond them:

```
src/engine/engine.ts        # Original bootstrap
src/engine/game.ts          # New bootstrap
src/engine/screen.ts        # Original state machine (push/pop)
src/engine/scenes.ts        # New state machine (simple switch)
src/engine/entity.ts        # ECS entity
src/engine/system.ts        # ECS systems
src/engine/entity-manager.ts
src/engine/index.ts         # What's exported publicly?
src/game/index.ts           # Demo game - which approach does it use?
```

## Output

Create a file called `ARCHITECTURE-ANALYSIS.md` in the repo root with your findings.

## What Good Looks Like

- **Be direct.** "X is redundant with Y" not "X and Y have some overlap"
- **Be specific.** Reference file names and line numbers
- **Have an opinion.** Don't just list options - recommend one
- **Think about users.** Someone new to this codebase - what do they need to know?

## What to Avoid

- Don't refactor anything yet - this is analysis only
- Don't propose multiple major changes - pick the ONE most important thing
- Don't write a novel - 1-2 pages max

## Questions?

Ask before assuming. But also: form your own opinions. Part of this task is seeing how you think through ambiguity.
