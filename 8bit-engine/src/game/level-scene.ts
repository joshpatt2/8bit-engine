/**
 * Level Scenes
 * Three playable levels with platformer mechanics
 */

import * as THREE from 'three'
import { Scene, SceneType, SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'

interface LevelConfig {
  name: SceneType
  backgroundColor: number
  groundColor: number
  platformColor: number
  enemyColor: number
  platforms: { x: number; y: number; width: number }[]
  enemies: { x: number; y: number }[]
  goalX: number
}

const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  level1: {
    name: 'level1',
    backgroundColor: NES_PALETTE.SKY_BLUE,
    groundColor: NES_PALETTE.GREEN,
    platformColor: NES_PALETTE.BROWN,
    enemyColor: NES_PALETTE.RED,
    platforms: [
      { x: -4, y: -2, width: 3 },
      { x: 2, y: -1, width: 2 },
      { x: 5, y: 0, width: 2 },
    ],
    enemies: [
      { x: -2, y: -3.5 },
      { x: 3, y: -3.5 },
    ],
    goalX: 7,
  },
  level2: {
    name: 'level2',
    backgroundColor: NES_PALETTE.BLACK,
    groundColor: NES_PALETTE.DARK_GRAY,
    platformColor: NES_PALETTE.PURPLE,
    enemyColor: NES_PALETTE.ORANGE,
    platforms: [
      { x: -5, y: -1, width: 2 },
      { x: -1, y: 0, width: 3 },
      { x: 4, y: -2, width: 2 },
      { x: 6, y: 1, width: 2 },
    ],
    enemies: [
      { x: -3, y: -3.5 },
      { x: 1, y: -3.5 },
      { x: 5, y: -3.5 },
    ],
    goalX: 7,
  },
  level3: {
    name: 'level3',
    backgroundColor: NES_PALETTE.DARK_BLUE,
    groundColor: NES_PALETTE.GRAY,
    platformColor: NES_PALETTE.LIGHT_GRAY,
    enemyColor: NES_PALETTE.MAGENTA,
    platforms: [
      { x: -6, y: -2, width: 2 },
      { x: -3, y: 0, width: 2 },
      { x: 0, y: 2, width: 2 },
      { x: 3, y: 0, width: 2 },
      { x: 6, y: -1, width: 2 },
    ],
    enemies: [
      { x: -4, y: -3.5 },
      { x: 0, y: -3.5 },
      { x: 4, y: -3.5 },
    ],
    goalX: 7,
  },
}

