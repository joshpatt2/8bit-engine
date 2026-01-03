/**
 * Map Player
 * Represents a player navigating a WorldMap
 * 
 * Features:
 * - Player state (current node, visited nodes)
 * - Visual representation with sprite animation
 * - Movement and navigation logic
 * - Input handling for map navigation
 * - Support for multiple players
 */

import * as THREE from 'three'
import { NES_PALETTE } from './palette'

// =============================================================================
// MAP PLAYER CONFIGURATION
// =============================================================================

export interface MapPlayerConfig {
  /** Starting node ID */
  startNodeId: string
  
  /** Path to sprite sheet, or THREE.Texture, or null for fallback box */
  sprite?: string | THREE.Texture | null
  
  /** Fallback color if sprite fails to load or is not provided */
  color?: number
  
  /** Animation speed (seconds per frame) */
  animSpeed?: number
  
  /** Sprite sheet layout (e.g., 2x2 for 4 frames in a grid) */
  spriteLayout?: { cols: number; rows: number }
  
  /** Player marker offset from node position */
  markerOffset?: { x: number; y: number; z: number }
  
  /** Size of the player visual */
  size?: { width: number; height: number }
  
  /** Called when player reaches a new node */
  onNodeReached?: (nodeId: string) => void
  
  /** Called when player tries to move but is blocked */
  onMovementBlocked?: (targetNodeId: string) => void
}

// =============================================================================
// MAP PLAYER CLASS
// =============================================================================

export class MapPlayer {
  private currentNodeId: string
  private currentPosition: { x: number; y: number }
  private visitedNodes: Set<string> = new Set()
  private config: Required<Omit<MapPlayerConfig, 'sprite' | 'onNodeReached' | 'onMovementBlocked'>> & Pick<MapPlayerConfig, 'sprite' | 'onNodeReached' | 'onMovementBlocked'>
  
  // Visual representation
  private visual?: THREE.Mesh
  private scene: THREE.Scene
  
  // Animation state
  private spriteFrameIndex: number = 0
  private spriteAnimTimer: number = 0
  private bounceTimer: number = 0
  
  constructor(scene: THREE.Scene, config: MapPlayerConfig) {
    this.scene = scene
    this.currentNodeId = config.startNodeId
    this.currentPosition = { x: 0, y: 0 }
    this.visitedNodes.add(config.startNodeId)
    
    // Set defaults
    this.config = {
      startNodeId: config.startNodeId,
      sprite: config.sprite,
      color: config.color ?? NES_PALETTE.RED,
      animSpeed: config.animSpeed ?? 0.3,
      spriteLayout: config.spriteLayout ?? { cols: 2, rows: 2 },
      markerOffset: config.markerOffset ?? { x: 0, y: 0.7, z: 0.5 },
      size: config.size ?? { width: 1.5, height: 1.5 },
      onNodeReached: config.onNodeReached,
      onMovementBlocked: config.onMovementBlocked
    }
    
    this.createVisual()
  }

  /**
   * Create the visual representation of the player
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
        console.error('Error loading player sprite:', error)
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
    texture.offset.set(0, 1 - frameHeight) // Start with top-left frame
    
    // Create sprite
    const geometry = new THREE.PlaneGeometry(this.config.size.width, this.config.size.height)
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    })
    
    this.visual = new THREE.Mesh(geometry, material)
    this.visual.position.set(
      this.currentPosition.x + this.config.markerOffset.x,
      this.currentPosition.y + this.config.markerOffset.y,
      this.config.markerOffset.z
    )
    
    this.scene.add(this.visual)
  }

  /**
   * Create fallback colored box visual
   */
  private createFallbackVisual(): void {
    const geometry = new THREE.BoxGeometry(0.6, 0.8, 0.6)
    const material = new THREE.MeshBasicMaterial({ color: this.config.color })
    
    this.visual = new THREE.Mesh(geometry, material)
    this.visual.position.set(
      this.currentPosition.x + this.config.markerOffset.x,
      this.currentPosition.y + this.config.markerOffset.y,
      this.config.markerOffset.z
    )
    
    this.scene.add(this.visual)
  }

