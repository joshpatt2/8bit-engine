/**
 * World Map Demo
 * Simple demo showing the WorldMap abstraction
 */

import './style.css'
import { Engine, PPU } from './engine'
import { MapScreen } from './game/map-screen'

const container = document.querySelector<HTMLDivElement>('#app')!

// NES resolution scaled up
const SCALE = 3
const WIDTH = PPU.SCREEN_WIDTH * SCALE
const HEIGHT = PPU.SCREEN_HEIGHT * SCALE

// Create engine
const engine = new Engine({
  container,
  width: WIDTH,
  height: HEIGHT,
  left: -128,
  right: 128,
  top: 120,
  bottom: -120,
})

// Create map screen
const mapScreen = new MapScreen('map', engine.getRenderer(), engine.getInput())

// Register and activate screen
const screenManager = engine.getScreenManager()
screenManager.register(mapScreen)
screenManager.switchTo('map')

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

// Update debug display
setInterval(() => {
  debug.innerHTML = `FPS: ${engine.getFPS()}`
}, 100)

// Start engine
engine.start()

// Resize handler
function handleResize() {
  const scale = Math.min(
    window.innerWidth / WIDTH,
    window.innerHeight / HEIGHT
  ) * 0.9
  engine.getRenderer().getDomElement().style.width = `${WIDTH * scale}px`
  engine.getRenderer().getDomElement().style.height = `${HEIGHT * scale}px`
}

window.addEventListener('resize', handleResize)
handleResize()
