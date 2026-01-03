# Screen/Scene Abstraction Unification - Design Document

**Status:** Draft for Review  
**Created:** 2026-01-03  
**Author:** GitHub Copilot Agent

## Executive Summary

This document proposes a refactoring of the 8bit-engine's screen management system to:
1. Make **Screen** the primary game engine abstraction for game states
2. Hide Three.js implementation details (Scene, Camera, Renderer) from the public API
3. Eliminate duplicate Scene/Screen abstractions between engine and game layers

## Current Architecture

### Engine Layer (`/src/engine/`)

**`screen.ts`** - Screen Management System
```typescript
export interface Screen {
  name: string
  onEnter(): void
  onExit(): void
  onUpdate(deltaTime: number): void
  onRender(): void
  onPause?(): void
  onResume?(): void
}

export abstract class BaseScreen implements Screen {
  protected scene: THREE.Scene        // ❌ THREE.js exposed
  protected camera: THREE.Camera      // ❌ THREE.js exposed
  protected renderer: THREE.WebGLRenderer  // ❌ THREE.js exposed
  
  constructor(
    name: string,
    scene: THREE.Scene,              // ❌ THREE.js in API
    camera: THREE.Camera,            // ❌ THREE.js in API
    renderer: THREE.WebGLRenderer,   // ❌ THREE.js in API
    input: Input
  )
}

export class ScreenManager {
  // Stack-based screen management
  switchTo(screenName: string): void
  push(screenName: string): void
  pop(): void
}
```

**`title-screen.ts`** - Reusable Title Screen Component
```typescript
export class TitleScreen extends BaseScreen {
  // Takes THREE.Scene in constructor
  // Uses this.scene directly
}
```

### Game Layer (`/src/game/`)

**`scenes.ts`** - Game Scene System (Duplicate!)
```typescript
export type SceneType = 'title' | 'map' | 'level1' | 'level2' | 'level3'

export interface Scene {  // ❌ Duplicates Screen interface
  name: SceneType
  enter: () => void
  exit: () => void
  update: (dt: number) => void
  render: () => void
}

export class SceneManager {  // ❌ Duplicates ScreenManager
  switchTo(sceneName: SceneType): void
}
```

**`title-scene.ts`, `map-scene.ts`, `level-scene.ts`** - Scene Adapters
```typescript
export function createTitleScene(
  threeScene: THREE.Scene,     // ❌ Game layer manages THREE.Scene
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  const titleScreen = new TitleScreen(
    'title',
    threeScene,  // ❌ Passes THREE objects to engine
    camera,
    renderer,
    input,
    config
  )
  
  // Adapter pattern wrapping Screen as Scene
  return {
    name: 'title' as SceneType,
    enter() { titleScreen.onEnter() },
    exit() { titleScreen.onExit() },
    update(dt) { titleScreen.onUpdate(dt) },
    render() { titleScreen.onRender() }
  }
}
```

**`index.ts`** - Game Entry Point
```typescript
export function startGame(container: HTMLElement): void {
  // ❌ Game creates and manages THREE.js objects
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(...)
  const renderer = new THREE.WebGLRenderer(...)
  
  // ❌ Uses game's SceneManager, not engine's ScreenManager
  const sceneManager = new SceneManager()
  
  sceneManager.register(
    createTitleScene(scene, camera, renderer, input, sceneManager)
  )
}
```

### Problems Identified

1. **API Leakage**: Three.js types (Scene, Camera, Renderer) are part of the engine's public API
2. **Duplicate Abstractions**: Both `Screen` (engine) and `Scene` (game) exist for the same purpose
3. **Adapter Pattern Overhead**: Game layer wraps Screen objects as Scene objects unnecessarily
4. **Unclear Separation**: Game code must create and manage Three.js objects that should be engine internals
5. **Inconsistent Usage**: Some code uses ScreenManager, other code uses SceneManager

## Proposed Architecture

### Goals

1. **Screen as Primary Abstraction**: Screen represents a game state (title, map, level, pause menu)
2. **Hide Implementation**: Three.js is an internal implementation detail, not exposed in API
3. **Single Abstraction**: Remove duplicate Scene system
4. **Cleaner API**: Engine creates and manages its own rendering infrastructure
5. **Backward Compatible Components**: Keep existing high-level components (TitleScreen, WorldMap) working

