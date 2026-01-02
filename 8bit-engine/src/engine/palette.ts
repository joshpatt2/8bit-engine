/**
 * NES Color Palette
 * The NES PPU could display 54 distinct colors (out of 64 total, some duplicates)
 * Games typically used a subset of these colors
 */

export const NES_PALETTE = {
  // Grays
  BLACK: 0x000000,
  DARK_GRAY: 0x3c3c3c,
  GRAY: 0x7c7c7c,
  LIGHT_GRAY: 0xbcbcbc,
  WHITE: 0xfcfcfc,

  // Reds
  DARK_RED: 0xa80020,
  RED: 0xdc0028,
  LIGHT_RED: 0xf87858,

  // Oranges
  ORANGE: 0xf83800,
  LIGHT_ORANGE: 0xfca044,

  // Yellows
  YELLOW: 0xf8b800,
  LIGHT_YELLOW: 0xfce4a0,

  // Greens
  DARK_GREEN: 0x005800,
  GREEN: 0x00a800,
  LIGHT_GREEN: 0xb8f8b8,
  LIME: 0x00b800,

  // Cyans
  CYAN: 0x00a8a8,
  LIGHT_CYAN: 0x00fcfc,

  // Blues
  DARK_BLUE: 0x0000a8,
  BLUE: 0x0058f8,
  LIGHT_BLUE: 0x3cbcfc,
  SKY_BLUE: 0xa4e4fc,

  // Purples
  PURPLE: 0x6844fc,
  LIGHT_PURPLE: 0xb8b8f8,

  // Magentas
  MAGENTA: 0xd800cc,
  PINK: 0xf878f8,
  LIGHT_PINK: 0xf8b8f8,

  // Browns
  BROWN: 0x503000,
  TAN: 0xac7c00,
  PEACH: 0xf8b8a0,
} as const

// Classic NES game palettes
export const PALETTES = {
  MARIO: {
    sky: NES_PALETTE.SKY_BLUE,
    ground: NES_PALETTE.BROWN,
    brick: NES_PALETTE.ORANGE,
    player: NES_PALETTE.RED,
  },
  ZELDA: {
    grass: NES_PALETTE.GREEN,
    sand: NES_PALETTE.TAN,
    water: NES_PALETTE.BLUE,
    player: NES_PALETTE.LIME,
  },
  METROID: {
    background: NES_PALETTE.BLACK,
    rock: NES_PALETTE.PURPLE,
    lava: NES_PALETTE.ORANGE,
    player: NES_PALETTE.YELLOW,
  },
} as const

export type PaletteColor = keyof typeof NES_PALETTE
