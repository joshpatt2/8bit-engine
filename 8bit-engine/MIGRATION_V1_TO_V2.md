# Migration Guide: v1.x to v2.0

This guide helps you migrate from 8bit-engine v1.x to v2.0, which introduces breaking changes to unify the Screen/Scene abstractions and hide Three.js implementation details.

## Overview of Changes

**v2.0 Goals:**
1. ✅ Screen is the primary game engine abstraction
2. ✅ THREE.js is an implementation detail (not in public API)
3. ✅ Single abstraction (removed duplicate Scene system)
4. ✅ Engine class manages initialization

## Breaking Changes

### 1. BaseScreen Constructor Changed

**v1.x:**
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

**v2.0:**
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
    super('my-screen', engine.getRenderer(), engine.getInput())
  }
}
```

### 2. Scene Direct Access Removed

**v1.x:**
```typescript
class MyScreen extends BaseScreen {
  onEnter() {
    this.scene.add(myObject)
    this.scene.background = new THREE.Color(0x000000)
  }
}
```

**v2.0:**
```typescript
class MyScreen extends BaseScreen {
  onEnter() {
    this.addToScene(myObject)
    this.setBackground(0x000000)
  }
}
```

### 3. Rendering Changed

**v1.x:**
```typescript
class MyScreen extends BaseScreen {
  onRender() {
    this.renderer.render(this.scene, this.camera)
  }
}
```

**v2.0:**
```typescript
class MyScreen extends BaseScreen {
  // onRender() is now optional - default implementation calls renderer.render()
  // You can override if needed, but usually not necessary
}
```

### 4. Game Initialization Changed

**v1.x:**
```typescript
import * as THREE from 'three'
import { Input, GameLoop, ScreenManager } from './engine'

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(...)
const renderer = new THREE.WebGLRenderer()
const input = new Input()
const screenManager = new ScreenManager()

const gameLoop = new GameLoop({
  update: (dt) => {
    screenManager.update(dt)
    input.update()
  },
  render: () => {
    screenManager.render()
  }
})

gameLoop.start()
```

**v2.0:**
```typescript
import { Engine } from './engine'

const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600
})

// Engine manages Input, ScreenManager, and GameLoop internally
engine.start()
```

### 5. Scene/SceneManager Removed

The game layer's Scene abstraction has been removed. If you were using it:

**v1.x:**
```typescript
import { Scene, SceneManager } from './game/scenes'

const sceneManager = new SceneManager()
sceneManager.register(createTitleScene(...))
sceneManager.switchTo('title')
```

**v2.0:**
```typescript
import { Engine } from './engine'

const engine = new Engine({ ... })
const screenManager = engine.getScreenManager()

screenManager.register(new TitleScreen('title', engine.getRenderer(), engine.getInput()))
screenManager.switchTo('title')
```

## Step-by-Step Migration

### Step 1: Install v2.0

Update your package.json:
```json
{
  "dependencies": {
    "8bit-engine": "^2.0.0"
  }
}
```

Then run:
```bash
npm install
```

### Step 2: Update Imports

**Remove:**
```typescript
import * as THREE from 'three'  // No longer needed in game code
```

**Add:**
```typescript
import { Engine } from './engine'
```

### Step 3: Replace Three.js Setup with Engine

**Old initialization code:**
```typescript
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(WIDTH, HEIGHT)
container.appendChild(renderer.domElement)

const input = new Input()
const screenManager = new ScreenManager()
const gameLoop = new GameLoop({ ... })
```

**New initialization code:**
```typescript
const engine = new Engine({
  container,
  width: WIDTH,
  height: HEIGHT,
  left: -8,
  right: 8,
  top: 6,
  bottom: -6
})

const input = engine.getInput()
const screenManager = engine.getScreenManager()
```

### Step 4: Update Screen Classes

For each screen class, update the constructor:

**Before:**
```typescript
class MyScreen extends BaseScreen {
  constructor() {
    super('my-screen', scene, camera, renderer, input)
  }
}
```

**After:**
```typescript
class MyScreen extends BaseScreen {
  constructor(renderer: SceneRenderer, input: Input) {
    super('my-screen', renderer, input)
  }
}
```

Note: You'll need to import SceneRenderer type:
```typescript
import type { SceneRenderer } from './engine/scene-renderer'
```

### Step 5: Update Scene Manipulation

Replace direct Three.js scene access with high-level methods:

| Old (v1.x) | New (v2.0) |
|-----------|-----------|
| `this.scene.add(obj)` | `this.addToScene(obj)` |
| `this.scene.remove(obj)` | `this.removeFromScene(obj)` |
| `this.scene.background = new THREE.Color(color)` | `this.setBackground(color)` |
| `while (this.scene.children.length > 0) { ... }` | `this.clearScene()` |
| `const light = new THREE.AmbientLight(...); this.scene.add(light)` | `this.addAmbientLight(intensity)` |

### Step 6: Update onRender (Optional)

If you have a custom `onRender()` that just calls the renderer:

**Before:**
```typescript
onRender() {
  this.renderer.render(this.scene, this.camera)
}
```

**After:**
```typescript
// Remove onRender() - default implementation handles this
```

### Step 7: Update Screen Registration

**Before:**
```typescript
const myScreen = new MyScreen('my-screen', scene, camera, renderer, input)
screenManager.register(myScreen)
```

**After:**
```typescript
const myScreen = new MyScreen(engine.getRenderer(), engine.getInput())
screenManager.register(myScreen)
```

### Step 8: Start the Engine

**Before:**
```typescript
gameLoop.start()
```

**After:**
```typescript
engine.start()
```

## Advanced: Accessing THREE.js Objects

If you need direct Three.js access for advanced features (like WorldMap), use the escape hatches:

```typescript
class MapScreen extends BaseScreen {
  onEnter() {
    // Get THREE.Scene when needed
    const threeScene = this.renderer.getThreeScene()
    this.worldMap = new WorldMap(threeScene, config)
    
    // Get camera when needed
    const camera = this.renderer.getCamera()
    camera.position.set(0, 0, 20)
  }
}
```

## Example: Complete Migration

### Before (v1.x)

```typescript
import * as THREE from 'three'
import { BaseScreen, Input, GameLoop, ScreenManager } from './engine'