### Design Principles

- **Separation of Concerns**: Game logic vs. rendering implementation
- **Encapsulation**: Hide internal rendering details
- **Simplicity**: One clear way to create screens
- **Composability**: Screens can use engine components without knowing about Three.js

## Detailed Design

### 1. Internal SceneRenderer Class

Create a new **internal** class (not exported) that encapsulates Three.js rendering:

```typescript
// src/engine/scene-renderer.ts
// ⚠️ INTERNAL - NOT EXPORTED FROM ENGINE

import * as THREE from 'three'

/**
 * Internal rendering backend using Three.js
 * This class is not exposed in the public API
 */
export class SceneRenderer {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    cameraConfig: CameraConfig
  ) {
    this.scene = new THREE.Scene()
    this.camera = this.createCamera(cameraConfig)
    this.renderer = this.createRenderer(container, width, height)
  }

  /**
   * Render the current scene
   */
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Add a renderable object to the scene
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  /**
   * Remove an object from the scene
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  /**
   * Clear all objects from the scene
   */
  clear(): void {
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0]
      this.disposeObject(obj)
      this.scene.remove(obj)
    }
  }

  /**
   * Set scene background color
   */
  setBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color)
  }

  /**
   * Add ambient light
   */
  addAmbientLight(intensity: number = 1): void {
    const light = new THREE.AmbientLight(0xffffff, intensity)
    this.scene.add(light)
  }

  /**
   * Get the underlying Three.js scene (for special cases)
   * Used by components like WorldMap that need direct access
   */
  getThreeScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the renderer's DOM element
   */
  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  // ... internal helper methods
}
```

**Key Points:**
- This class is **internal only** - not exported from `/src/engine/index.ts`
- Encapsulates all Three.js-specific rendering logic
- Provides high-level methods for common operations
- Still allows direct access via `getThreeScene()` for advanced components

### 2. Refactored BaseScreen

Update BaseScreen to use SceneRenderer instead of exposing Three.js objects:

```typescript
// src/engine/screen.ts

import { SceneRenderer } from './scene-renderer'  // Internal import
import { Input } from './input'

export interface Screen {
  name: string
  onEnter(): void
  onExit(): void
  onUpdate(deltaTime: number): void
  onRender(): void
  onPause?(): void
  onResume?(): void
}

export abstract class BaseScreen implements Screen {
  public readonly name: string
  protected renderer: SceneRenderer  // ✅ Internal renderer, not THREE
  protected input: Input
  protected clickHandler?: ClickHandler

  constructor(
    name: string,
    renderer: SceneRenderer,  // ✅ No Three.js in API
    input: Input
  ) {
    this.name = name
    this.renderer = renderer
    this.input = input
  }

  /**
   * Add an object to the scene
   * Objects can be created using engine utilities or Three.js directly
   */
  protected addToScene(object: any): void {
    this.renderer.addObject(object)
  }

  /**
   * Remove an object from the scene
   */
  protected removeFromScene(object: any): void {
    this.renderer.removeObject(object)
  }

  /**
   * Clear all objects from the scene
   */
  protected clearScene(): void {
    this.renderer.clear()
  }

  /**
   * Set scene background color
   */
  protected setBackground(color: number): void {
    this.renderer.setBackgroundColor(color)
  }

  /**
   * Add ambient lighting to scene
   */
  protected addAmbientLight(intensity: number = 1): void {
    this.renderer.addAmbientLight(intensity)
  }

  /**
   * Enable click handling for this screen
   */
  protected enableClickHandling(): void {
    const threeScene = this.renderer.getThreeScene()  // Internal use only
    const domElement = this.renderer.getDomElement()
    // Create click handler using internal scene access
  }

  // Default render implementation
  onRender(): void {
    this.renderer.render()
  }

  // Abstract methods
  abstract onEnter(): void
  abstract onExit(): void
  abstract onUpdate(deltaTime: number): void
}
```

**Key Changes:**
- ✅ No Three.js types in constructor or public API
- ✅ Uses SceneRenderer internally
- ✅ Provides high-level methods for common operations
- ✅ Still allows advanced usage via `renderer.getThreeScene()` internally

### 3. Updated Engine Components

**TitleScreen** - Update to use new API:

