/**
 * 8BIT QUEST - Test Game
 * Demonstrates the 8bit-engine with:
 * - Title screen
 * - World map (SMB3-style)
 * - 3 Platformer levels
 */

import * as THREE from 'three'
import { 
  Engine,
  BaseScreen,
  PPU,
  NES_PALETTE,
  TitleScreen,
  WorldMap,
  type WorldMapConfig,
  type MapNode,
  createLabel,
  AnimatedSprite,
  type Input
} from '../engine'
import type { SceneRenderer } from '../engine/scene-renderer'

// Level completion tracking
interface LevelStatus {
  level1: 'locked' | 'unlocked' | 'complete'
  level2: 'locked' | 'unlocked' | 'complete'
  level3: 'locked' | 'unlocked' | 'complete'
}

const levelStatus: LevelStatus = {
  level1: 'unlocked',
  level2: 'locked',
  level3: 'locked',
}

// =============================================================================
// TITLE SCREEN
// =============================================================================

class GameTitleScreen extends TitleScreen {
  private stars: THREE.Mesh[] = []
  private decorations: THREE.Mesh[] = []

  constructor(renderer: SceneRenderer, input: Input, onStart: () => void) {
    super('title', renderer, input, {
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
          onStart()
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
          this.stars.push(star)
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
          this.decorations.push(block)
        }
      },
      
      // Game-specific visual updates
      onUpdateVisuals: (_deltaTime: number, elapsedTime: number) => {
        // Twinkle stars
        this.stars.forEach((star, i) => {
          star.visible = Math.sin(elapsedTime * 3 + i) > -0.3
        })
        
        // Optionally animate decorations
        this.decorations.forEach((block, i) => {
          block.rotation.z = Math.PI / 4 + Math.sin(elapsedTime + i) * 0.1
        })
      },
      
      // Game-specific cleanup
      onCleanupVisuals: () => {
        this.stars = []
        this.decorations = []
      },
    })
  }
}

// =============================================================================
// MAP SCREEN
// =============================================================================

class GameMapScreen extends BaseScreen {
  private worldMap?: WorldMap
  private levelNameLabel?: ReturnType<typeof createLabel>

