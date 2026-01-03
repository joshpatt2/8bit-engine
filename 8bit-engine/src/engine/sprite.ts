/**
 * NES Sprite System (OAM - Object Attribute Memory)
 * 
 * Authentic NES sprite constraints:
 * - 64 sprites maximum on screen
 * - 8 sprites per scanline (horizontal line)
 * - 8×8 or 8×16 pixel sprites
 * - 4 colors per sprite (including transparency)
 * - 4 sprite palettes
 * - Horizontal/vertical flipping
 * - Priority (behind or in front of background)
 */

import * as THREE from 'three'
import { NES_PALETTE } from './palette'
import { PPU } from './technical-constraints'

// =============================================================================
// SPRITE TYPES
// =============================================================================

export type SpriteSize = '8x8' | '8x16'

export interface SpritePalette {
  /** Color 0 is always transparent */
  color1: number
  color2: number
  color3: number
}

export interface SpritePattern {
  /** 8×8 pixel pattern data (0-3 for 4 colors) */
  pixels: number[][]
}

export interface SpriteAttributes {
  /** X position on screen (0-255) */
  x: number
  
  /** Y position on screen (0-239) */
  y: number
  
  /** Tile/pattern index */
  tileIndex: number
  
  /** Palette index (0-3) */
  paletteIndex: number
  
  /** Flip horizontally */
  flipX?: boolean
  
  /** Flip vertically */
  flipY?: boolean
  
  /** Priority: false = in front of background, true = behind */
  behindBackground?: boolean
  
  /** Visible */
  visible?: boolean
}

export interface MetaSpriteFrame {
  /** Individual sprite tiles that make up this meta-sprite */
  sprites: Array<{
    /** Offset from meta-sprite origin */
    offsetX: number
    offsetY: number
    tileIndex: number
    flipX?: boolean
    flipY?: boolean
  }>
}

export interface MetaSprite {
  /** Width in tiles */
  width: number
  
  /** Height in tiles */
  height: number
  
  /** Animation frames */
  frames: MetaSpriteFrame[]
}

// =============================================================================
// PATTERN TABLE (CHR-ROM equivalent)
// =============================================================================

export class PatternTable {
  private patterns: Map<number, SpritePattern> = new Map()

  /**
   * Create a pattern from pixel data
   */
  public createPattern(index: number, pixels: number[][]): void {
    if (pixels.length !== 8 || pixels.some(row => row.length !== 8)) {
      throw new Error('Pattern must be 8×8 pixels')
    }
    
    // Validate pixel values (0-3)
    for (const row of pixels) {
      for (const pixel of row) {
        if (pixel < 0 || pixel > 3) {
          throw new Error('Pixel values must be 0-3')
        }
      }
    }
    
    this.patterns.set(index, { pixels })
  }

  /**
   * Create a pattern from a simplified string format
   * Example:
   * ```
   * [
   *   '00111100',
   *   '01222210',
   *   '12333321',
   *   '12333321',
   *   '12333321',
   *   '12333321',
   *   '01222210',
   *   '00111100'
   * ]
   * ```
   */
  public createPatternFromString(index: number, rows: string[]): void {
    if (rows.length !== 8) {
      throw new Error('Must provide 8 rows')
    }
    
    const pixels = rows.map(row => {
      if (row.length !== 8) {
        throw new Error('Each row must be 8 characters')
      }
      return row.split('').map(char => parseInt(char, 10))
    })
    
    this.createPattern(index, pixels)
  }

  public getPattern(index: number): SpritePattern | undefined {
    return this.patterns.get(index)
  }

  public hasPattern(index: number): boolean {
    return this.patterns.has(index)
  }

  /**
   * Create multiple patterns for a character animation
   */
  public createAnimationPatterns(startIndex: number, frames: string[][]): void {
    frames.forEach((frame, i) => {
      this.createPatternFromString(startIndex + i, frame)
    })
  }
}

// =============================================================================
// SPRITE OBJECT (OAM Entry)
// =============================================================================

