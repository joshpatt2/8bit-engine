/**
 * Title Scene
 * Welcome screen with game title and "Press Start"
 */

import * as THREE from 'three'
import type { Scene, SceneType } from './scenes'
import { SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'
import { createBitmapText, BitmapTextStyles } from '../engine/bitmap-font'

export function createTitleScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  let titleText: THREE.Group
  let pressStartText: THREE.Group
  let pressStartBorder: THREE.Mesh
  let pressStartBackground: THREE.Mesh
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

      // Title "8BIT QUEST" - using bitmap text
      titleText = createBitmapText('8BIT QUEST', BitmapTextStyles.title(NES_PALETTE.YELLOW))
      titleText.position.set(0, 2, 0)
      threeScene.add(titleText)

      // "Press Start" text - using bitmap text
      pressStartText = createBitmapText('PRESS START', BitmapTextStyles.subtitle(NES_PALETTE.WHITE))
      pressStartText.position.set(0, -2, 0)
      threeScene.add(pressStartText)

      // Calculate text width: "PRESS START" = 11 chars
      // scale = 0.1, char width = 8 pixels, letterSpacing = 0.02
      const charCount = 11
      const charWidth = 8 * 0.1  // 8 pixels * scale
      const spacing = 0.02
      const textWidth = (charCount * charWidth) + ((charCount - 1) * spacing)
      const textHeight = 8 * 0.1  // Full 8 pixels tall * scale (to contain descenders like 'p')

      // Text is positioned from top-left, so we need to shift the box down by half its height
      const boxYOffset = -textHeight / 2

      // "Press Start" background box (slightly larger than text)
      const padding = 0.2
      const bgGeo = new THREE.PlaneGeometry(textWidth + padding * 2, textHeight + padding * 2)
      const bgMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_BLUE })
      pressStartBackground = new THREE.Mesh(bgGeo, bgMat)
      pressStartBackground.position.set(0, -2 + boxYOffset, -0.1)
      threeScene.add(pressStartBackground)

      // "Press Start" border (slightly larger than background)
      const borderThickness = 0.08
      const borderGeo = new THREE.PlaneGeometry(
        textWidth + padding * 2 + borderThickness * 2,
        textHeight + padding * 2 + borderThickness * 2
      )
      const borderMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.CYAN })
      pressStartBorder = new THREE.Mesh(borderGeo, borderMat)
      pressStartBorder.position.set(0, -2 + boxYOffset, -0.2)
      threeScene.add(pressStartBorder)

      // Decorative blocks (like a logo)
      const colors = [NES_PALETTE.RED, NES_PALETTE.GREEN, NES_PALETTE.BLUE, NES_PALETTE.CYAN]
      for (let i = 0; i < 4; i++) {
        const blockGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
        const blockMat = new THREE.MeshBasicMaterial({ color: colors[i] })
        const block = new THREE.Mesh(blockGeo, blockMat)
        block.position.set(-1.5 + i * 1, 0, 0)
        block.rotation.z = Math.PI / 4
        threeScene.add(block)
      }

      blinkTimer = 0
    },

    exit() {
      stars = []
    },

    update(dt: number) {
      // Blink "Press Start" with border and background
      blinkTimer += dt
      const isVisible = Math.floor(blinkTimer * 2) % 2 === 0
      if (pressStartText) {
        pressStartText.visible = isVisible
      }
      if (pressStartBorder) {
        pressStartBorder.visible = isVisible
      }
      if (pressStartBackground) {
        pressStartBackground.visible = isVisible
      }

      // Animate title
      if (titleText) {
        titleText.rotation.y = Math.sin(blinkTimer * 0.5) * 0.1
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
