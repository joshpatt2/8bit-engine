/**
 * WorldMap System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { WorldMap, type WorldMapConfig, type MapNode } from '../engine/world-map'
import { Input } from '../engine/input'

describe('WorldMap', () => {
  let scene: THREE.Scene
  let input: Input
  let worldMap: WorldMap

  const createTestNodes = (): MapNode[] => [
    {
      id: 'start',
      name: 'START',
      type: 'start',
      status: 'complete',
      position: { x: 0, y: 0 },
      connections: ['level1']
    },
    {
      id: 'level1',
      name: 'LEVEL 1',
      type: 'level',
      status: 'unlocked',
      position: { x: 10, y: 0 },
      connections: ['level2']
    },
    {
      id: 'level2',
      name: 'LEVEL 2',
      type: 'level',
      status: 'locked',
      position: { x: 20, y: 0 },
      connections: []
    }
  ]

  beforeEach(() => {
    scene = new THREE.Scene()
    input = new Input()
  })

  describe('Construction', () => {
    it('should create a world map with nodes', () => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }

      worldMap = new WorldMap(scene, config)
      expect(worldMap).toBeDefined()
      expect(worldMap.getPlayer()).toBeDefined()
    })

    it('should throw error if start node not found', () => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'invalid'
      }

      expect(() => new WorldMap(scene, config)).toThrow()
    })

    it('should start at the specified node when player provided', () => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }

      worldMap = new WorldMap(scene, config)
      const currentNode = worldMap.getCurrentNode()
      
      expect(currentNode?.id).toBe('start')
    })
    
    it('should return undefined current node when no player', () => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start'
      }

      worldMap = new WorldMap(scene, config)
      const currentNode = worldMap.getCurrentNode()
      
      expect(currentNode).toBeUndefined()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }
      worldMap = new WorldMap(scene, config)
    })

    it('should move to adjacent unlocked node', () => {
      const moved = worldMap.moveToNode('level1')
      expect(moved).toBe(true)
      expect(worldMap.getCurrentNode()?.id).toBe('level1')
    })

    it('should not move to locked node', () => {
      const moved = worldMap.moveToNode('level2')
      expect(moved).toBe(false)
      expect(worldMap.getCurrentNode()?.id).toBe('start')
    })

    it('should not move to non-adjacent node', () => {
      // level2 is not connected to start
      const moved = worldMap.moveToNode('level2')
      expect(moved).toBe(false)
    })

    it('should find node in right direction', () => {
      // level1 is at (10, 0), start is at (0, 0)
      // level1 should be found when pressing right
      const nodeId = worldMap.findNodeInDirection('right')
      expect(nodeId).toBe('level1')
    })

    it('should return null when no node in direction', () => {
      const nodeId = worldMap.findNodeInDirection('left')
      expect(nodeId).toBeNull()
    })
  })

  describe('Node Status', () => {
    beforeEach(() => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }
      worldMap = new WorldMap(scene, config)
    })

    it('should unlock a locked node', () => {
      worldMap.unlockNode('level2')
      
      // Move to level1 first
      worldMap.moveToNode('level1')
      
      // Now should be able to move to level2
      const moved = worldMap.moveToNode('level2')
      expect(moved).toBe(true)
    })

    it('should mark node as complete', () => {
      worldMap.completeNode('level1')
      
      // Note: We can't directly check the node status from outside,
      // but we can verify it doesn't throw
      expect(() => worldMap.completeNode('level1')).not.toThrow()
    })

    it('should not unlock already unlocked node', () => {
      // level1 is already unlocked
      expect(() => worldMap.unlockNode('level1')).not.toThrow()
    })
  })

  describe('Update', () => {
    beforeEach(() => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }
      worldMap = new WorldMap(scene, config)
    })

    it('should update without errors', () => {
      expect(() => worldMap.update(0.016, input)).not.toThrow()
    })

    it('should handle navigation input', () => {
      // Simulate pressing right arrow
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      window.dispatchEvent(event)

      worldMap.update(0.016, input)
      input.update()

      // Should have moved to level1
      expect(worldMap.getCurrentNode()?.id).toBe('level1')
    })
  })

  describe('Cleanup', () => {
    it('should destroy and clean up scene objects', () => {
      const config: WorldMapConfig = {
        nodes: createTestNodes(),
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }

      worldMap = new WorldMap(scene, config)
      const initialChildCount = scene.children.length

      expect(initialChildCount).toBeGreaterThan(0)

      worldMap.destroy()

      // Scene should have fewer children after destroy
      expect(scene.children.length).toBeLessThan(initialChildCount)
    })
  })

  describe('Complex Navigation', () => {
    it('should handle branching paths', () => {
      const nodes: MapNode[] = [
        {
          id: 'start',
          name: 'START',
          type: 'start',
          status: 'complete',
          position: { x: 0, y: 0 },
          connections: ['level1', 'bonus1']
        },
        {
          id: 'level1',
          name: 'LEVEL 1',
          type: 'level',
          status: 'unlocked',
          position: { x: 10, y: 0 },
          connections: []
        },
        {
          id: 'bonus1',
          name: 'BONUS',
          type: 'bonus',
          status: 'unlocked',
          position: { x: 0, y: 10 },
          connections: []
        }
      ]

      const config: WorldMapConfig = {
        nodes,
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }

      worldMap = new WorldMap(scene, config)

      // Should be able to reach both level1 and bonus1
      const rightNode = worldMap.findNodeInDirection('right')
      const upNode = worldMap.findNodeInDirection('up')

      expect(rightNode).toBe('level1')
      expect(upNode).toBe('bonus1')
    })

    it('should handle diagonal nodes', () => {
      const nodes: MapNode[] = [
        {
          id: 'start',
          name: 'START',
          type: 'start',
          status: 'complete',
          position: { x: 0, y: 0 },
          connections: ['diagonal']
        },
        {
          id: 'diagonal',
          name: 'DIAGONAL',
          type: 'level',
          status: 'unlocked',
          position: { x: 10, y: 10 },
          connections: []
        }
      ]

      const config: WorldMapConfig = {
        nodes,
        startNodeId: 'start',
        player: {
          startNodeId: 'start',
          sprite: null
        }
      }

      worldMap = new WorldMap(scene, config)

      // Diagonal node should be reachable from both up and right
      const rightNode = worldMap.findNodeInDirection('right')
      const upNode = worldMap.findNodeInDirection('up')

      expect(rightNode).toBe('diagonal')
      expect(upNode).toBe('diagonal')
    })
  })
})