// Three.js setup
const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
const renderer = new THREE.WebGLRenderer()
renderer.setSize(800, 600)
document.body.appendChild(renderer.domElement)

// Input
const input = new Input()

// Screen
class TitleScreen extends BaseScreen {
  constructor() {
    super('title', scene, camera, renderer, input)
  }
  
  onEnter() {
    this.scene.background = new THREE.Color(0x000080)
  }
  
  onUpdate(dt: number) {
    if (this.input.justPressed('start')) {
      // Switch screen
    }
  }
  
  onRender() {
    this.renderer.render(this.scene, this.camera)
  }
  
  onExit() {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0])
    }
  }
}

// Setup
const screenManager = new ScreenManager()
screenManager.register(new TitleScreen())
screenManager.switchTo('title')

const gameLoop = new GameLoop({
  update: (dt) => {
    screenManager.update(dt)
    input.update()
  },
  render: () => {
    screenManager.render()
  }
})

gameLoop.start()
```

### After (v2.0)

```typescript
import { Engine, BaseScreen } from './engine'
import type { SceneRenderer, Input } from './engine/scene-renderer'

// Engine setup
const engine = new Engine({
  container: document.body,
  width: 800,
  height: 600,
  left: -8,
  right: 8,
  top: 6,
  bottom: -6
})

// Screen
class TitleScreen extends BaseScreen {
  constructor(renderer: SceneRenderer, input: Input) {
    super('title', renderer, input)
  }
  
  onEnter() {
    this.setBackground(0x000080)
  }
  
  onUpdate(dt: number) {
    if (this.input.justPressed('start')) {
      // Switch screen
    }
  }
  
  onExit() {
    this.clearScene()
  }
}

// Setup
const screenManager = engine.getScreenManager()
screenManager.register(
  new TitleScreen(engine.getRenderer(), engine.getInput())
)
screenManager.switchTo('title')

engine.start()
```

## Common Issues

### Issue: "Cannot find module 'SceneRenderer'"

**Solution:** Import the type directly from the source:
```typescript
import type { SceneRenderer } from './engine/scene-renderer'
```

SceneRenderer is intentionally not exported from the main engine index to keep it internal.

### Issue: "Property 'scene' does not exist"

**Solution:** Use high-level methods instead:
- `this.addToScene(obj)` instead of `this.scene.add(obj)`
- `this.setBackground(color)` instead of `this.scene.background = new THREE.Color(color)`

Or use the escape hatch:
```typescript
const threeScene = this.renderer.getThreeScene()
threeScene.add(obj)
```

### Issue: "Property 'camera' does not exist"

**Solution:** Use the escape hatch:
```typescript
const camera = this.renderer.getCamera()
camera.position.set(x, y, z)
```

### Issue: "Property 'renderer' does not exist on type 'WebGLRenderer'"

**Solution:** The renderer property is now of type `SceneRenderer`, not `THREE.WebGLRenderer`. Use escape hatch if you need the Three.js renderer:
```typescript
const webGLRenderer = this.renderer.getRenderer()
```

## Benefits of v2.0

After migration, you'll enjoy:

1. **Simpler Code**: Less boilerplate, no THREE.js imports
2. **Cleaner API**: High-level methods instead of direct Three.js
3. **Better Abstraction**: Game logic separated from rendering details
4. **Easier Maintenance**: Changes to rendering don't affect game code
5. **Single Abstraction**: No more confusion between Scene and Screen

## Need Help?

If you encounter issues during migration:

1. Check the [README.md](./README.md) for updated examples
2. Look at the demo game in `/src/game/index.ts` for a complete example
3. Review the design documents in the repository root
4. Open an issue on GitHub

---

**Version:** 2.0.0  
**Last Updated:** 2026-01-03