```typescript
// src/engine/title-screen.ts

export class TitleScreen extends BaseScreen {
  private titleText?: THREE.Group
  private menuButtons: Map<string, Button> = new Map()

  constructor(
    name: string,
    renderer: SceneRenderer,  // ✅ No Three.js types
    input: Input,
    config: TitleScreenConfig
  ) {
    super(name, renderer, input)
    this.config = {
      // ... apply defaults
    }
  }

  onEnter(): void {
    this.clearScene()
    this.setBackground(this.config.backgroundColor)
    this.addAmbientLight()
    this.enableClickHandling()
    
    // Allow game to setup custom visual elements
    // Pass internal THREE.Scene only for advanced usage
    const threeScene = this.renderer.getThreeScene()
    this.config.onSetupVisuals(threeScene)
    
    this.createTitle()
    this.createMenu()
  }

  private createTitle(): void {
    this.titleText = createBitmapText(
      this.config.title,
      BitmapTextStyles.title(this.config.titleColor)
    )
    this.titleText.position.set(0, 2, 0)
    this.addToScene(this.titleText)  // ✅ Use BaseScreen method
  }

  // ... rest of implementation
}
```

**WorldMap** - Keep existing interface but note it uses Three.js internally:

```typescript
// src/engine/world-map.ts

export class WorldMap {
  constructor(
    scene: THREE.Scene,  // Still takes THREE.Scene for now
    config: WorldMapConfig
  ) {
    // WorldMap is a complex component that directly uses Three.js
    // This is acceptable for internal engine components
  }
}
```

**Note:** Components like WorldMap, AnimatedSprite that currently take `THREE.Scene` can:
1. **Option A**: Keep taking THREE.Scene (users get it from `renderer.getThreeScene()`)
2. **Option B**: Refactor to take SceneRenderer and use high-level methods
3. **Option C**: Create a hybrid approach where they can take either

For this design, we'll use **Option A** to minimize breaking changes to existing components.

### 4. Engine Initialization Helper

Create a helper to initialize the engine:

```typescript
// src/engine/engine-init.ts

export interface EngineConfig {
  container: HTMLElement
  width: number
  height: number
  targetFPS?: number
  cameraType?: 'orthographic' | 'perspective'
  // Orthographic camera config
  left?: number
  right?: number
  top?: number
  bottom?: number
}

export class Engine {
  private renderer: SceneRenderer
  private input: Input
  private gameLoop: GameLoop
  private screenManager: ScreenManager

  constructor(config: EngineConfig) {
    this.input = new Input()
    
    // Create internal renderer
    this.renderer = new SceneRenderer(
      config.container,
      config.width,
      config.height,
      {
        type: config.cameraType || 'orthographic',
        left: config.left || -8,
        right: config.right || 8,
        top: config.top || 6,
        bottom: config.bottom || -6
      }
    )
    
    this.screenManager = new ScreenManager()
    
    this.gameLoop = new GameLoop({
      update: (dt) => {
        this.screenManager.update(dt)
        this.input.update()
      },
      render: () => {
        this.screenManager.render()
      },
      targetFPS: config.targetFPS || 60
    })
  }

  /**
   * Get the scene renderer for creating screens
   */
  getRenderer(): SceneRenderer {
    return this.renderer
  }

  /**
   * Get the input system
   */
  getInput(): Input {
    return this.input
  }

  /**
   * Get the screen manager
   */
  getScreenManager(): ScreenManager {
    return this.screenManager
  }

  /**
   * Start the game loop
   */
  start(): void {
    this.gameLoop.start()
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.gameLoop.stop()
  }
}
```

### 5. Remove Game Layer Scene Abstraction

**Delete these files:**
- `/src/game/scenes.ts` - Delete entirely
- `/src/game/title-scene.ts` - Delete (or convert to direct Screen)
- `/src/game/map-scene.ts` - Delete (or convert to direct Screen)
- `/src/game/level-scene.ts` - Delete (or convert to direct Screen)

**Why?** These were adapter wrappers. With the new API, game code creates Screen objects directly.

### 6. Updated Game Layer

**New `/src/game/index.ts`** - Simplified game entry point:

