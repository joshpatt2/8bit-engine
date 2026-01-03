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

import { Input } from './input'
import { ClickHandler } from './click-handler'
import { SceneRenderer } from './scene-renderer'

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
  protected renderer: SceneRenderer
  protected input: Input
  protected clickHandler?: ClickHandler

  constructor(
    name: string,
    renderer: SceneRenderer,
    input: Input
  ) {
    this.name = name
    this.renderer = renderer
    this.input = input
  }

  /**
   * Add an object to the scene
   */
  protected addToScene(object: any): void {
    this.renderer.addObject(object)
  }

  /**
   * Remove an object from the scene
   */
  protected removeFromScene(object: any): void {
    this.renderer.removeObject(object)
  }

  /**
   * Initialize click handling for this screen
   */
  protected enableClickHandling(): void {
    const camera = this.renderer.getCamera()
    const scene = this.renderer.getThreeScene()
    const domElement = this.renderer.getDomElement()
    this.clickHandler = new ClickHandler(camera, scene, domElement)
  }

  /**
   * Clear all objects from the scene
   */
  protected clearScene(): void {
    this.renderer.clear()
  }

  /**
   * Set scene background color
   */
  protected setBackground(color: number): void {
    this.renderer.setBackgroundColor(color)
  }

  /**
   * Add ambient lighting to scene
   */
  protected addAmbientLight(intensity: number = 1): void {
    this.renderer.addAmbientLight(intensity)
  }

  // Abstract methods that must be implemented
  abstract onEnter(): void
  abstract onExit(): void
  abstract onUpdate(deltaTime: number): void

  // Default render implementation
  onRender(): void {
    this.renderer.render()
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
