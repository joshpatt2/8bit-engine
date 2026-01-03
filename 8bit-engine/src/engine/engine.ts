/**
 * Engine - Game Engine Initialization and Management
 * 
 * Provides a simple, high-level API for initializing the game engine.
 * Manages rendering, input, screen management, and the game loop.
 * 
 * Example usage:
 * ```typescript
 * const engine = new Engine({
 *   container: document.querySelector('#app')!,
 *   width: 256 * 3,
 *   height: 240 * 3,
 *   left: -8,
 *   right: 8,
 *   top: 6,
 *   bottom: -6
 * })
 * 
 * const screenManager = engine.getScreenManager()
 * screenManager.register(new MyScreen('my-screen', engine.getRenderer(), engine.getInput()))
 * screenManager.switchTo('my-screen')
 * 
 * engine.start()
 * ```
 */

import { SceneRenderer, type CameraConfig } from './scene-renderer'
import { Input } from './input'
import { ScreenManager } from './screen'
import { GameLoop } from './game-loop'

export interface EngineConfig {
  /** Container element for the game canvas */
  container: HTMLElement
  
  /** Canvas width in pixels */
  width: number
  
  /** Canvas height in pixels */
  height: number
  
  /** Target frames per second (default: 60) */
  targetFPS?: number
  
  /** Camera type (default: 'orthographic') */
  cameraType?: 'orthographic' | 'perspective'
  
  // Orthographic camera config
  /** Left plane boundary (default: -8) */
  left?: number
  /** Right plane boundary (default: 8) */
  right?: number
  /** Top plane boundary (default: 6) */
  top?: number
  /** Bottom plane boundary (default: -6) */
  bottom?: number
  
  // Common camera config
  /** Near clipping plane (default: 0.1) */
  near?: number
  /** Far clipping plane (default: 100 for ortho, 1000 for perspective) */
  far?: number
  
  // Perspective camera config
  /** Field of view in degrees (default: 75) */
  fov?: number
  /** Aspect ratio (default: width/height) */
  aspect?: number
}

/**
 * Main engine class that manages all core systems
 */
export class Engine {
  private sceneRenderer: SceneRenderer
  private input: Input
  private screenManager: ScreenManager
  private gameLoop: GameLoop

  constructor(config: EngineConfig) {

    // Create input system
    this.input = new Input()

    // Create camera configuration
    const cameraConfig: CameraConfig = {
      type: config.cameraType ?? 'orthographic',
      left: config.left,
      right: config.right,
      top: config.top,
      bottom: config.bottom,
      near: config.near,
      far: config.far,
      fov: config.fov,
      aspect: config.aspect,
    }

    // Create scene renderer
    this.sceneRenderer = new SceneRenderer(
      config.container,
      config.width,
      config.height,
      cameraConfig
    )

    // Create screen manager
    this.screenManager = new ScreenManager()

    // Create game loop
    this.gameLoop = new GameLoop({
      update: (dt: number) => {
        this.screenManager.update(dt)
        this.input.update()
      },
      render: () => {
        this.screenManager.render()
      },
      targetFPS: config.targetFPS ?? 60,
    })
  }

  /**
   * Get the scene renderer for creating screens
   * 
   * Pass this to screen constructors:
   * ```typescript
   * new MyScreen('my-screen', engine.getRenderer(), engine.getInput())
   * ```
   */
  getRenderer(): SceneRenderer {
    return this.sceneRenderer
  }

  /**
   * Get the input system
   * 
   * Pass this to screen constructors:
   * ```typescript
   * new MyScreen('my-screen', engine.getRenderer(), engine.getInput())
   * ```
   */
  getInput(): Input {
    return this.input
  }

  /**
   * Get the screen manager
   * 
   * Use this to register and switch between screens:
   * ```typescript
   * const screenManager = engine.getScreenManager()
   * screenManager.register(new MyScreen(...))
   * screenManager.switchTo('my-screen')
   * ```
   */
  getScreenManager(): ScreenManager {
    return this.screenManager
  }

  /**
   * Get the game loop
   * 
   * Usually you don't need this directly - use start() and stop() instead
   */
  getGameLoop(): GameLoop {
    return this.gameLoop
  }

  /**
   * Start the game loop
   * 
   * Call this after setting up your screens
   */
  start(): void {
    this.gameLoop.start()
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.gameLoop.stop()
  }

  /**
   * Get the current FPS
   */
  getFPS(): number {
    return this.gameLoop.getFPS()
  }

  /**
   * Resize the game canvas
   */
  resize(width: number, height: number): void {
    this.sceneRenderer.setSize(width, height)
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.gameLoop.stop()
    this.sceneRenderer.dispose()
  }
}
