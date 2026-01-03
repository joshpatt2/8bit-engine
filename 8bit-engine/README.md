# 8bit-engine

A TypeScript game engine built on Three.js with authentic NES-style constraints for creating retro 2D games.

## Overview

8bit-engine provides a complete framework for building NES-inspired games with modern web technologies. It enforces classic 8-bit constraints while leveraging Three.js for rendering, giving you the best of both worlds: retro aesthetics with modern performance.

## Features

### 🎮 Core Engine

- **NES-Authentic Constraints**: 256×240 resolution, 8×8 pixel tiles, limited color palette
- **60 FPS Target**: Smooth gameplay with consistent frame timing
- **Input System**: Full keyboard and gamepad support with NES button mappings
- **Game Loop**: Delta-time based updates with separate update/render cycles

### 🎨 Graphics & UI

- **Bitmap Font System**: Pixel-perfect 8×8 character rendering (A-Z, 0-9, punctuation)
- **UI Components**: Pre-built buttons, labels, menus, text boxes, and title cards
- **Sprite System**: NES-authentic OAM with 64 sprites, 8×8 patterns, meta-sprites
- **Click Handler**: Mouse interaction with raycasting for UI elements
- **Color Palette**: Authentic NES color palette with 30+ colors

### 🗺️ Game Systems

- **WorldMap**: SMB3-style overworld navigation with graph-based node system
- **Screen System**: State machine for managing game screens (title, map, gameplay, pause)
- **Scene Manager**: Legacy scene system with lifecycle hooks

### ✅ Quality Assurance

- **88 Unit Tests**: Comprehensive test coverage with Vitest
- **100% Passing**: All core modules tested (Input, WorldMap, Bitmap Font, Game)
- **CI/CD Ready**: Test scripts for continuous integration

## Installation

```bash
npm install
```

## Quick Start

### 1. Run the Demo

```bash
npm run dev
```

Open http://localhost:5173 to see the 8BIT QUEST demo game.

### 2. Create Your First Screen

```typescript
import { Engine, BaseScreen, NES_PALETTE, createBitmapText } from './engine'

export class MyGameScreen extends BaseScreen {
  onEnter(): void {
    this.setBackground(NES_PALETTE.BLACK)
    this.addAmbientLight()
    
    const title = createBitmapText('MY GAME', {
      color: NES_PALETTE.YELLOW,
      scale: 0.2,
      align: 'center'
    })
    title.position.set(0, 2, 0)
    this.addToScene(title)
  }

  onUpdate(deltaTime: number): void {
    // Update game logic
  }

  onExit(): void {
    // Cleanup
  }
}
```

### 3. Set Up the Game

```typescript
import { Engine } from './engine'
import { MyGameScreen } from './my-game-screen'

// Create engine - handles rendering, input, and game loop
const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600,
  left: -8,
  right: 8,
  top: 6,
  bottom: -6
})

// Create and register screen
const myScreen = new MyGameScreen(
  'game',
  engine.getRenderer(),
  engine.getInput()
)

engine.getScreenManager().register(myScreen)
engine.getScreenManager().switchTo('game')

// Start the game
engine.start()
```

## Core Modules

### Input System

Handle keyboard and gamepad input with NES-style button mappings.

```typescript
import { Input } from './engine'

const input = new Input()

// Check if button is currently pressed
if (input.isPressed('a')) {
  // A button (Z key or gamepad button)
}

// Check if button was just pressed this frame
if (input.justPressed('start')) {
  // Start button (Enter key or gamepad start)
}

// Check if button was just released
if (input.justReleased('a')) {
  // For variable jump height, etc.
}

// Check if any directional input is active
if (input.isMoving()) {
  // Player is moving
}

// Get direction vector
const dir = input.getDirection()  // { x: -1/0/1, y: -1/0/1 }

// Update input state (call once per frame)
input.update()
```

**Keyboard Mappings:**
- **Arrows/WASD** → D-Pad (up, down, left, right)
- **Z** → A button (jump/accept)
- **X/Space** → B button (run/cancel)
- **Enter** → Start
- **Shift** → Select

**Gamepad Support:**
- **D-Pad** → Directional input
- **Left Stick** → Directional input (with dead zone)
- **A/✕** → A button
- **B/○, X/□, Y/△** → A or B button
- **Start/Options** → Start
- **Select/Share** → Select
- **Hot-plugging** → Automatically detects gamepad connection/disconnection

### Bitmap Font

Render pixel-perfect text using 8×8 bitmap characters.

