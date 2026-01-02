/**
 * Road Scene
 * Wander the endless Idaho roads as Mike
 */

import * as THREE from 'three'
import { Scene, SceneType, SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'

export function createRoadScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  let playerX = 0
  let playerY = -2
  let playerMesh: THREE.Mesh
  let roadOffset = 0
  let dreamTimer = 0
  const roadLines: THREE.Mesh[] = []

  return {
    name: 'road' as SceneType,

    enter() {
      // Clear scene
      while (threeScene.children.length > 0) {
        threeScene.remove(threeScene.children[0])
      }

      // Idaho sky - blue with hints of warmth
      threeScene.background = new THREE.Color(NES_PALETTE.SKY_BLUE)

      // Ambient light
      const light = new THREE.AmbientLight(0xffffff, 1)
      threeScene.add(light)

      // Ground - wheat fields on both sides
      const leftFieldGeo = new THREE.PlaneGeometry(10, 12)
      const fieldMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.TAN })
      const leftField = new THREE.Mesh(leftFieldGeo, fieldMat)
      leftField.position.set(-7, 0, -1)
      threeScene.add(leftField)

      const rightField = new THREE.Mesh(leftFieldGeo, fieldMat)
      rightField.position.set(7, 0, -1)
      threeScene.add(rightField)

      // The Road
      const roadGeo = new THREE.PlaneGeometry(4, 14)
      const roadMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.GRAY })
      const road = new THREE.Mesh(roadGeo, roadMat)
      road.position.set(0, 0, 0)
      threeScene.add(road)

      // Road edge lines
      const edgeGeo = new THREE.PlaneGeometry(0.1, 14)
      const edgeMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
      const leftEdge = new THREE.Mesh(edgeGeo, edgeMat)
      leftEdge.position.set(-1.9, 0, 0.05)
      threeScene.add(leftEdge)
      const rightEdge = new THREE.Mesh(edgeGeo, edgeMat)
      rightEdge.position.set(1.9, 0, 0.05)
      threeScene.add(rightEdge)

      // Dashed center lines
      for (let i = 0; i < 8; i++) {
        const lineGeo = new THREE.PlaneGeometry(0.15, 0.8)
        const lineMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
        const line = new THREE.Mesh(lineGeo, lineMat)
        line.position.set(0, -6 + i * 1.8, 0.05)
        threeScene.add(line)
        roadLines.push(line)
      }

      // Mountains in distance
      const mountainGeo = new THREE.ConeGeometry(3, 4, 4)
      const mountainMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.PURPLE })
      const mountain1 = new THREE.Mesh(mountainGeo, mountainMat)
      mountain1.position.set(-4, 5, -2)
      threeScene.add(mountain1)

      const mountain2 = new THREE.Mesh(mountainGeo, mountainMat)
      mountain2.position.set(4, 4.5, -2)
      threeScene.add(mountain2)

      // Player (Mike) - simple character
      const bodyGeo = new THREE.BoxGeometry(0.6, 1, 0.3)
      const bodyMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_BLUE })
      playerMesh = new THREE.Mesh(bodyGeo, bodyMat)
      playerMesh.position.set(playerX, playerY, 1)
      threeScene.add(playerMesh)

      // Player head
      const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.3)
      const headMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.PEACH })
      const head = new THREE.Mesh(headGeo, headMat)
      head.position.set(0, 0.7, 0)
      playerMesh.add(head)

      // Player hair
      const hairGeo = new THREE.BoxGeometry(0.45, 0.2, 0.35)
      const hairMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.BROWN })
      const hair = new THREE.Mesh(hairGeo, hairMat)
      hair.position.set(0, 0.9, 0)
      playerMesh.add(hair)

      dreamTimer = 0
    },

    exit() {
      roadLines.length = 0
    },

    update(dt: number) {
      // Player movement
      const speed = 3
      if (input.isPressed('left')) {
        playerX -= speed * dt
      }
      if (input.isPressed('right')) {
        playerX += speed * dt
      }
      if (input.isPressed('up')) {
        playerY += speed * dt
      }
      if (input.isPressed('down')) {
        playerY -= speed * dt
      }

      // Clamp to road area
      playerX = Math.max(-1.5, Math.min(1.5, playerX))
      playerY = Math.max(-5, Math.min(5, playerY))

      if (playerMesh) {
        playerMesh.position.x = playerX
        playerMesh.position.y = playerY
      }

      // Scroll road lines to simulate walking
      roadOffset += dt * 2
      roadLines.forEach((line, i) => {
        line.position.y = (((-6 + i * 1.8 - roadOffset) % 14.4) + 14.4) % 14.4 - 6
      })

      // Dream timer - after wandering, fall asleep
      dreamTimer += dt
      if (dreamTimer > 15 && !input.isPressed('up') && !input.isPressed('down') &&
          !input.isPressed('left') && !input.isPressed('right')) {
        // Still for too long = narcolepsy
        sceneManager.switchTo('dream')
      }

      // Press B to trigger dream
      if (input.justPressed('b')) {
        sceneManager.switchTo('dream')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
