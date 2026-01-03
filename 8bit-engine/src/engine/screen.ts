/**
 * Screen System
 * Higher-level abstraction for game screens/states
 * 
 * Screens represent distinct game states like:
 * - Title screen
 * - World map
 * - Level gameplay
 * - Pause menu
 * - Game over
 * 
 * This provides a cleaner, more structured alternative to raw scenes
 */

import * as THREE from 'three'
import { Input } from './input'
import { ClickHandler } from './click-handler'

// =============================================================================
// SCREEN INTERFACE
// =============================================================================

export interface Screen {
  /** Unique identifier for this screen */
  name: string

  /** Called when entering this screen */
  onEnter(): void

  /** Called when exiting this screen */
  onExit(): void

  /** Called every frame with delta time in seconds */
  onUpdate(deltaTime: number): void

  /** Called every frame to render */
  onRender(): void

  /** Optional: Called when screen is paused (another screen pushed on top) */
  onPause?(): void

  /** Optional: Called when screen is resumed (top screen was popped) */
  onResume?(): void
}

// =============================================================================
// BASE SCREEN CLASS
// =============================================================================

export abstract class BaseScreen implements Screen {
  public readonly name: string
  protected scene: THREE.Scene
  protected camera: THREE.Camera
  protected renderer: THREE.WebGLRenderer
  protected input: Input
  protected clickHandler?: ClickHandler

  constructor(
    name: string,
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    input: Input
  ) {
    this.name = name
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.input = input
  }

  /**
   * Initialize click handling for this screen
   */
  protected enableClickHandling(): void {
    this.clickHandler = new ClickHandler(this.camera, this.scene, this.renderer.domElement)
  }

  /**
   * Clear all objects from the scene
   */
  protected clearScene(): void {
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0]
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose())
          } else {
            obj.material.dispose()
          }
        }
      }
      this.scene.remove(obj)
    }
  }

  /**
   * Set scene background color
   */
  protected setBackground(color: number): void {
    this.scene.background = new THREE.Color(color)
  }

  /**
   * Add ambient lighting to scene
   */
  protected addAmbientLight(intensity: number = 1): void {
    const light = new THREE.AmbientLight(0xffffff, intensity)
    this.scene.add(light)
  }

  // Abstract methods that must be implemented
  abstract onEnter(): void
  abstract onExit(): void
  abstract onUpdate(deltaTime: number): void

  // Default render implementation
  onRender(): void {
    this.renderer.render(this.scene, this.camera)
  }

  // Optional lifecycle methods
  onPause?(): void
  onResume?(): void
}

// =============================================================================
// SCREEN MANAGER
// =============================================================================

export type ScreenTransition = 'switch' | 'push' | 'pop'

export class ScreenManager {
  private screens: Map<string, Screen> = new Map()
  private screenStack: Screen[] = []
  private currentScreen: Screen | null = null

  /**
   * Register a screen
   */
  register(screen: Screen): void {
    this.screens.set(screen.name, screen)
  }

  /**
   * Get a registered screen by name
   */
  getScreen(name: string): Screen | undefined {
    return this.screens.get(name)
  }

  /**
   * Switch to a screen (replaces current screen entirely)
   */
  switchTo(screenName: string): void {
    const nextScreen = this.screens.get(screenName)
    if (!nextScreen) {
      console.error(`Screen "${screenName}" not found`)
      return
    }

    // Exit current screen
    if (this.currentScreen) {
      this.currentScreen.onExit()
    }

    // Clear stack
    this.screenStack = []

    // Enter new screen
    this.currentScreen = nextScreen
    this.currentScreen.onEnter()
  }

  /**
   * Push a screen on top of current (like a modal/pause menu)
   * Current screen is paused but not exited
   */
  push(screenName: string): void {
    const nextScreen = this.screens.get(screenName)
    if (!nextScreen) {
      console.error(`Screen "${screenName}" not found`)
      return
    }

    // Pause current screen
    if (this.currentScreen) {
      this.currentScreen.onPause?.()
      this.screenStack.push(this.currentScreen)
    }

    // Enter new screen
    this.currentScreen = nextScreen
    this.currentScreen.onEnter()
  }

  /**
   * Pop the current screen and return to previous
   */
  pop(): void {
    if (this.screenStack.length === 0) {
      console.warn('Cannot pop: screen stack is empty')
      return
    }

    // Exit current screen
    if (this.currentScreen) {
      this.currentScreen.onExit()
    }

    // Resume previous screen
    this.currentScreen = this.screenStack.pop()!
    this.currentScreen.onResume?.()
  }

  /**
   * Get the current active screen name
   */
  getCurrentScreenName(): string | null {
    return this.currentScreen?.name || null
  }

  /**
   * Get the full screen stack (for debugging)
   */
  getScreenStack(): string[] {
    return this.screenStack.map(s => s.name)
  }

  /**
   * Update the current screen
   */
  update(deltaTime: number): void {
    if (this.currentScreen) {
      this.currentScreen.onUpdate(deltaTime)
    }
  }

  /**
   * Render the current screen
   */
  render(): void {
    if (this.currentScreen) {
      this.currentScreen.onRender()
    }
  }

  /**
   * Check if a screen is currently active
   */
  isScreenActive(screenName: string): boolean {
    return this.currentScreen?.name === screenName
  }

  /**
   * Check if any screens are on the stack
   */
  hasScreensOnStack(): boolean {
    return this.screenStack.length > 0
  }
}

// =============================================================================
// SCREEN FACTORY HELPERS
// =============================================================================

/**
 * Helper to create a simple screen from functions
 */
export function createScreen(config: {
  name: string
  onEnter: () => void
  onExit: () => void
  onUpdate: (dt: number) => void
  onRender: () => void
  onPause?: () => void
  onResume?: () => void
}): Screen {
  return {
    name: config.name,
    onEnter: config.onEnter,
    onExit: config.onExit,
    onUpdate: config.onUpdate,
    onRender: config.onRender,
    onPause: config.onPause,
    onResume: config.onResume,
  }
}

/**
 * Screen transition effects (optional enhancement)
 */
export const ScreenTransitionEffect = {
  None: 'none',
  Fade: 'fade',
  Slide: 'slide',
  Dissolve: 'dissolve',
} as const

export type ScreenTransitionEffect = typeof ScreenTransitionEffect[keyof typeof ScreenTransitionEffect]

/**
 * Configuration for screen transitions
 */
export interface ScreenTransitionConfig {
  effect: ScreenTransitionEffect
  duration: number // in seconds
}