```typescript
// src/game/index.ts

import { Engine, ScreenManager, BaseScreen, NES_PALETTE } from '../engine'
import { TitleScreen } from '../engine/title-screen'
import { createBitmapText } from '../engine'

// Game-specific screens extend BaseScreen directly
class GameTitleScreen extends BaseScreen {
  onEnter(): void {
    this.setBackground(NES_PALETTE.DARK_BLUE)
    this.addAmbientLight()
    
    // Create game-specific content
    const title = createBitmapText('8BIT QUEST')
    title.position.set(0, 2, 0)
    this.addToScene(title)
  }

  onUpdate(deltaTime: number): void {
    if (this.input.justPressed('start')) {
      // Switch to map screen
      this.screenManager.switchTo('map')
    }
  }

  onExit(): void {
    this.clearScene()
  }
}

class MapScreen extends BaseScreen {
  private worldMap?: WorldMap

  onEnter(): void {
    this.setBackground(NES_PALETTE.LIME)
    this.addAmbientLight()
    
    // WorldMap needs THREE.Scene - get it internally
    const threeScene = this.renderer.getThreeScene()
    this.worldMap = new WorldMap(threeScene, {
      // ... config
    })
  }

  onUpdate(deltaTime: number): void {
    this.worldMap?.update(deltaTime, this.input)
    
    if (this.input.justPressed('a')) {
      const currentNode = this.worldMap?.getCurrentNode()
      if (currentNode) {
        // Navigate based on node
        if (currentNode.type === 'level') {
          this.screenManager.switchTo('level1')
        }
      }
    }
  }

  onExit(): void {
    this.worldMap?.destroy()
  }
}

export function startGame(container: HTMLElement): void {
  // Initialize engine (no THREE.js in game code!)
  const engine = new Engine({
    container,
    width: 256 * 3,
    height: 240 * 3,
    left: -8,
    right: 8,
    top: 6,
    bottom: -6
  })

  const renderer = engine.getRenderer()
  const input = engine.getInput()
  const screenManager = engine.getScreenManager()

  // Register screens
  screenManager.register(
    new GameTitleScreen('title', renderer, input)
  )
  screenManager.register(
    new MapScreen('map', renderer, input)
  )
  // ... register other screens

  // Start at title
  screenManager.switchTo('title')

  // Start game loop
  engine.start()
}
```

**Key Improvements:**
- ✅ No `new THREE.Scene()` in game code
- ✅ No Scene/SceneManager duplication
- ✅ Screens extend BaseScreen directly
- ✅ Clean, simple API

## Migration Path

### Phase 1: Create Internal Infrastructure ✅ SAFE
**Goal:** Add new SceneRenderer without breaking existing code

Files to create:
- [ ] `/src/engine/scene-renderer.ts` - New internal class
- [ ] `/src/engine/engine-init.ts` - New Engine helper class

Changes:
- [ ] **DO NOT** export SceneRenderer from `/src/engine/index.ts`
- [ ] **DO NOT** modify existing Screen/BaseScreen yet

Testing:
- [ ] All existing tests pass (no changes to existing code)
- [ ] Add unit tests for SceneRenderer if needed

### Phase 2: Refactor BaseScreen ⚠️ BREAKING
**Goal:** Update Screen API to use SceneRenderer

Files to modify:
- [ ] `/src/engine/screen.ts` - Update BaseScreen constructor and methods
- [ ] `/src/engine/title-screen.ts` - Update TitleScreen to new API
- [ ] `/src/game/map-screen.ts` - Update MapScreen to new API

Changes:
- [ ] BaseScreen constructor: `(name, renderer: SceneRenderer, input)` 
- [ ] Update protected methods to use SceneRenderer
- [ ] Keep `renderer.getThreeScene()` available for components

Testing:
- [ ] Update any Screen-related tests
- [ ] Verify TitleScreen still works
- [ ] Verify MapScreen still works

### Phase 3: Update Game Layer ⚠️ BREAKING
**Goal:** Remove Scene abstraction and use Screen directly

Files to modify:
- [ ] `/src/game/index.ts` - Use Engine class, ScreenManager
- [ ] `/src/game/title-scene.ts` - Convert to direct Screen or delete
- [ ] `/src/game/map-scene.ts` - Convert to direct Screen or delete
- [ ] `/src/game/level-scene.ts` - Convert to direct Screen or delete

