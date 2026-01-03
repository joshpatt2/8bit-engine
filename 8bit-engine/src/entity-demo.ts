/**
 * Entity System Demo
 * 
 * Simple example demonstrating the entity system with moving entities.
 * Run with: npm run dev and navigate to /entity-demo.html
 */

import * as THREE from 'three'
import {
  EntityManager,
  COMPONENT,
  createTransform,
  createVelocity,
  createHealth,
  MovementSystem,
  SpriteRenderSystem,
  createLifetime,
  LifetimeSystem,
  GameLoop,
  Input,
  NES_PALETTE,
  createBitmapText,
  BitmapTextStyles,
  type VelocityComponent,
  type TransformComponent,
  type InputComponent,
} from './engine'

// =============================================================================
// SETUP
// =============================================================================

// Create scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(NES_PALETTE.DARK_BLUE)

// Create camera
const camera = new THREE.OrthographicCamera(-15, 15, 10, -10, 0.1, 100)
camera.position.z = 10

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: false })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

// Create input system
const input = new Input()

// Create entity manager
const entityManager = new EntityManager()

// Add systems
entityManager.getSystemManager()
  .addSystem(new MovementSystem())
  .addSystem(new SpriteRenderSystem())
  .addSystem(new LifetimeSystem())

// =============================================================================
// CREATE ENTITIES
// =============================================================================

// Title text
const title = createBitmapText('ENTITY SYSTEM DEMO', BitmapTextStyles.title())
title.position.set(0, 8, 0)
scene.add(title)

// Instructions
let instructionsText = createBitmapText('PRESS A OR Z TO SPAWN', BitmapTextStyles.subtitle())
instructionsText.position.set(0, 6, 0)
scene.add(instructionsText)

let lastEntityCount = -1

/**
 * Create a player entity
 */
function createPlayer(): void {
  // Create mesh for player
  const geometry = new THREE.BoxGeometry(1, 1, 0.5)
  const material = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  // Create entity
  const player = entityManager.createEntity('player')
  player
    .addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
    .addComponent(COMPONENT.VELOCITY, createVelocity(0, 0, 0))
    .addComponent(COMPONENT.SPRITE, {
      mesh,
      color: NES_PALETTE.YELLOW,
      visible: true,
    })
    .addComponent(COMPONENT.HEALTH, createHealth(100))
    .addComponent(COMPONENT.INPUT, {
      moveSpeed: 5,
      jumpPower: 10,
    })
  
  console.log('Player created:', player.id)
}

/**
 * Create a bouncing entity at random position
 */
function createBouncingEntity(): void {
  // Random position and velocity
  const x = (Math.random() - 0.5) * 20
  const y = (Math.random() - 0.5) * 10
  const vx = (Math.random() - 0.5) * 8
  const vy = (Math.random() - 0.5) * 8
  
  // Random color
  const colors = [
    NES_PALETTE.RED,
    NES_PALETTE.GREEN,
    NES_PALETTE.BLUE,
    NES_PALETTE.CYAN,
    NES_PALETTE.MAGENTA,
    NES_PALETTE.ORANGE,
  ]
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  // Create mesh
  const geometry = new THREE.SphereGeometry(0.5, 8, 8)
  const material = new THREE.MeshBasicMaterial({ color })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  
  // Create entity
  const entity = entityManager.createEntity('bouncing')
  entity
    .addComponent(COMPONENT.TRANSFORM, createTransform(x, y, 0))
    .addComponent(COMPONENT.VELOCITY, createVelocity(vx, vy, 0))
    .addComponent(COMPONENT.SPRITE, {
      mesh,
      color,
      visible: true,
    })
    .addComponent(COMPONENT.LIFETIME, createLifetime(5)) // Lives for 5 seconds
  
  console.log('Bouncing entity created:', entity.id)
}

/**
 * Update player movement based on input
 */
function updatePlayerInput(): void {
  const players = entityManager.getEntitiesByTag('player')
  
  for (const player of players) {
    const velocity = player.getComponent<VelocityComponent>(COMPONENT.VELOCITY)
    const inputComp = player.getComponent<InputComponent>(COMPONENT.INPUT)
    
    if (!velocity || !inputComp) continue
    
    // Reset velocity
    velocity.x = 0
    velocity.y = 0
    
    // Move based on input
    if (input.isPressed('left')) velocity.x = -inputComp.moveSpeed
    if (input.isPressed('right')) velocity.x = inputComp.moveSpeed
    if (input.isPressed('up')) velocity.y = inputComp.moveSpeed
    if (input.isPressed('down')) velocity.y = -inputComp.moveSpeed
  }
}

/**
 * Bounce entities off screen edges
 */
function updateBouncing(): void {
  const bouncingEntities = entityManager.getEntitiesByTag('bouncing')
  
  for (const entity of bouncingEntities) {
    const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)
    const velocity = entity.getComponent<VelocityComponent>(COMPONENT.VELOCITY)
    
    if (!transform || !velocity) continue
    
    // Bounce off edges
    if (transform.position.x > 14 || transform.position.x < -14) {
      velocity.x *= -1
    }
    if (transform.position.y > 9 || transform.position.y < -9) {
      velocity.y *= -1
    }
  }
}

// =============================================================================
// GAME LOOP
// =============================================================================

// Create initial player
createPlayer()

// Spawn initial bouncing entities
for (let i = 0; i < 5; i++) {
  createBouncingEntity()
}

// Game loop
const gameLoop = new GameLoop({
  update: (deltaTime) => {
    // Update input
    input.update()
    
    // Spawn new entity on space press
    if (input.justPressed('a')) {
      createBouncingEntity()
    }
    
    // Update player input
    updatePlayerInput()
    
    // Update bouncing physics
    updateBouncing()
    
    // Update all entities and systems
    entityManager.update(deltaTime)
    
    // Update entity count display (only when count changes)
    const count = entityManager.getActiveEntityCount()
    if (count !== lastEntityCount) {
      lastEntityCount = count
      scene.remove(instructionsText)
      
      instructionsText = createBitmapText(
        `ENTITIES: ${count}  A/Z: SPAWN`,
        BitmapTextStyles.subtitle()
      )
      instructionsText.position.set(0, 6, 0)
      scene.add(instructionsText)
    }
  },
  
  render: () => {
    renderer.render(scene, camera)
  },
})

gameLoop.start()

// =============================================================================
// WINDOW RESIZE
// =============================================================================

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight
  const height = 10
  const width = height * aspect
  
  camera.left = -width
  camera.right = width
  camera.top = height
  camera.bottom = -height
  camera.updateProjectionMatrix()
  
  renderer.setSize(window.innerWidth, window.innerHeight)
})

console.log('Entity System Demo Ready!')
console.log('- Arrow keys or WASD to move yellow player')
console.log('- A or Z to spawn bouncing entities')
console.log('- Entities auto-destroy after 5 seconds')
