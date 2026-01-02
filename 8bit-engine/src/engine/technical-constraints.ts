/**
 * NES Technical Constraints
 *
 * Reference document for authentic NES-style game development.
 * Use these constants to enforce hardware-accurate limitations.
 *
 * Sources:
 * - https://wiki.nesdev.org/w/index.php/PPU
 * - https://www.nesdev.org/wiki/Limitations
 * - https://famicom.party/book/09-theppu/
 * - https://www.dustmop.io/blog/2015/06/08/nes-graphics-part-2/
 */

// =============================================================================
// CPU CONSTRAINTS
// =============================================================================

export const CPU = {
  /** CPU clock speed: 1.79 MHz (NTSC) / 1.66 MHz (PAL) */
  CLOCK_SPEED_NTSC: 1789773,
  CLOCK_SPEED_PAL: 1662607,

  /** CPU RAM: Only 2KB for all game variables */
  RAM_BYTES: 2048,

  /** Cycles available during VBlank for updates: ~2270 */
  VBLANK_CYCLES: 2270,

  /** PPU ticks per CPU cycle */
  PPU_TICKS_PER_CYCLE_NTSC: 3,
  PPU_TICKS_PER_CYCLE_PAL: 3.2,
} as const

// =============================================================================
// PPU (GRAPHICS) CONSTRAINTS
// =============================================================================

export const PPU = {
  /** Screen resolution */
  SCREEN_WIDTH: 256,
  SCREEN_HEIGHT: 240,

  /** Visible scanlines (NTSC shows 224, PAL shows 240) */
  VISIBLE_SCANLINES_NTSC: 224,
  VISIBLE_SCANLINES_PAL: 240,
  TOTAL_SCANLINES_NTSC: 262,
  TOTAL_SCANLINES_PAL: 312,

  /** Tile dimensions - the atomic unit of NES graphics */
  TILE_SIZE: 8,
  TILE_SIZE_LARGE: 16, // 8x16 sprite mode

  /** Screen measured in tiles */
  SCREEN_WIDTH_TILES: 32,  // 256 / 8
  SCREEN_HEIGHT_TILES: 30, // 240 / 8
  TOTAL_SCREEN_TILES: 960, // 32 * 30

  /** Pattern table (tile storage) */
  PATTERN_TABLE_TILES: 256,      // Tiles per pattern table
  PATTERN_TABLES: 2,             // Two pattern tables (0 and 1)
  MAX_UNIQUE_TILES: 512,         // Combined
  BYTES_PER_TILE: 16,            // 8x8 pixels at 2 bits per pixel

  /** Nametable (background layout) */
  NAMETABLE_SIZE_BYTES: 960,     // One screen of tile indices
  NAMETABLE_RAM_BYTES: 2048,     // Total VRAM for nametables

  /** Color depth per tile/sprite */
  COLORS_PER_TILE: 4,            // 2-bit depth (including transparent)
  USABLE_COLORS_PER_TILE: 3,     // Plus transparency
} as const

// =============================================================================
// SPRITE CONSTRAINTS
// =============================================================================

export const SPRITES = {
  /** Maximum sprites on screen */
  MAX_SPRITES: 64,

  /** Maximum sprites per scanline - CRITICAL LIMIT */
  MAX_PER_SCANLINE: 8,

  /** Sprite sizes */
  SPRITE_WIDTH: 8,
  SPRITE_HEIGHT_NORMAL: 8,
  SPRITE_HEIGHT_TALL: 16,        // 8x16 mode

  /** OAM (Object Attribute Memory) */
  OAM_SIZE_BYTES: 256,           // 64 sprites * 4 bytes each
  BYTES_PER_SPRITE: 4,           // X, Y, tile index, attributes

  /** Sprite data structure */
  SPRITE_DATA: {
    BYTE_0: 'Y position',
    BYTE_1: 'Tile index',
    BYTE_2: 'Attributes (palette, flip, priority)',
    BYTE_3: 'X position',
  },
} as const