Files to delete:
- [ ] `/src/game/scenes.ts` - Delete Scene interface and SceneManager

Changes:
- [ ] Create game screens as direct Screen implementations
- [ ] Use engine's ScreenManager instead of game's SceneManager
- [ ] Use Engine initialization helper

Testing:
- [ ] Demo game still runs correctly
- [ ] All screen transitions work
- [ ] Level progression works

### Phase 4: Update Demo and Documentation 📝
**Goal:** Update examples and documentation

Files to modify:
- [ ] `/src/map-demo.ts` - Update to use Engine class
- [ ] `README.md` - Update Screen System section
- [ ] Remove Scene references from README
- [ ] Update Quick Start examples

Documentation to add:
- [ ] Add migration guide for existing code
- [ ] Document Engine initialization
- [ ] Document when to use `renderer.getThreeScene()`

Testing:
- [ ] map-demo.ts runs correctly
- [ ] All examples in README work

## API Surface Changes

### Before (Current API)

**Game code must manage Three.js:**
```typescript
import * as THREE from 'three'
import { BaseScreen } from './engine'

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
const renderer = new THREE.WebGLRenderer()

class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', scene, camera, renderer, input)
  }
}
```

**Two separate systems:**
```typescript
import { ScreenManager } from './engine'  // One system
import { SceneManager } from './game'     // Another system (duplicate!)
```

### After (Proposed API)

**Engine manages rendering:**
```typescript
import { Engine, BaseScreen } from './engine'
// No THREE.js imports needed!

const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600
})

class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', engine.getRenderer(), engine.getInput())
  }
  
  onEnter(): void {
    this.setBackground(0x000000)
    this.addAmbientLight()
    // Use high-level methods, no THREE.Scene!
  }
}
```

**Single screen system:**
```typescript
import { Engine } from './engine'  // One system!

const engine = new Engine({ /* config */ })
const screenManager = engine.getScreenManager()
```

## Handling Edge Cases

### Case 1: Components That Need THREE.Scene

**Problem:** WorldMap, AnimatedSprite take `THREE.Scene` in constructor

**Solution:** Use `renderer.getThreeScene()` internally in screens:

```typescript
class MapScreen extends BaseScreen {
  onEnter(): void {
    // Get THREE.Scene for specialized components
    const threeScene = this.renderer.getThreeScene()
    this.worldMap = new WorldMap(threeScene, config)
  }
}
```

**Future:** Could refactor these components to take SceneRenderer instead.

### Case 2: Custom Rendering in onSetupVisuals

**Problem:** TitleScreen's `onSetupVisuals` callback passes THREE.Scene

**Solution:** Keep passing THREE.Scene for now in callbacks:

```typescript
export interface TitleScreenConfig {
  onSetupVisuals?: (scene: THREE.Scene) => void
}

// In TitleScreen.onEnter():
const threeScene = this.renderer.getThreeScene()
this.config.onSetupVisuals?.(threeScene)
```

This is acceptable because:
1. It's a callback API for advanced customization
2. Users who need it understand they're working with Three.js
3. The main Screen API stays clean

### Case 3: ClickHandler Setup

**Problem:** ClickHandler needs camera and DOM element

**Solution:** SceneRenderer provides these via getters:

```typescript
protected enableClickHandling(): void {
  const scene = this.renderer.getThreeScene()
  const camera = this.renderer.getCamera()  // Add this getter
  const domElement = this.renderer.getDomElement()
  
  this.clickHandler = new ClickHandler(camera, scene, domElement)
}
```

### Case 4: Existing Projects Using Old API

**Problem:** Breaking changes affect existing code

**Solution Options:**

1. **Deprecation Period:**
   - Keep old API with deprecation warnings
   - Provide migration guide
   - Remove in next major version

2. **Compatibility Layer:**
   - Create adapter that wraps old API
   - Mark as deprecated
   - Direct users to new API

3. **Version Bump:**
   - Make it v2.0.0 with breaking changes
   - Document migration clearly

**Recommendation:** Version bump to 2.0.0 + migration guide

## Implementation Checklist

### Prerequisites
- [x] Understand current architecture
- [x] Identify all Screen/Scene usages
- [x] Design new abstractions
- [ ] Review design with stakeholders
- [ ] Decide on backward compatibility approach