  onEnter(): void {
    this.clearScene()
    this.setBackground(NES_PALETTE.LIME)
    this.addAmbientLight()

    // Get THREE.Scene for WorldMap (uses escape hatch)
    const threeScene = this.renderer.getThreeScene()

    // Ground texture (grass tiles in checkered pattern)
    for (let x = -8; x <= 8; x += 2) {
      for (let y = -6; y <= 6; y += 2) {
        const tileGeo = new THREE.PlaneGeometry(1.8, 1.8)
        const shade = ((x + y) % 4 === 0) ? NES_PALETTE.GREEN : NES_PALETTE.LIME
        const tileMat = new THREE.MeshBasicMaterial({ color: shade })
        const tile = new THREE.Mesh(tileGeo, tileMat)
        tile.position.set(x, y, -0.1)
        threeScene.add(tile)
      }
    }

    const nodes: MapNode[] = [
      {
        id: 'start',
        name: 'START',
        type: 'start',
        status: 'complete',
        position: { x: -4, y: -2 },
        connections: ['level1']
      },
      {
        id: 'level1',
        name: 'LEVEL 1: PLAINS',
        type: 'level',
        status: 'unlocked',
        position: { x: -1, y: 1 },
        connections: ['level2'],
        color: NES_PALETTE.BLUE,
      },
      {
        id: 'level2',
        name: 'LEVEL 2: CAVE',
        type: 'level',
        status: levelStatus.level2,
        position: { x: 2, y: -1 },
        connections: ['level3'],
        color: NES_PALETTE.PURPLE,
      },
      {
        id: 'level3',
        name: 'LEVEL 3: CASTLE',
        type: 'boss',
        status: levelStatus.level3,
        position: { x: 5, y: 1 },
        connections: [],
        color: NES_PALETTE.GRAY,
      }
    ]

    const mapConfig: WorldMapConfig = {
      nodes,
      startNodeId: 'start',
      backgroundColor: NES_PALETTE.LIME,
      pathColor: NES_PALETTE.TAN,
      showLockedPaths: true,
      player: {
        startNodeId: 'start',
        sprite: '/src/game/sprites/player/corgi_4x4_left_ear_anim.png',
        color: NES_PALETTE.RED,
        spriteLayout: { cols: 2, rows: 2 }
      }
    }

    this.worldMap = new WorldMap(threeScene, mapConfig)

    // Draw dotted paths between levels
    const levelPositions = [
      { x: -4, y: -2 },  // Start
      { x: -1, y: 1 },   // Level 1
      { x: 2, y: -1 },   // Level 2
      { x: 5, y: 1 },    // Level 3
    ]
    
    for (let i = 0; i < levelPositions.length - 1; i++) {
      const start = levelPositions[i]
      const end = levelPositions[i + 1]

      const segments = 8
      for (let s = 0; s < segments; s++) {
        const t = s / segments
        const x = start.x + (end.x - start.x) * t
        const y = start.y + (end.y - start.y) * t

        const dotGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1)
        const dotMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.TAN })
        const dot = new THREE.Mesh(dotGeo, dotMat)
        dot.position.set(x, y, 0)
        threeScene.add(dot)
      }
    }

    // Add decorative trees
    const treePositions = [
      { x: -6, y: 3 }, { x: 6, y: 2 }, { x: -2, y: -3 },
      { x: 5, y: -4 }, { x: -5, y: -1 }
    ]
    treePositions.forEach(pos => {
      // Tree trunk
      const trunkGeo = new THREE.BoxGeometry(0.3, 0.6, 0.3)
      const trunkMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.BROWN })
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.set(pos.x, pos.y - 0.2, 0)
      threeScene.add(trunk)

      // Tree top
      const topGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
      const topMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_GREEN })
      const top = new THREE.Mesh(topGeo, topMat)
      top.position.set(pos.x, pos.y + 0.4, 0)
      threeScene.add(top)
    })

    // Level name label
    this.levelNameLabel = createLabel({
      text: 'WORLD MAP',
      color: NES_PALETTE.WHITE,
      scale: 0.12
    })
    this.levelNameLabel.setPosition(0, -5.5, 10)
    this.addToScene(this.levelNameLabel.group)

    // Reset camera
    const camera = this.renderer.getCamera()
    camera.position.set(0, 0, 10)
  }

  onUpdate(deltaTime: number): void {
    if (!this.worldMap) return

    this.worldMap.update(deltaTime, this.input)

    const currentNode = this.worldMap.getCurrentNode()
    if (currentNode && this.levelNameLabel) {
      this.levelNameLabel.setText(currentNode.name)
    }

    if (this.input.justPressed('a') || this.input.justPressed('start')) {
      const currentNode = this.worldMap.getCurrentNode()
      if (currentNode && currentNode.status === 'unlocked') {
        // Navigate to level based on node ID
        const screenManager = (this.renderer as any)._screenManager
        if (screenManager) {
          if (currentNode.id === 'level1') {
            screenManager.switchTo('level1')
          } else if (currentNode.id === 'level2') {
            screenManager.switchTo('level2')
          } else if (currentNode.id === 'level3') {
            screenManager.switchTo('level3')
          }
        }
      }
    }

    if (this.input.justPressed('b')) {
      const screenManager = (this.renderer as any)._screenManager
      if (screenManager) {
        screenManager.switchTo('title')
      }
    }
  }

  onExit(): void {
    this.worldMap?.destroy()
    this.levelNameLabel?.destroy()
    this.clearScene()
  }
}

// =============================================================================
// LEVEL SCREENS
// =============================================================================

interface LevelConfig {
  name: string
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

class LevelScreen extends BaseScreen {
  private config: LevelConfig
  private playerSprite?: AnimatedSprite
  private playerHitbox?: THREE.Mesh
  private platforms: THREE.Mesh[] = []
  private enemies: THREE.Mesh[] = []
  private goal?: THREE.Mesh
  private ground?: THREE.Mesh
  private velocityX = 0
  private velocityY = 0
  private isGrounded = false
  private gameTime = 0
  private levelComplete = false
  private playerDead = false
  private onComplete: () => void

  private readonly GRAVITY = 25
  private readonly JUMP_FORCE = 10
  private readonly MOVE_SPEED = 5
  private readonly FRICTION = 0.85

  constructor(
    levelKey: string,
    renderer: SceneRenderer,
    input: Input,
    onComplete: () => void
  ) {
    super(levelKey, renderer, input)
    this.config = LEVEL_CONFIGS[levelKey]
    this.onComplete = onComplete
  }

  onEnter(): void {
    this.clearScene()
    this.platforms = []
    this.enemies = []
    this.levelComplete = false
    this.playerDead = false
    this.gameTime = 0

    const threeScene = this.renderer.getThreeScene()

    // Background
    this.setBackground(this.config.backgroundColor)
    this.addAmbientLight()

    // Ground
    const groundGeo = new THREE.BoxGeometry(20, 1, 1)
    const groundMat = new THREE.MeshBasicMaterial({ color: this.config.groundColor })
    this.ground = new THREE.Mesh(groundGeo, groundMat)
    this.ground.position.set(0, -4.5, 0)
    threeScene.add(this.ground)

    // Platforms
    this.config.platforms.forEach(p => {
      const platGeo = new THREE.BoxGeometry(p.width, 0.5, 0.5)
      const platMat = new THREE.MeshBasicMaterial({ color: this.config.platformColor })
      const plat = new THREE.Mesh(platGeo, platMat)
      plat.position.set(p.x, p.y, 0)
      plat.userData = { width: p.width, height: 0.5 }
      threeScene.add(plat)
      this.platforms.push(plat)
    })

    // Enemies
    this.config.enemies.forEach(e => {
      const enemyGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6)
      const enemyMat = new THREE.MeshBasicMaterial({ color: this.config.enemyColor })
      const enemy = new THREE.Mesh(enemyGeo, enemyMat)
      enemy.position.set(e.x, e.y, 0)
      enemy.userData = { startX: e.x, direction: 1 }
      threeScene.add(enemy)
      this.enemies.push(enemy)
    })

