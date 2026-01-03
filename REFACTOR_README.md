# Screen/Scene Unification Refactor

**Status:** 🎨 Design Complete - Ready for Review  
**Version:** 2.0.0 (Proposed)  
**Type:** Breaking Change  
**Last Updated:** 2026-01-03

## Overview

This refactoring unifies the Screen/Scene abstractions in the 8bit-engine, making **Screen** the primary game engine abstraction while hiding Three.js implementation details.

## Problem Statement

We need to unify our Screen/Scene abstractions with the following goals:

1. **Screen** should be the game engine abstraction that represents a single screen (title screen, map screen, level screen)
2. **THREE.js objects** (Scene, Camera, Renderer) should be implementation details, not part of the game engine API

## Current Issues

❌ Two separate abstractions: `Screen` (engine) and `Scene` (game)  
❌ THREE.js types exposed in BaseScreen constructor  
❌ Game layer must create and manage THREE.Scene, Camera, Renderer  
❌ Confusing adapter pattern wrapping Screen as Scene  
❌ Unclear which abstraction to use  

## Proposed Solution

✅ Single abstraction: **Screen** only  
✅ THREE.js hidden behind internal **SceneRenderer**  
✅ **Engine** class manages rendering infrastructure  
✅ Clean API with escape hatches for advanced usage  
✅ Remove game layer Scene abstraction  

## Documentation

This refactoring includes comprehensive design documentation:

### 📘 Core Design Documents

1. **[SCREEN_SCENE_REFACTOR_DESIGN.md](./SCREEN_SCENE_REFACTOR_DESIGN.md)** (26KB)
   - **START HERE** - Complete design specification
   - Current vs proposed architecture
   - Detailed API changes
   - Migration path (4 phases)
   - Edge cases and solutions
   - Success criteria

2. **[ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)** (18KB)
   - Visual before/after diagrams
   - Data flow comparisons
   - Code examples
   - Key differences

3. **[DESIGN_ALTERNATIVES.md](./DESIGN_ALTERNATIVES.md)** (14KB)
   - 6 alternative approaches evaluated
   - Trade-off analysis
   - Design decisions explained
   - Performance considerations

### 📋 Implementation Resources

4. **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** (12KB)
   - Step-by-step implementation plan
   - 5 phases with detailed tasks
   - Testing checkpoints
   - Code review gates

5. **[REFACTOR_QUICK_REFERENCE.md](./REFACTOR_QUICK_REFERENCE.md)** (5KB)
   - Quick TL;DR summary
   - What changes
   - Migration examples
   - FAQs

## Quick Summary

### Before (Current)

```typescript
// Game layer creates Three.js objects
import * as THREE from 'three'

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(...)
const renderer = new THREE.WebGLRenderer()

// Two separate abstractions
import { SceneManager } from './game/scenes'  // Game's Scene
import { ScreenManager } from './engine'      // Engine's Screen

// Complex adapter pattern
const titleScene = createTitleScene(scene, camera, renderer, ...)
```

### After (Proposed)

```typescript
// Engine manages rendering
import { Engine } from './engine'
// No THREE.js imports needed!

const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600
})

// Single abstraction
const screenManager = engine.getScreenManager()

// Direct Screen usage
class MyScreen extends BaseScreen {
  constructor() {
    super('my', engine.getRenderer(), engine.getInput())
  }
}
```

## Key Benefits

| Benefit | Description |
|---------|-------------|
| **Simpler API** | No THREE.js types in public API |
| **Single Abstraction** | Screen only (no Scene confusion) |
| **Clear Ownership** | Engine manages rendering infrastructure |
| **Better Encapsulation** | Three.js is hidden implementation detail |
| **Easier to Use** | Less boilerplate, cleaner code |
| **Still Flexible** | Escape hatches for advanced usage |

## API Changes

### BaseScreen Constructor

**Before:**
```typescript
constructor(
  name: string,
  scene: THREE.Scene,           // ❌ Three.js exposed
  camera: THREE.Camera,         // ❌ Three.js exposed
  renderer: THREE.WebGLRenderer, // ❌ Three.js exposed
  input: Input
)
```

**After:**
```typescript
constructor(
  name: string,
  renderer: SceneRenderer,  // ✅ Internal abstraction
  input: Input
)
```

### Engine Initialization

**Before:**
```typescript
// User creates everything
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
const renderer = new THREE.WebGLRenderer()
const input = new Input()
const screenManager = new ScreenManager()
const gameLoop = new GameLoop({ ... })
```

**After:**
```typescript
// Engine creates everything
const engine = new Engine({
  container,
  width: 800,
  height: 600,
  left: -8,
  right: 8,
  top: 6,
  bottom: -6
})

engine.start()
```

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `/src/engine/scene-renderer.ts` | **NEW** | Internal Three.js wrapper |
| `/src/engine/engine-init.ts` | **NEW** | Engine initialization |
| `/src/engine/screen.ts` | **MODIFY** | BaseScreen uses SceneRenderer |
| `/src/engine/title-screen.ts` | **MODIFY** | Update to new API |
| `/src/game/scenes.ts` | **DELETE** | Remove duplicate abstraction |
| `/src/game/title-scene.ts` | **DELETE** | Adapter no longer needed |
| `/src/game/map-scene.ts` | **DELETE** | Adapter no longer needed |
| `/src/game/level-scene.ts` | **DELETE** | Adapter no longer needed |
| `/src/game/map-screen.ts` | **MODIFY** | Update to new API |
| `/src/game/index.ts` | **MODIFY** | Use Engine, create direct Screens |

