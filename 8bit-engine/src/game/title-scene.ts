/**
 * Title Scene
 * Welcome screen with game title and "Press Start"
 */

import type { Scene, SceneType } from './scenes'
import { SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'
import { TitleScreen } from '../engine/title-screen'
import * as THREE from 'three'

export function createTitleScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  // Game-specific visual elements (managed by game layer)
  let stars: THREE.Mesh[] = []
  let decorations: THREE.Mesh[] = []

  // Create the title screen instance
  const titleScreen = new TitleScreen(
    'title',
    threeScene,
    camera,
    renderer,
    input,
    {
      title: '8BIT QUEST',
      titleColor: NES_PALETTE.YELLOW,
      backgroundColor: NES_PALETTE.DARK_BLUE,
      menuOptions: [
        {
          id: 'start',
          text: 'PRESS START',
          color: NES_PALETTE.WHITE,
          blinking: true,
        },
      ],
      onSelectOption: (optionId: string) => {
        if (optionId === 'start') {
          sceneManager.switchTo('map')
        }
      },
      
      // Game-specific visual setup
      onSetupVisuals: (scene: THREE.Scene) => {
        // Create star field background
        for (let i = 0; i < 30; i++) {
          const starGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1)
          const starMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
          const star = new THREE.Mesh(starGeo, starMat)
          star.position.set(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 12,
            -1
          )
          scene.add(star)
          stars.push(star)
        }

        // Create decorative blocks (like a logo)
        const colors = [NES_PALETTE.RED, NES_PALETTE.GREEN, NES_PALETTE.BLUE, NES_PALETTE.CYAN]
        for (let i = 0; i < 4; i++) {
          const blockGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
          const blockMat = new THREE.MeshBasicMaterial({ color: colors[i] })
          const block = new THREE.Mesh(blockGeo, blockMat)
          block.position.set(-1.5 + i * 1, 0, 0)
          block.rotation.z = Math.PI / 4
          scene.add(block)
          decorations.push(block)
        }
      },
      
      // Game-specific visual updates
      onUpdateVisuals: (_deltaTime: number, elapsedTime: number) => {
        // Twinkle stars
        stars.forEach((star, i) => {
          star.visible = Math.sin(elapsedTime * 3 + i) > -0.3
        })
        
        // Optionally animate decorations
        decorations.forEach((block, i) => {
          block.rotation.z = Math.PI / 4 + Math.sin(elapsedTime + i) * 0.1
        })
      },
      
      // Game-specific cleanup
      onCleanupVisuals: () => {
        stars = []
        decorations = []
      },
    }
  )

  // Adapt TitleScreen to the Scene interface
  return {
    name: 'title' as SceneType,

    enter() {
      titleScreen.onEnter()
    },

    exit() {
      titleScreen.onExit()
    },

    update(dt: number) {
      titleScreen.onUpdate(dt)
    },

    render() {
      titleScreen.onRender()
    },
  }
}
