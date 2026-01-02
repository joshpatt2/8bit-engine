# NES Sprite System

Complete NES-authentic sprite system with hardware constraints.

## Features

- ✅ **64 sprite maximum** (NES OAM limit)
- ✅ **8 sprites per scanline** limit (with warnings)
- ✅ **8×8 pixel sprites** (8×16 support planned)
- ✅ **4-color palettes** with transparency
- ✅ **Pattern tables** (CHR-ROM equivalent)
- ✅ **Horizontal/vertical flipping**
- ✅ **Priority control** (behind/in front of background)
- ✅ **Meta-sprites** for larger characters
- ✅ **Animation support**

## Quick Start

### 1. Create Sprite Manager

```typescript
import { SpriteManager, createDefaultSpritePalettes } from './engine'

// Set up sprite system with 4 palettes
const palettes = createDefaultSpritePalettes()
const spriteManager = new SpriteManager(scene, palettes)
```

### 2. Define Sprite Patterns

```typescript
const patternTable = spriteManager.getPatternTable()

// Create an 8×8 sprite pattern
// 0 = transparent, 1-3 = palette colors
patternTable.createPatternFromString(0, [
  '00111100',
  '01222210',
  '12333321',
  '12333321',
  '12333321',
  '12333321',
  '01222210',
  '00111100'
])

// Create animation frames
patternTable.createAnimationPatterns(1, [
  // Frame 1
  [
    '00111100',
    '01222210',
    '12333321',
    '12333321',
    '12333321',
    '12333321',
    '01222210',
    '00111100'
  ],
  // Frame 2
  [
    '00011000',
    '00122100',
    '01233210',
    '12333321',
    '12333321',
    '01233210',
    '00122100',
    '00011000'
  ]
])
```

### 3. Create Sprites

```typescript
// Create a single sprite
const sprite = spriteManager.createSprite({
  x: 128,           // X position (0-255)
  y: 120,           // Y position (0-239)
  tileIndex: 0,     // Pattern index
  paletteIndex: 0,  // Palette (0-3)
  flipX: false,     // Flip horizontally
  flipY: false,     // Flip vertically
  behindBackground: false,
  visible: true
})

// Update sprite
sprite.update({
  x: 130,
  y: 122
})

// Animate sprite
let frame = 0
setInterval(() => {
  frame = (frame + 1) % 2
  sprite.update({ tileIndex: 1 + frame })
}, 200)
```

## Meta-Sprites (Large Characters)

Meta-sprites combine multiple 8×8 sprites to create larger characters (like 16×16 Mario).

### Creating a Meta-Sprite

```typescript
import { MetaSprite, MetaSpriteObject } from './engine'

// Define a 16×16 character (4 sprites in 2×2 grid)
const playerMetaSprite: MetaSprite = {
  width: 2,   // 2 tiles wide
  height: 2,  // 2 tiles tall
  frames: [
    // Frame 0: Standing
    {
      sprites: [
        { offsetX: 0, offsetY: 0, tileIndex: 10 },  // Top-left
        { offsetX: 8, offsetY: 0, tileIndex: 11 },  // Top-right
        { offsetX: 0, offsetY: 8, tileIndex: 12 },  // Bottom-left
        { offsetX: 8, offsetY: 8, tileIndex: 13 }   // Bottom-right
      ]
    },
    // Frame 1: Walking
    {
      sprites: [
        { offsetX: 0, offsetY: 0, tileIndex: 14 },
        { offsetX: 8, offsetY: 0, tileIndex: 15 },
        { offsetX: 0, offsetY: 8, tileIndex: 16 },
        { offsetX: 8, offsetY: 8, tileIndex: 17 }
      ]
    }
  ]
}

// Create meta-sprite instance
const player = new MetaSpriteObject(spriteManager, playerMetaSprite)

// Position it
player.setPosition(128, 120)

// Animate it
player.setFrame(1)

// Flip it
player.setFlip(true, false)  // Face left

// Change palette
player.setPalette(1)

// Hide/show
player.setVisible(false)
```

## Sprite Palettes

Each sprite uses one of 4 palettes. Each palette has 3 colors (color 0 is always transparent).