```typescript
import { createBitmapText, BitmapTextStyles, NES_PALETTE } from './engine'

// Basic text
const text = createBitmapText('HELLO WORLD')
scene.add(text)

// Styled text
const title = createBitmapText('GAME TITLE', {
  color: NES_PALETTE.YELLOW,
  scale: 0.2,
  align: 'center',
  letterSpacing: 0.15
})

// Preset styles
const subtitle = createBitmapText('Start Game', BitmapTextStyles.subtitle())
const small = createBitmapText('Score: 1000', BitmapTextStyles.small())
```

**Supported Characters:**
- Letters: A-Z (case-insensitive)
- Numbers: 0-9
- Punctuation: `! ? . , - : ' "`
- Special: Space

### UI Components

Pre-built components for common UI elements.

#### Button

```typescript
import { createButton, NES_PALETTE } from './engine'

const button = createButton({
  text: 'PRESS START',
  textColor: NES_PALETTE.WHITE,
  backgroundColor: NES_PALETTE.DARK_BLUE,
  borderColor: NES_PALETTE.CYAN,
  padding: 0.2,
  borderThickness: 0.08,
  onClick: () => {
    console.log('Button clicked!')
  }
})

button.setPosition(0, -2, 0)
scene.add(button.group)
```

#### Label

```typescript
import { createLabel, NES_PALETTE } from './engine'

const label = createLabel({
  text: 'SCORE: 1000',
  color: NES_PALETTE.WHITE,
  scale: 0.1
})

label.setPosition(0, 5, 0)
scene.add(label.group)

// Update text
label.setText('SCORE: 1500')
```

#### Menu

```typescript
import { createMenu, NES_PALETTE } from './engine'

const menu = createMenu({
  items: [
    { text: 'NEW GAME', value: 'new' },
    { text: 'CONTINUE', value: 'continue' },
    { text: 'OPTIONS', value: 'options' }
  ],
  selectedColor: NES_PALETTE.YELLOW,
  unselectedColor: NES_PALETTE.WHITE,
  spacing: 1.5,
  onSelect: (item) => {
    console.log('Selected:', item.value)
  }
})

scene.add(menu.group)

// Navigate with input
if (input.justPressed('up')) menu.selectPrevious()
if (input.justPressed('down')) menu.selectNext()
if (input.justPressed('a')) menu.confirm()
```

#### TextBox

```typescript
import { createTextBox, NES_PALETTE } from './engine'

const textBox = createTextBox({
  text: 'The hero approaches the castle...',
  width: 10,
  height: 3,
  backgroundColor: NES_PALETTE.BLACK,
  borderColor: NES_PALETTE.WHITE,
  textColor: NES_PALETTE.WHITE,
  padding: 0.3
})

textBox.setPosition(0, -4, 0)
scene.add(textBox.group)

// Update text
textBox.setText('A wild monster appears!')
```

### WorldMap System

Create SMB3-style overworld maps with node-based navigation.

```typescript
import { WorldMap, type MapNode, NES_PALETTE } from './engine'

const nodes: MapNode[] = [
  {
    id: 'start',
    name: 'START',
    type: 'start',
    status: 'complete',
    position: { x: 0, y: 0 },
    connections: ['level1']
  },
  {
    id: 'level1',
    name: 'LEVEL 1',
    type: 'level',
    status: 'unlocked',
    position: { x: 10, y: 0 },
    connections: ['level2'],
    onSelect: () => {
      // Load level
    }
  },
  {
    id: 'level2',
    name: 'LEVEL 2',
    type: 'level',
    status: 'locked',
    position: { x: 20, y: 0 },
    connections: []
  }
]

const worldMap = new WorldMap(scene, {
  nodes,
  startNodeId: 'start',
  backgroundColor: NES_PALETTE.LIME,
  pathColor: NES_PALETTE.TAN,
  playerColor: NES_PALETTE.RED
})

// Update in game loop
worldMap.update(deltaTime, input)

// Unlock nodes
worldMap.unlockNode('level2')

// Mark complete
worldMap.completeNode('level1')
```

**Node Types:**
- `level` - Standard level (green)
- `boss` - Boss battle (large red)
- `bonus` - Bonus stage (small yellow)
- `shop` - Item shop (cyan)
- `castle` - Fortress (large purple)
- `start` - Starting point (blue)
- `goal` - Final destination (yellow)

### Sprite System

NES-authentic sprite system with hardware constraints (OAM).

