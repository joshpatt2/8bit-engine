/**
 * Map Screen
 * Displays the world map where player navigates between levels
 */

import {
  BaseScreen,
  WorldMap,
  type WorldMapConfig,
  type MapNode,
  NES_PALETTE,
  createLabel
} from '../engine'

export class MapScreen extends BaseScreen {
  private worldMap?: WorldMap
  private levelNameLabel?: ReturnType<typeof createLabel>

  onEnter(): void {
    this.setBackground(NES_PALETTE.DARK_BLUE)
    this.addAmbientLight()
    
    // Create example world map
    const mapConfig: WorldMapConfig = {
      nodes: this.createExampleNodes(),
      startNodeId: 'start',
      backgroundColor: NES_PALETTE.DARK_BLUE,
      pathColor: NES_PALETTE.BROWN,
      showLockedPaths: true
    }
    
    // WorldMap needs THREE.Scene - use escape hatch
    const threeScene = this.renderer.getThreeScene()
    this.worldMap = new WorldMap(threeScene, mapConfig)
    
    // Create UI label to show current node name
    this.levelNameLabel = createLabel({
      text: 'WORLD 1',
      color: NES_PALETTE.WHITE,
      scale: 0.16
    })
    this.levelNameLabel.setPosition(0, 110, 10)
    this.addToScene(this.levelNameLabel.group)
    
    // Position camera to see the whole map
    const camera = this.renderer.getCamera()
    camera.position.set(0, 0, 20)
  }

  /**
   * Create example nodes for demo purposes
   */
  private createExampleNodes(): MapNode[] {
    return [
      {
        id: 'start',
        name: 'START',
        type: 'start',
        status: 'complete',
        position: { x: -40, y: -20 },
        connections: ['level1']
      },
      {
        id: 'level1',
        name: 'LEVEL 1-1',
        type: 'level',
        status: 'unlocked',
        position: { x: -20, y: -20 },
        connections: ['level2', 'bonus1']
      },
      {
        id: 'bonus1',
        name: 'BONUS HOUSE',
        type: 'bonus',
        status: 'unlocked',
        position: { x: -20, y: 0 },
        connections: ['level2']
      },
      {
        id: 'level2',
        name: 'LEVEL 1-2',
        type: 'level',
        status: 'locked',
        position: { x: 0, y: -20 },
        connections: ['level3']
      },
      {
        id: 'level3',
        name: 'LEVEL 1-3',
        type: 'level',
        status: 'locked',
        position: { x: 20, y: -20 },
        connections: ['fortress']
      },
      {
        id: 'fortress',
        name: 'FORTRESS',
        type: 'castle',
        status: 'locked',
        position: { x: 40, y: -20 },
        connections: ['level4']
      },
      {
        id: 'level4',
        name: 'LEVEL 1-4',
        type: 'level',
        status: 'locked',
        position: { x: 40, y: 0 },
        connections: ['shop']
      },
      {
        id: 'shop',
        name: 'ITEM SHOP',
        type: 'shop',
        status: 'locked',
        position: { x: 40, y: 20 },
        connections: ['level5']
      },
      {
        id: 'level5',
        name: 'LEVEL 1-5',
        type: 'level',
        status: 'locked',
        position: { x: 20, y: 20 },
        connections: ['boss']
      },
      {
        id: 'boss',
        name: 'CASTLE',
        type: 'boss',
        status: 'locked',
        position: { x: 0, y: 20 },
        connections: []
      }
    ]
  }

  onUpdate(deltaTime: number): void {
    if (!this.worldMap) return
    
    this.worldMap.update(deltaTime, this.input)
    
    // Update level name label
    const currentNode = this.worldMap.getCurrentNode()
    if (currentNode && this.levelNameLabel) {
      this.levelNameLabel.setText?.(currentNode.name)
    }
    
    // Press Enter/Z to select current node
    if (this.input.justPressed('a') || this.input.justPressed('start')) {
      const currentNode = this.worldMap.getCurrentNode()
      if (currentNode) {
        this.handleNodeSelect(currentNode)
      }
    }
    
    // Press Escape/X to go back
    if (this.input.justPressed('b') || this.input.justPressed('select')) {
      this.handleBackToTitle()
    }
  }

  /**
   * Handle selecting a node on the map
   */
  private handleNodeSelect(node: MapNode): void {
    console.log('Selected node:', node.name, node.type)
    
    // Different actions based on node type
    switch (node.type) {
      case 'level':
      case 'boss':
        // TODO: Load level scene
        console.log('Loading level...')
        // After completing the level, unlock next nodes:
        // this.unlockNextNodes(node)
        break
        
      case 'bonus':
        console.log('Starting bonus game...')
        break
        
      case 'shop':
        console.log('Opening shop...')
        break
        
      case 'castle':
        console.log('Entering castle...')
        break
    }
    
    // For demo: unlock next nodes when selecting current node
    if (this.worldMap && node.status === 'unlocked') {
      this.worldMap.completeNode(node.id)
      node.connections.forEach(nodeId => {
        this.worldMap?.unlockNode(nodeId)
      })
    }
  }

  /**
   * Return to title screen
   */
  private handleBackToTitle(): void {
    console.log('Returning to title...')
    // TODO: Switch to title screen
    // this.screenManager.switchTo(new TitleScreen(...))
  }

  onExit(): void {
    this.worldMap?.destroy()
    this.levelNameLabel?.destroy()
  }
}
