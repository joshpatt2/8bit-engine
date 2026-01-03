# Architecture Comparison: Before vs After

## Current Architecture (Before)

```
┌─────────────────────────────────────────────────────────────┐
│                        Game Layer                           │
│  /src/game/                                                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  index.ts (Game Entry Point)                         │  │
│  │  - Creates THREE.Scene ❌                            │  │
│  │  - Creates THREE.Camera ❌                           │  │
│  │  - Creates THREE.WebGLRenderer ❌                    │  │
│  │  - Creates game.SceneManager ❌                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  scenes.ts - Scene Abstraction                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  interface Scene                               │  │  │
│  │  │    name, enter(), exit(), update(), render()   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class SceneManager                            │  │  │
│  │  │    switchTo(sceneName)                         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  title-scene.ts, map-scene.ts, level-scene.ts       │  │
│  │  (Adapter Functions)                                 │  │
│  │                                                      │  │
│  │  createTitleScene(                                   │  │
│  │    threeScene: THREE.Scene, ❌                       │  │
│  │    camera: THREE.Camera, ❌                          │  │
│  │    renderer: THREE.WebGLRenderer, ❌                 │  │
│  │    input, sceneManager                               │  │
│  │  ): Scene {                                          │  │
│  │    const titleScreen = new TitleScreen(...)          │  │
│  │    return { /* adapter wrapping */ }                 │  │
│  │  }                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ Uses ▼
┌───────────────────────────┼─────────────────────────────────┐
│                        Engine Layer                         │
│  /src/engine/             │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  screen.ts - Screen Abstraction                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  interface Screen                              │  │  │
│  │  │    name, onEnter(), onExit(), onUpdate()...    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class BaseScreen implements Screen            │  │  │
│  │  │    protected scene: THREE.Scene ❌             │  │  │
│  │  │    protected camera: THREE.Camera ❌           │  │  │
│  │  │    protected renderer: THREE.WebGLRenderer ❌  │  │  │
│  │  │                                                │  │  │
│  │  │    constructor(                                │  │  │
│  │  │      name,                                     │  │  │
│  │  │      scene: THREE.Scene, ❌                    │  │  │
│  │  │      camera: THREE.Camera, ❌                  │  │  │
│  │  │      renderer: THREE.WebGLRenderer ❌          │  │  │
│  │  │    )                                           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class ScreenManager                           │  │  │
│  │  │    switchTo(), push(), pop()                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  title-screen.ts                                     │  │
│  │  class TitleScreen extends BaseScreen               │  │
│  │    Takes THREE.Scene in constructor ❌              │  │
│  │    Uses this.scene directly ❌                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Problems:
❌ THREE.js types exposed in engine API
❌ Duplicate abstractions (Scene and Screen)
❌ Game layer manages rendering infrastructure
❌ Adapter pattern adds complexity
❌ Unclear which system to use
```

## Proposed Architecture (After)

