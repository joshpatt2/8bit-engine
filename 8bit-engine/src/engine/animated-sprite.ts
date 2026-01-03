/**
 * Animated Sprite
 * Reusable sprite rendering and animation component
 * 
 * Features:
 * - Sprite sheet loading and rendering
 * - Frame-based animation
 * - Fallback to colored box
 * - Pixel-perfect rendering
 * - Position and scale control
 */

import * as THREE from 'three'

// =============================================================================
// ANIMATED SPRITE CONFIGURATION
// =============================================================================

export interface AnimatedSpriteConfig {
  /** Path to sprite sheet, or THREE.Texture, or null for fallback box */
  sprite?: string | THREE.Texture | null
  
  /** Fallback color if sprite fails to load or is not provided */
  color?: number
  
  /** Size of the sprite visual */
  size?: { width: number; height: number; depth?: number }
  
  /** Sprite sheet layout (e.g., 2x2 for 4 frames in a grid) */
  spriteLayout?: { cols: number; rows: number }
  
  /** Animation speed (seconds per frame) */
  animSpeed?: number
  
  /** Should the sprite animate automatically? */
  autoAnimate?: boolean
  
  /** Initial frame index */
  initialFrame?: number
  
  /** Flip sprite horizontally */
  flipX?: boolean
  
  /** Flip sprite vertically */
  flipY?: boolean
}

// =============================================================================
// ANIMATED SPRITE CLASS
// =============================================================================

export class AnimatedSprite {
  private config: Required<Omit<AnimatedSpriteConfig, 'sprite'>> & Pick<AnimatedSpriteConfig, 'sprite'>
  private mesh?: THREE.Mesh
  private scene: THREE.Scene
  
  // Animation state
  private currentFrame: number = 0
  private animTimer: number = 0
  private isAnimating: boolean = true
  
  constructor(scene: THREE.Scene, config: AnimatedSpriteConfig = {}) {
    this.scene = scene
    
    // Set defaults
    this.config = {
      sprite: config.sprite,
      color: config.color ?? 0xff0000,
      size: config.size ?? { width: 1, height: 1, depth: 0.5 },
      spriteLayout: config.spriteLayout ?? { cols: 1, rows: 1 },
      animSpeed: config.animSpeed ?? 0.15,
      autoAnimate: config.autoAnimate ?? true,
      initialFrame: config.initialFrame ?? 0,
      flipX: config.flipX ?? false,
      flipY: config.flipY ?? false
    }
    
    this.currentFrame = this.config.initialFrame
    this.isAnimating = this.config.autoAnimate
    
    this.createVisual()
  }

  /**
   * Create the visual representation
   */
  private createVisual(): void {
    const sprite = this.config.sprite
    
    if (typeof sprite === 'string') {
      // Load from path
      this.loadSpriteFromPath(sprite)
    } else if (sprite instanceof THREE.Texture) {
      // Use provided texture
      this.createSpriteVisual(sprite)
    } else {
      // Fallback to colored box
      this.createFallbackVisual()
    }
  }

  /**
   * Load sprite from file path
   */
  private loadSpriteFromPath(path: string): void {
    const textureLoader = new THREE.TextureLoader()
    
    textureLoader.load(
      path,
      (texture) => {
        this.createSpriteVisual(texture)
      },
      undefined,
      (error) => {
        console.error('Error loading sprite:', error)
        this.createFallbackVisual()
      }
    )
  }

