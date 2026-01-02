/**
 * Title Scene
 * Welcome screen with game title and "Press Start"
 */

import * as THREE from 'three'
import type { Scene, SceneType } from './scenes'
import { SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'

export function createTitleScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  let titleMesh: THREE.Mesh
  let subtitleMesh: THREE.Mesh
  let pressStartMesh: THREE.Mesh
  let blinkTimer = 0
  let stars: THREE.Mesh[] = []

  return {
    name: 'title' as SceneType,

    enter() {
      // Clear scene
      while (threeScene.children.length > 0) {
        threeScene.remove(threeScene.children[0])
      }

      // Dark blue background
      threeScene.background = new THREE.Color(NES_PALETTE.DARK_BLUE)

      // Ambient light
      const light = new THREE.AmbientLight(0xffffff, 1)
      threeScene.add(light)

      // Create stars background
      for (let i = 0; i < 30; i++) {
        const starGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1)
        const starMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
        const star = new THREE.Mesh(starGeo, starMat)
        star.position.set(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 12,
          -1
        )
        threeScene.add(star)
        stars.push(star)
      }

      // Title "8BIT QUEST"
      const titleGeo = new THREE.BoxGeometry(6, 1.5, 0.5)
      const titleMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
      titleMesh = new THREE.Mesh(titleGeo, titleMat)
      titleMesh.position.set(0, 2, 0)
      threeScene.add(titleMesh)

      // Subtitle decoration
      const subGeo = new THREE.BoxGeometry(4, 0.3, 0.3)
      const subMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.ORANGE })
      subtitleMesh = new THREE.Mesh(subGeo, subMat)
      subtitleMesh.position.set(0, 0.5, 0)
      threeScene.add(subtitleMesh)

      // "Press Start" indicator
      const startGeo = new THREE.BoxGeometry(3, 0.5, 0.3)
      const startMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
      pressStartMesh = new THREE.Mesh(startGeo, startMat)
      pressStartMesh.position.set(0, -2, 0)
      threeScene.add(pressStartMesh)

      // Decorative blocks (like a logo)
      const colors = [NES_PALETTE.RED, NES_PALETTE.GREEN, NES_PALETTE.BLUE, NES_PALETTE.CYAN]
      for (let i = 0; i < 4; i++) {
        const blockGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
        const blockMat = new THREE.MeshBasicMaterial({ color: colors[i] })
        const block = new THREE.Mesh(blockGeo, blockMat)
        block.position.set(-1.5 + i * 1, -0.8, 0)
        block.rotation.z = Math.PI / 4
        threeScene.add(block)
      }

      blinkTimer = 0
    },

    exit() {
      stars = []
    },

    update(dt: number) {
      // Blink "Press Start"
      blinkTimer += dt
      if (pressStartMesh) {
        pressStartMesh.visible = Math.floor(blinkTimer * 2) % 2 === 0
      }

      // Animate title
      if (titleMesh) {
        titleMesh.rotation.y = Math.sin(blinkTimer * 0.5) * 0.1
      }

      // Twinkle stars
      stars.forEach((star, i) => {
        star.visible = Math.sin(blinkTimer * 3 + i) > -0.3
      })

      // Check for start
      if (input.justPressed('start') || input.justPressed('a')) {
        sceneManager.switchTo('map')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