```
┌─────────────────────────────────────────────────────────────┐
│                        Game Layer                           │
│  /src/game/                                                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  index.ts (Game Entry Point)                         │  │
│  │                                                      │  │
│  │  const engine = new Engine({ ✅                      │  │
│  │    container,                                        │  │
│  │    width, height                                     │  │
│  │  })                                                  │  │
│  │                                                      │  │
│  │  const renderer = engine.getRenderer() ✅            │  │
│  │  const input = engine.getInput() ✅                  │  │
│  │  const screenManager = engine.getScreenManager() ✅  │  │
│  │                                                      │  │
│  │  // No THREE.js in game code! ✅                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Game Screens (Direct Screen implementations)        │  │
│  │                                                      │  │
│  │  class GameTitleScreen extends BaseScreen {         │  │
│  │    constructor(name, renderer, input) ✅             │  │
│  │                                                      │  │
│  │    onEnter() {                                       │  │
│  │      this.setBackground(0x000000) ✅                 │  │
│  │      this.addAmbientLight() ✅                       │  │
│  │      // Use high-level methods ✅                    │  │
│  │    }                                                 │  │
│  │  }                                                   │  │
│  │                                                      │  │
│  │  class MapScreen extends BaseScreen { ... }         │  │
│  │  class Level1Screen extends BaseScreen { ... }      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ Uses ▼
┌───────────────────────────┼─────────────────────────────────┐
│                        Engine Layer                         │
│  /src/engine/             │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  engine-init.ts - Engine Initialization              │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class Engine                                  │  │  │
│  │  │    - renderer: SceneRenderer (internal) ✅     │  │  │
│  │  │    - input: Input ✅                           │  │  │
│  │  │    - screenManager: ScreenManager ✅           │  │  │
│  │  │    - gameLoop: GameLoop ✅                     │  │  │
│  │  │                                                │  │  │
│  │  │    getRenderer(): SceneRenderer ✅             │  │  │
│  │  │    getInput(): Input ✅                        │  │  │
│  │  │    getScreenManager(): ScreenManager ✅        │  │  │
│  │  │    start(), stop() ✅                          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  scene-renderer.ts (INTERNAL - NOT EXPORTED) 🔒      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class SceneRenderer                           │  │  │
│  │  │    private scene: THREE.Scene ✅               │  │  │
│  │  │    private camera: THREE.Camera ✅             │  │  │
│  │  │    private renderer: THREE.WebGLRenderer ✅    │  │  │
│  │  │                                                │  │  │
│  │  │    // High-level API ✅                        │  │  │
│  │  │    render(): void                              │  │  │
│  │  │    addObject(obj): void                        │  │  │
│  │  │    removeObject(obj): void                     │  │  │
│  │  │    clear(): void                               │  │  │
│  │  │    setBackgroundColor(color): void             │  │  │
│  │  │    addAmbientLight(intensity): void            │  │  │
│  │  │                                                │  │  │
│  │  │    // Escape hatch for advanced usage 🚪       │  │  │
│  │  │    getThreeScene(): THREE.Scene                │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  screen.ts - Screen Abstraction                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  interface Screen (unchanged) ✅               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class BaseScreen implements Screen            │  │  │
│  │  │    protected renderer: SceneRenderer ✅        │  │  │
│  │  │    protected input: Input ✅                   │  │  │
│  │  │                                                │  │  │
│  │  │    constructor(                                │  │  │
│  │  │      name: string, ✅                          │  │  │
│  │  │      renderer: SceneRenderer, ✅               │  │  │
│  │  │      input: Input ✅                           │  │  │
│  │  │    )                                           │  │  │
│  │  │                                                │  │  │
│  │  │    // High-level methods ✅                    │  │  │
│  │  │    protected addToScene(obj): void             │  │  │
│  │  │    protected removeFromScene(obj): void        │  │  │
│  │  │    protected clearScene(): void                │  │  │
│  │  │    protected setBackground(color): void        │  │  │
│  │  │    protected addAmbientLight(): void           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  class ScreenManager (unchanged) ✅            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  title-screen.ts                                     │  │
│  │  class TitleScreen extends BaseScreen               │  │
│  │    constructor(name, renderer, input, config) ✅     │  │
│  │    Uses this.addToScene() ✅                        │  │
│  │    Uses this.setBackground() ✅                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components (WorldMap, AnimatedSprite, etc.)         │  │
│  │  - Can use renderer.getThreeScene() if needed 🚪     │  │
│  │  - Or be refactored to use SceneRenderer (future)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Benefits:
✅ Single abstraction: Screen (no Scene duplication)
✅ THREE.js hidden as implementation detail
✅ Engine manages rendering infrastructure
✅ Clean, simple API
✅ Game code focuses on game logic
✅ Escape hatches for advanced usage
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Abstractions** | Scene (game) + Screen (engine) | Screen only ✅ |
| **THREE.js in API** | Exposed in BaseScreen constructor | Hidden in SceneRenderer ✅ |
| **Who creates renderer** | Game layer | Engine ✅ |
| **Scene management** | Two systems: SceneManager + ScreenManager | One system: ScreenManager ✅ |
| **Screen creation** | Complex adapter pattern | Direct extension of BaseScreen ✅ |
| **API surface** | Large (THREE.js types exposed) | Small (clean abstractions) ✅ |
| **Flexibility** | Game can access Three.js freely | Escape hatches for advanced cases ✅ |

## Code Comparison

### Creating a Screen - Before

```typescript
// In game layer
import * as THREE from 'three'
import { BaseScreen, Input } from './engine'