// =============================================================================
// PALETTE CONSTRAINTS
// =============================================================================

export const PALETTE = {
  /** Total colors the NES can theoretically display */
  SYSTEM_COLORS: 64,

  /** Actual unique colors (some are duplicates) */
  UNIQUE_COLORS: 54,

  /** Palettes available */
  BACKGROUND_PALETTES: 4,
  SPRITE_PALETTES: 4,

  /** Colors per palette */
  COLORS_PER_PALETTE: 4,         // Including shared background/transparent
  UNIQUE_COLORS_PER_PALETTE: 3,  // Usable unique colors

  /** Total unique colors on screen at once */
  MAX_COLORS_ON_SCREEN: 25,      // 4 palettes * 3 + 1 background * 4 groups + 1 bg
} as const

// =============================================================================
// SCROLLING CONSTRAINTS
// =============================================================================

export const SCROLLING = {
  /** Scroll range */
  MAX_SCROLL_X: 511,             // Two nametables wide
  MAX_SCROLL_Y: 479,             // Two nametables tall

  /** Nametable mirroring modes */
  MIRRORING: {
    HORIZONTAL: 'horizontal',    // Vertical scrolling games (like SMB)
    VERTICAL: 'vertical',        // Horizontal scrolling games
    FOUR_SCREEN: 'four-screen',  // Rare, requires extra VRAM
    SINGLE: 'single',            // No scrolling
  },
} as const

// =============================================================================
// AUDIO CONSTRAINTS (APU)
// =============================================================================

export const AUDIO = {
  /** Sound channels */
  PULSE_CHANNELS: 2,             // Square wave
  TRIANGLE_CHANNELS: 1,          // Triangle wave (bass, melody)
  NOISE_CHANNELS: 1,             // Noise (drums, effects)
  DMC_CHANNELS: 1,               // Delta modulation (samples)
  TOTAL_CHANNELS: 5,

  /** Sample rate */
  SAMPLE_RATE: 44100,            // Approximate output

  /** Pulse wave duty cycles */
  DUTY_CYCLES: [0.125, 0.25, 0.5, 0.75],
} as const

// =============================================================================
// CARTRIDGE CONSTRAINTS
// =============================================================================

export const CARTRIDGE = {
  /** Base cartridge limits */
  BASE_PRG_ROM_BYTES: 32768,     // 32KB program ROM
  BASE_CHR_ROM_BYTES: 8192,      // 8KB character ROM

  /** Common mapper-enhanced limits */
  MMC1_PRG_MAX: 262144,          // 256KB (Zelda, Metroid)
  MMC3_PRG_MAX: 524288,          // 512KB (SMB3, Kirby)
  MMC3_CHR_MAX: 262144,          // 256KB

  /** Battery-backed save RAM */
  SAVE_RAM_BYTES: 8192,          // 8KB typical
} as const

// =============================================================================
// DERIVED CONSTRAINTS FOR GAME DESIGN
// =============================================================================

export const GAME_DESIGN = {
  /**
   * Player sprite size considerations:
   * Mario is 16x32 pixels = 8 sprites (2 wide, 4 tall)
   * This means Mario alone uses 2 sprites per scanline
   */
  TYPICAL_PLAYER_WIDTH_TILES: 2,
  TYPICAL_PLAYER_HEIGHT_TILES: 4,
  TYPICAL_PLAYER_SPRITES: 8,

  /**
   * Safe sprites per scanline accounting for player:
   * 8 max - 2 for player = 6 for enemies/items
   */
  SAFE_ENEMY_SPRITES_PER_SCANLINE: 6,

  /**
   * To avoid flicker, keep total scanline sprites under 8
   * If you must exceed, implement sprite cycling (multiplexing)
   */
  FLICKER_THRESHOLD: 8,

  /**
   * Screen can display 30 rows of tiles
   * Status bar typically uses 2-3 rows
   * Playable area: 27-28 rows
   */
  TYPICAL_HUD_ROWS: 2,
  PLAYABLE_ROWS: 28,

  /**
   * Frame timing
   * NES runs at ~60 FPS (NTSC) or ~50 FPS (PAL)
   */
  TARGET_FPS_NTSC: 60,
  TARGET_FPS_PAL: 50,
  FRAME_TIME_MS_NTSC: 16.67,
  FRAME_TIME_MS_PAL: 20,
} as const

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if sprite count will cause flicker on a scanline
 */
