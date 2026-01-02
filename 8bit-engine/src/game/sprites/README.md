# Game Sprites

This folder contains sprite assets for the 8BIT QUEST game.

## Structure

```
sprites/
├── player/           # Main character sprites
│   ├── player-patterns.ts
│   └── corgi.png
├── enemies/          # Reserved for future enemies
│   └── enemy-patterns.ts
└── index.ts          # Central export point
```

## Usage

### Player Sprite (Corgi)

The player character uses `corgi.png` as the sprite texture. This is loaded and rendered using the sprite system.

```typescript
import { SpriteManager, createDefaultSpritePalettes } from '../engine'

// Initialize sprite system
const palettes = createDefaultSpritePalettes()
const spriteManager = new SpriteManager(scene, palettes)

// Load corgi texture for player sprite
// (Implementation details in player-patterns.ts)
```

### Future Sprites

The `enemies/` folder is reserved for future enemy sprite patterns.

## Adding New Sprites

1. Add your sprite image files to the appropriate folder
2. Define any pattern data in the `*-patterns.ts` files
3. Export from `index.ts`
4. Load in your game scene