    // Goal
    const goalGeo = new THREE.BoxGeometry(0.3, 2, 0.3)
    const goalMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
    this.goal = new THREE.Mesh(goalGeo, goalMat)
    this.goal.position.set(this.config.goalX, -3, 0)
    threeScene.add(this.goal)

    // Goal flag top
    const flagGeo = new THREE.BoxGeometry(0.8, 0.5, 0.1)
    const flagMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.RED })
    const flag = new THREE.Mesh(flagGeo, flagMat)
    flag.position.set(this.config.goalX + 0.4, -2.2, 0)
    threeScene.add(flag)

    // Player (animated sprite)
    this.playerSprite = new AnimatedSprite(threeScene, {
      sprite: '/src/game/sprites/player/corgi_4x4_left_ear_anim.png',
      color: NES_PALETTE.BLUE,
      size: { width: 1, height: 1, depth: 0.5 },
      spriteLayout: { cols: 2, rows: 2 },
      animSpeed: 0.15,
      autoAnimate: true
    })
    this.playerSprite.setPosition(-7, -3, 0.5)
    
    // Invisible hitbox for collision detection
    const hitboxGeo = new THREE.BoxGeometry(0.8, 1, 0.8)
    const hitboxMat = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0
    })
    this.playerHitbox = new THREE.Mesh(hitboxGeo, hitboxMat)
    this.playerHitbox.position.set(-7, -3, 0)
    threeScene.add(this.playerHitbox)

    this.velocityX = 0
    this.velocityY = 0
    this.isGrounded = false
  }

  onUpdate(deltaTime: number): void {
    if (this.levelComplete || this.playerDead) {
      this.gameTime += deltaTime
      if (this.gameTime > 2) {
        if (this.levelComplete) {
          this.onComplete()
          const screenManager = (this.renderer as any)._screenManager
          if (screenManager) {
            screenManager.switchTo('map')
          }
        } else {
          // Respawn
          if (this.playerHitbox && this.playerSprite) {
            this.playerHitbox.position.set(-7, -3, 0)
            this.playerSprite.setPosition(-7, -3, 0.5)
            this.velocityX = 0
            this.velocityY = 0
            this.playerDead = false
            this.playerSprite.setVisible(true)
            this.gameTime = 0
          }
        }
      }
      return
    }

    this.gameTime += deltaTime
    
    // Update sprite animation
    this.playerSprite?.update(deltaTime)

    // Input
    if (this.input.isPressed('left')) {
      this.velocityX = -this.MOVE_SPEED
      this.playerSprite?.setFlipX(true)
    } else if (this.input.isPressed('right')) {
      this.velocityX = this.MOVE_SPEED
      this.playerSprite?.setFlipX(false)
    } else {
      this.velocityX *= this.FRICTION
    }

    // Jump
    if (this.input.justPressed('a') && this.isGrounded) {
      this.velocityY = this.JUMP_FORCE
      this.isGrounded = false
    }

    // Gravity
    this.velocityY -= this.GRAVITY * deltaTime

    // Move player hitbox
    if (this.playerHitbox) {
      this.playerHitbox.position.x += this.velocityX * deltaTime
      this.playerHitbox.position.y += this.velocityY * deltaTime

      // Ground collision
      if (this.playerHitbox.position.y <= -3.5) {
        this.playerHitbox.position.y = -3.5
        this.velocityY = 0
        this.isGrounded = true
      }

      // Platform collisions
      this.platforms.forEach(plat => {
        const pw = plat.userData.width
        const ph = plat.userData.height

        if (
          this.playerHitbox!.position.x > plat.position.x - pw / 2 - 0.4 &&
          this.playerHitbox!.position.x < plat.position.x + pw / 2 + 0.4 &&
          this.playerHitbox!.position.y > plat.position.y &&
          this.playerHitbox!.position.y < plat.position.y + ph + 0.5 &&
          this.velocityY < 0
        ) {
          this.playerHitbox!.position.y = plat.position.y + ph / 2 + 0.5
          this.velocityY = 0
          this.isGrounded = true
        }
      })

      // Bounds
      this.playerHitbox.position.x = Math.max(-8, Math.min(8, this.playerHitbox.position.x))
      
      // Sync sprite position with hitbox
      this.playerSprite?.setPosition(this.playerHitbox.position.x, this.playerHitbox.position.y, 0.5)
    }

    // Enemy movement and collision
    this.enemies.forEach(enemy => {
      // Patrol
      enemy.position.x += enemy.userData.direction * 1.5 * deltaTime
      if (Math.abs(enemy.position.x - enemy.userData.startX) > 2) {
        enemy.userData.direction *= -1
      }

      // Collision with player
      if (this.playerHitbox && this.checkCollision(
        this.playerHitbox.position.x - 0.4, this.playerHitbox.position.y - 0.5, 0.8, 1,
        enemy.position.x - 0.3, enemy.position.y - 0.3, 0.6, 0.6
      )) {
        // Check if stomping
        if (this.velocityY < 0 && this.playerHitbox.position.y > enemy.position.y) {
          // Stomp enemy
          const threeScene = this.renderer.getThreeScene()
          threeScene.remove(enemy)
          this.enemies = this.enemies.filter(e => e !== enemy)
          this.velocityY = 6 // Bounce
        } else {
          // Player dies
          this.playerDead = true
          this.playerSprite?.setVisible(false)
          this.gameTime = 0
        }
      }
    })

    // Goal collision
    if (this.playerHitbox && this.playerHitbox.position.x > this.config.goalX - 0.5) {
      this.levelComplete = true
      this.gameTime = 0
    }

    // Back to map
    if (this.input.justPressed('select') || this.input.justPressed('b')) {
      const screenManager = (this.renderer as any)._screenManager
      if (screenManager) {
        screenManager.switchTo('map')
      }
    }
  }

  private checkCollision(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  onExit(): void {
    this.playerSprite?.destroy()
    this.platforms = []
    this.enemies = []
    this.clearScene()
  }
}

