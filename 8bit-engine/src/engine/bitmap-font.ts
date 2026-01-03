/**
 * Bitmap Font Renderer
 * NES-style 8x8 tile-based text rendering
 *
 * Each character is represented as an 8x8 grid of pixels
 * This is how real NES games rendered text
 *
 * Performance: Uses DataTexture per character (1 mesh per char)
 * instead of individual pixel meshes (up to 64 meshes per char)
 */

import * as THREE from 'three'

// =============================================================================
// TEXTURE CACHE
// =============================================================================

/**
 * Cache for character textures to avoid recreating them
 * Key format: "char:color" (e.g., "A:16777215")
 */
const textureCache = new Map<string, THREE.DataTexture>()

/**
 * Get or create a cached texture for a character/color combination
 */
function getCharacterTexture(charData: number[], color: number): THREE.DataTexture {
  const cacheKey = `${charData.join(',')}:${color}`

  let texture = textureCache.get(cacheKey)
  if (texture) {
    return texture
  }

  // Create 8x8 RGBA texture
  const data = new Uint8Array(8 * 8 * 4)

  // Extract RGB from hex color
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff

  // Fill texture data from font bitmap
  for (let row = 0; row < 8; row++) {
    const rowData = charData[row]

    for (let col = 0; col < 8; col++) {
      // Check if this pixel is "on" (bit is set)
      const bitMask = 1 << (7 - col)
      const isPixelOn = (rowData & bitMask) !== 0

      // Texture Y is flipped (bottom-up in WebGL)
      const texY = 7 - row
      const idx = (texY * 8 + col) * 4

      if (isPixelOn) {
        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = 255
      } else {
        data[idx] = 0
        data[idx + 1] = 0
        data[idx + 2] = 0
        data[idx + 3] = 0
      }
    }
  }

  texture = new THREE.DataTexture(data, 8, 8, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.needsUpdate = true

  textureCache.set(cacheKey, texture)
  return texture
}

/**
 * Clear the texture cache (call on cleanup if needed)
 */
export function clearBitmapFontCache(): void {
  textureCache.forEach(texture => texture.dispose())
  textureCache.clear()
}

// =============================================================================
// FONT DATA
// =============================================================================

// Simple 5x7 pixel font data (stored as binary patterns)
// Each character is 8 rows of 8 bits (though we only use 5x7)
const FONT_DATA: Record<string, number[]> = {
  'A': [0x20, 0x50, 0x88, 0x88, 0xF8, 0x88, 0x88, 0x00],
  'B': [0xF0, 0x88, 0x88, 0xF0, 0x88, 0x88, 0xF0, 0x00],
  'C': [0x70, 0x88, 0x80, 0x80, 0x80, 0x88, 0x70, 0x00],
  'D': [0xF0, 0x88, 0x88, 0x88, 0x88, 0x88, 0xF0, 0x00],
  'E': [0xF8, 0x80, 0x80, 0xF0, 0x80, 0x80, 0xF8, 0x00],
  'F': [0xF8, 0x80, 0x80, 0xF0, 0x80, 0x80, 0x80, 0x00],
  'G': [0x70, 0x88, 0x80, 0xB8, 0x88, 0x88, 0x70, 0x00],
  'H': [0x88, 0x88, 0x88, 0xF8, 0x88, 0x88, 0x88, 0x00],
  'I': [0x70, 0x20, 0x20, 0x20, 0x20, 0x20, 0x70, 0x00],
  'J': [0x38, 0x10, 0x10, 0x10, 0x10, 0x90, 0x60, 0x00],
  'K': [0x88, 0x90, 0xA0, 0xC0, 0xA0, 0x90, 0x88, 0x00],
  'L': [0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0xF8, 0x00],
  'M': [0x88, 0xD8, 0xA8, 0xA8, 0x88, 0x88, 0x88, 0x00],
  'N': [0x88, 0xC8, 0xA8, 0x98, 0x88, 0x88, 0x88, 0x00],
  'O': [0x70, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70, 0x00],
  'P': [0xF0, 0x88, 0x88, 0xF0, 0x80, 0x80, 0x80, 0x00],
  'Q': [0x70, 0x88, 0x88, 0x88, 0xA8, 0x90, 0x68, 0x00],
  'R': [0xF0, 0x88, 0x88, 0xF0, 0xA0, 0x90, 0x88, 0x00],
  'S': [0x70, 0x88, 0x80, 0x70, 0x08, 0x88, 0x70, 0x00],
  'T': [0xF8, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x00],
  'U': [0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70, 0x00],
  'V': [0x88, 0x88, 0x88, 0x88, 0x88, 0x50, 0x20, 0x00],
  'W': [0x88, 0x88, 0x88, 0xA8, 0xA8, 0xD8, 0x88, 0x00],
  'X': [0x88, 0x88, 0x50, 0x20, 0x50, 0x88, 0x88, 0x00],
  'Y': [0x88, 0x88, 0x50, 0x20, 0x20, 0x20, 0x20, 0x00],
  'Z': [0xF8, 0x08, 0x10, 0x20, 0x40, 0x80, 0xF8, 0x00],
  '0': [0x70, 0x88, 0x98, 0xA8, 0xC8, 0x88, 0x70, 0x00],
  '1': [0x20, 0x60, 0x20, 0x20, 0x20, 0x20, 0x70, 0x00],
  '2': [0x70, 0x88, 0x08, 0x30, 0x40, 0x80, 0xF8, 0x00],
  '3': [0xF8, 0x08, 0x10, 0x30, 0x08, 0x88, 0x70, 0x00],
  '4': [0x10, 0x30, 0x50, 0x90, 0xF8, 0x10, 0x10, 0x00],
  '5': [0xF8, 0x80, 0xF0, 0x08, 0x08, 0x88, 0x70, 0x00],
  '6': [0x30, 0x40, 0x80, 0xF0, 0x88, 0x88, 0x70, 0x00],
  '7': [0xF8, 0x08, 0x10, 0x20, 0x40, 0x40, 0x40, 0x00],
  '8': [0x70, 0x88, 0x88, 0x70, 0x88, 0x88, 0x70, 0x00],
  '9': [0x70, 0x88, 0x88, 0x78, 0x08, 0x10, 0x60, 0x00],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  '-': [0x00, 0x00, 0x00, 0xF8, 0x00, 0x00, 0x00, 0x00],
  '!': [0x20, 0x20, 0x20, 0x20, 0x20, 0x00, 0x20, 0x00],
  '?': [0x70, 0x88, 0x08, 0x10, 0x20, 0x00, 0x20, 0x00],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00],
  ':': [0x00, 0x00, 0x20, 0x00, 0x00, 0x20, 0x00, 0x00],
  '/': [0x08, 0x08, 0x10, 0x20, 0x40, 0x80, 0x80, 0x00],
}

