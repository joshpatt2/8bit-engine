# Design Alternatives and Trade-offs

This document explores alternative approaches considered for the Screen/Scene refactoring and explains why the proposed design was chosen.

## Alternative 1: Full GameObject Abstraction

### Description
Create a complete GameObject wrapper that hides ALL Three.js types, including `THREE.Object3D`.

```typescript
// Complete abstraction
export class GameObject {
  private object: THREE.Object3D  // Completely hidden
  
  setPosition(x: number, y: number, z: number): void
  setRotation(x: number, y: number, z: number): void
  setScale(x: number, y: number, z: number): void
  // ... all manipulation methods
}

export class SceneRenderer {
  addObject(obj: GameObject): void  // Only accepts GameObject
  removeObject(obj: GameObject): void
}

export abstract class BaseScreen {
  protected createCube(size: number, color: number): GameObject
  protected createBitmapText(text: string): GameObject
  // Factory methods for all object types
}
```

### Pros
- ✅ Complete encapsulation
- ✅ No Three.js exposure at all
- ✅ Could switch rendering backend easily
- ✅ Simpler API for beginners

### Cons
- ❌ MASSIVE refactoring effort
- ❌ Need to wrap every Three.js feature
- ❌ Limits flexibility for power users
- ❌ Lots of wrapper code to maintain
- ❌ Performance overhead from wrapping
- ❌ Existing components (WorldMap, AnimatedSprite) would all need refactoring

### Decision
**REJECTED** - Too large in scope, limits flexibility, high maintenance burden.

## Alternative 2: Keep Both Scene and Screen

### Description
Keep both abstractions but clarify their purposes.

```typescript
// Engine provides Screen
export class BaseScreen {
  protected scene: THREE.Scene
  // ... current API
}

// Game provides Scene
export interface Scene {
  name: string
  enter(): void
  exit(): void
  // ... current API
}

// Documentation explains:
// - Use Screen for engine-level abstractions
// - Use Scene for game-level state machines
```

### Pros
- ✅ No breaking changes
- ✅ Keeps existing code working
- ✅ Documentation-only fix

### Cons
- ❌ Confusing for users (two abstractions)
- ❌ Doesn't solve THREE.js exposure
- ❌ Adapter pattern still needed
- ❌ Technical debt remains
- ❌ Violates DRY principle

### Decision
**REJECTED** - Doesn't solve the core problems, perpetuates confusion.

## Alternative 3: Scene Only (Remove Screen)

### Description
Keep Scene, remove Screen. Make Scene the primary abstraction.

```typescript
// Remove BaseScreen, ScreenManager from engine
// Game's Scene becomes the main abstraction

export interface Scene {
  name: string
  enter(): void
  exit(): void
  update(dt: number): void
  render(): void
}

// Engine provides Scene utilities
export class SceneRenderer {
  // Helper for Scene implementations
}
```

### Pros
- ✅ Single abstraction
- ✅ Scene is already used in game layer
- ✅ Simpler mental model

### Cons
- ❌ Loses engine's Screen infrastructure (TitleScreen, ScreenManager)
- ❌ Scene is less featured than Screen (no pause/resume)
- ❌ "Scene" conflicts with THREE.Scene naming
- ❌ Screen is the more complete abstraction
- ❌ Loses stack-based screen management

### Decision
**REJECTED** - Screen is the better abstraction, more features, less naming confusion.

## Alternative 4: Dependency Injection

### Description
Use dependency injection to provide rendering services.

```typescript
export interface RenderService {
  render(): void
  addObject(obj: any): void
  removeObject(obj: any): void
  // ...
}

export abstract class BaseScreen {
  constructor(
    name: string,
    @inject(RenderService) private renderService: RenderService,
    @inject(Input) private input: Input
  ) {
    // DI framework injects dependencies
  }
}

// Engine sets up DI container
const container = new DIContainer()
container.register(RenderService, ThreeJSRenderService)
```

### Pros
- ✅ Clean separation via interfaces
- ✅ Easy to mock for testing
- ✅ Could swap backends easily
- ✅ Industry standard pattern

### Cons
- ❌ Adds dependency on DI framework
- ❌ More complex setup
- ❌ Overkill for a game engine
- ❌ Steeper learning curve
- ❌ Not idiomatic for game development

### Decision
**REJECTED** - Too complex for the use case, adds unnecessary dependency.

## Alternative 5: Minimal Change (Deprecation Only)

### Description
Just deprecate the Scene system, encourage Screen usage, but change nothing else.