export function willCauseFlicker(spritesOnScanline: number): boolean {
  return spritesOnScanline > SPRITES.MAX_PER_SCANLINE
}

/**
 * Calculate how many enemies can safely share a scanline with player
 */
export function safeEnemyCount(playerWidthTiles: number = 2): number {
  const playerSpritesPerScanline = playerWidthTiles
  return SPRITES.MAX_PER_SCANLINE - playerSpritesPerScanline
}

/**
 * Check if a tile count fits in pattern table
 */
export function tilesFitInPatternTable(tileCount: number): boolean {
  return tileCount <= PPU.MAX_UNIQUE_TILES
}

/**
 * Calculate bytes needed for tile graphics
 */
export function tilesBytes(tileCount: number): number {
  return tileCount * PPU.BYTES_PER_TILE
}

/**
 * Calculate total sprites needed for a character
 */
export function spritesForCharacter(widthPx: number, heightPx: number): number {
  const tilesWide = Math.ceil(widthPx / SPRITES.SPRITE_WIDTH)
  const tilesTall = Math.ceil(heightPx / SPRITES.SPRITE_HEIGHT_NORMAL)
  return tilesWide * tilesTall
}

// =============================================================================
// CONSTRAINT CHECKER
// =============================================================================

export interface ConstraintViolation {
  constraint: string
  limit: number
  actual: number
  severity: 'warning' | 'error'
  message: string
}

export function checkConstraints(params: {
  totalSprites?: number
  spritesPerScanline?: number
  uniqueTiles?: number
  colorsOnScreen?: number
}): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []

  if (params.totalSprites !== undefined && params.totalSprites > SPRITES.MAX_SPRITES) {
    violations.push({
      constraint: 'MAX_SPRITES',
      limit: SPRITES.MAX_SPRITES,
      actual: params.totalSprites,
      severity: 'error',
      message: `Too many sprites: ${params.totalSprites} exceeds NES limit of ${SPRITES.MAX_SPRITES}`,
    })
  }

  if (params.spritesPerScanline !== undefined && params.spritesPerScanline > SPRITES.MAX_PER_SCANLINE) {
    violations.push({
      constraint: 'MAX_PER_SCANLINE',
      limit: SPRITES.MAX_PER_SCANLINE,
      actual: params.spritesPerScanline,
      severity: 'warning',
      message: `Sprite flicker: ${params.spritesPerScanline} sprites on scanline exceeds ${SPRITES.MAX_PER_SCANLINE} limit`,
    })
  }

  if (params.uniqueTiles !== undefined && params.uniqueTiles > PPU.MAX_UNIQUE_TILES) {
    violations.push({
      constraint: 'MAX_UNIQUE_TILES',
      limit: PPU.MAX_UNIQUE_TILES,
      actual: params.uniqueTiles,
      severity: 'error',
      message: `Too many tiles: ${params.uniqueTiles} exceeds NES limit of ${PPU.MAX_UNIQUE_TILES}`,
    })
  }

  if (params.colorsOnScreen !== undefined && params.colorsOnScreen > PALETTE.MAX_COLORS_ON_SCREEN) {
    violations.push({
      constraint: 'MAX_COLORS_ON_SCREEN',
      limit: PALETTE.MAX_COLORS_ON_SCREEN,
      actual: params.colorsOnScreen,
      severity: 'error',
      message: `Too many colors: ${params.colorsOnScreen} exceeds NES limit of ${PALETTE.MAX_COLORS_ON_SCREEN}`,
    })
  }

  return violations
}
