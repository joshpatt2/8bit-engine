# Proposal: Camera System Implementation

## The Problem

**The engine cannot make scrolling games.** This is the single biggest blocker to shipping real games.

### Evidence

Every demo in this codebase uses a static camera:
- Title screen: static ([game/index.ts#L39](src/game/index.ts#L39))
- World map: static ([game/index.ts#L113](src/game/index.ts#L113))
- Level screens: static, player can't move beyond screen bounds ([game/index.ts#L489-L495](src/game/index.ts#L489-L495))

The camera is hardcoded in `SceneRenderer` with no public API:
```typescript
// scene-renderer.ts - camera is created but never moves
this.camera = new THREE.OrthographicCamera(...)
this.camera.position.z = 10  // Fixed Z position
```

### Impact

**You cannot build:**
- Platformers with levels wider than 256px
- Shoot-em-ups with scrolling backgrounds
- Top-down games with exploration
- Beat-em-ups with side-scrolling
- Any game where the world > viewport

**Current workaround:** Move the entire world instead of the camera. This is O(n) per frame, backwards, and breaks particle effects/UI.

---

## The Solution

Add a lightweight `CameraController` that manages camera position and following behavior.

### Core Requirements

1. **Manual control:** `setPosition(x, y)` for cutscenes
2. **Auto-follow:** `follow(target, smoothing)` for player tracking
3. **Bounds:** `setBounds(minX, maxX, minY, maxY)` to constrain camera
4. **Deadzone:** Only move camera when target leaves center zone
5. **Zero overhead:** Only update when needed

### API Design

```typescript
class CameraController {
  constructor(camera: THREE.Camera)
  
  // Manual positioning
  setPosition(x: number, y: number): void
  getPosition(): { x: number, y: number }
  
  // Follow target
  follow(target: { x: number, y: number }, smoothing?: number): void
  stopFollowing(): void
  
  // Constraints
  setBounds(minX: number, maxX: number, minY: number, maxY: number): void
  clearBounds(): void
  
  // Deadzone (optional, v2 feature)
  setDeadzone(width: number, height: number): void
  
  // Update loop
  update(deltaTime: number): void
}
```

### Usage Example

```typescript
// In a platformer level screen
class PlatformerLevel extends BaseScreen {
  private cameraController: CameraController
  
  onEnter() {
    // Get camera from renderer
    const camera = this.renderer.getCamera()
    
    // Create controller
    this.cameraController = new CameraController(camera)
    
    // Set level bounds (level is 100 units wide)
    this.cameraController.setBounds(-50, 50, -6, 6)
    
    // Follow player with smooth tracking
    this.cameraController.follow(this.player.position, 0.1)
  }
  
  onUpdate(deltaTime: number) {
    // Update game logic...
    
    // Update camera (follows player automatically)
    this.cameraController.update(deltaTime)
  }
}
```

---

## Implementation Plan

### Core Camera Controller

**File:** `src/engine/camera-controller.ts`

```typescript
export class CameraController {
  private camera: THREE.Camera
  private targetPos: { x: number, y: number } | null = null
  private followTarget: { x: number, y: number } | null = null
  private smoothing: number = 0
  private bounds: { minX: number, maxX: number, minY: number, maxY: number } | null = null
  
  constructor(camera: THREE.Camera) {
    this.camera = camera
  }
  
  setPosition(x: number, y: number): void {
    this.targetPos = { x, y }
    this.followTarget = null
  }
  
  follow(target: { x: number, y: number }, smoothing: number = 0.1): void {
    this.followTarget = target
    this.smoothing = Math.max(0, Math.min(1, smoothing))
  }
  
  setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.bounds = { minX, maxX, minY, maxY }
  }
  
  update(deltaTime: number): void {
    let targetX = this.camera.position.x
    let targetY = this.camera.position.y
    
    // Manual position override
    if (this.targetPos) {
      targetX = this.targetPos.x
      targetY = this.targetPos.y
    }
    
    // Follow target
    if (this.followTarget) {
      targetX = this.followTarget.x
      targetY = this.followTarget.y
    }
    
    // Apply smoothing (lerp)
    if (this.smoothing > 0) {
      const t = 1 - Math.pow(this.smoothing, deltaTime * 60)
      targetX = this.camera.position.x + (targetX - this.camera.position.x) * t
      targetY = this.camera.position.y + (targetY - this.camera.position.y) * t
    }
    
    // Clamp to bounds
    if (this.bounds) {
      targetX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, targetX))
      targetY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, targetY))
    }
    
    // Update camera
    this.camera.position.x = targetX
    this.camera.position.y = targetY
  }
}
```

**Integration with Engine:**

Modify [src/engine/engine.ts](src/engine/engine.ts):
```typescript
import { CameraController } from './camera-controller'

export class Engine {
  private cameraController: CameraController
  
  constructor(config: EngineConfig) {
    // ... existing code ...
    
    // Create camera controller
    this.cameraController = new CameraController(this.sceneRenderer.getCamera())
  }
  
  getCameraController(): CameraController {
    return this.cameraController
  }
}
```

Export from [src/engine/index.ts](src/engine/index.ts):
```typescript
export * from './camera-controller'
```

### Demo Implementation

**File:** `src/scrolling-demo.ts`

Create a simple scrolling level demo:
- Player moves left/right
- Camera follows with smooth lerp
- Level is 3x wider than screen
- Parallax background layers
- Shows camera bounds working at edges

### Documentation

Update [README.md](README.md) with camera usage examples.

---

## Technical Details

### Camera Math

For orthographic camera, only X/Y position matters (Z is fixed).

**Smooth following (exponential decay):**
```typescript
// Instead of linear lerp: pos = pos + (target - pos) * t
// Use frame-rate independent version:
const t = 1 - Math.pow(smoothing, deltaTime * 60)
newPos = currentPos + (targetPos - currentPos) * t
```

This gives consistent feel at any framerate.

### Bounds Clamping

```typescript
// Simple clamp after calculating desired position
x = Math.max(minX, Math.min(maxX, x))
y = Math.max(minY, Math.min(maxY, y))
```

For levels narrower than viewport, center the camera:
```typescript
if (levelWidth < viewportWidth) {
  bounds.minX = bounds.maxX = levelWidth / 2
}
```

### Deadzone (Future Enhancement)

```typescript
// Only move camera if target leaves center rectangle
const dx = target.x - camera.x
const dy = target.y - camera.y

if (Math.abs(dx) > deadzoneWidth / 2) {
  camera.x = target.x - sign(dx) * deadzoneWidth / 2
}
```

This creates "looser" following for run-and-gun games.

---

## Alternatives Considered

### Alternative 1: Move the world instead
**Rejected.** Terrible performance (O(n) objects), breaks world-space effects.

### Alternative 2: Three.js OrbitControls
**Rejected.** Made for 3D inspection, not 2D games. Mouse-based, not code-driven.

### Alternative 3: Cinemachine-style zones
**Overkill.** We need basic following first. Add zones later if needed.

---

## Testing Plan

1. **Unit tests** for bounds clamping, smoothing math
2. **Integration test** in scrolling-demo.ts
3. **Performance test:** 1000 entities + camera following should be 60fps

---

## Success Metrics

**Before:** Cannot make scrolling games  
**After:** Can make any scrolling game in < 50 lines of camera code

**Adoption:** Update all level screens in demo game to use camera following

**Code size:** < 100 lines for CameraController

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaks existing demos | Low | Medium | Demos use static camera, won't change |
| Framerate dependent smoothing | Medium | High | Use exponential decay formula |
| Camera jitter at bounds | Low | Medium | Clamp after smoothing |
| Complexity creep | Medium | High | Ship v1 without deadzone/shake/zoom |

---

## Conclusion

The camera system is the highest-leverage feature to add. It's:
- Small scope (< 100 LOC)
- High impact (unlocks entire game genres)
- Low risk (doesn't break existing code)
- Well-understood (solved problem)

**Recommendation:** Ship this before anything else. Then add collision detection.

Without camera scrolling, this is a tech demo. With it, it's a game engine.