  /**
   * Update sprite animation
   */
  private updateAnimation(deltaTime: number): void {
    this.spriteAnimTimer += deltaTime
    
    if (this.spriteAnimTimer >= this.config.animSpeed) {
      this.spriteAnimTimer = 0
      
      const { cols, rows } = this.config.spriteLayout
      const totalFrames = cols * rows
      this.spriteFrameIndex = (this.spriteFrameIndex + 1) % totalFrames
      
      // Update texture offset
      if (this.visual && this.visual.material instanceof THREE.MeshBasicMaterial) {
        const texture = this.visual.material.map
        if (texture) {
          const frameWidth = 1 / cols
          const frameHeight = 1 / rows
          
          const col = this.spriteFrameIndex % cols
          const row = Math.floor(this.spriteFrameIndex / cols)
          
          // Set texture offset (origin is bottom-left in Three.js)
          texture.offset.x = col * frameWidth
          texture.offset.y = 1 - (row + 1) * frameHeight
        }
      }
    }
  }

  /**
   * Update bounce animation
   */
  private updateBounce(deltaTime: number): void {
    this.bounceTimer += deltaTime
    
    if (this.visual) {
      const bounceOffset = Math.sin(this.bounceTimer * 5) * 0.02
      this.visual.position.y = this.currentPosition.y + this.config.markerOffset.y + bounceOffset
    }
  }

  /**
   * Update player state and animations
   */
  public update(deltaTime: number): void {
    this.updateAnimation(deltaTime)
    this.updateBounce(deltaTime)
  }

  /**
   * Get current node ID
   */
  public getCurrentNodeId(): string {
    return this.currentNodeId
  }

  /**
   * Get current position
   */
  public getCurrentPosition(): { x: number; y: number } {
    return { ...this.currentPosition }
  }

  /**
   * Check if player has visited a node
   */
  public hasVisited(nodeId: string): boolean {
    return this.visitedNodes.has(nodeId)
  }

  /**
   * Get all visited nodes
   */
  public getVisitedNodes(): Set<string> {
    return new Set(this.visitedNodes)
  }

  /**
   * Move to a specific node (instant teleport)
   */
  public teleportTo(nodeId: string, position: { x: number; y: number }): void {
    this.currentNodeId = nodeId
    this.currentPosition = { ...position }
    this.visitedNodes.add(nodeId)
    
    // Update visual position
    if (this.visual) {
      this.visual.position.x = this.currentPosition.x + this.config.markerOffset.x
      this.visual.position.y = this.currentPosition.y + this.config.markerOffset.y
    }
    
    // Trigger callback
    if (this.config.onNodeReached) {
      this.config.onNodeReached(nodeId)
    }
  }

  /**
   * Move to a node (with validation callback)
   * Returns true if move was successful
   */
  public moveTo(nodeId: string, position: { x: number; y: number }, isAllowed: boolean): boolean {
    if (!isAllowed) {
      if (this.config.onMovementBlocked) {
        this.config.onMovementBlocked(nodeId)
      }
      return false
    }
    
    this.teleportTo(nodeId, position)
    return true
  }

  /**
   * Set position without changing node (for animations, etc.)
   */
  public setPosition(x: number, y: number): void {
    this.currentPosition = { x, y }
    
    if (this.visual) {
      this.visual.position.x = x + this.config.markerOffset.x
      this.visual.position.y = y + this.config.markerOffset.y
    }
  }

  /**
   * Get the visual mesh (for external manipulation)
   */
  public getVisual(): THREE.Mesh | undefined {
    return this.visual
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.visual) {
      if (this.visual.geometry) {
        this.visual.geometry.dispose()
      }
      if (this.visual.material instanceof THREE.MeshBasicMaterial) {
        if (this.visual.material.map) {
          this.visual.material.map.dispose()
        }
        this.visual.material.dispose()
      }
      this.scene.remove(this.visual)
      this.visual = undefined
    }
  }
}