```typescript
// In scenes.ts
/** @deprecated Use Screen from engine instead */
export interface Scene {
  // ...
}

/** @deprecated Use ScreenManager from engine instead */
export class SceneManager {
  // ...
}
```

### Pros
- ✅ Minimal work
- ✅ No breaking changes
- ✅ Gradual migration

### Cons
- ❌ THREE.js still exposed in API
- ❌ Duplicate abstractions remain
- ❌ Technical debt not addressed
- ❌ Problem not solved

### Decision
**REJECTED** - Doesn't solve the core problem.

## Alternative 6: Proposed Solution (SceneRenderer + Engine)

### Description
Create internal SceneRenderer, hide Three.js, remove Scene duplication.

```typescript
// Internal renderer
class SceneRenderer {
  private scene: THREE.Scene
  // High-level API + escape hatches
}

// Engine initialization
export class Engine {
  private renderer: SceneRenderer
  getRenderer(): SceneRenderer
}

// Updated BaseScreen
export abstract class BaseScreen {
  constructor(name: string, renderer: SceneRenderer, input: Input)
  protected addToScene(obj: any): void
  protected setBackground(color: number): void
}
```

### Pros
- ✅ Single abstraction (Screen)
- ✅ THREE.js hidden but accessible
- ✅ Clean API for common cases
- ✅ Flexibility for advanced cases
- ✅ Reasonable refactoring scope
- ✅ Good balance of abstraction and pragmatism

### Cons
- ⚠️ Breaking changes required
- ⚠️ Moderate refactoring effort
- ⚠️ Some components still use THREE.Scene directly

### Decision
**ACCEPTED** - Best balance of clean abstraction and pragmatic implementation.

## Trade-off Analysis

| Criteria | Alt 1: GameObject | Alt 2: Keep Both | Alt 3: Scene Only | Alt 4: DI | Alt 5: Deprecate | Alt 6: Proposed |
|----------|-------------------|------------------|-------------------|-----------|------------------|-----------------|
| **Encapsulation** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ |
| **Flexibility** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Simplicity** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Refactor Size** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Solves Problem** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **Maintainability** | ⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Learning Curve** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **OVERALL** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## Design Decisions Explained

### Decision 1: Keep SceneRenderer Internal

**Question:** Should SceneRenderer be part of the public API?

**Options:**
1. Export SceneRenderer, let users create it
2. Keep SceneRenderer internal, provide via Engine

**Decision:** Keep internal (Option 2)

**Reasoning:**
- Users don't need to know about SceneRenderer
- Engine creates and manages it
- Cleaner public API
- Can change implementation without breaking API
- Users get SceneRenderer via `engine.getRenderer()`

### Decision 2: Provide getThreeScene() Escape Hatch

**Question:** Should we allow direct THREE.Scene access?

**Options:**
1. Never expose THREE.Scene (pure abstraction)
2. Provide `getThreeScene()` for advanced cases
3. Expose THREE.Scene in API (current state)

**Decision:** Escape hatch (Option 2)

**Reasoning:**
- Pragmatic: Some components need THREE.Scene
- Flexibility: Power users can drop down
- Progressive: Start with high-level API, drop down when needed
- Clear signal: Calling `getThreeScene()` signals "advanced usage"
- Avoids massive component refactoring
- Example: WorldMap needs THREE.Scene, this allows it to work

### Decision 3: Single Screen Abstraction

**Question:** Keep Scene or Screen as primary abstraction?