export function createLevelScene(
  levelKey: 'level1' | 'level2' | 'level3',
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager,
  onComplete: () => void
): Scene {
  const config = LEVEL_CONFIGS[levelKey]

  let player: THREE.Mesh
  let platforms: THREE.Mesh[] = []
  let enemies: THREE.Mesh[] = []
  let goal: THREE.Mesh
  let ground: THREE.Mesh

  let velocityX = 0
  let velocityY = 0
  let isGrounded = false
  let gameTime = 0
  let levelComplete = false
  let playerDead = false

  const GRAVITY = 25
  const JUMP_FORCE = 10
  const MOVE_SPEED = 5
  const FRICTION = 0.85

  function checkCollision(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  return {
    name: config.name as SceneType,

    enter() {
      // Clear scene
      while (threeScene.children.length > 0) {
        threeScene.remove(threeScene.children[0])
      }

      platforms = []
      enemies = []
      levelComplete = false
      playerDead = false
      gameTime = 0

      // Background
      threeScene.background = new THREE.Color(config.backgroundColor)

      // Lighting
      const light = new THREE.AmbientLight(0xffffff, 1)
      threeScene.add(light)

      // Ground
      const groundGeo = new THREE.BoxGeometry(20, 1, 1)
      const groundMat = new THREE.MeshBasicMaterial({ color: config.groundColor })
      ground = new THREE.Mesh(groundGeo, groundMat)
      ground.position.set(0, -4.5, 0)
      threeScene.add(ground)

      // Platforms
      config.platforms.forEach(p => {
        const platGeo = new THREE.BoxGeometry(p.width, 0.5, 0.5)
        const platMat = new THREE.MeshBasicMaterial({ color: config.platformColor })
        const plat = new THREE.Mesh(platGeo, platMat)
        plat.position.set(p.x, p.y, 0)
        plat.userData = { width: p.width, height: 0.5 }
        threeScene.add(plat)
        platforms.push(plat)
      })

      // Enemies
      config.enemies.forEach(e => {
        const enemyGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
        const enemyMat = new THREE.MeshBasicMaterial({ color: config.enemyColor })
        const enemy = new THREE.Mesh(enemyGeo, enemyMat)
        enemy.position.set(e.x, e.y, 0)
        enemy.userData = { startX: e.x, direction: 1 }
        threeScene.add(enemy)
        enemies.push(enemy)
      })

      // Goal (flag)
      const goalGeo = new THREE.BoxGeometry(0.3, 2, 0.3)
      const goalMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
      goal = new THREE.Mesh(goalGeo, goalMat)
      goal.position.set(config.goalX, -3, 0)
      threeScene.add(goal)

      // Goal flag top
      const flagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.1)
      const flagMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.RED })
      const flag = new THREE.Mesh(flagGeo, flagMat)
      flag.position.set(config.goalX + 0.4, -2.2, 0)
      threeScene.add(flag)

      // Player
      const playerGeo = new THREE.BoxGeometry(0.8, 1, 0.8)
      const playerMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.BLUE })
      player = new THREE.Mesh(playerGeo, playerMat)
      player.position.set(-7, -3, 0)
      threeScene.add(player)

      velocityX = 0
      velocityY = 0
      isGrounded = false
    },

    exit() {
      platforms = []
      enemies = []
    },

    update(dt: number) {
      if (levelComplete || playerDead) {
        gameTime += dt
        if (gameTime > 2) {
          if (levelComplete) {
            onComplete()
            sceneManager.switchTo('map')
          } else {
            // Respawn
            player.position.set(-7, -3, 0)
            velocityX = 0
            velocityY = 0
            playerDead = false
            gameTime = 0
          }
        }
        return
      }

      gameTime += dt

      // Input
      if (input.isPressed('left')) {
        velocityX = -MOVE_SPEED
      } else if (input.isPressed('right')) {
        velocityX = MOVE_SPEED
      } else {
        velocityX *= FRICTION
      }

      // Jump
      if (input.justPressed('a') && isGrounded) {
        velocityY = JUMP_FORCE
        isGrounded = false
      }

      // Gravity
      velocityY -= GRAVITY * dt

      // Move player
      player.position.x += velocityX * dt
      player.position.y += velocityY * dt

      // Ground collision
      if (player.position.y <= -3.5) {
        player.position.y = -3.5
        velocityY = 0
        isGrounded = true
      }

      // Platform collisions
      platforms.forEach(plat => {
        const pw = plat.userData.width
        const ph = plat.userData.height

        // Simple top collision
        if (
          player.position.x > plat.position.x - pw / 2 - 0.4 &&
          player.position.x < plat.position.x + pw / 2 + 0.4 &&
          player.position.y > plat.position.y &&
          player.position.y < plat.position.y + ph + 0.5 &&
          velocityY < 0
        ) {
          player.position.y = plat.position.y + ph / 2 + 0.5
          velocityY = 0
          isGrounded = true
        }
      })

      // Bounds
      player.position.x = Math.max(-8, Math.min(8, player.position.x))

      // Enemy movement and collision
      enemies.forEach(enemy => {
        // Patrol
        enemy.position.x += enemy.userData.direction * 1.5 * dt
        if (Math.abs(enemy.position.x - enemy.userData.startX) > 2) {
          enemy.userData.direction *= -1
        }

        // Collision with player
        if (checkCollision(
          player.position.x - 0.4, player.position.y - 0.5, 0.8, 1,
          enemy.position.x - 0.3, enemy.position.y - 0.3, 0.6, 0.6
        )) {
          // Check if stomping
          if (velocityY < 0 && player.position.y > enemy.position.y) {
            // Stomp enemy
            threeScene.remove(enemy)
            enemies = enemies.filter(e => e !== enemy)
            velocityY = 6 // Bounce
          } else {
            // Player dies
            playerDead = true
            player.visible = false
            gameTime = 0
          }
        }
      })

      // Goal collision
      if (player.position.x > config.goalX - 0.5) {
        levelComplete = true
        gameTime = 0
      }

      // Back to map
      if (input.justPressed('select') || input.justPressed('b')) {
        sceneManager.switchTo('map')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