### Phase 1: Internal Infrastructure
- [ ] Create `SceneRenderer` class
- [ ] Create `Engine` initialization class
- [ ] Add unit tests for SceneRenderer
- [ ] Verify all existing tests still pass
- [ ] Code review

### Phase 2: Refactor BaseScreen
- [ ] Update BaseScreen constructor
- [ ] Update BaseScreen methods
- [ ] Update TitleScreen
- [ ] Update MapScreen
- [ ] Update any screen-related tests
- [ ] Manual testing of updated screens
- [ ] Code review

### Phase 3: Update Game Layer
- [ ] Convert title-scene.ts to direct Screen
- [ ] Convert map-scene.ts to direct Screen
- [ ] Convert level-scene.ts to direct Screen
- [ ] Update game/index.ts to use Engine
- [ ] Delete game/scenes.ts
- [ ] Test demo game end-to-end
- [ ] Code review

### Phase 4: Documentation
- [ ] Update README.md Screen System section
- [ ] Remove Scene references
- [ ] Update Quick Start examples
- [ ] Update map-demo.ts
- [ ] Create MIGRATION_GUIDE.md
- [ ] Update API documentation
- [ ] Review documentation

### Phase 5: Final Testing
- [ ] Run full test suite
- [ ] Test demo game thoroughly
- [ ] Test map-demo
- [ ] Manual testing of all screens
- [ ] Performance testing
- [ ] Browser compatibility testing

## Success Criteria

- [ ] No Three.js types in Screen interface or BaseScreen constructor
- [ ] Single abstraction: Screen (no Scene)
- [ ] Game code doesn't create THREE.Scene, Camera, or Renderer
- [ ] All existing tests pass
- [ ] Demo game works identically
- [ ] map-demo.ts works
- [ ] Documentation updated
- [ ] Migration guide created
- [ ] Code is cleaner and easier to understand

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing projects | High | Certain | Version bump, migration guide, deprecation warnings |
| Complex components break | Medium | Medium | Thorough testing, allow `getThreeScene()` escape hatch |
| Performance regression | Low | Low | Performance testing, Three.js still used internally |
| Developer confusion | Medium | Low | Clear documentation, examples, migration guide |
| Hidden bugs in edge cases | Medium | Medium | Comprehensive testing, code review |

## Future Enhancements

After this refactor, we could:

1. **GameObject Abstraction**: Create a GameObject wrapper that hides THREE.Object3D
2. **Component System**: Refactor WorldMap, AnimatedSprite to use SceneRenderer
3. **Renderer Backends**: Abstract SceneRenderer to support different renderers (Canvas2D, WebGPU)
4. **Visual Editor**: Build a visual screen editor now that abstraction is clean
5. **Plugin System**: Allow plugins to extend Screen functionality

## Questions for Review

1. **API Depth**: Should we hide Three.js completely or allow escape hatches like `getThreeScene()`?
   - **Recommendation**: Keep escape hatches for advanced use cases

2. **GameObject Abstraction**: Should we wrap THREE.Object3D in a GameObject class?
   - **Recommendation**: Not in this refactor - too big. Future enhancement.

3. **Backward Compatibility**: Deprecation period or clean break?
   - **Recommendation**: Clean break with migration guide (v2.0.0)

4. **Component Refactoring**: Should WorldMap, AnimatedSprite take SceneRenderer?
   - **Recommendation**: Future refactor. For now, use `getThreeScene()` escape hatch.

5. **Engine Singleton**: Should Engine be a singleton or allow multiple instances?
   - **Recommendation**: Allow multiple instances for testing and flexibility

## Conclusion

This refactoring will:

✅ Make Screen the clear, primary abstraction for game states  
✅ Hide Three.js implementation details from the public API  
✅ Eliminate confusing duplicate Scene/Screen abstractions  
✅ Provide a cleaner, more intuitive API for game developers  
✅ Maintain flexibility for advanced use cases  
✅ Improve code maintainability and testability  

The proposed design balances **clean abstractions** with **pragmatic implementation**, providing escape hatches where needed while steering developers toward the high-level API for common use cases.

**Next Steps:** Review this design, gather feedback, and proceed with implementation if approved.

---

**Document Version:** 1.0  
**Status:** Ready for Review  
**Reviewers:** Project maintainers, stakeholders
