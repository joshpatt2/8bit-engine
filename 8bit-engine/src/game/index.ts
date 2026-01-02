/**
 * 8BIT QUEST - Test Game
 * Demonstrates the 8bit-engine with:
 * - Title screen
 * - World map (SMB3-style)
 * - 3 Platformer levels
 */

import * as THREE from 'three'
import { PPU } from '../engine/technical-constraints'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'
import { GameLoop } from '../engine/game-loop'
import { SceneManager } from './scenes'
import { createTitleScene } from './title-scene'
import { createMapScene, LevelStatus } from './map-scene'
import { createLevelScene } from './level-scene'

export function startGame(container: HTMLElement): void {
  // NES resolution scaled up
  const SCALE = 3
  const WIDTH = PPU.SCREEN_WIDTH * SCALE
  const HEIGHT = PPU.SCREEN_HEIGHT * SCALE

  // Three.js setup
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(NES_PALETTE.BLACK)

  // Orthographic camera for 2D
  const aspect = PPU.SCREEN_WIDTH / PPU.SCREEN_HEIGHT
  const camera = new THREE.OrthographicCamera(-8, 8, 8 / aspect, -8 / aspect, 0.1, 100)
  camera.position.z = 10

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setSize(WIDTH, HEIGHT)
  renderer.setPixelRatio(1)
  container.appendChild(renderer.domElement)

  // Input
  const input = new Input()

  // Level completion tracking
  const levelStatus: LevelStatus = {
    level1: 'unlocked',
    level2: 'locked',
    level3: 'locked',
  }

  // Scene manager
  const sceneManager = new SceneManager()

  // Register scenes
  sceneManager.register(
    createTitleScene(scene, camera, renderer, input, sceneManager)
  )

  sceneManager.register(
    createMapScene(scene, camera, renderer, input, sceneManager, levelStatus)
  )

  sceneManager.register(
    createLevelScene('level1', scene, camera, renderer, input, sceneManager, () => {
      levelStatus.level1 = 'complete'
      levelStatus.level2 = 'unlocked'
    })
  )

  sceneManager.register(
    createLevelScene('level2', scene, camera, renderer, input, sceneManager, () => {
      levelStatus.level2 = 'complete'
      levelStatus.level3 = 'unlocked'
    })
  )

  sceneManager.register(
    createLevelScene('level3', scene, camera, renderer, input, sceneManager, () => {
      levelStatus.level3 = 'complete'
      console.log('🎉 Game Complete!')
    })
  )

  // Start at title
  sceneManager.switchTo('title')

  // HUD
  const hud = document.createElement('div')
  hud.id = 'hud'
  hud.innerHTML = `
    <strong>8BIT QUEST</strong><br>
    Arrows/WASD: Move | Z: Jump/Select<br>
    Enter: Start | Shift: Select | X: Back
  `
  document.body.appendChild(hud)

  // Debug
  const debug = document.createElement('div')
  debug.id = 'debug'
  document.body.appendChild(debug)

  // Game loop
  const gameLoop = new GameLoop({
    update: (dt: number) => {
      sceneManager.update(dt)
      input.update()
    },
    render: () => {
      sceneManager.render()
      debug.innerHTML = `FPS: ${gameLoop.getFPS()} | Scene: ${sceneManager.getCurrentScene()}`
    },
  })

  gameLoop.start()

  // Resize handler
  function handleResize() {
    const scale = Math.min(
      window.innerWidth / WIDTH,
      window.innerHeight / HEIGHT
    ) * 0.9
    renderer.domElement.style.width = `${WIDTH * scale}px`
    renderer.domElement.style.height = `${HEIGHT * scale}px`
  }

  window.addEventListener('resize', handleResize)
  handleResize()
}