```typescript
import {
  SpriteManager,
  createDefaultSpritePalettes,
  MetaSpriteObject
} from './engine'

// Initialize sprite system
const palettes = createDefaultSpritePalettes()
const spriteManager = new SpriteManager(scene, palettes)
const patternTable = spriteManager.getPatternTable()

// Create an 8×8 sprite pattern
patternTable.createPatternFromString(0, [
  '00111100',  // 0 = transparent
  '01222210',  // 1-3 = palette colors
  '12333321',
  '12333321',
  '12333321',
  '12333321',
  '01222210',
  '00111100'
])

// Create a sprite
const sprite = spriteManager.createSprite({
  x: 128,           // X position (0-255)
  y: 120,           // Y position (0-239)
  tileIndex: 0,     // Pattern index
  paletteIndex: 0,  // Palette (0-3)
  flipX: false,
  flipY: false
})

// Update sprite
sprite.update({ x: 130, y: 122 })

// Create meta-sprite (16×16 character from 4 tiles)
const playerMetaSprite = {
  width: 2,
  height: 2,
  frames: [{
    sprites: [
      { offsetX: 0, offsetY: 0, tileIndex: 10 },
      { offsetX: 8, offsetY: 0, tileIndex: 11 },
      { offsetX: 0, offsetY: 8, tileIndex: 12 },
      { offsetX: 8, offsetY: 8, tileIndex: 13 }
    ]
  }]
}

const player = new MetaSpriteObject(spriteManager, playerMetaSprite)
player.setPosition(128, 120)
player.setFrame(0)
player.setFlip(true, false)  // Face left
```

**Hardware Limits:**
- Maximum 64 sprites on screen
- Maximum 8 sprites per scanline
- 8×8 pixel sprites
- 4 colors per sprite (including transparency)
- 4 sprite palettes

See [SPRITES.md](./SPRITES.md) for detailed documentation.

### Screen System

Manage game states with lifecycle hooks and stack-based navigation.

```typescript
import { Engine, BaseScreen } from './engine'

// Create engine
const engine = new Engine({
  container: document.querySelector('#app')!,
  width: 800,
  height: 600
})

class TitleScreen extends BaseScreen {
  onEnter(): void {
    this.setBackground(0x000000)
    this.addAmbientLight()
    // Initialize title screen
  }
  
  onUpdate(dt: number): void {
    if (this.input.justPressed('start')) {
      // Switch to game screen
      engine.getScreenManager().switchTo('game')
    }
  }
  
  onExit(): void {
    this.clearScene()
  }
}

class GameScreen extends BaseScreen {
  onEnter(): void {
    // Initialize game
  }
  
  onUpdate(dt: number): void {
    // Game logic
  }
  
  onExit(): void {
    this.clearScene()
  }
}

const screenManager = engine.getScreenManager()

// Register screens
screenManager.register(
  new TitleScreen('title', engine.getRenderer(), engine.getInput())
)
screenManager.register(
  new GameScreen('game', engine.getRenderer(), engine.getInput())
)

// Switch screens (replaces current)
screenManager.switchTo('title')

// Push screen (stacks on top - for pause menus)
screenManager.push('pause')

// Pop screen (returns to previous)
screenManager.pop()

// Start the engine
engine.start()
```

### Color Palette

Authentic NES color palette with semantic naming.

```typescript
import { NES_PALETTE } from './engine'

// Grayscale
NES_PALETTE.BLACK
NES_PALETTE.DARK_GRAY
NES_PALETTE.GRAY
NES_PALETTE.LIGHT_GRAY
NES_PALETTE.WHITE

// Primary Colors
NES_PALETTE.RED
NES_PALETTE.DARK_RED
NES_PALETTE.BLUE
NES_PALETTE.DARK_BLUE
NES_PALETTE.GREEN
NES_PALETTE.DARK_GREEN
NES_PALETTE.YELLOW
NES_PALETTE.GOLD

// Additional Colors
NES_PALETTE.CYAN
NES_PALETTE.MAGENTA
NES_PALETTE.PURPLE
NES_PALETTE.ORANGE
NES_PALETTE.BROWN
NES_PALETTE.TAN
NES_PALETTE.LIME
NES_PALETTE.PINK
NES_PALETTE.PEACH
```

## Technical Constraints

Following NES hardware limitations for authentic retro feel:

- **Resolution**: 256×240 pixels
- **Tile Size**: 8×8 pixels
- **Frame Rate**: 60 FPS
- **Color Palette**: Limited NES palette
- **Sprites**: 64 max on screen, 8 per scanline
- **Sprite Size**: 8×8 pixels
- **Sprite Palettes**: 4 palettes with 3 colors + transparency
- **Audio**: Not yet implemented