```typescript
import { SpritePalette } from './engine'

const customPalettes: SpritePalette[] = [
  // Palette 0: Fire enemy
  {
    color1: NES_PALETTE.RED,
    color2: NES_PALETTE.ORANGE,
    color3: NES_PALETTE.YELLOW
  },
  // Palette 1: Water enemy
  {
    color1: NES_PALETTE.BLUE,
    color2: NES_PALETTE.CYAN,
    color3: NES_PALETTE.WHITE
  },
  // Palette 2: Plant enemy
  {
    color1: NES_PALETTE.GREEN,
    color2: NES_PALETTE.DARK_GREEN,
    color3: NES_PALETTE.LIME
  },
  // Palette 3: Coins/powerups
  {
    color1: NES_PALETTE.YELLOW,
    color2: NES_PALETTE.ORANGE,
    color3: NES_PALETTE.BROWN
  }
]

const spriteManager = new SpriteManager(scene, customPalettes)
```

## Pattern Creation

### From String Array

```typescript
patternTable.createPatternFromString(0, [
  '00111100',  // Row 0
  '01222210',  // Row 1
  '12333321',  // Row 2
  '12333321',  // Row 3
  '12333321',  // Row 4
  '12333321',  // Row 5
  '01222210',  // Row 6
  '00111100'   // Row 7
])
```

### From Pixel Array

```typescript
const pixels: number[][] = [
  [0,0,1,1,1,1,0,0],
  [0,1,2,2,2,2,1,0],
  [1,2,3,3,3,3,2,1],
  [1,2,3,3,3,3,2,1],
  [1,2,3,3,3,3,2,1],
  [1,2,3,3,3,3,2,1],
  [0,1,2,2,2,2,1,0],
  [0,0,1,1,1,1,0,0]
]

patternTable.createPattern(0, pixels)
```

### Helper Patterns

```typescript
import { createCirclePattern, createSquarePattern } from './engine'

// Circle sprite
patternTable.createPatternFromString(0, createCirclePattern())

// Square sprite
patternTable.createPatternFromString(1, createSquarePattern())
```

## NES Constraints

### Sprite Limit (64 total)

```typescript
// Check sprite count
console.log(`Sprites: ${spriteManager.getSpriteCount()} / 64`)

// Returns null if limit reached
const sprite = spriteManager.createSprite({ ... })
if (!sprite) {
  console.log('Sprite limit reached!')
}
```

### Scanline Limit (8 per line)

```typescript
// Check for scanline overflow (would cause flickering on real NES)
spriteManager.checkScanlineLimits()
// Warns: "Scanline 120 has 12 sprites (max 8) - sprites would flicker on real NES"
```

## Complete Example

```typescript
import {
  SpriteManager,
  createDefaultSpritePalettes,
  MetaSprite,
  MetaSpriteObject,
  createCirclePattern
} from './engine'

// Initialize
const palettes = createDefaultSpritePalettes()
const spriteManager = new SpriteManager(scene, palettes)
const patternTable = spriteManager.getPatternTable()

// Create patterns for a bouncing ball
patternTable.createPatternFromString(0, createCirclePattern())

// Create the ball sprite
const ball = spriteManager.createSprite({
  x: 128,
  y: 50,
  tileIndex: 0,
  paletteIndex: 0
})

// Animate the ball
let ballY = 50
let ballVelocity = 2

function update() {
  ballY += ballVelocity
  ballVelocity += 0.2  // Gravity
  
  if (ballY > 200) {
    ballY = 200
    ballVelocity = -8  // Bounce
  }
  
  ball.update({ y: Math.floor(ballY) })
}

// Create a 16×16 player character
const playerSprite: MetaSprite = {
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

const player = new MetaSpriteObject(spriteManager, playerSprite)
player.setPosition(100, 180)

// Clean up
function cleanup() {
  spriteManager.destroyAll()
}
```

## Performance Tips

1. **Reuse patterns** - Don't create duplicate patterns, reference the same tile index
2. **Pool sprites** - Reuse sprite objects instead of creating/destroying constantly
3. **Batch updates** - Update multiple sprite properties at once
4. **Check limits** - Use `checkScanlineLimits()` during development to catch issues

## Next Steps

- Create your sprite patterns
- Design meta-sprites for characters
- Set up animation sequences
- Handle sprite collisions
- Implement sprite pooling for bullets/particles

See the demo game for more examples!