// =============================================================================
// GAME INITIALIZATION
// =============================================================================

export function startGame(container: HTMLElement): void {
  // NES resolution scaled up
  const SCALE = 3
  const WIDTH = PPU.SCREEN_WIDTH * SCALE
  const HEIGHT = PPU.SCREEN_HEIGHT * SCALE

  // Create engine
  const aspect = PPU.SCREEN_WIDTH / PPU.SCREEN_HEIGHT
  const engine = new Engine({
    container,
    width: WIDTH,
    height: HEIGHT,
    left: -8,
    right: 8,
    top: 8 / aspect,
    bottom: -8 / aspect,
  })

  const renderer = engine.getRenderer()
  const input = engine.getInput()
  const screenManager = engine.getScreenManager()

  // Store screenManager reference for screens (hack for now)
  ;(renderer as any)._screenManager = screenManager

  // Create and register screens
  const titleScreen = new GameTitleScreen(renderer, input, () => {
    screenManager.switchTo('map')
  })
  screenManager.register(titleScreen)

  const mapScreen = new GameMapScreen('map', renderer, input)
  screenManager.register(mapScreen)

  const level1Screen = new LevelScreen('level1', renderer, input, () => {
    levelStatus.level1 = 'complete'
    levelStatus.level2 = 'unlocked'
    // Update map node status
    const mapScreenInstance = screenManager.getScreen('map') as GameMapScreen
    if (mapScreenInstance) {
      // Trigger re-enter to update status
      mapScreenInstance.onExit()
      mapScreenInstance.onEnter()
    }
  })
  screenManager.register(level1Screen)

  const level2Screen = new LevelScreen('level2', renderer, input, () => {
    levelStatus.level2 = 'complete'
    levelStatus.level3 = 'unlocked'
    const mapScreenInstance = screenManager.getScreen('map') as GameMapScreen
    if (mapScreenInstance) {
      mapScreenInstance.onExit()
      mapScreenInstance.onEnter()
    }
  })
  screenManager.register(level2Screen)

  const level3Screen = new LevelScreen('level3', renderer, input, () => {
    levelStatus.level3 = 'complete'
    console.log('🎉 Game Complete!')
  })
  screenManager.register(level3Screen)

  // Start at title
  screenManager.switchTo('title')

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

  // Update debug display
  setInterval(() => {
    debug.innerHTML = `FPS: ${engine.getFPS()} | Screen: ${screenManager.getCurrentScreenName()}`
  }, 100)

  // Start engine
  engine.start()

  // Resize handler
  function handleResize() {
    const scale = Math.min(
      window.innerWidth / WIDTH,
      window.innerHeight / HEIGHT
    ) * 0.9
    renderer.getDomElement().style.width = `${WIDTH * scale}px`
    renderer.getDomElement().style.height = `${HEIGHT * scale}px`
  }

  window.addEventListener('resize', handleResize)
  handleResize()
}
