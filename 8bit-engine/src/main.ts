import './style.css'
import * as THREE from 'three'
import { NES_PALETTE } from './engine/palette'
import { Input } from './engine/input'
import { GameLoop } from './engine/game-loop'
import { PPU, SPRITES, GAME_DESIGN, checkConstraints } from './engine/technical-constraints'

// =============================================================================
// 8bit-engine Demo
// Demonstrates NES-style constraints in a 3D environment
// =============================================================================

// Use NES resolution
const SCALE = 3
const WIDTH = PPU.SCREEN_WIDTH * SCALE
const HEIGHT = PPU.SCREEN_HEIGHT * SCALE

// Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(NES_PALETTE.BLACK)

// Orthographic camera for 2D-style rendering
const aspect = PPU.SCREEN_WIDTH / PPU.SCREEN_HEIGHT
const camera = new THREE.OrthographicCamera(-8, 8, 8 / aspect, -8 / aspect, 0.1, 100)
camera.position.z = 10

// Renderer with pixelated look
const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(WIDTH, HEIGHT)
renderer.setPixelRatio(1) // Keep pixels sharp
document.querySelector<HTMLDivElement>('#app')!.appendChild(renderer.domElement)

// Lighting (simple, NES-style flat shading)
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

// Ground (like SMB ground tiles)
const groundGeometry = new THREE.PlaneGeometry(16, 2)
const groundMaterial = new THREE.MeshBasicMaterial({ color: NES_PALETTE.BROWN })
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.position.y = -5
scene.add(ground)

// Sky blocks (like SMB clouds)
function createBlock(x: number, y: number, color: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, 0)
  scene.add(mesh)
  return mesh
}

// Create some platform blocks
for (let i = -3; i <= 3; i++) {
  createBlock(i, -3, NES_PALETTE.ORANGE)
}

// Question block
const questionBlock = createBlock(0, -1, NES_PALETTE.YELLOW)

// Player (Mario-sized: 16x32 pixels = 2x4 tiles = 8 sprites)
const playerGeometry = new THREE.BoxGeometry(1, 2, 1)
const playerMaterial = new THREE.MeshBasicMaterial({ color: NES_PALETTE.RED })
const player = new THREE.Mesh(playerGeometry, playerMaterial)
player.position.set(-5, -2, 0)
scene.add(player)

// Check constraints for our scene
const playerSprites = GAME_DESIGN.TYPICAL_PLAYER_SPRITES
console.log(`Player uses ${playerSprites} sprites (${GAME_DESIGN.TYPICAL_PLAYER_WIDTH_TILES}x${GAME_DESIGN.TYPICAL_PLAYER_HEIGHT_TILES} tiles)`)

const violations = checkConstraints({
  totalSprites: 10,
  spritesPerScanline: 4,
})
if (violations.length > 0) {
  console.warn('Constraint violations:', violations)
}

// Input
const input = new Input()

// Player physics
let velocityY = 0
const gravity = 0.5
const jumpForce = 8
const moveSpeed = 0.15
let isGrounded = false

// HUD
const hud = document.createElement('div')
hud.id = 'hud'
hud.innerHTML = `
  <strong>8bit-engine</strong><br>
  WASD/Arrows: Move<br>
  Z: Jump<br>
  Resolution: ${PPU.SCREEN_WIDTH}x${PPU.SCREEN_HEIGHT}
`
document.body.appendChild(hud)

// Debug display
const debug = document.createElement('div')
debug.id = 'debug'
document.body.appendChild(debug)

// Game loop
const gameLoop = new GameLoop({
  update: (dt: number) => {
    // Horizontal movement
    if (input.isPressed('left')) {
      player.position.x -= moveSpeed
    }
    if (input.isPressed('right')) {
      player.position.x += moveSpeed
    }

    // Jump
    if (input.justPressed('a') && isGrounded) {
      velocityY = jumpForce
      isGrounded = false
    }

    // Apply gravity
    velocityY -= gravity
    player.position.y += velocityY * dt

    // Ground collision
    if (player.position.y <= -2) {
      player.position.y = -2
      velocityY = 0
      isGrounded = true
    }

    // Platform collision (simple)
    if (player.position.y <= -1 && player.position.y > -2 &&
        player.position.x >= -3.5 && player.position.x <= 3.5) {
      if (velocityY < 0) {
        player.position.y = -1
        velocityY = 0
        isGrounded = true
      }
    }

    // Bounds
    player.position.x = Math.max(-7, Math.min(7, player.position.x))

    // Animate question block
    questionBlock.rotation.y += 0.02

    // Update input state
    input.update()
  },

  render: () => {
    renderer.render(scene, camera)

    // Update debug info
    debug.innerHTML = `
      FPS: ${gameLoop.getFPS()}<br>
      Pos: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)})<br>
      Max sprites/scanline: ${SPRITES.MAX_PER_SCANLINE}
    `
  },
})

// Start the game
gameLoop.start()

// Handle resize
window.addEventListener('resize', () => {
  // Maintain aspect ratio and scale
  const scale = Math.min(
    window.innerWidth / WIDTH,
    window.innerHeight / HEIGHT
  )
  renderer.domElement.style.width = `${WIDTH * scale}px`
  renderer.domElement.style.height = `${HEIGHT * scale}px`
})

// Trigger initial resize
window.dispatchEvent(new Event('resize'))