Access constraints programmatically:

```typescript
import { TECHNICAL_CONSTRAINTS, PPU } from './engine'

console.log(PPU.SCREEN_WIDTH)  // 256
console.log(PPU.SCREEN_HEIGHT) // 240
console.log(PPU.TILE_SIZE)     // 8
console.log(TECHNICAL_CONSTRAINTS.TARGET_FPS) // 60
```

## Project Structure

```
8bit-engine/
├── src/
│   ├── engine/              # Core engine modules
│   │   ├── bitmap-font.ts   # Text rendering
│   │   ├── click-handler.ts # Mouse interaction
│   │   ├── game-loop.ts     # Main loop
│   │   ├── input.ts         # Input system
│   │   ├── palette.ts       # NES colors
│   │   ├── screen.ts        # Screen management
│   │   ├── sprite.ts        # Sprite system (OAM)
│   │   ├── ui-components.ts # UI library
│   │   ├── world-map.ts     # Map navigation
│   │   └── index.ts         # Engine exports
│   ├── game/                # Game implementation
│   │   ├── title-scene.ts
│   │   ├── map-scene.ts
│   │   ├── level-scene.ts
│   │   └── index.ts
│   ├── __tests__/           # Unit tests
│   │   ├── input.test.ts
│   │   ├── world-map.test.ts
│   │   └── bitmap-font.test.ts
│   └── main.ts              # Entry point
├── public/                  # Static assets
├── SPRITES.md              # Sprite system guide
├── TESTING.md              # Test documentation
├── WORLD_MAP.md            # WorldMap guide
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Development

### Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests once
npm run test:run

# Test UI
npm run test:ui
```

### Testing

The engine includes comprehensive unit tests:

```bash
npm test                 # Watch mode
npm run test:run         # Run once
npm run test:ui          # Visual interface
npm test -- --coverage   # Coverage report
```

See [TESTING.md](./TESTING.md) for details.

## Examples

### Complete Game Example

See the included 8BIT QUEST demo (`src/game/`) for a full example including:
- Title screen with animated button
- World map with 3 levels
- SMB3-style navigation
- Level progression system
- UI components in action

### Sprite System Example

See [SPRITES.md](./SPRITES.md) for detailed sprite system documentation including:
- Pattern creation and animation
- Meta-sprite characters
- Hardware constraint handling
- Complete code examples

### WorldMap Example

See [WORLD_MAP.md](./WORLD_MAP.md) for detailed WorldMap usage and examples.

## Browser Support

- Modern browsers with WebGL support
- ES6+ JavaScript required
- Tested on Chrome, Firefox, Safari, Edge

## Performance

- 60 FPS target on modern hardware
- Minimal draw calls with batched rendering
- Efficient pixel-based rendering
- No texture loading (pure geometry)

## Contributing

This is a personal project, but you're welcome to fork and adapt it for your own games!

## Architecture Decisions

### Why Three.js?

Three.js provides excellent 2D rendering capabilities through orthographic cameras while giving us:
- Hardware-accelerated rendering
- Mature scene graph
- Cross-browser WebGL support
- Excellent TypeScript support

### Why NES Constraints?

Constraints breed creativity. By limiting ourselves to NES-era capabilities:
- Simpler asset creation (no high-res art needed)
- Clear aesthetic direction
- Performance is never an issue
- Nostalgic appeal

### State Management

The engine uses a **Screen** system for managing game states. Screens represent distinct states like:
- Title screen
- World map
- Level gameplay
- Pause menu
- Game over

Each screen has lifecycle hooks (`onEnter`, `onUpdate`, `onExit`) and the `ScreenManager` provides stack-based navigation for modal screens like pause menus.

The `Engine` class provides a simple initialization API that manages rendering, input, screen management, and the game loop - eliminating boilerplate and hiding Three.js implementation details.

## Roadmap

Future enhancements:
- [x] ~~Sprite system (NES OAM)~~ ✅ Complete!
- [x] ~~Gamepad support~~ ✅ Complete!
- [ ] Audio system (NES-style chip tunes)
- [ ] 8×16 sprite support
- [ ] Tilemap renderer with scrolling
- [ ] Particle effects
- [ ] Save/load system
- [ ] Input rebinding/configuration
- [ ] Touch controls for mobile
- [ ] Collision detection helpers
- [ ] More UI components (sliders, progress bars)
- [ ] Visual scene editor

## License

MIT - Use freely in your own projects!

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D rendering library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

Inspired by classic NES games and the limitations that made them great.

---

**Happy retro game development! 🎮**
