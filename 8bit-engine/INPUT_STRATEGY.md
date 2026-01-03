# Input Strategy & Technical Design

## Overview

This document outlines the input strategy for the 8bit-engine, designed to provide authentic NES-style input handling with modern web technologies. The system supports both keyboard and gamepad input with NES controller constraints and button mappings.

## Table of Contents

1. [NES Controller Background](#nes-controller-background)
2. [Design Goals](#design-goals)
3. [Input Architecture](#input-architecture)
4. [Implementation Details](#implementation-details)
5. [Input Polling Strategy](#input-polling-strategy)
6. [Gamepad Support](#gamepad-support)
7. [Best Practices](#best-practices)
8. [Future Enhancements](#future-enhancements)

---

## NES Controller Background

The Nintendo Entertainment System (NES) controller is a simple yet iconic input device with the following characteristics:

### Hardware Layout
```
   ┌─────────────────────────────┐
   │  SELECT  START              │
   │                             │
   │   ╔═══╗           ┌─┐       │
   │   ║ ↑ ║           │B│  ┌─┐  │
   │ ╔═╬═══╬═╗         └─┘  │A│  │
   │ ║← ╬ ═ ╬→║              └─┘  │
   │ ╚═╬═══╬═╝                    │
   │   ║ ↓ ║                      │
   │   ╚═══╝                      │
   └─────────────────────────────┘
```

### Button Specifications
- **D-Pad**: 4 directional buttons (Up, Down, Left, Right)
- **Action Buttons**: A and B buttons
- **System Buttons**: START and SELECT

### Hardware Constraints
- **8-bit shift register**: Buttons read sequentially via serial protocol
- **No analog input**: Digital on/off states only
- **No simultaneous opposite directions**: Hardware prevents Up+Down or Left+Right
- **Polling rate**: 60 Hz (once per frame)
- **Input lag**: 16.67ms (one frame) minimum

---

## Design Goals

### 1. **Authenticity**
Replicate the NES controller experience:
- 8 digital buttons (4 directional + 2 action + 2 system)
- 60 Hz polling rate (aligned with game loop)
- Frame-based input detection
- Simple, predictable behavior

### 2. **Accessibility**
Support multiple input methods:
- Keyboard (WASD + Arrow keys)
- Modern gamepads (Xbox, PlayStation, Switch Pro)
- Rebindable controls (future enhancement)

### 3. **Developer Experience**
Provide clean, intuitive API:
```typescript
// Simple button queries
if (input.isPressed('a')) { }
if (input.justPressed('start')) { }
if (input.justReleased('b')) { }

// Direction queries
const direction = input.getDirection()
if (input.isMoving()) { }
```

### 4. **Performance**
- Zero garbage collection during gameplay
- O(1) button state lookups
- Minimal event listener overhead
- No polling loops (event-driven updates)

---

## Input Architecture

### Component Diagram
```
┌─────────────────────────────────────────────────────┐
│                   Game Loop                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ 1. input.update() - Capture previous state  │  │
│  │ 2. Game logic (queries input state)         │  │
│  │ 3. Render                                    │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴─────────────────────────────┐
│                  Input System                        │
│  ┌────────────────┐  ┌──────────────────────────┐   │
│  │ Current State  │  │   Previous State         │   │
│  │ {              │  │   {                      │   │
│  │   up: false    │  │     up: false            │   │
│  │   down: false  │  │     down: false          │   │
│  │   left: false  │  │     left: false          │   │
│  │   right: false │  │     right: false         │   │
│  │   a: false     │  │     a: false             │   │
│  │   b: false     │  │     b: false             │   │
│  │   start: false │  │     start: false         │   │
│  │   select: false│  │     select: false        │   │
│  │ }              │  │   }                      │   │
│  └────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────┘
         ▲                           ▲
         │                           │
    ┌────┴────┐               ┌──────┴──────┐
    │ Keyboard│               │   Gamepad   │
    │ Events  │               │   Events    │
    └─────────┘               └─────────────┘
```

### Data Flow

1. **Input Events** → Browser captures keyboard/gamepad events
2. **Event Handlers** → Update current input state immediately
3. **Game Loop** → Calls `input.update()` at start of frame
4. **State Snapshot** → Previous state = current state
5. **Game Logic** → Queries input state using API methods
6. **Next Frame** → Repeat

---

## Implementation Details

### State Management

The input system maintains two state objects:

```typescript
interface InputState {
  up: boolean      // D-pad up
  down: boolean    // D-pad down
  left: boolean    // D-pad left
  right: boolean   // D-pad right
  a: boolean       // A button
  b: boolean       // B button
  start: boolean   // START button
  select: boolean  // SELECT button
}

class Input {
  private state: InputState = { /* all false */ }
  private previousState: InputState = { /* all false */ }
}
```

**Why two states?**
- Enables detection of button press/release events
- Distinguishes "held" vs "just pressed" vs "just released"
- Prevents double-triggering of actions

### Input Queries

#### `isPressed(button)`
Returns true if button is currently held down.

```typescript
isPressed(button: keyof InputState): boolean {
  return this.state[button]
}
```

**Use cases:**
- Continuous movement (player walks while holding right)
- Charge attacks (hold B to charge)
- Acceleration (hold longer = move faster)

#### `justPressed(button)`
Returns true only on the first frame the button is pressed.

```typescript
justPressed(button: keyof InputState): boolean {
  return this.state[button] && !this.previousState[button]
}
```

**Use cases:**
- Menu selection (press A to confirm)
- Jump (press A to jump once)
- Pause game (press START to toggle pause)
- Item usage (press B to use item)

#### `justReleased(button)`
Returns true only on the first frame the button is released.

```typescript
justReleased(button: keyof InputState): boolean {
  return !this.state[button] && this.previousState[button]
}
```

**Use cases:**
- Variable jump height (release A early = short jump)
- Charge release (release B to fire charged shot)
- Button release detection

### Key Mappings

The system supports multiple input methods with sensible defaults:

```typescript
// Keyboard mappings (two options per direction for accessibility)
const KEYBOARD_MAP = {
  // D-Pad
  'ArrowUp':    'up',
  'w':          'up',
  'ArrowDown':  'down',
  's':          'down',
  'ArrowLeft':  'left',
  'a':          'left',
  'ArrowRight': 'right',
  'd':          'right',
  
  // Action buttons
  'z':          'a',      // Primary action
  ' ':          'a',      // Space as alternative
  'x':          'b',      // Secondary action
  
  // System buttons
  'Enter':      'start',
  'Shift':      'select'
}
```

**Design rationale:**
- **Arrow keys**: Traditional cursor movement, right hand
- **WASD**: FPS-style controls, left hand
- **Z/X**: Easy to reach, commonly used in retro games
- **Space**: Alternative for A (jump), widely expected
- **Enter**: Natural choice for "start/confirm"
- **Shift**: Accessible modifier key for "select/back"

---

## Input Polling Strategy

### Event-Driven vs Polling

NES hardware used **polling** (reading controller state once per frame), but modern web APIs are **event-driven**. Our hybrid approach:

#### Current Implementation: Event-Driven State Updates
```typescript
// State updates happen immediately when key pressed/released
handleKeyDown(e: KeyboardEvent): void {
  this.updateKey(e.key, true)  // Update state NOW
}

handleKeyUp(e: KeyboardEvent): void {
  this.updateKey(e.key, false)  // Update state NOW
}
```

**Advantages:**
- No polling overhead
- Zero input lag
- Browser handles timing
- No missed inputs

#### Frame Synchronization
```typescript
// Called once per frame in game loop
update(): void {
  this.previousState = { ...this.state }  // Snapshot for edge detection
}
```

**Why this works:**
1. Events update `state` continuously (sub-frame resolution)
2. `update()` captures state once per frame
3. Game logic sees consistent state for entire frame
4. Next frame, previous state allows edge detection

### Timing Guarantees

At 60 FPS (16.67ms per frame):

```
Frame N-1    Frame N      Frame N+1
|------------|------------|------------|
     ▲            ▲            ▲
   update()    update()    update()
   
Event: ──────────┐  Press detected
                 ▼
State: ──────────████████████████────  (button held)
                 │          │
              Frame N    Frame N+1
```

**Key insight:** Events can fire mid-frame, but game logic only reads state once per frame. This matches NES behavior where controller is sampled during V-blank.

---

## Gamepad Support

### Gamepad API Integration

Modern browsers provide the Gamepad API for controller support:

```typescript
class Input {
  private gamepadIndex: number | null = null
  
  // Detect gamepad connection
  private handleGamepadConnected = (e: GamepadEvent) => {
    this.gamepadIndex = e.gamepad.index
    console.log('Gamepad connected:', e.gamepad.id)
  }
  
  // Handle gamepad disconnection
  private handleGamepadDisconnected = (e: GamepadEvent) => {
    if (e.gamepad.index === this.gamepadIndex) {
      this.gamepadIndex = null
      console.log('Gamepad disconnected')
    }
  }
  
  // Poll gamepad state (must be called in game loop)
  private updateGamepad(): void {
    if (this.gamepadIndex === null) return
    
    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[this.gamepadIndex]
    if (!gamepad) return
    
    // Map gamepad buttons to NES buttons
    this.mapGamepadButtons(gamepad)
  }
}
```

### Standard Gamepad Mapping

Following the [W3C Standard Gamepad Layout](https://w3c.github.io/gamepad/#remapping):

```
Standard Gamepad Button Layout (index)
┌────────────────────────────────────┐
│  [10]      [9]                     │
│  SELECT   START                    │
│                                    │
│  ╔════╗             ┌──┐           │
│  ║ 12 ║             │ 1│   ┌──┐   │
│╔═╬════╬═╗           └──┘   │ 0│   │
│║14║ ══ ║15║                 └──┘   │
│╚═╬════╬═╝    [3]         [2]       │
│  ║ 13 ║      B           A         │
│  ╚════╝                            │
└────────────────────────────────────┘
```

Button mapping:
```typescript
const GAMEPAD_BUTTON_MAP = {
  0:  'a',        // A button (Xbox: A, PS: ✕)
  1:  'b',        // B button (Xbox: B, PS: ○)
  2:  'b',        // X button (also maps to B)
  3:  'a',        // Y button (also maps to A)
  9:  'start',    // Start button
  8:  'select',   // Select/Back button
  12: 'up',       // D-pad up
  13: 'down',     // D-pad down
  14: 'left',     // D-pad left
  15: 'right',    // D-pad right
}

// Analog stick support (for D-pad simulation)
const STICK_THRESHOLD = 0.5  // Dead zone
```

### Gamepad Polling Requirements

**Important:** Unlike keyboard events, gamepad state must be polled:

```typescript
update(): void {
  this.previousState = { ...this.state }
  this.updateGamepad()  // Poll gamepad state every frame
}
```

**Why polling?** The Gamepad API only provides state snapshots via `navigator.getGamepads()`. No events for button presses.

---

## Best Practices

### 1. Call `update()` Once Per Frame

```typescript
// ✅ Good: Single update at frame start
function gameLoop(deltaTime: number) {
  input.update()              // Snapshot state
  updateGame(deltaTime)       // Use stable state
  render()
}

// ❌ Bad: Multiple updates
function gameLoop(deltaTime: number) {
  input.update()
  updatePlayer(deltaTime)
  input.update()              // Don't do this!
  updateEnemies(deltaTime)
}
```

### 2. Use Appropriate Query Methods

```typescript
// ✅ Good: Use justPressed for one-time actions
if (input.justPressed('start')) {
  togglePauseMenu()
}

// ❌ Bad: Using isPressed causes multiple triggers
if (input.isPressed('start')) {
  togglePauseMenu()  // Will toggle every frame!
}

// ✅ Good: Use isPressed for continuous actions
if (input.isPressed('right')) {
  player.x += speed * deltaTime
}
```

### 3. Handle Simultaneous Inputs

```typescript
// Check for diagonal movement
const moveX = (input.isPressed('right') ? 1 : 0) - 
              (input.isPressed('left') ? 1 : 0)
const moveY = (input.isPressed('down') ? 1 : 0) - 
              (input.isPressed('up') ? 1 : 0)

// Normalize diagonal movement (optional, depends on game)
if (moveX !== 0 && moveY !== 0) {
  const length = Math.sqrt(moveX * moveX + moveY * moveY)
  moveX /= length
  moveY /= length
}
```

### 4. Prioritize Action Buttons

In NES games, A is typically primary action (jump), B is secondary (run/shoot):

```typescript
if (input.justPressed('a')) {
  player.jump()        // Primary action
}

if (input.isPressed('b')) {
  player.run()         // Secondary action / modifier
}

// Combined actions
if (input.isPressed('b') && input.justPressed('a')) {
  player.spinJump()    // B+A combo
}
```

### 5. Pause Menu Pattern

```typescript
class Game {
  private paused = false
  
  update(deltaTime: number) {
    input.update()
    
    // Pause toggle (works in any state)
    if (input.justPressed('start')) {
      this.paused = !this.paused
    }
    
    if (this.paused) {
      this.updatePauseMenu()
      return  // Don't update game
    }
    
    this.updateGameplay(deltaTime)
  }
}
```

### 6. Menu Navigation

```typescript
class Menu {
  update() {
    if (input.justPressed('up')) {
      this.selectedIndex--
      this.clampSelection()
    }
    
    if (input.justPressed('down')) {
      this.selectedIndex++
      this.clampSelection()
    }
    
    if (input.justPressed('a') || input.justPressed('start')) {
      this.selectItem()
    }
    
    if (input.justPressed('b')) {
      this.goBack()
    }
  }
}
```

---

## Code Examples

### Basic Integration

```typescript
import { Input } from './engine'

// Create input system
const input = new Input()

// Game loop
function gameLoop(deltaTime: number) {
  // 1. Update input state (FIRST!)
  input.update()
  
  // 2. Handle input
  if (input.justPressed('start')) {
    console.log('Game started!')
  }
  
  if (input.isPressed('right')) {
    player.x += 2
  }
  
  // 3. Render
  render()
  
  requestAnimationFrame(gameLoop)
}

gameLoop(0)
```

### Player Movement

```typescript
class Player {
  x = 0
  y = 0
  velocity = { x: 0, y: 0 }
  
  update(deltaTime: number, input: Input) {
    const SPEED = 100  // pixels per second
    const ACCEL = 500  // acceleration
    
    // Horizontal movement
    if (input.isPressed('left')) {
      this.velocity.x = Math.max(this.velocity.x - ACCEL * deltaTime, -SPEED)
    } else if (input.isPressed('right')) {
      this.velocity.x = Math.min(this.velocity.x + ACCEL * deltaTime, SPEED)
    } else {
      // Deceleration
      this.velocity.x *= 0.8
    }
    
    // Jump (only when on ground)
    if (input.justPressed('a') && this.onGround) {
      this.velocity.y = -300  // Jump velocity
    }
    
    // Variable jump height
    if (input.justReleased('a') && this.velocity.y < 0) {
      this.velocity.y *= 0.5  // Cut jump short
    }
    
    // Apply velocity
    this.x += this.velocity.x * deltaTime
    this.y += this.velocity.y * deltaTime
  }
}
```

### Combat System

```typescript
class CombatPlayer {
  attackCooldown = 0
  
  update(deltaTime: number, input: Input) {
    this.attackCooldown -= deltaTime
    
    // B button: Shoot projectile
    if (input.justPressed('b') && this.attackCooldown <= 0) {
      this.shootProjectile()
      this.attackCooldown = 0.5  // 500ms cooldown
    }
    
    // Hold A: Charge attack
    if (input.isPressed('a')) {
      this.chargeLevel = Math.min(this.chargeLevel + deltaTime, 1.0)
    }
    
    // Release A: Fire charged attack
    if (input.justReleased('a') && this.chargeLevel > 0.3) {
      this.fireChargedAttack(this.chargeLevel)
      this.chargeLevel = 0
    }
  }
}
```

---

## Future Enhancements

### 1. Input Rebinding
Allow players to customize controls:

```typescript
interface InputConfig {
  up: string[]
  down: string[]
  left: string[]
  right: string[]
  a: string[]
  b: string[]
  start: string[]
  select: string[]
}

class Input {
  private config: InputConfig = DEFAULT_CONFIG
  
  setKeyBinding(button: keyof InputState, keys: string[]) {
    this.config[button] = keys
  }
  
  loadConfig(config: InputConfig) {
    this.config = config
  }
}
```

### 2. Input Recording & Playback
For replays and demos:

```typescript
interface InputFrame {
  frame: number
  state: InputState
}

class InputRecorder {
  private recording: InputFrame[] = []
  
  record(frame: number, state: InputState) {
    this.recording.push({ frame, state })
  }
  
  export(): string {
    return JSON.stringify(this.recording)
  }
}
```

### 3. Touch Controls
Mobile support:

```typescript
class TouchInput {
  // Virtual D-pad on left side
  // Virtual A/B buttons on right side
  // Map touches to button states
}
```

### 4. Input Buffering
For fighting game style inputs:

```typescript
class InputBuffer {
  private buffer: Array<{ button: string, frame: number }> = []
  private BUFFER_SIZE = 5  // frames
  
  checkSequence(sequence: string[]): boolean {
    // Check if button sequence was input in order
  }
}
```

### 5. Accessibility Features

- **Button hold assistance**: Auto-repeat for held buttons
- **Sticky keys**: Toggle instead of hold
- **One-handed mode**: Map all controls to one side
- **Simplified controls**: Reduce button requirements

### 6. Input Analytics

```typescript
interface InputStats {
  buttonsPressed: Record<string, number>
  avgAPM: number  // Actions per minute
  mostUsedButton: string
}
```

---

## Testing Strategy

### Unit Tests

Test each input method independently:

```typescript
describe('Input', () => {
  it('should detect key press', () => {
    const input = new Input()
    simulateKeyPress('ArrowUp')
    expect(input.isPressed('up')).toBe(true)
  })
  
  it('should detect justPressed only once', () => {
    const input = new Input()
    simulateKeyPress('z')
    
    expect(input.justPressed('a')).toBe(true)
    input.update()
    expect(input.justPressed('a')).toBe(false)
    expect(input.isPressed('a')).toBe(true)
  })
})
```

### Integration Tests

Test with game systems:

```typescript
describe('Player with Input', () => {
  it('should move player on arrow key press', () => {
    const input = new Input()
    const player = new Player()
    
    simulateKeyPress('ArrowRight')
    input.update()
    player.update(0.016, input)
    
    expect(player.x).toBeGreaterThan(0)
  })
})
```

### Manual Testing

Essential for gamepad support:
1. Test with Xbox controller
2. Test with PlayStation controller
3. Test with Nintendo Switch Pro controller
4. Test with generic USB controller
5. Test hot-plugging (connect/disconnect during gameplay)

---

## Performance Considerations

### Memory
- **State objects**: 2 × 8 booleans = 16 bytes (negligible)
- **Event listeners**: 2 keyboard + 2 gamepad = 4 listeners
- **No allocations during gameplay**: All state objects reused

### CPU
- **Event handling**: O(1) per event, only when events fire
- **update() call**: O(1), just object copy
- **Query methods**: O(1), simple property access
- **Gamepad polling**: O(1), array access

### Optimization Tips

1. **Avoid string allocations**:
```typescript
// ✅ Good: Use button constants
const BUTTON_A = 'a'
if (input.isPressed(BUTTON_A)) { }

// ❌ Bad: String creation every frame
if (input.isPressed('a')) { }  // Creates new string
```

2. **Cache complex queries**:
```typescript
// If checking same input multiple times per frame
const jumpPressed = input.justPressed('a')
if (jumpPressed && onGround) player.jump()
if (jumpPressed && inWater) player.swim()
```

3. **Early exit patterns**:
```typescript
if (!input.isMoving()) return  // No movement inputs, skip logic
```

---

## Conclusion

The 8bit-engine input system provides a simple yet powerful abstraction over modern web input APIs while maintaining NES-style constraints and behavior. By combining event-driven state updates with frame-synchronized polling, we achieve zero input lag while preserving the predictable, retro feel of classic games.

Key takeaways:
- ✅ Two-state system enables edge detection
- ✅ Event-driven updates for zero lag
- ✅ Frame synchronization for consistency
- ✅ Multiple input methods (keyboard + gamepad)
- ✅ Clean, intuitive API
- ✅ Zero garbage collection during gameplay
- ✅ Authentic NES constraints and feel

For implementation details, see `src/engine/input.ts`.