// Must create Three.js objects
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(...)
const renderer = new THREE.WebGLRenderer()

// Pass Three.js objects to screen
class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', scene, camera, renderer, input)
  }
  
  onEnter() {
    // Direct access to this.scene
    this.scene.add(myObject)
  }
}

// Then wrap it in adapter
function createMyScene(...): Scene {
  const screen = new MyScreen(...)
  return {
    name: 'my-screen',
    enter: () => screen.onEnter(),
    // ... more adapter code
  }
}
```

### Creating a Screen - After

```typescript
// In game layer
import { Engine, BaseScreen } from './engine'
// No THREE.js import needed!

// Engine creates rendering infrastructure
const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600
})

// Use clean API
class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', engine.getRenderer(), engine.getInput())
  }
  
  onEnter() {
    // High-level methods
    this.setBackground(0x000000)
    this.addToScene(myObject)
  }
}

// Register directly
engine.getScreenManager().register(new MyScreen())
```

## Data Flow Comparison

### Before

```
User Code
  │
  ├─> Creates THREE.Scene ❌
  ├─> Creates THREE.Camera ❌
  ├─> Creates THREE.WebGLRenderer ❌
  │
  ├─> Creates game.SceneManager ❌
  ├─> Creates Scene adapters
  │     │
  │     └─> Wraps BaseScreen
  │           │
  │           └─> Uses THREE.js objects passed from user
  │
  └─> Manages rendering loop
```

### After

```
User Code
  │
  ├─> Creates Engine ✅
  │     │
  │     ├─> Engine creates SceneRenderer (internal) ✅
  │     │     │
  │     │     └─> SceneRenderer creates THREE.js objects (hidden) ✅
  │     │
  │     ├─> Engine creates Input ✅
  │     ├─> Engine creates ScreenManager ✅
  │     └─> Engine creates GameLoop ✅
  │
  ├─> Creates Screens extending BaseScreen ✅
  │     │
  │     └─> Screens use high-level methods ✅
  │
  └─> engine.start() ✅
```

## Escape Hatch Example

For advanced cases where direct Three.js access is needed:

```typescript
class AdvancedScreen extends BaseScreen {
  onEnter() {
    // Normal high-level API
    this.setBackground(0x000000)
    
    // Advanced: Need direct Three.js access
    const threeScene = this.renderer.getThreeScene()
    
    // Use for components that need THREE.Scene
    this.worldMap = new WorldMap(threeScene, config)
    
    // Or for custom Three.js manipulations
    const customLight = new THREE.DirectionalLight(...)
    threeScene.add(customLight)
  }
}
```

This provides:
- ✅ Clean API for common cases
- ✅ Power user escape hatch when needed
- ✅ Clear signal when "dropping down" to Three.js
- ✅ Flexibility without compromising abstraction

## Summary

The new architecture:

1. **Simplifies** the API by removing duplicate abstractions
2. **Encapsulates** Three.js as an implementation detail
3. **Clarifies** responsibilities: Engine manages rendering, Game manages logic
4. **Maintains** flexibility through escape hatches
5. **Improves** maintainability by reducing coupling
6. **Guides** developers toward the high-level API while allowing advanced usage

The refactoring achieves the goals:
- ✅ Screen is the game engine abstraction for game states
- ✅ THREE.Scene is an implementation detail, not part of public API
