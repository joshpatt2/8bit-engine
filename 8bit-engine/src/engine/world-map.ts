/**
 * World Map System
 * SMB3-style overworld map with nodes, paths, and player navigation
 * 
 * Features:
 * - Nodes represent levels, shops, bonus stages, etc.
 * - Paths connect nodes in a directed graph
 * - Player marker that moves along paths
 * - Lock/unlock progression system
 * - Visual representation with Three.js
 */

import * as THREE from 'three'
import { NES_PALETTE } from './palette'
import { Input } from './input'

// =============================================================================
// NODE TYPES
// =============================================================================

export type NodeType = 
  | 'level'      // Standard level
  | 'boss'       // Boss level
  | 'bonus'      // Bonus/mini-game
  | 'shop'       // Item shop
  | 'castle'     // Castle/fortress
  | 'start'      // Starting position
  | 'goal'       // Final goal

export type NodeStatus = 
  | 'locked'     // Cannot access yet
  | 'unlocked'   // Can access
  | 'complete'   // Already completed

// =============================================================================
// MAP NODE
// =============================================================================

export interface MapNode {
  /** Unique identifier for this node */
  id: string
  
  /** Display name */
  name: string
  
  /** Type of node */
  type: NodeType
  
  /** Current status */
  status: NodeStatus
  
  /** Position on the map */
  position: { x: number; y: number }
  
  /** IDs of nodes this connects to */
  connections: string[]
  
  /** Optional: Custom color for this node */
  color?: number
  
  /** Optional: Callback when node is selected */
  onSelect?: () => void
  
  /** Optional: Custom data for game-specific logic */
  data?: Record<string, unknown>
}

// =============================================================================
// WORLD MAP CONFIGURATION
// =============================================================================

export interface WorldMapConfig {
  /** All nodes on the map */
  nodes: MapNode[]
  
  /** Starting node ID where player begins */
  startNodeId: string
  
  /** Map background color */
  backgroundColor?: number
  
  /** Path line color */
  pathColor?: number
  
  /** Player marker color */
  playerColor?: number
  
  /** Should paths be visible before unlocked? */
  showLockedPaths?: boolean
}

// =============================================================================
// WORLD MAP CLASS
// =============================================================================

export class WorldMap {
  private config: WorldMapConfig
  private nodes: Map<string, MapNode>
  private currentNodeId: string
  private playerPosition: { x: number; y: number }
  
  // Three.js objects
  private scene: THREE.Scene
  private nodeObjects: Map<string, THREE.Group> = new Map()
  private pathObjects: THREE.Line[] = []
  private playerMarker?: THREE.Mesh
  
  // Navigation
  private availableDirections: Set<string> = new Set()
  private moveTimer: number = 0

  constructor(scene: THREE.Scene, config: WorldMapConfig) {
    this.scene = scene
    this.config = config
    this.nodes = new Map(config.nodes.map(n => [n.id, n]))
    
    // Find start node
    const startNode = this.nodes.get(config.startNodeId)
    if (!startNode) {
      throw new Error(`Start node "${config.startNodeId}" not found`)
    }
    
    this.currentNodeId = startNode.id
    this.playerPosition = { ...startNode.position }
    
    this.initialize()
  }

  /**
   * Initialize the map visuals
   */
  private initialize(): void {
    this.createPaths()
    this.createNodes()
    this.createPlayerMarker()
    this.updateAvailableDirections()
  }

