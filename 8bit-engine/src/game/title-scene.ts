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
import { createButton } from '../engine/ui-components'
import type { Button } from '../engine/ui-components'
import { ClickHandler } from '../engine/click-handler'

export function createTitleScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  let titleText: THREE.Group
  let pressStartButton: Button
  let clickHandler: ClickHandler
  let blinkTimer = 0
  let stars: THREE.Mesh[] = []

  return {
    name: 'title' as SceneType,

    enter() {
      // Clear scene properly
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

      // "Press Start" button with click handler
      pressStartButton = createButton({
        text: 'PRESS START',
        textColor: NES_PALETTE.WHITE,
        backgroundColor: NES_PALETTE.DARK_BLUE,
        borderColor: NES_PALETTE.CYAN,
        padding: 0.2,
        borderThickness: 0.08,
        textStyle: BitmapTextStyles.subtitle(NES_PALETTE.WHITE),
        onClick: () => {
          sceneManager.switchTo('map')
        },
      })
      pressStartButton.setPosition(0, -2, 0)
      threeScene.add(pressStartButton.group)

      // Initialize click handler
      clickHandler = new ClickHandler(camera, threeScene, renderer.domElement)

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
      if (clickHandler) {
        clickHandler.destroy()
      }
    },

    update(dt: number) {
      // Blink "Press Start" button
      blinkTimer += dt
      const isVisible = Math.floor(blinkTimer * 2) % 2 === 0
      if (pressStartButton) {
        pressStartButton.setVisible(isVisible)
      }

      // Animate title
      if (titleText) {
        titleText.rotation.y = Math.sin(blinkTimer * 0.5) * 0.1
      }

      // Twinkle stars
      stars.forEach((star, i) => {
        star.visible = Math.sin(blinkTimer * 3 + i) > -0.3
      })

      // Check for start (keyboard)
      if (input.justPressed('start') || input.justPressed('a')) {
        sceneManager.switchTo('map')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
