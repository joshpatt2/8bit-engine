# World Map System

A reusable abstraction for creating SMB3-style overworld maps with nodes and paths.

## Features

- **Graph-based navigation**: Nodes connected by paths in a directed graph
- **Node types**: Levels, bosses, bonus stages, shops, castles, etc.
- **Lock/unlock progression**: Nodes start locked and unlock as player progresses
- **Visual representation**: Auto-generated 3D meshes for nodes and paths
- **Smart navigation**: Arrow key movement finds closest node in each direction
- **Completion tracking**: Mark nodes as complete with visual indicators
- **Animated player marker**: Bouncing player sprite shows current position

## Usage

### 1. Define Your Map Nodes

```typescript
import type { MapNode } from './engine'

const nodes: MapNode[] = [
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
    connections: ['level2']
  },
  {
    id: 'level2',
    name: 'LEVEL 1-2',
    type: 'level',
    status: 'locked',
    position: { x: 0, y: -20 },
    connections: ['boss']
  },
  {
    id: 'boss',
    name: 'CASTLE',
    type: 'boss',
    status: 'locked',
    position: { x: 20, y: -20 },
    connections: []
  }
]
```

### 2. Create WorldMap Instance

```typescript
import { WorldMap, type WorldMapConfig } from './engine'

const mapConfig: WorldMapConfig = {
  nodes: nodes,
  startNodeId: 'start',
  backgroundColor: NES_PALETTE.DARK_BLUE,
  pathColor: NES_PALETTE.BROWN,
  playerColor: NES_PALETTE.RED,
  showLockedPaths: true
}

const worldMap = new WorldMap(scene, mapConfig)
```

### 3. Update in Game Loop

```typescript
function update(deltaTime: number) {
  worldMap.update(deltaTime, input)
  
  // Get current node
  const currentNode = worldMap.getCurrentNode()
  
  // Handle node selection
  if (input.justPressed('a')) {
    if (currentNode) {
      console.log('Selected:', currentNode.name)
      
      // Complete and unlock next nodes
      worldMap.completeNode(currentNode.id)
      currentNode.connections.forEach(nodeId => {
        worldMap.unlockNode(nodeId)
      })
    }
  }
}
```

## Node Types

- **`level`** - Standard level (green cube)
- **`boss`** - Boss level (large red cube)
- **`bonus`** - Bonus/mini-game (small yellow cube)
- **`shop`** - Item shop (cyan cube)
- **`castle`** - Castle/fortress (large purple cube)
- **`start`** - Starting position (blue cube)
- **`goal`** - Final goal (yellow cube)

## Node Status

- **`locked`** - Cannot access yet (dark gray)
- **`unlocked`** - Can access (type-specific color)
- **`complete`** - Already completed (light green with yellow checkmark)

## API Reference

### WorldMap Methods

#### `update(deltaTime: number, input: Input): void`
Update map animations and handle input navigation.

#### `getCurrentNode(): MapNode | undefined`
Get the node where the player is currently located.

#### `unlockNode(nodeId: string): void`
Unlock a previously locked node.

#### `completeNode(nodeId: string): void`
Mark a node as complete (shows checkmark, changes color).

#### `moveToNode(targetNodeId: string): boolean`
Programmatically move player to a specific node. Returns false if node is locked or not adjacent.

#### `findNodeInDirection(direction: 'up' | 'down' | 'left' | 'right'): string | null`
Find the closest unlocked node in the given direction.

#### `destroy(): void`
Clean up all map objects from the scene.

## Example Screen Implementation

See `/src/game/map-screen.ts` for a complete example using the Screen system.

## Demo

Run the world map demo:
```bash
npm run dev
```

Navigate with arrow keys, press Z/Enter to select nodes and unlock the next ones!