  /**
   * Create sprite-based visual
   */
  private createSpriteVisual(texture: THREE.Texture): void {
    // Configure texture for pixel-perfect rendering
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    
    // Set up for sprite sheet
    const { cols, rows } = this.config.spriteLayout
    const frameWidth = 1 / cols
    const frameHeight = 1 / rows
    
    texture.repeat.set(frameWidth, frameHeight)
    
    // Set initial frame
    this.updateTextureOffset(texture, this.currentFrame)
    
    // Create sprite plane
    const geometry = new THREE.PlaneGeometry(this.config.size.width, this.config.size.height)
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    })
    
    // Apply flipping
    if (this.config.flipX || this.config.flipY) {
      material.map!.repeat.x = this.config.flipX ? -frameWidth : frameWidth
      material.map!.repeat.y = this.config.flipY ? -frameHeight : frameHeight
    }
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)
  }

  /**
   * Create fallback colored box visual
   */
  private createFallbackVisual(): void {
    const depth = this.config.size.depth ?? 0.5
    const geometry = new THREE.BoxGeometry(
      this.config.size.width,
      this.config.size.height,
      depth
    )
    const material = new THREE.MeshBasicMaterial({ color: this.config.color })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)
  }

  /**
   * Update texture offset for current frame
   */
  private updateTextureOffset(texture: THREE.Texture, frame: number): void {
    const { cols, rows } = this.config.spriteLayout
    const frameWidth = 1 / cols
    const frameHeight = 1 / rows
    
    const col = frame % cols
    const row = Math.floor(frame / cols)
    
    // Set texture offset (origin is bottom-left in Three.js)
    const baseOffsetX = col * frameWidth
    const baseOffsetY = 1 - (row + 1) * frameHeight
    
    if (this.config.flipX) {
      texture.offset.x = baseOffsetX + frameWidth
    } else {
      texture.offset.x = baseOffsetX
    }
    
    if (this.config.flipY) {
      texture.offset.y = baseOffsetY + frameHeight
    } else {
      texture.offset.y = baseOffsetY
    }
  }

  /**
   * Update animation
   */
  public update(deltaTime: number): void {
    if (!this.isAnimating) return
    
    this.animTimer += deltaTime
    
    if (this.animTimer >= this.config.animSpeed) {
      this.animTimer = 0
      
      const { cols, rows } = this.config.spriteLayout
      const totalFrames = cols * rows
      this.currentFrame = (this.currentFrame + 1) % totalFrames
      
      // Update texture offset if using sprite
      if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
        const texture = this.mesh.material.map
        if (texture) {
          this.updateTextureOffset(texture, this.currentFrame)
        }
      }
    }
  }

  /**
   * Set sprite position
   */
  public setPosition(x: number, y: number, z?: number): void {
    if (this.mesh) {
      this.mesh.position.x = x
      this.mesh.position.y = y
      if (z !== undefined) {
        this.mesh.position.z = z
      }
    }
  }

  /**
   * Get current position
   */
  public getPosition(): THREE.Vector3 {
    return this.mesh ? this.mesh.position.clone() : new THREE.Vector3()
  }

  /**
   * Set sprite scale
   */
  public setScale(x: number, y?: number, z?: number): void {
    if (this.mesh) {
      this.mesh.scale.x = x
      this.mesh.scale.y = y ?? x
      this.mesh.scale.z = z ?? x
    }
  }

  /**
   * Set sprite rotation
   */
  public setRotation(x: number, y: number, z: number): void {
    if (this.mesh) {
      this.mesh.rotation.set(x, y, z)
    }
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): void {
    if (this.mesh) {
      this.mesh.visible = visible
    }
  }

  /**
   * Set specific frame
   */
  public setFrame(frame: number): void {
    const { cols, rows } = this.config.spriteLayout
    const totalFrames = cols * rows
    this.currentFrame = Math.max(0, Math.min(frame, totalFrames - 1))
    
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      const texture = this.mesh.material.map
      if (texture) {
        this.updateTextureOffset(texture, this.currentFrame)
      }
    }
  }

  /**
   * Get current frame
   */
  public getFrame(): number {
    return this.currentFrame
  }

  /**
   * Start animation
   */
  public play(): void {
    this.isAnimating = true
  }

  /**
   * Stop animation
   */
  public stop(): void {
    this.isAnimating = false
  }

  /**
   * Reset animation to first frame
   */
  public reset(): void {
    this.currentFrame = this.config.initialFrame
    this.animTimer = 0
    
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      const texture = this.mesh.material.map
      if (texture) {
        this.updateTextureOffset(texture, this.currentFrame)
      }
    }
  }

  /**
   * Get the mesh (for external manipulation)
   */
  public getMesh(): THREE.Mesh | undefined {
    return this.mesh
  }

  /**
   * Set color (works with fallback box or tints sprite)
   */
  public setColor(color: number): void {
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      this.mesh.material.color.setHex(color)
    }
  }

  /**
   * Flip the sprite horizontally
   */
  public setFlipX(flip: boolean): void {
    this.config.flipX = flip
    
    if (this.mesh && this.mesh.material instanceof THREE.MeshBasicMaterial) {
      const texture = this.mesh.material.map
      if (texture) {
        const { cols } = this.config.spriteLayout
        const frameWidth = 1 / cols
        texture.repeat.x = flip ? -frameWidth : frameWidth
        this.updateTextureOffset(texture, this.currentFrame)
      }
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.mesh) {
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose()
      }
      if (this.mesh.material instanceof THREE.MeshBasicMaterial) {
        if (this.mesh.material.map) {
          this.mesh.material.map.dispose()
        }
        this.mesh.material.dispose()
      }
      this.scene.remove(this.mesh)
      this.mesh = undefined
    }
  }
}
