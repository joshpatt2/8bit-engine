/**
 * Map Scene
 * World map with selectable levels using new WorldMap abstraction
 */

import * as THREE from 'three'
import type { Scene, SceneType } from './scenes'
import { SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'
import { WorldMap, type WorldMapConfig, type MapNode } from '../engine/world-map'
import { createLabel } from '../engine/ui-components'

export interface LevelStatus {
  level1: 'locked' | 'unlocked' | 'complete'
  level2: 'locked' | 'unlocked' | 'complete'
  level3: 'locked' | 'unlocked' | 'complete'
}

export function createMapScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager,
  levelStatus: LevelStatus
): Scene {
  let worldMap: WorldMap | undefined
  let levelNameLabel: ReturnType<typeof createLabel> | undefined

  return {
    name: 'map' as SceneType,

    enter() {
      while (threeScene.children.length > 0) {
        const obj = threeScene.children[0]
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose())
            } else {
              obj.material.dispose()
            }
          }
        }
        threeScene.remove(obj)
      }

      // Green background (like SMB3 world map)
      threeScene.background = new THREE.Color(NES_PALETTE.LIME)

      const light = new THREE.AmbientLight(0xffffff, 1)
      threeScene.add(light)

      // Ground texture (grass tiles in checkered pattern)
      for (let x = -8; x <= 8; x += 2) {
        for (let y = -6; y <= 6; y += 2) {
          const tileGeo = new THREE.PlaneGeometry(1.8, 1.8)
          const shade = ((x + y) % 4 === 0) ? NES_PALETTE.GREEN : NES_PALETTE.LIME
          const tileMat = new THREE.MeshBasicMaterial({ color: shade })
          const tile = new THREE.Mesh(tileGeo, tileMat)
          tile.position.set(x, y, -0.1)
          threeScene.add(tile)
        }
      }

      const nodes: MapNode[] = [
        {
          id: 'start',
          name: 'START',
          type: 'start',
          status: 'complete',
          position: { x: -4, y: -2 },
          connections: ['level1']
        },
        {
          id: 'level1',
          name: 'LEVEL 1: PLAINS',
          type: 'level',
          status: 'unlocked',  // Always start unlocked
          position: { x: -1, y: 1 },
          connections: ['level2'],
          color: NES_PALETTE.BLUE,
          onSelect: () => {
            sceneManager.switchTo('level1')
          }
        },
        {
          id: 'level2',
          name: 'LEVEL 2: CAVE',
          type: 'level',
          status: levelStatus.level2,
          position: { x: 2, y: -1 },
          connections: ['level3'],
          color: NES_PALETTE.PURPLE,
          onSelect: () => {
            sceneManager.switchTo('level2')
          }
        },
        {
          id: 'level3',
          name: 'LEVEL 3: CASTLE',
          type: 'boss',
          status: levelStatus.level3,
          position: { x: 5, y: 1 },
          connections: [],
          color: NES_PALETTE.GRAY,
          onSelect: () => {
            sceneManager.switchTo('level3')
          }
        }
      ]

      const mapConfig: WorldMapConfig = {
        nodes,
        startNodeId: 'start',
        backgroundColor: NES_PALETTE.LIME,
        pathColor: NES_PALETTE.TAN,
        showLockedPaths: true,
        player: {
          startNodeId: 'start',
          sprite: '/src/game/sprites/player/corgi_4x4_left_ear_anim.png',
          color: NES_PALETTE.RED,
          spriteLayout: { cols: 2, rows: 2 }
        }
      }

      worldMap = new WorldMap(threeScene, mapConfig)

      // Draw dotted paths between levels
      const levelPositions = [
        { x: -4, y: -2 },  // Start
        { x: -1, y: 1 },   // Level 1
        { x: 2, y: -1 },   // Level 2
        { x: 5, y: 1 },    // Level 3
      ]
      
      for (let i = 0; i < levelPositions.length - 1; i++) {
        const start = levelPositions[i]
        const end = levelPositions[i + 1]

        // Create dotted path with small segments
        const segments = 8
        for (let s = 0; s < segments; s++) {
          const t = s / segments
          const x = start.x + (end.x - start.x) * t
          const y = start.y + (end.y - start.y) * t

          const dotGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1)
          const dotMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.TAN })
          const dot = new THREE.Mesh(dotGeo, dotMat)
          dot.position.set(x, y, 0)
          threeScene.add(dot)
        }
      }

      // Add palm tree decorations
      const treePositions = [
        { x: -6, y: 3 }, { x: 6, y: 2 }, { x: -2, y: -3 },
        { x: 5, y: -4 }, { x: -5, y: -1 }
      ]
      treePositions.forEach(pos => {
        // Tree trunk
        const trunkGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3)
        const trunkMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.BROWN })
        const trunk = new THREE.Mesh(trunkGeo, trunkMat)
        trunk.position.set(pos.x, pos.y - 0.2, 0)
        threeScene.add(trunk)

        // Tree top (palm fronds)
        const topGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
        const topMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_GREEN })
        const top = new THREE.Mesh(topGeo, topMat)
        top.position.set(pos.x, pos.y + 0.4, 0)
        threeScene.add(top)
      })

      // Level name label (bottom of screen)
      levelNameLabel = createLabel({
        text: 'WORLD MAP',
        color: NES_PALETTE.WHITE,
        scale: 0.12
      })
      levelNameLabel.setPosition(0, -5.5, 10)
      threeScene.add(levelNameLabel.group)

      // Reset camera to default position
      camera.position.set(0, 0, 10)
    },

    exit() {
      worldMap?.destroy()
      levelNameLabel?.destroy()
    },

    update(dt: number) {
      if (!worldMap) return

      worldMap.update(dt, input)

      const currentNode = worldMap.getCurrentNode()
      if (currentNode && levelNameLabel) {
        levelNameLabel.setText(currentNode.name)
      }

      if (input.justPressed('a') || input.justPressed('start')) {
        const currentNode = worldMap.getCurrentNode()
        if (currentNode && currentNode.status === 'unlocked') {
          if (currentNode.onSelect) {
            currentNode.onSelect()
          }
        }
      }

      if (input.justPressed('b')) {
        sceneManager.switchTo('title')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    }
  }
}
