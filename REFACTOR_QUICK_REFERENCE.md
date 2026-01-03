# Screen/Scene Refactor - Quick Reference

## TL;DR

**Problem:** The engine has two screen abstractions (Screen and Scene) and exposes Three.js in its public API.

**Solution:** Unify around Screen, hide Three.js behind a SceneRenderer abstraction.

## What Changes

### API Changes

#### Before
```typescript
// User must manage Three.js
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(...)
const renderer = new THREE.WebGLRenderer()

class MyScreen extends BaseScreen {
  constructor() {
    super('my', scene, camera, renderer, input)
  }
}
```

#### After
```typescript
// Engine manages Three.js
const engine = new Engine({ container, width, height })

class MyScreen extends BaseScreen {
  constructor() {
    super('my', engine.getRenderer(), engine.getInput())
  }
}
```

### File Changes

| File | Change |
|------|--------|
| `/src/engine/scene-renderer.ts` | **NEW** - Internal Three.js wrapper |
| `/src/engine/engine-init.ts` | **NEW** - Engine initialization |
| `/src/engine/screen.ts` | **MODIFY** - BaseScreen uses SceneRenderer |
| `/src/engine/title-screen.ts` | **MODIFY** - Update to new API |
| `/src/engine/index.ts` | **MODIFY** - Export Engine, don't export SceneRenderer |
| `/src/game/scenes.ts` | **DELETE** - Remove duplicate abstraction |
| `/src/game/title-scene.ts` | **DELETE** - Adapter no longer needed |
| `/src/game/map-scene.ts` | **DELETE** - Adapter no longer needed |
| `/src/game/level-scene.ts` | **DELETE** - Adapter no longer needed |
| `/src/game/map-screen.ts` | **MODIFY** - Update to new API |
| `/src/game/index.ts` | **MODIFY** - Use Engine, create direct Screens |
| `/src/map-demo.ts` | **MODIFY** - Use Engine initialization |
| `README.md` | **MODIFY** - Update documentation |

## Migration Guide

### For Engine Users

#### Old Way
```typescript
import * as THREE from 'three'
import { BaseScreen, ScreenManager, Input, GameLoop } from './engine'

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
const renderer = new THREE.WebGLRenderer()
const input = new Input()
const screenManager = new ScreenManager()

class MyScreen extends BaseScreen {
  constructor() {
    super('my', scene, camera, renderer, input)
  }
  
  onEnter() {
    this.scene.background = new THREE.Color(0x000000)
  }
}

const gameLoop = new GameLoop({
  update: (dt) => screenManager.update(dt),
  render: () => screenManager.render()
})
gameLoop.start()
```

#### New Way
```typescript
import { Engine, BaseScreen } from './engine'

const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600,
  left: -8,
  right: 8,
  top: 6,
  bottom: -6
})

class MyScreen extends BaseScreen {
  constructor() {
    super('my', engine.getRenderer(), engine.getInput())
  }
  
  onEnter() {
    this.setBackground(0x000000)
  }
}

engine.getScreenManager().register(new MyScreen())
engine.start()
```

### For Advanced Users

If you need direct Three.js access (e.g., for WorldMap):

```typescript
class MyScreen extends BaseScreen {
  onEnter() {
    // Use high-level API when possible
    this.setBackground(0x000000)
    
    // Get THREE.Scene when needed
    const threeScene = this.renderer.getThreeScene()
    this.worldMap = new WorldMap(threeScene, config)
  }
}
```

## Implementation Phases

### Phase 1: Create Infrastructure ✅ SAFE
- Create `SceneRenderer` class (internal)
- Create `Engine` initialization class
- Add tests
- No breaking changes

### Phase 2: Refactor BaseScreen ⚠️ BREAKING
- Update BaseScreen constructor
- Update TitleScreen, MapScreen
- Update Screen-related tests

### Phase 3: Update Game Layer ⚠️ BREAKING
- Remove `/game/scenes.ts`
- Convert game scenes to direct Screens
- Update `/game/index.ts`

### Phase 4: Documentation 📝
- Update README.md
- Update examples
- Create migration guide

## Key Benefits

1. **Simpler API**: No THREE.js in signatures
2. **Single Abstraction**: Screen (no Scene)
3. **Clear Ownership**: Engine manages rendering
4. **Better Encapsulation**: Three.js is hidden
5. **Easier to Use**: Less boilerplate

## FAQs

**Q: Do I need to know Three.js to use the engine?**  
A: No! The new API hides Three.js completely for common use cases.

**Q: What if I need Three.js for something?**  
A: Use `renderer.getThreeScene()` as an escape hatch.

**Q: Is this a breaking change?**  
A: Yes. Recommend version bump to 2.0.0.

**Q: Will my existing code break?**  
A: Yes, but migration is straightforward. See migration guide above.

**Q: What about performance?**  
A: No change. Three.js is still used internally, just hidden.

**Q: Can I still use ScreenManager features (push/pop)?**  
A: Yes! ScreenManager API is unchanged.

## Design Documents

For detailed information:

- `SCREEN_SCENE_REFACTOR_DESIGN.md` - Complete design document
- `ARCHITECTURE_COMPARISON.md` - Before/after visual comparison

## Status

- [x] Design complete
- [ ] Implementation Phase 1
- [ ] Implementation Phase 2
- [ ] Implementation Phase 3
- [ ] Documentation updates
- [ ] Testing complete
- [ ] Ready to merge
