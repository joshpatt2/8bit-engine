/**
 * Game - Core game manager
 * Encapsulates common game initialization logic:
 * - Three.js setup (scene, camera, renderer)
 * - Input system
 * - Game loop
 * - Scene management
 * - DOM/HUD setup
 * - Window resize handling
 */

import * as THREE from 'three'
import { PPU } from './technical-constraints'
import { NES_PALETTE } from './palette'
import { Input } from './input'
import { GameLoop } from './game-loop'
import { SceneManager, type Scene, type SceneType } from './scenes'

export interface GameConfig {
  container: HTMLElement
  scale?: number  // Default: 3
  title?: string  // For HUD display
  controls?: string  // Controls text for HUD
  showDebug?: boolean  // Default: true
  onUpdate?: (dt: number, game: Game) => void  // Additional update logic
  onRender?: (game: Game) => void  // Additional render logic
}

export class Game {
  // Three.js core
  public readonly scene: THREE.Scene
  public readonly camera: THREE.OrthographicCamera
  public readonly renderer: THREE.WebGLRenderer
  
  // Engine systems
  public readonly input: Input
  public readonly sceneManager: SceneManager
  public readonly gameLoop: GameLoop
  
  // Configuration
  public readonly config: Required<GameConfig>
  
  // DOM elements
  private hudElement: HTMLElement | null = null
  private debugElement: HTMLElement | null = null
  private resizeHandler: (() => void) | null = null
  
  // Dimensions
  private readonly width: number
  private readonly height: number

  constructor(config: GameConfig) {
    // Apply defaults
    this.config = {
      scale: 3,
      title: '',
      controls: '',
      showDebug: true,
      onUpdate: () => {},
      onRender: () => {},
      ...config,
    }

    // Calculate dimensions
    const scale = this.config.scale
    this.width = PPU.SCREEN_WIDTH * scale
    this.height = PPU.SCREEN_HEIGHT * scale

    // Three.js setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(NES_PALETTE.BLACK)

    // Orthographic camera for 2D
    const aspect = PPU.SCREEN_WIDTH / PPU.SCREEN_HEIGHT
    this.camera = new THREE.OrthographicCamera(-8, 8, 8 / aspect, -8 / aspect, 0.1, 100)
    this.camera.position.z = 10

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setSize(this.width, this.height)
    this.renderer.setPixelRatio(1)
    this.config.container.appendChild(this.renderer.domElement)

    // Input
    this.input = new Input()

    // Scene manager
    this.sceneManager = new SceneManager()

    // Game loop
    this.gameLoop = new GameLoop({
      update: (dt: number) => {
        this.sceneManager.update(dt)
        this.input.update()
        this.config.onUpdate(dt, this)
      },
      render: () => {
        this.sceneManager.render()
        this.config.onRender(this)
        if (this.config.showDebug && this.debugElement) {
          this.updateDebugInfo({
            FPS: this.gameLoop.getFPS(),
            Scene: this.sceneManager.getCurrentScene() || 'none',
          })
        }
      },
    })

    // Setup HUD and debug display
    this.setupDOM()

    // Setup resize handler
    this.setupResize()
  }

  private setupDOM(): void {
    // HUD
    if (this.config.title || this.config.controls) {
      this.hudElement = document.createElement('div')
      this.hudElement.id = 'hud'
      
      let hudContent = ''
      if (this.config.title) {
        hudContent += `<strong>${this.config.title}</strong>`
      }
      if (this.config.controls) {
        if (hudContent) hudContent += '<br>'
        hudContent += this.config.controls
      }
      
      this.hudElement.innerHTML = hudContent
      document.body.appendChild(this.hudElement)
    }

    // Debug
    if (this.config.showDebug) {
      this.debugElement = document.createElement('div')
      this.debugElement.id = 'debug'
      document.body.appendChild(this.debugElement)
    }
  }

  private setupResize(): void {
    this.resizeHandler = () => {
      const scale = Math.min(
        window.innerWidth / this.width,
        window.innerHeight / this.height
      ) * 0.9
      this.renderer.domElement.style.width = `${this.width * scale}px`
      this.renderer.domElement.style.height = `${this.height * scale}px`
    }

    window.addEventListener('resize', this.resizeHandler)
    this.resizeHandler() // Initial call
  }

  // Lifecycle methods
  public start(): void {
    this.gameLoop.start()
  }

  public stop(): void {
    this.gameLoop.stop()
  }

  public destroy(): void {
    // Stop game loop
    this.gameLoop.stop()

    // Remove resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }

    // Destroy input
    this.input.destroy()

    // Remove DOM elements
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement)
      this.hudElement = null
    }
    if (this.debugElement && this.debugElement.parentNode) {
      this.debugElement.parentNode.removeChild(this.debugElement)
      this.debugElement = null
    }

    // Remove renderer from container
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }

    // Dispose Three.js resources
    this.renderer.dispose()
  }

  // Scene management helpers
  public registerScene(scene: Scene): void {
    this.sceneManager.register(scene)
  }

  public switchToScene(sceneName: SceneType): void {
    this.sceneManager.switchTo(sceneName)
  }

  // HUD/Debug helpers
  public updateHUD(html: string): void {
    if (this.hudElement) {
      this.hudElement.innerHTML = html
    }
  }

  public updateDebugInfo(info: Record<string, any>): void {
    if (this.debugElement) {
      const lines = Object.entries(info).map(([key, value]) => `${key}: ${value}`)
      this.debugElement.innerHTML = lines.join(' | ')
    }
  }

  // Utility
  public getFPS(): number {
    return this.gameLoop.getFPS()
  }

  public getCurrentScene(): SceneType | null {
    return this.sceneManager.getCurrentScene()
  }
}
