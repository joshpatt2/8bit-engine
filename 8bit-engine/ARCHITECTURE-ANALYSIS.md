# Architecture Analysis

## TL;DR

**This engine has 3 competing ways to structure a game, with zero guidance on which to use.**

**Recommendation:** Consolidate around `Engine` + `BaseScreen/ScreenManager` + optional ECS. Deprecate `Game`/`SceneManager`. Add collision and camera systems.

---

## 1. Abstraction Inventory

| Approach | Entry Point | State Management | Entity Model | Currently Used By |
|----------|-------------|------------------|--------------|-------------------|
| **A: Engine + Screen** | `Engine` ([engine.ts#L75](src/engine/engine.ts#L75)) | `ScreenManager` w/ push/pop stack ([screen.ts#L119](src/engine/screen.ts#L119)) | Manual THREE.Object3D | Demo game ([game/index.ts#L642](src/game/index.ts#L642)) |
| **B: Game + Scene** | `Game` ([game.ts#L31](src/engine/game.ts#L31)) | `SceneManager` w/ simple switch ([scenes.ts#L13](src/engine/scenes.ts#L13)) | Manual THREE.Object3D | Nothing |
| **C: Raw ECS** | DIY setup | None (DIY) | ECS entities ([entity.ts#L19](src/engine/entity.ts#L19)) | Entity demo ([entity-demo.ts#L1](src/entity-demo.ts#L1)) |

---

## 2. Redundancy Analysis

### Engine vs Game

**Redundant.** Both do the exact same job:
- Create Three.js scene/camera/renderer ([engine.ts#L100-L107](src/engine/engine.ts#L100-L107) vs [game.ts#L60-L77](src/engine/game.ts#L60-L77))
- Create Input system ([engine.ts#L82](src/engine/engine.ts#L82) vs [game.ts#L78](src/engine/game.ts#L78))
- Create GameLoop ([engine.ts#L110](src/engine/engine.ts#L110) vs [game.ts#L91](src/engine/game.ts#L91))

**Key difference:** `Engine` uses hidden `SceneRenderer` ([engine.ts#L27](src/engine/engine.ts#L27)), `Game` exposes public `scene`, `camera`, `renderer` ([game.ts#L33-L35](src/engine/game.ts#L33-L35)).

**Winner:** `Engine`. Better encapsulation. `Game`'s public Three.js exposure is leaky abstraction.

**Verdict:** Delete `Game`.

### ScreenManager vs SceneManager

**Redundant.** Both manage game states:
- `ScreenManager`: Push/pop stack with pause/resume ([screen.ts#L161-L230](src/engine/screen.ts#L161-L230))
- `SceneManager`: Simple switch, no stack ([scenes.ts#L22-L40](src/engine/scenes.ts#L22-L40))

**Key difference:** `ScreenManager` is more powerful (supports pause menus, modals, overlays).

**Winner:** `ScreenManager`. Stack-based state is essential for real games.

**Verdict:** Delete `SceneManager`.

### BaseScreen vs Scene Interface

Both wrap game states but:
- `BaseScreen` is a class with helpers ([screen.ts#L50](src/engine/screen.ts#L50))
- `Scene` is a raw interface ([scenes.ts#L5](src/engine/scenes.ts#L5))

**Winner:** `BaseScreen`. Provides `addToScene()`, `clearScene()`, etc. ([screen.ts#L67-L96](src/engine/screen.ts#L67-L96))

**Verdict:** Delete `Scene` interface.

### ECS Integration

**Not redundant.** ECS is orthogonal to screen management.

You can use `BaseScreen` + `EntityManager` together ([entity-demo.ts#L54](src/entity-demo.ts#L54) does this manually).

**Verdict:** Keep ECS but make it optional. Some games need it, some don't.

---

## 3. Missing Features (Critical Gaps)

Regardless of which abstraction you pick, these are missing:

### 3.1 Camera/Scrolling System

**Problem:** All demos use static cameras. No scrolling levels.

**Impact:** Can't make platformers with levels > screen width.

**Location:** Camera is buried in `SceneRenderer` ([scene-renderer.ts](src/engine/scene-renderer.ts)) with no scrolling API.

### 3.2 Collision Detection

**Problem:** Every demo rolls its own collision ([game/index.ts#L587-L591](src/game/index.ts#L587-L591)).

**Impact:** Copy-paste code. No broad-phase optimization.

**Solution:** Need spatial hashing or quad-tree system.

### 3.3 Sprite Animation Management

**Problem:** `AnimatedSprite` exists ([animated-sprite.ts](src/engine/animated-sprite.ts)) but no animation state machine.

**Impact:** Can't do idle/walk/jump/attack animations cleanly.

### 3.4 Asset Loading

**Problem:** Sprites load inline via URLs ([game/index.ts#L148](src/game/index.ts#L148)). No preloading or progress.

**Impact:** Race conditions, no loading screens.

---

## 4. Recommended Path Forward

### Option: **Consolidate**

**Rationale:** This is what Carmack would do. One clear path. Delete everything else.

**The One True Way™:**

```typescript
// 1. Initialize engine
const engine = new Engine({ container, width, height, ... })

// 2. Create screens (game states)
class MyGameScreen extends BaseScreen {
  onEnter() { /* setup */ }
  onUpdate(dt) { /* game logic */ }
  onExit() { /* cleanup */ }
}

// 3. Register and switch
const screenManager = engine.getScreenManager()
screenManager.register(new MyGameScreen('game', engine.getRenderer(), engine.getInput()))
screenManager.switchTo('game')

// 4. Optionally use ECS inside screens
const entities = new EntityManager()
entities.getSystemManager().addSystem(new MovementSystem())
// ... update entities in screen's onUpdate()
```

**What gets deleted:**
- `Game` class ([game.ts](src/engine/game.ts))
- `SceneManager` class ([scenes.ts](src/engine/scenes.ts))  
- `Scene` interface ([scenes.ts](src/engine/scenes.ts))

**What gets kept:**
- `Engine` (the bootstrap)
- `BaseScreen` + `ScreenManager` (state machine)
- ECS system (optional for complex games)

**What gets added:**
- Camera scrolling API
- Collision system (broad-phase + narrow-phase)
- Asset preloader

**Documentation:**
- Update README with "Getting Started" using Engine
- Mark `Game`/`SceneManager` as deprecated in code comments
- Write migration guide (it's 5 lines of code to switch)

---

## 5. Next Concrete Task

**Task: Add Camera Scrolling System**

**Priority:** High

**Rationale:** This is the #1 blocker for making real games. Without camera scrolling, you can't make platformers, shmups, or any scrolling game.

**Approach:**
1. Add `CameraController` class to `src/engine/camera-controller.ts`
2. Expose `setCameraPosition()`, `setCameraFollow()` APIs
3. Add `smoothFollow` with lerp for smooth tracking
4. Add camera bounds (min/max X/Y) to prevent going out of level
5. Integrate with `Engine` as `engine.getCameraController()`
6. Update demo to show scrolling level

**Complexity:** Medium (2-3 hours)

**Dependencies:** None

**Files to modify:**
- Create: `src/engine/camera-controller.ts`
- Modify: [src/engine/engine.ts](src/engine/engine.ts) (expose controller)
- Modify: [src/engine/index.ts](src/engine/index.ts) (export it)
- Demo: Create `src/scrolling-demo.ts`

**Acceptance Criteria:**
- Player moves, camera follows smoothly
- Camera stops at level boundaries
- Works with orthographic camera (NES-style)
- <50 lines of code

---

## Conclusion

This codebase grew organically without architectural decisions. The demo game uses `Engine` + `ScreenManager`, proving it works. Delete the unused abstractions (`Game`, `SceneManager`), document the winner, and ship the camera system. Then make games.

**Action items:**
1. ✅ Document this analysis
2. ⬜ Add camera scrolling (next task)
3. ⬜ Delete `Game` and `SceneManager` 
4. ⬜ Add collision system
5. ⬜ Add asset preloader

**Ship the camera system, then delete the dead abstractions.**