**Options:**
1. Screen (engine's abstraction)
2. Scene (game's abstraction)
3. Both (status quo)

**Decision:** Screen (Option 1)

**Reasoning:**
- Screen has more features (pause/resume)
- Screen has ScreenManager with stack support
- "Screen" doesn't conflict with THREE.Scene
- Screen is more game-engine-oriented
- Scene is just a thin wrapper around Screen
- Eliminating duplication is goal

### Decision 4: Engine Initialization Helper

**Question:** How should users initialize the rendering system?

**Options:**
1. Manual: Create THREE.Scene, Camera, Renderer yourself
2. Factory: Static factory methods
3. Engine Class: Dedicated initialization class

**Decision:** Engine Class (Option 3)

**Reasoning:**
- Encapsulates initialization
- Provides clean API surface
- Easy to add configuration options
- Natural place for game loop setup
- Can manage lifecycle (start/stop)
- Hides complexity from users

### Decision 5: Version Bump to 2.0.0

**Question:** How to handle breaking changes?

**Options:**
1. Major version bump (2.0.0)
2. Deprecation period with warnings
3. Keep old API alongside new

**Decision:** Major version bump (Option 1)

**Reasoning:**
- Clean break from old API
- Clear signal to users
- Easier to maintain (one API path)
- Migration guide helps transition
- Breaking changes are significant
- Aligns with semantic versioning

### Decision 6: Defer GameObject Abstraction

**Question:** Should we hide THREE.Object3D?

**Options:**
1. Yes, create GameObject wrapper
2. No, allow THREE.Object3D
3. Partial, wrap some types

**Decision:** No, defer to future (Option 2)

**Reasoning:**
- Scope too large for this refactor
- THREE.Object3D is well-known and stable
- Users can learn Three.js if needed
- Wrapping adds complexity and overhead
- Can always add later without breaking changes
- Focus on Screen/Scene unification first

## Performance Considerations

### SceneRenderer Overhead

**Concern:** Does SceneRenderer add performance overhead?

**Analysis:**
- SceneRenderer is a thin wrapper
- Methods delegate directly to THREE.js
- No extra object creation per frame
- No proxy traps or complex logic
- Same render path as before

**Conclusion:** Negligible performance impact (< 1%)

### Escape Hatch Performance

**Concern:** Does `getThreeScene()` have overhead?

**Analysis:**
```typescript
getThreeScene(): THREE.Scene {
  return this.scene  // Simple getter, no overhead
}
```

**Conclusion:** Zero overhead, just returns reference

### Engine Initialization

**Concern:** Does Engine add startup cost?

**Analysis:**
- One-time initialization
- Same objects created as before
- Just organized differently
- No additional allocations

**Conclusion:** No impact on startup time

## Security Considerations

### Escape Hatch Security

**Concern:** Can users break things with `getThreeScene()`?

**Analysis:**
- Yes, users can manipulate THREE.Scene directly
- This is intentional for flexibility
- Users who call it should know what they're doing
- Could add JSDoc warning

**Mitigation:**
```typescript
/**
 * Get the underlying Three.js scene.
 * 
 * ⚠️ ADVANCED: This breaks abstraction and should only be used
 * when the high-level API is insufficient. Direct manipulation
 * of the scene can lead to unexpected behavior.
 * 
 * @returns The Three.js Scene object
 */
getThreeScene(): THREE.Scene {
  return this.scene
}
```

### Validation

**Concern:** Should we validate objects added to scene?

**Analysis:**
- Could add type checking
- Could validate object state
- Trade-off: Performance vs safety

**Decision:** 
- No validation in production
- Could add in debug mode
- Trust users to use API correctly

## Future Extensions

This design enables future enhancements:

### 1. Multiple Renderers

```typescript
interface Renderer {
  render(): void
  addObject(obj: any): void
  // ...
}

class ThreeJSRenderer implements Renderer { /* current */ }
class Canvas2DRenderer implements Renderer { /* new */ }
class WebGPURenderer implements Renderer { /* future */ }

class Engine {
  constructor(config: EngineConfig) {
    this.renderer = this.createRenderer(config.renderBackend)
  }
}
```

### 2. Render Layers

```typescript
class SceneRenderer {
  addObjectToLayer(obj: any, layer: string): void
  
  setLayerVisibility(layer: string, visible: boolean): void
  
  setLayerOpacity(layer: string, opacity: number): void
}
```

### 3. Post-Processing

```typescript
class SceneRenderer {
  addPostProcessEffect(effect: PostProcessEffect): void
  
  removePostProcessEffect(effect: PostProcessEffect): void
}
```

### 4. Scene Graph Queries

```typescript
class SceneRenderer {
  findObjectsByTag(tag: string): any[]
  
  findObjectByName(name: string): any | null
  
  findObjectsInBounds(bounds: Box3): any[]
}
```

These extensions are possible because:
- SceneRenderer encapsulates rendering
- Public API is stable
- Internal implementation can change

## Summary

The proposed design (Alternative 6) was chosen because it:

1. **Solves the core problems** - Unifies abstractions, hides THREE.js
2. **Balances abstraction and pragmatism** - Clean API with escape hatches
3. **Reasonable scope** - Not too small, not too large
4. **Maintains flexibility** - Power users can still access Three.js
5. **Good performance** - No significant overhead
6. **Enables future work** - Foundation for more abstractions
7. **Manageable migration** - Clear path from old to new

The key insight is that **perfect abstraction is the enemy of good enough**. By providing a clean high-level API while allowing direct Three.js access when needed, we achieve both simplicity and power.

---

**Document Version:** 1.0  
**Status:** Final  
**Last Updated:** 2026-01-03