export interface BitmapTextOptions {
  color?: number
  scale?: number
  letterSpacing?: number
  align?: 'left' | 'center' | 'right'
}

/**
 * Create a mesh group containing text rendered as 8x8 pixel tiles
 */
export function createBitmapText(
  text: string,
  options: BitmapTextOptions = {}
): THREE.Group {
  const {
    color = 0xffffff,
    scale = 0.1,
    letterSpacing = 0,
    align = 'left',
  } = options

  const group = new THREE.Group()
  const upperText = text.toUpperCase()
  
  // Calculate total width for alignment
  const totalWidth = (upperText.length * 8 * scale) + (upperText.length - 1) * letterSpacing
  let startX = 0
  
  if (align === 'center') {
    startX = -totalWidth / 2
  } else if (align === 'right') {
    startX = -totalWidth
  }

  let xOffset = startX

  for (let i = 0; i < upperText.length; i++) {
    const char = upperText[i]
    const charData = FONT_DATA[char] || FONT_DATA[' ']

    const charMesh = createCharacterMesh(charData, color, scale)
    // Position mesh center to align with old pixel-based positioning
    // Old pixels were at 0-7, so left edge was at -0.5*scale, center at 3.5*scale
    charMesh.position.x = xOffset + 3.5 * scale
    charMesh.position.y = -3.5 * scale
    group.add(charMesh)

    xOffset += 8 * scale + letterSpacing
  }

  return group
}

/**
 * Create a mesh for a single character from its bitmap data
 * Uses a single PlaneGeometry with a cached DataTexture (1 mesh per character)
 */
function createCharacterMesh(
  charData: number[],
  color: number,
  scale: number
): THREE.Mesh {
  const charSize = 8 * scale

  // Get or create cached texture for this character/color
  const texture = getCharacterTexture(charData, color)

  // Single plane geometry for the entire character
  const geometry = new THREE.PlaneGeometry(charSize, charSize)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.5
  })

  const mesh = new THREE.Mesh(geometry, material)

  // Position is set by createBitmapText, not here
  return mesh
}

/**
 * Update the text of an existing bitmap text group
 * Properly disposes old geometry/materials before replacing
 */
export function updateBitmapText(
  group: THREE.Group,
  text: string,
  options: BitmapTextOptions = {}
): void {
  // Dispose and remove existing children
  while (group.children.length > 0) {
    const child = group.children[0]
    group.remove(child)

    // Dispose geometry and material (textures are cached, don't dispose)
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (child.material instanceof THREE.Material) {
        child.material.dispose()
      }
    }
  }

  // Add new text
  const newText = createBitmapText(text, options)
  newText.children.forEach(child => {
    group.add(child)
  })
}

/**
 * Helper to create common text styles
 */
export const BitmapTextStyles = {
  /** Large title text */
  title: (color: number = 0xffffff): BitmapTextOptions => ({
    color,
    scale: 0.15,
    letterSpacing: 0.05,
    align: 'center',
  }),

  /** Medium subtitle text */
  subtitle: (color: number = 0xffffff): BitmapTextOptions => ({
    color,
    scale: 0.1,
    letterSpacing: 0.02,
    align: 'center',
  }),

  /** Small UI text */
  small: (color: number = 0xffffff): BitmapTextOptions => ({
    color,
    scale: 0.08,
    letterSpacing: 0,
    align: 'left',
  }),
}