  /**
   * Create path lines between connected nodes
   */
  private createPaths(): void {
    const pathColor = this.config.pathColor || NES_PALETTE.BROWN
    
    this.nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = this.nodes.get(targetId)
        if (!targetNode) return
        
        // Don't show locked paths if configured
        if (!this.config.showLockedPaths && targetNode.status === 'locked') {
          return
        }
        
        // Create path line
        const points = []
        points.push(new THREE.Vector3(node.position.x, node.position.y, -0.5))
        points.push(new THREE.Vector3(targetNode.position.x, targetNode.position.y, -0.5))
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: pathColor })
        const line = new THREE.Line(geometry, material)
        
        this.scene.add(line)
        this.pathObjects.push(line)
      })
    })
  }

  /**
   * Create visual representation of nodes
   */
  private createNodes(): void {
    this.nodes.forEach(node => {
      const nodeGroup = new THREE.Group()
      
      // Node color based on type and status
      let color = node.color || this.getNodeColor(node.type)
      if (node.status === 'locked') {
        color = NES_PALETTE.DARK_GRAY
      } else if (node.status === 'complete') {
        color = NES_PALETTE.LIGHT_GREEN
      }
      
      // Node shape (varies by type)
      const geometry = this.getNodeGeometry(node.type)
      const material = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(geometry, material)
      nodeGroup.add(mesh)
      
      // Completion indicator for completed nodes
      if (node.status === 'complete') {
        const checkGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1)
        const checkMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
        const check = new THREE.Mesh(checkGeo, checkMat)
        check.position.set(0, 0, 0.2)
        nodeGroup.add(check)
      }
      
      // Position the node group
      nodeGroup.position.set(node.position.x, node.position.y, 0)
      
      this.scene.add(nodeGroup)
      this.nodeObjects.set(node.id, nodeGroup)
    })
  }

  /**
   * Get default color for node type
   */
  private getNodeColor(type: NodeType): number {
    switch (type) {
      case 'level': return NES_PALETTE.GREEN
      case 'boss': return NES_PALETTE.RED
      case 'bonus': return NES_PALETTE.YELLOW
      case 'shop': return NES_PALETTE.CYAN
      case 'castle': return NES_PALETTE.PURPLE
      case 'start': return NES_PALETTE.BLUE
      case 'goal': return NES_PALETTE.YELLOW
      default: return NES_PALETTE.WHITE
    }
  }

  /**
   * Get geometry shape for node type
   */
  private getNodeGeometry(type: NodeType): THREE.BufferGeometry {
    switch (type) {
      case 'boss':
      case 'castle':
        return new THREE.BoxGeometry(1.5, 1.5, 0.5)
      case 'bonus':
        return new THREE.BoxGeometry(0.8, 0.8, 0.5)
      default:
        return new THREE.BoxGeometry(1.2, 1.2, 0.5)
    }
  }

  /**
   * Create player marker
   */
  private createPlayerMarker(): void {
    // Load corgi texture for player sprite
    const textureLoader = new THREE.TextureLoader()
    
    textureLoader.load(
      '/src/game/sprites/player/corgi.png',
      (texture) => {
        // Configure texture for pixel-perfect rendering
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        
        // Create sprite with corgi texture
        const geometry = new THREE.PlaneGeometry(1.5, 1.5)
        const material = new THREE.MeshBasicMaterial({ 
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        })
        
        this.playerMarker = new THREE.Mesh(geometry, material)
        this.playerMarker.position.set(
          this.playerPosition.x,
          this.playerPosition.y + 0.7,
          0.5
        )
        
        this.scene.add(this.playerMarker)
      },
      undefined,
      (error) => {
        console.error('Error loading corgi texture:', error)
        // Fallback to colored box if texture fails to load
        this.createFallbackPlayerMarker()
      }
    )
  }

  /**
   * Create fallback player marker (colored box)
   */
  private createFallbackPlayerMarker(): void {
    const color = this.config.playerColor || NES_PALETTE.RED
    const geometry = new THREE.BoxGeometry(0.6, 0.8, 0.6)
    const material = new THREE.MeshBasicMaterial({ color })
    
    this.playerMarker = new THREE.Mesh(geometry, material)
    this.playerMarker.position.set(
      this.playerPosition.x,
      this.playerPosition.y + 0.7,
      0.5
    )
    
    this.scene.add(this.playerMarker)
  }

  /**
   * Update which directions the player can move
   */
  private updateAvailableDirections(): void {
    this.availableDirections.clear()
    
    const currentNode = this.nodes.get(this.currentNodeId)
    if (!currentNode) return
    
    // Can move to any unlocked connected node
    currentNode.connections.forEach(targetId => {
      const targetNode = this.nodes.get(targetId)
      if (targetNode && targetNode.status !== 'locked') {
        this.availableDirections.add(targetId)
      }
    })
  }

  /**
   * Try to move to an adjacent node
   */
  public moveToNode(targetNodeId: string): boolean {
    if (!this.availableDirections.has(targetNodeId)) {
      return false
    }
    
    this.currentNodeId = targetNodeId
    const node = this.nodes.get(targetNodeId)!
    this.playerPosition = { ...node.position }
    this.updateAvailableDirections()
    
    return true
  }

  /**
   * Find the closest available node in a direction
   */
  public findNodeInDirection(direction: 'up' | 'down' | 'left' | 'right'): string | null {
    const currentNode = this.nodes.get(this.currentNodeId)
    if (!currentNode) return null
    
    let bestNode: string | null = null
    let bestDistance = Infinity
    
    this.availableDirections.forEach(nodeId => {
      const node = this.nodes.get(nodeId)!
      const dx = node.position.x - currentNode.position.x
      const dy = node.position.y - currentNode.position.y
      
      // Check if node is in the desired direction (more lenient)
      let isInDirection = false
      switch (direction) {
        case 'up': isInDirection = dy > 0 && Math.abs(dx) <= Math.abs(dy); break
        case 'down': isInDirection = dy < 0 && Math.abs(dx) <= Math.abs(dy); break
        case 'left': isInDirection = dx < 0 && Math.abs(dy) <= Math.abs(dx); break
        case 'right': isInDirection = dx > 0 && Math.abs(dy) <= Math.abs(dx); break
      }
      
      if (isInDirection) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < bestDistance) {
          bestDistance = distance
          bestNode = node.id
        }
      }
    })
    
    return bestNode
  }

  /**
   * Update the map (animate player, etc.)
   */
  public update(deltaTime: number, input: Input): void {
    this.moveTimer += deltaTime
    
    // Animate player marker (bounce)
    if (this.playerMarker) {
      const currentNode = this.nodes.get(this.currentNodeId)
      if (currentNode) {
        this.playerMarker.position.x = currentNode.position.x
        this.playerMarker.position.y = currentNode.position.y + 0.7 + Math.sin(this.moveTimer * 5) * 0.05
      }
    }
    
    // Highlight current node
    this.nodeObjects.forEach((obj, id) => {
      if (id === this.currentNodeId) {
        obj.scale.setScalar(1 + Math.sin(this.moveTimer * 4) * 0.1)
      } else {
        obj.scale.setScalar(1)
      }
    })
    
    // Handle input for navigation
    if (input.justPressed('up')) {
      const targetId = this.findNodeInDirection('up')
      if (targetId) this.moveToNode(targetId)
    }
    if (input.justPressed('down')) {
      const targetId = this.findNodeInDirection('down')
      if (targetId) this.moveToNode(targetId)
    }
    if (input.justPressed('left')) {
      const targetId = this.findNodeInDirection('left')
      if (targetId) this.moveToNode(targetId)
    }
    if (input.justPressed('right')) {
      const targetId = this.findNodeInDirection('right')
      if (targetId) this.moveToNode(targetId)
    }
  }

  /**
   * Get current node
   */
  public getCurrentNode(): MapNode | undefined {
    return this.nodes.get(this.currentNodeId)
  }

  /**
   * Unlock a node
   */
  public unlockNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (node && node.status === 'locked') {
      node.status = 'unlocked'
      this.updateNodeVisual(nodeId)
      this.updateAvailableDirections()
    }
  }

  /**
   * Mark a node as complete
   */
  public completeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.status = 'complete'
      this.updateNodeVisual(nodeId)
    }
  }

  /**
   * Update visual representation of a node
   */
  private updateNodeVisual(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    const nodeObj = this.nodeObjects.get(nodeId)
    if (!node || !nodeObj) return
    
    // Remove old visual
    this.scene.remove(nodeObj)
    this.nodeObjects.delete(nodeId)
    
    // Recreate with new status
    const tempNodes = this.nodes
    this.nodes = new Map([[nodeId, node]])
    this.createNodes()
    this.nodes = tempNodes
  }

  /**
   * Clean up all map objects
   */
  public destroy(): void {
    this.nodeObjects.forEach(obj => this.scene.remove(obj))
    this.pathObjects.forEach(obj => this.scene.remove(obj))
    if (this.playerMarker) this.scene.remove(this.playerMarker)
    
    this.nodeObjects.clear()
    this.pathObjects = []
  }
}
