/**
 * World Map Demo
 * Simple demo showing the WorldMap abstraction
 */

import './style.css'
import * as THREE from 'three'
import { PPU, NES_PALETTE, Input, GameLoop } from './engine'
import { MapScreen } from './game/map-screen'

const container = document.querySelector<HTMLDivElement>('#app')!

// NES resolution scaled up
const SCALE = 3
const WIDTH = PPU.SCREEN_WIDTH * SCALE
const HEIGHT = PPU.SCREEN_HEIGHT * SCALE

// Three.js setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(NES_PALETTE.BLACK)

// Orthographic camera for 2D
const camera = new THREE.OrthographicCamera(-128, 128, 120, -120, 0.1, 100)
camera.position.z = 10

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(WIDTH, HEIGHT)
renderer.setPixelRatio(1)
container.appendChild(renderer.domElement)

// Input
const input = new Input()

// Create map screen
const mapScreen = new MapScreen('map', scene, camera, renderer, input)
mapScreen.onEnter()

// HUD
const hud = document.createElement('div')
hud.id = 'hud'
hud.innerHTML = `
  <strong>WORLD MAP DEMO</strong><br>
  Arrows: Navigate | Z/Enter: Select Node | X/Esc: Back<br>
  <br>
  <em>Select unlocked nodes to complete them and unlock next nodes</em>
`
document.body.appendChild(hud)

// Debug
const debug = document.createElement('div')
debug.id = 'debug'
document.body.appendChild(debug)

// Game loop
const gameLoop = new GameLoop({
  update: (dt: number) => {
    mapScreen.onUpdate(dt)
    input.update()
  },
  render: () => {
    mapScreen.onRender()
    debug.innerHTML = `FPS: ${gameLoop.getFPS()}`
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
