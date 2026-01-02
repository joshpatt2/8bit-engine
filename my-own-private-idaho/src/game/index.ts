/**
 * My Own Private Idaho - An 8-bit Adventure
 *
 * Wander the roads of Idaho as Mike.
 * Experience narcoleptic dream sequences.
 * Search for home.
 */

import * as THREE from 'three'
import { PPU } from '../engine/technical-constraints'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'
import { GameLoop } from '../engine/game-loop'
import { SceneManager } from './scenes'
import { createTitleScene } from './title-scene'
import { createRoadScene } from './road-scene'
import { createDreamScene } from './dream-scene'

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

  // Scene manager
  const sceneManager = new SceneManager()

  // Register scenes
  sceneManager.register(
    createTitleScene(scene, camera, renderer, input, sceneManager)
  )

  sceneManager.register(
    createRoadScene(scene, camera, renderer, input, sceneManager)
  )

  sceneManager.register(
    createDreamScene(scene, camera, renderer, input, sceneManager)
  )

  // Start at title
  sceneManager.switchTo('title')

  // HUD
  const hud = document.createElement('div')
  hud.id = 'hud'
  hud.innerHTML = `
    <strong>MY OWN PRIVATE IDAHO</strong><br>
    Arrows/WASD: Wander | Z: Select<br>
    Enter: Start | X: Dream
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