export class Sprite {
  public attributes: SpriteAttributes
  private mesh?: THREE.Mesh
  private geometry?: THREE.PlaneGeometry
  private material?: THREE.MeshBasicMaterial
  private texture?: THREE.DataTexture
  private textureData?: Uint8Array
  private scene: THREE.Scene
  private patternTable: PatternTable
  private palettes: SpritePalette[]
  private isInScene = false

  constructor(
    scene: THREE.Scene,
    patternTable: PatternTable,
    palettes: SpritePalette[],
    attributes: SpriteAttributes
  ) {
    this.scene = scene
    this.patternTable = patternTable
    this.palettes = palettes
    this.attributes = { visible: true, ...attributes }
    this.createMesh()
    this.updateTexture()
  }

  /**
   * Create the mesh once - geometry and material are reused
   */
  private createMesh(): void {
    // Create 8x8 RGBA texture data (reused on updates)
    this.textureData = new Uint8Array(8 * 8 * 4)

    this.texture = new THREE.DataTexture(
      this.textureData,
      8, 8,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    )
    this.texture.magFilter = THREE.NearestFilter
    this.texture.minFilter = THREE.NearestFilter
    this.texture.needsUpdate = true

    // Single plane geometry for the entire sprite (8x8 pixels = 8 units)
    this.geometry = new THREE.PlaneGeometry(PPU.TILE_SIZE, PPU.TILE_SIZE)

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      alphaTest: 0.5
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.updatePosition()

    if (this.attributes.visible !== false) {
      this.scene.add(this.mesh)
      this.isInScene = true
    }
  }

  /**
   * Update texture data in-place - no geometry rebuild needed
   */
  private updateTexture(): void {
    if (!this.textureData || !this.texture) return

    const pattern = this.patternTable.getPattern(this.attributes.tileIndex)
    if (!pattern) {
      // Clear texture if no pattern
      this.textureData.fill(0)
      this.texture.needsUpdate = true
      return
    }

    const palette = this.palettes[this.attributes.paletteIndex]
    if (!palette) {
      this.textureData.fill(0)
      this.texture.needsUpdate = true
      return
    }

    // Build color lookup (palette index -> RGBA)
    const colors: [number, number, number, number][] = [
      [0, 0, 0, 0], // 0 = transparent
      this.hexToRGBA(palette.color1),
      this.hexToRGBA(palette.color2),
      this.hexToRGBA(palette.color3)
    ]

    // Fill texture data with pattern colors
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        // Handle flipping at texture level
        let srcX = this.attributes.flipX ? 7 - x : x
        let srcY = this.attributes.flipY ? 7 - y : y

        const pixelValue = pattern.pixels[srcY][srcX]
        const color = colors[pixelValue] || colors[0]

        // Texture Y is flipped (bottom-up in WebGL)
        const texY = 7 - y
        const idx = (texY * 8 + x) * 4

        this.textureData[idx] = color[0]     // R
        this.textureData[idx + 1] = color[1] // G
        this.textureData[idx + 2] = color[2] // B
        this.textureData[idx + 3] = color[3] // A
      }
    }

    this.texture.needsUpdate = true
  }

  /**
   * Convert hex color to RGBA tuple
   */
  private hexToRGBA(hex: number): [number, number, number, number] {
    return [
      (hex >> 16) & 0xff, // R
      (hex >> 8) & 0xff,  // G
      hex & 0xff,         // B
      255                 // A (fully opaque)
    ]
  }

  private updatePosition(): void {
    if (!this.mesh) return

    // Convert NES screen coordinates to our coordinate system
    const screenX = this.attributes.x - PPU.SCREEN_WIDTH / 2
    const screenY = PPU.SCREEN_HEIGHT / 2 - this.attributes.y

    this.mesh.position.set(screenX, screenY, this.attributes.behindBackground ? -0.5 : 0.5)
  }

  public update(attributes: Partial<SpriteAttributes>): void {
    const needsTextureUpdate =
      attributes.tileIndex !== undefined ||
      attributes.paletteIndex !== undefined ||
      attributes.flipX !== undefined ||
      attributes.flipY !== undefined

    Object.assign(this.attributes, attributes)

    if (needsTextureUpdate) {
      // Just update texture data - no mesh rebuild!
      this.updateTexture()
    }

    // Always update position (cheap operation)
    this.updatePosition()

    // Handle visibility
    if (attributes.visible !== undefined && this.mesh) {
      if (attributes.visible && !this.isInScene) {
        this.scene.add(this.mesh)
        this.isInScene = true
      } else if (!attributes.visible && this.isInScene) {
        this.scene.remove(this.mesh)
        this.isInScene = false
      }
    }
  }

  public destroy(): void {
    if (this.mesh && this.isInScene) {
      this.scene.remove(this.mesh)
      this.isInScene = false
    }
    if (this.geometry) {
      this.geometry.dispose()
    }
    if (this.material) {
      this.material.dispose()
    }
    if (this.texture) {
      this.texture.dispose()
    }
  }
}

