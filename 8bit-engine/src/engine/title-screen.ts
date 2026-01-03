/**
 * Title Screen
 * Reusable title/menu screen component for game engines
 * 
 * Features:
 * - Animated title text
 * - Menu options with keyboard/mouse input
 * - Lifecycle hooks for custom visual elements
 * - Blinking/pulsing elements
 * 
 * Design Philosophy:
 * - Engine provides structure (title, menu, animations)
 * - Game provides content (backgrounds, decorations, effects)
 */

import * as THREE from 'three'
import { BaseScreen } from './screen'
import { NES_PALETTE } from './palette'
import { createBitmapText, BitmapTextStyles } from './bitmap-font'
import { createButton, type Button } from './ui-components'

// =============================================================================
// TYPES
// =============================================================================

export interface TitleScreenConfig {
  /** Main title text */
  title: string
  
  /** Title text color (default: YELLOW) */
  titleColor?: number
  
  /** Background color (default: DARK_BLUE) */
  backgroundColor?: number
  
  /** Menu options */
  menuOptions?: TitleMenuOption[]
  
  /** Callback when menu option is selected */
  onSelectOption?: (optionId: string) => void
  
  /** Optional: Custom setup for visual elements (backgrounds, effects, etc) */
  onSetupVisuals?: (scene: THREE.Scene) => void
  
  /** Optional: Custom update logic for visual elements */
  onUpdateVisuals?: (deltaTime: number, elapsedTime: number) => void
  
  /** Optional: Custom cleanup for visual elements */
  onCleanupVisuals?: () => void
}

export interface TitleMenuOption {
  id: string
  text: string
  color?: number
  blinking?: boolean
}

// =============================================================================
// TITLE SCREEN CLASS
// =============================================================================

export class TitleScreen extends BaseScreen {
  private config: Required<TitleScreenConfig>
  private titleText?: THREE.Group
  private menuButtons: Map<string, Button> = new Map()
  private blinkTimer = 0
  private elapsedTime = 0
  private onSelectCallback?: (optionId: string) => void

  constructor(
    name: string,
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    input: any,
    config: TitleScreenConfig
  ) {
    super(name, scene, camera, renderer, input)
    
    // Apply defaults
    this.config = {
      title: config.title,
      titleColor: config.titleColor ?? NES_PALETTE.YELLOW,
      backgroundColor: config.backgroundColor ?? NES_PALETTE.DARK_BLUE,
      menuOptions: config.menuOptions ?? [],
      onSelectOption: config.onSelectOption ?? (() => {}),
      onSetupVisuals: config.onSetupVisuals ?? (() => {}),
      onUpdateVisuals: config.onUpdateVisuals ?? (() => {}),
      onCleanupVisuals: config.onCleanupVisuals ?? (() => {}),
    }
    
    this.onSelectCallback = config.onSelectOption
  }

  onEnter(): void {
    this.clearScene()
    this.setBackground(this.config.backgroundColor)
    this.addAmbientLight()
    this.enableClickHandling()
    
    // Allow game to setup custom visual elements
    this.config.onSetupVisuals(this.scene)
    
    // Create core UI elements
    this.createTitle()
    this.createMenu()
    
    this.blinkTimer = 0
    this.elapsedTime = 0
  }

  onExit(): void {
    this.menuButtons.clear()
    
    // Allow game to cleanup custom visual elements
    this.config.onCleanupVisuals()
    
    if (this.clickHandler) {
      this.clickHandler.destroy()
    }
  }

  onUpdate(deltaTime: number): void {
    this.blinkTimer += deltaTime
    this.elapsedTime += deltaTime
    
    // Animate title
    if (this.titleText) {
      this.titleText.rotation.y = Math.sin(this.blinkTimer * 0.5) * 0.1
    }
    
    // Allow game to update custom visual elements
    this.config.onUpdateVisuals(deltaTime, this.elapsedTime)
    
    // Blink menu options
    this.blinkMenuOptions()
    
    // Handle keyboard input for menu
    this.handleMenuInput()
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private createTitle(): void {
    this.titleText = createBitmapText(
      this.config.title,
      BitmapTextStyles.title(this.config.titleColor)
    )
    this.titleText.position.set(0, 2, 0)
    this.scene.add(this.titleText)
  }

  private createMenu(): void {
    if (this.config.menuOptions.length === 0) return
    
    const startY = -2
    const spacing = -1.5
    
    this.config.menuOptions.forEach((option, index) => {
      const button = createButton({
        text: option.text,
        textColor: option.color ?? NES_PALETTE.WHITE,
        backgroundColor: this.config.backgroundColor,
        borderColor: NES_PALETTE.CYAN,
        padding: 0.2,
        borderThickness: 0.08,
        textStyle: BitmapTextStyles.subtitle(option.color ?? NES_PALETTE.WHITE),
        onClick: () => {
          if (this.onSelectCallback) {
            this.onSelectCallback(option.id)
          }
        },
      })
      
      button.setPosition(0, startY + (index * spacing), 0)
      this.scene.add(button.group)
      this.menuButtons.set(option.id, button)
    })
  }

  private blinkMenuOptions(): void {
    this.config.menuOptions.forEach((option) => {
      if (option.blinking) {
        const button = this.menuButtons.get(option.id)
        if (button) {
          const isVisible = Math.floor(this.blinkTimer * 2) % 2 === 0
          button.setVisible(isVisible)
        }
      }
    })
  }

  private handleMenuInput(): void {
    // Check for any button press to select first option
    if (this.config.menuOptions.length > 0) {
      if (this.input.justPressed('start') || this.input.justPressed('a')) {
        const firstOption = this.config.menuOptions[0]
        if (this.onSelectCallback) {
          this.onSelectCallback(firstOption.id)
        }
      }
    }
  }

  // =============================================================================
  // PUBLIC API - For accessing elapsed time in animations
  // =============================================================================

  /**
   * Get the current elapsed time since screen entered
   */
  public getElapsedTime(): number {
    return this.elapsedTime
  }

  /**
   * Get the blink timer value (useful for synchronized animations)
   */
  public getBlinkTimer(): number {
    return this.blinkTimer
  }
}
