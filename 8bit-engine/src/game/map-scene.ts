/**
 * Map Scene
 * World map with 3 selectable levels (SMB3-style)
 */

import * as THREE from 'three'
import type { Scene, SceneType } from './scenes'
import { SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'

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
  _levelStatus: LevelStatus
): Scene {
  let playerMarker: THREE.Mesh
  let levelNodes: THREE.Mesh[] = []
  let pathSegments: THREE.Mesh[] = []
  let currentSelection = 0
  let moveTimer = 0

  const levelPositions = [
    { x: -4, y: -2 },  // Level 1: Plains
    { x: 0, y: 1 },    // Level 2: Cave
    { x: 4, y: -1 },   // Level 3: Castle
  ]

  const levelColors = [
    NES_PALETTE.GREEN,   // Plains
    NES_PALETTE.PURPLE,  // Cave
    NES_PALETTE.GRAY,    // Castle
  ]

  return {
    name: 'map' as SceneType,

    enter() {
      // Clear scene
      while (threeScene.children.length > 0) {
        threeScene.remove(threeScene.children[0])
      }

      levelNodes = []
      pathSegments = []

      // Green background (like SMB3 world map)
      threeScene.background = new THREE.Color(NES_PALETTE.LIME)

      // Ambient light
      const light = new THREE.AmbientLight(0xffffff, 1)
      threeScene.add(light)

      // Ground texture (grass tiles)
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

      // Draw paths between levels
      for (let i = 0; i < levelPositions.length - 1; i++) {
        const start = levelPositions[i]
        const end = levelPositions[i + 1]

        // Simple path segments
        const segments = 5
        for (let s = 0; s < segments; s++) {
          const t = s / segments
          const x = start.x + (end.x - start.x) * t
          const y = start.y + (end.y - start.y) * t

          const dotGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1)
          const dotMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.TAN })
          const dot = new THREE.Mesh(dotGeo, dotMat)
          dot.position.set(x, y, 0)
          threeScene.add(dot)
          pathSegments.push(dot)
        }
      }

      // Create level nodes
      levelPositions.forEach((pos, i) => {
        const nodeGeo = new THREE.BoxGeometry(1.2, 1.2, 0.5)
        const nodeMat = new THREE.MeshBasicMaterial({ color: levelColors[i] })
        const node = new THREE.Mesh(nodeGeo, nodeMat)
        node.position.set(pos.x, pos.y, 0)
        threeScene.add(node)
        levelNodes.push(node)

        // Add level number indicator
        const numGeo = new THREE.BoxGeometry(0.4, 0.4, 0.3)
        const numMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
        const num = new THREE.Mesh(numGeo, numMat)
        num.position.set(pos.x, pos.y + 0.8, 0.2)
        threeScene.add(num)
      })

      // Player marker (like Mario on world map)
      const markerGeo = new THREE.BoxGeometry(0.6, 0.8, 0.6)
      const markerMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.RED })
      playerMarker = new THREE.Mesh(markerGeo, markerMat)
      playerMarker.position.set(levelPositions[0].x, levelPositions[0].y + 0.5, 0.3)
      threeScene.add(playerMarker)

      // Decorations - trees
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

        // Tree top
        const topGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
        const topMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_GREEN })
        const top = new THREE.Mesh(topGeo, topMat)
        top.position.set(pos.x, pos.y + 0.4, 0)
        threeScene.add(top)
      })

      currentSelection = 0
      moveTimer = 0
    },

    exit() {
      levelNodes = []
      pathSegments = []
    },

    update(dt: number) {
      moveTimer += dt

      // Navigate between levels
      if (input.justPressed('right') && currentSelection < 2) {
        currentSelection++
      }
      if (input.justPressed('left') && currentSelection > 0) {
        currentSelection--
      }

      // Move player marker to selected level
      const targetPos = levelPositions[currentSelection]
      playerMarker.position.x += (targetPos.x - playerMarker.position.x) * 0.2
      playerMarker.position.y += (targetPos.y + 0.5 - playerMarker.position.y) * 0.2

      // Bounce player marker
      playerMarker.position.y += Math.sin(moveTimer * 5) * 0.05

      // Highlight selected level
      levelNodes.forEach((node, i) => {
        if (i === currentSelection) {
          node.scale.setScalar(1 + Math.sin(moveTimer * 4) * 0.1)
        } else {
          node.scale.setScalar(1)
        }
      })

      // Enter level
      if (input.justPressed('a') || input.justPressed('start')) {
        const levelName = `level${currentSelection + 1}` as SceneType
        sceneManager.switchTo(levelName)
      }

      // Back to title
      if (input.justPressed('b')) {
        sceneManager.switchTo('title')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