// =============================================================================
// SPRITE MANAGER (OAM)
// =============================================================================

export class SpriteManager {
  private scene: THREE.Scene
  private patternTable: PatternTable
  private palettes: SpritePalette[]
  private sprites: Sprite[] = []
  private maxSprites = 64 // NES hardware limit
  private maxSpritesPerScanline = 8

  constructor(scene: THREE.Scene, palettes: SpritePalette[]) {
    this.scene = scene
    this.patternTable = new PatternTable()
    this.palettes = palettes
  }

  public getPatternTable(): PatternTable {
    return this.patternTable
  }

  /**
   * Create a new sprite
   */
  public createSprite(attributes: SpriteAttributes): Sprite | null {
    if (this.sprites.length >= this.maxSprites) {
      console.warn('Maximum sprite limit (64) reached')
      return null
    }

    const sprite = new Sprite(this.scene, this.patternTable, this.palettes, attributes)
    this.sprites.push(sprite)
    return sprite
  }

  /**
   * Remove a sprite
   */
  public destroySprite(sprite: Sprite): void {
    const index = this.sprites.indexOf(sprite)
    if (index !== -1) {
      this.sprites.splice(index, 1)
      sprite.destroy()
    }
  }

  /**
   * Check scanline sprite limits and warn
   */
  public checkScanlineLimits(): void {
    const scanlines = new Map<number, number>()
    
    this.sprites.forEach(sprite => {
      if (sprite.attributes.visible === false) return
      
      const scanline = Math.floor(sprite.attributes.y)
      scanlines.set(scanline, (scanlines.get(scanline) || 0) + 1)
    })

    scanlines.forEach((count, scanline) => {
      if (count > this.maxSpritesPerScanline) {
        console.warn(`Scanline ${scanline} has ${count} sprites (max 8) - sprites would flicker on real NES`)
      }
    })
  }

  /**
   * Get sprite count
   */
  public getSpriteCount(): number {
    return this.sprites.length
  }

  /**
   * Destroy all sprites
   */
  public destroyAll(): void {
    this.sprites.forEach(sprite => sprite.destroy())
    this.sprites = []
  }
}

// =============================================================================
// META-SPRITE (Multi-sprite character)
// =============================================================================

export class MetaSpriteObject {
  private sprites: Sprite[] = []
  private spriteManager: SpriteManager
  private metaSprite: MetaSprite
  private currentFrame = 0
  private x = 0
  private y = 0
  private paletteIndex = 0
  private visible = true

  constructor(spriteManager: SpriteManager, metaSprite: MetaSprite) {
    this.spriteManager = spriteManager
    this.metaSprite = metaSprite
    this.createSprites()
  }