## Implementation Phases

### Phase 1: Internal Infrastructure ✅ SAFE
- Create SceneRenderer class
- Create Engine class
- Add tests
- **No breaking changes**

### Phase 2: Refactor BaseScreen ⚠️ BREAKING
- Update BaseScreen API
- Update TitleScreen, MapScreen
- Update tests

### Phase 3: Update Game Layer ⚠️ BREAKING
- Remove Scene abstraction
- Convert game scenes to Screens
- Update game initialization

### Phase 4: Documentation 📝
- Update README
- Create migration guide
- Update examples

## Migration Example

### Old Code (v1.x)

```typescript
import * as THREE from 'three'
import { BaseScreen, ScreenManager } from './engine'
import { Scene, SceneManager } from './game/scenes'

// Create Three.js objects
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
const renderer = new THREE.WebGLRenderer()

// Create screen with Three.js objects
class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', scene, camera, renderer, input)
  }
  
  onEnter() {
    this.scene.add(myObject)  // Direct Three.js usage
  }
}

// Wrap in Scene adapter
function createMyScene(): Scene {
  const screen = new MyScreen()
  return {
    name: 'my-scene',
    enter: () => screen.onEnter(),
    exit: () => screen.onExit(),
    update: (dt) => screen.onUpdate(dt),
    render: () => screen.onRender()
  }
}

// Use game's SceneManager
const sceneManager = new SceneManager()
sceneManager.register(createMyScene())
```

### New Code (v2.0)

```typescript
import { Engine, BaseScreen } from './engine'

// Create engine (manages Three.js internally)
const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600,
  left: -8,
  right: 8,
  top: 6,
  bottom: -6
})

// Create screen with clean API
class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', engine.getRenderer(), engine.getInput())
  }
  
  onEnter() {
    this.addToScene(myObject)  // High-level API
  }
}

// Use engine's ScreenManager directly
const screenManager = engine.getScreenManager()
screenManager.register(new MyScreen())
engine.start()
```

## Escape Hatch for Advanced Usage

When you need direct Three.js access (e.g., for WorldMap):

```typescript
class MapScreen extends BaseScreen {
  onEnter() {
    // Use high-level API when possible
    this.setBackground(0x00FF00)
    
    // Get THREE.Scene when needed
    const threeScene = this.renderer.getThreeScene()
    this.worldMap = new WorldMap(threeScene, config)
  }
}
```

## Testing Strategy

- ✅ All existing tests must pass
- ✅ Add tests for SceneRenderer
- ✅ Add tests for Engine
- ✅ Integration tests for screen transitions
- ✅ Manual testing of demo game
- ✅ Performance testing
- ✅ Browser compatibility testing

## Success Criteria

- [x] Design documents complete
- [ ] Design reviewed and approved
- [ ] Implementation Phase 1 complete
- [ ] Implementation Phase 2 complete
- [ ] Implementation Phase 3 complete
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Demo game working
- [ ] Performance maintained
- [ ] Migration guide created
- [ ] Ready for v2.0.0 release

## Timeline (Estimated)

- **Design Phase:** ✅ Complete (2026-01-03)
- **Review Phase:** 1-2 days
- **Phase 1 Implementation:** 1-2 days
- **Phase 2 Implementation:** 2-3 days
- **Phase 3 Implementation:** 2-3 days
- **Phase 4 Documentation:** 1-2 days
- **Testing & Polish:** 1-2 days
- **Total:** ~2 weeks

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing projects | Version bump to 2.0.0, migration guide |
| Complex components break | Thorough testing, escape hatches |
| Performance regression | Performance testing, same Three.js backend |
| Developer confusion | Clear documentation, examples |

## Questions & Feedback

For questions or feedback on this design:

1. Review the design documents (start with SCREEN_SCENE_REFACTOR_DESIGN.md)
2. Open an issue with questions or concerns
3. Suggest alternatives or improvements
4. Approve to proceed with implementation

## Next Steps

1. **Review** - Stakeholders review design documents
2. **Discuss** - Address questions and concerns
3. **Approve** - Get approval to proceed
4. **Implement** - Begin Phase 1 implementation
5. **Test** - Comprehensive testing at each phase
6. **Release** - Version 2.0.0 with migration guide

## Resources

- [Design Specification](./SCREEN_SCENE_REFACTOR_DESIGN.md) - Complete design
- [Architecture Comparison](./ARCHITECTURE_COMPARISON.md) - Visual diagrams
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md) - Step-by-step plan
- [Quick Reference](./REFACTOR_QUICK_REFERENCE.md) - TL;DR guide
- [Design Alternatives](./DESIGN_ALTERNATIVES.md) - Trade-offs analysis

---

**Status:** 🎨 Design Complete  
**Awaiting:** Review and Approval  
**Contact:** Project maintainers  
**Version:** 1.0