  private createSprites(): void {
    const frame = this.metaSprite.frames[this.currentFrame]
    
    // Destroy old sprites
    this.sprites.forEach(sprite => this.spriteManager.destroySprite(sprite))
    this.sprites = []

    // Create new sprites for current frame
    frame.sprites.forEach(spriteDef => {
      const sprite = this.spriteManager.createSprite({
        x: this.x + spriteDef.offsetX,
        y: this.y + spriteDef.offsetY,
        tileIndex: spriteDef.tileIndex,
        paletteIndex: this.paletteIndex,
        flipX: spriteDef.flipX,
        flipY: spriteDef.flipY,
        visible: this.visible
      })
      
      if (sprite) {
        this.sprites.push(sprite)
      }
    })
  }

  /**
   * Set position of the entire meta-sprite
   */
  public setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
    
    const frame = this.metaSprite.frames[this.currentFrame]
    this.sprites.forEach((sprite, i) => {
      const spriteDef = frame.sprites[i]
      sprite.update({
        x: this.x + spriteDef.offsetX,
        y: this.y + spriteDef.offsetY
      })
    })
  }

  /**
   * Set animation frame
   */
  public setFrame(frameIndex: number): void {
    if (frameIndex < 0 || frameIndex >= this.metaSprite.frames.length) {
      console.warn(`Invalid frame index ${frameIndex}`)
      return
    }
    
    this.currentFrame = frameIndex
    this.createSprites()
  }

  /**
   * Set palette for all sprites
   */
  public setPalette(paletteIndex: number): void {
    this.paletteIndex = paletteIndex
    this.sprites.forEach(sprite => {
      sprite.update({ paletteIndex })
    })
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): void {
    this.visible = visible
    this.sprites.forEach(sprite => {
      sprite.update({ visible })
    })
  }

  /**
   * Flip entire meta-sprite
   */
  public setFlip(flipX: boolean, flipY: boolean): void {
    const frame = this.metaSprite.frames[this.currentFrame]
    
    this.sprites.forEach((sprite, i) => {
      const spriteDef = frame.sprites[i]
      
      // Calculate flipped position
      let offsetX = spriteDef.offsetX
      let offsetY = spriteDef.offsetY
      
      if (flipX) {
        offsetX = (this.metaSprite.width * 8 - 8) - offsetX
      }
      if (flipY) {
        offsetY = (this.metaSprite.height * 8 - 8) - offsetY
      }
      
      sprite.update({
        x: this.x + offsetX,
        y: this.y + offsetY,
        flipX: flipX ? !spriteDef.flipX : spriteDef.flipX,
        flipY: flipY ? !spriteDef.flipY : spriteDef.flipY
      })
    })
  }

  /**
   * Destroy the meta-sprite
   */
  public destroy(): void {
    this.sprites.forEach(sprite => this.spriteManager.destroySprite(sprite))
    this.sprites = []
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create default NES sprite palettes
 */
export function createDefaultSpritePalettes(): SpritePalette[] {
  return [
    // Palette 0: Mario colors
    {
      color1: NES_PALETTE.RED,
      color2: NES_PALETTE.BROWN,
      color3: NES_PALETTE.PEACH
    },
    // Palette 1: Luigi colors
    {
      color1: NES_PALETTE.GREEN,
      color2: NES_PALETTE.BROWN,
      color3: NES_PALETTE.PEACH
    },
    // Palette 2: Enemy colors
    {
      color1: NES_PALETTE.DARK_RED,
      color2: NES_PALETTE.ORANGE,
      color3: NES_PALETTE.YELLOW
    },
    // Palette 3: Coins/items
    {
      color1: NES_PALETTE.YELLOW,
      color2: NES_PALETTE.ORANGE,
      color3: NES_PALETTE.BROWN
    }
  ]
}

/**
 * Create a simple square sprite pattern (for testing)
 */
export function createSquarePattern(): string[] {
  return [
    '33333333',
    '32222223',
    '32111123',
    '32111123',
    '32111123',
    '32111123',
    '32222223',
    '33333333'
  ]
}

/**
 * Create a circle sprite pattern
 */
export function createCirclePattern(): string[] {
  return [
    '00111100',
    '01222210',
    '12333321',
    '12333321',
    '12333321',
    '12333321',
    '01222210',
    '00111100'
  ]
}
