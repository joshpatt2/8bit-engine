/**
 * UI Components
 * Higher-level reusable UI elements for NES-style games
 * 
 * Provides common patterns like buttons, title cards, text boxes, etc.
 * All components follow NES constraints and aesthetic
 */

import * as THREE from 'three'
import { createBitmapText } from './bitmap-font'
import type { BitmapTextOptions } from './bitmap-font'

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export interface ButtonOptions {
  text: string
  textColor?: number
  backgroundColor?: number
  borderColor?: number
  padding?: number
  borderThickness?: number
  textStyle?: BitmapTextOptions
  onClick?: () => void
}

export interface Button {
  group: THREE.Group
  text: THREE.Group
  background: THREE.Mesh
  border: THREE.Mesh
  hitArea: THREE.Mesh  // Invisible mesh for click detection
  onClick?: () => void
  setVisible: (visible: boolean) => void
  setPosition: (x: number, y: number, z?: number) => void
  destroy: () => void
}

/**
 * Create a bordered button with text
 * Returns a group containing the button and methods to control it
 */
export function createButton(options: ButtonOptions): Button {
  const {
    text,
    textColor = 0xffffff,
    backgroundColor = 0x000000,
    borderColor = 0xffffff,
    padding = 0.2,
    borderThickness = 0.08,
    textStyle,
  } = options

  const group = new THREE.Group()

  // Calculate dimensions based on text
  const scale = textStyle?.scale || 0.1
  const letterSpacing = textStyle?.letterSpacing || 0
  const charCount = text.length
  const charWidth = 8 * scale
  const textWidth = (charCount * charWidth) + ((charCount - 1) * letterSpacing)
  const textHeight = 8 * scale

  // Position offset for centered box
  const boxYOffset = -textHeight / 2

  // Create text - centered both horizontally and vertically
  const textMesh = createBitmapText(text, {
    color: textColor,
    align: 'center',
    ...textStyle,
  })
  // Position text centered in box
  // Horizontal: text is offset by -0.5*scale due to character positioning math
  // Vertical: font glyphs use rows 0-6 (row 7 empty), so visual center is at -3*scale
  textMesh.position.x = padding
  textMesh.position.y = boxYOffset + 3 * scale
  group.add(textMesh)

  // Background
  const bgGeo = new THREE.PlaneGeometry(
    textWidth + padding * 2,
    textHeight + padding * 2
  )
  const bgMat = new THREE.MeshBasicMaterial({ color: backgroundColor })
  const background = new THREE.Mesh(bgGeo, bgMat)
  background.position.set(0, boxYOffset, -0.1)
  group.add(background)

  // Border
  const borderGeo = new THREE.PlaneGeometry(
    textWidth + padding * 2 + borderThickness * 2,
    textHeight + padding * 2 + borderThickness * 2
  )
  const borderMat = new THREE.MeshBasicMaterial({ color: borderColor })
  const border = new THREE.Mesh(borderGeo, borderMat)
  border.position.set(0, boxYOffset, -0.2)
  group.add(border)

  // Hit area - invisible mesh for click detection
  const hitAreaGeo = new THREE.PlaneGeometry(
    textWidth + padding * 2 + borderThickness * 2,
    textHeight + padding * 2 + borderThickness * 2
  )
  const hitAreaMat = new THREE.MeshBasicMaterial({
    visible: false,
    transparent: true,
    opacity: 0,
  })
  const hitArea = new THREE.Mesh(hitAreaGeo, hitAreaMat)
  hitArea.position.set(0, boxYOffset, 0.1)
  hitArea.userData.isButton = true
  hitArea.userData.onClick = options.onClick
  group.add(hitArea)

  return {
    group,
    text: textMesh,
    background,
    border,
    hitArea,
    onClick: options.onClick,
    setVisible: (visible: boolean) => {
      group.visible = visible
    },
    setPosition: (x: number, y: number, z: number = 0) => {
      group.position.set(x, y, z)
    },
    destroy: () => {
      // Dispose geometries and materials
      background.geometry.dispose()
      if (background.material instanceof THREE.Material) {
        background.material.dispose()
      }
      border.geometry.dispose()
      if (border.material instanceof THREE.Material) {
        border.material.dispose()
      }
      hitArea.geometry.dispose()
      if (hitArea.material instanceof THREE.Material) {
        hitArea.material.dispose()
      }
      // Dispose text meshes
      textMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      group.parent?.remove(group)
    },
  }
}

// =============================================================================
// TITLE CARD COMPONENT
// =============================================================================

export interface TitleCardOptions {
  title: string
  subtitle?: string
  titleColor?: number
  subtitleColor?: number
  titleScale?: number
  subtitleScale?: number
}

export interface TitleCard {
  group: THREE.Group
  title: THREE.Group
  subtitle?: THREE.Group
  setVisible: (visible: boolean) => void
  setPosition: (x: number, y: number, z?: number) => void
  destroy: () => void
}

/**
 * Create a title card with optional subtitle
 */
export function createTitleCard(options: TitleCardOptions): TitleCard {
  const {
    title,
    subtitle,
    titleColor = 0xffffff,
    subtitleColor = 0xaaaaaa,
    titleScale = 0.15,
    subtitleScale = 0.08,
  } = options

  const group = new THREE.Group()

  // Title text
  const titleMesh = createBitmapText(title, {
    color: titleColor,
    scale: titleScale,
    align: 'center',
  })
  titleMesh.position.set(0, 0, 0)
  group.add(titleMesh)

  let subtitleMesh: THREE.Group | undefined

  // Optional subtitle
  if (subtitle) {
    subtitleMesh = createBitmapText(subtitle, {
      color: subtitleColor,
      scale: subtitleScale,
      align: 'center',
    })
    // Position subtitle below title
    const titleHeight = 8 * titleScale
    subtitleMesh.position.set(0, -(titleHeight + 0.3), 0)
    group.add(subtitleMesh)
  }

  return {
    group,
    title: titleMesh,
    subtitle: subtitleMesh,
    setVisible: (visible: boolean) => {
      group.visible = visible
    },
    setPosition: (x: number, y: number, z: number = 0) => {
      group.position.set(x, y, z)
    },
    destroy: () => {
      // Dispose text meshes
      titleMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      if (subtitleMesh) {
        subtitleMesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
      }
      group.parent?.remove(group)
    },
  }
}

// =============================================================================
// TEXT BOX COMPONENT
// =============================================================================

export interface TextBoxOptions {
  text: string
  width?: number
  backgroundColor?: number
  borderColor?: number
  textColor?: number
  padding?: number
  borderThickness?: number
  textScale?: number
  /** Horizontal text alignment within the box */
  textAlign?: 'left' | 'center' | 'right'
  /** Vertical text alignment within the box */
  verticalAlign?: 'top' | 'center' | 'bottom'
}

export interface TextBox {
  group: THREE.Group
  text: THREE.Group
  background: THREE.Mesh
  border?: THREE.Mesh
  setText: (newText: string) => void
  setVisible: (visible: boolean) => void
  setPosition: (x: number, y: number, z?: number) => void
  destroy: () => void
}

/**
 * Create a text box with background (like dialog boxes in NES RPGs)
 */
export function createTextBox(options: TextBoxOptions): TextBox {
  const {
    text,
    width,
    backgroundColor = 0x000000,
    borderColor,
    textColor = 0xffffff,
    padding = 0.3,
    borderThickness = 0.1,
    textScale = 0.08,
    textAlign = 'center',
    verticalAlign = 'center',
  } = options

  const group = new THREE.Group()

  // Calculate box dimensions
  const charCount = text.length
  const charWidth = 8 * textScale
  const textContentWidth = (charCount * charWidth) + ((charCount - 1) * (textScale * 0.2))
  const boxWidth = width || textContentWidth
  const textHeight = 8 * textScale

  // Calculate text position based on alignment
  function getTextPosition(currentText: string): { x: number; y: number } {
    const currentCharCount = currentText.length
    const currentTextWidth = (currentCharCount * charWidth) + ((currentCharCount - 1) * (textScale * 0.2))

    // Horizontal position
    let x: number
    switch (textAlign) {
      case 'center':
        x = boxWidth / 2
        break
      case 'right':
        x = boxWidth - currentTextWidth / 2
        break
      case 'left':
      default:
        x = currentTextWidth / 2
        break
    }

    // Vertical position
    let y: number
    switch (verticalAlign) {
      case 'center':
        y = -textHeight / 2
        break
      case 'bottom':
        y = -textHeight
        break
      case 'top':
      default:
        y = 0
        break
    }

    return { x, y }
  }

  // Create text with alignment
  const bitmapAlign = textAlign // Pass through to bitmap text
  let textMesh = createBitmapText(text, {
    color: textColor,
    scale: textScale,
    align: bitmapAlign,
  })
  const textPos = getTextPosition(text)
  textMesh.position.set(textPos.x, textPos.y, 0.1)
  group.add(textMesh)

  // Background - centered on the box
  const bgGeo = new THREE.PlaneGeometry(
    boxWidth + padding * 2,
    textHeight + padding * 2
  )
  const bgMat = new THREE.MeshBasicMaterial({ color: backgroundColor })
  const background = new THREE.Mesh(bgGeo, bgMat)
  background.position.set(boxWidth / 2, -textHeight / 2, 0)
  group.add(background)

  // Optional border
  let border: THREE.Mesh | undefined
  if (borderColor !== undefined) {
    const borderGeo = new THREE.PlaneGeometry(
      boxWidth + padding * 2 + borderThickness * 2,
      textHeight + padding * 2 + borderThickness * 2
    )
    const borderMat = new THREE.MeshBasicMaterial({ color: borderColor })
    border = new THREE.Mesh(borderGeo, borderMat)
    border.position.set(boxWidth / 2, -textHeight / 2, -0.1)
    group.add(border)
  }

  return {
    group,
    text: textMesh,
    background,
    border,
    setText: (newText: string) => {
      // Remove old text
      group.remove(textMesh)
      // Dispose old text
      textMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      // Create new text with same alignment
      textMesh = createBitmapText(newText, {
        color: textColor,
        scale: textScale,
        align: bitmapAlign,
      })
      const newTextPos = getTextPosition(newText)
      textMesh.position.set(newTextPos.x, newTextPos.y, 0.1)
      group.add(textMesh)
    },
    setVisible: (visible: boolean) => {
      group.visible = visible
    },
    setPosition: (x: number, y: number, z: number = 0) => {
      group.position.set(x, y, z)
    },
    destroy: () => {
      // Dispose all resources
      background.geometry.dispose()
      if (background.material instanceof THREE.Material) {
        background.material.dispose()
      }
      if (border) {
        border.geometry.dispose()
        if (border.material instanceof THREE.Material) {
          border.material.dispose()
        }
      }
      textMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      group.parent?.remove(group)
    },
  }
}

// =============================================================================
// LABEL COMPONENT (Simple text without box)
// =============================================================================

export interface LabelOptions {
  text: string
  color?: number
  scale?: number
  align?: 'left' | 'center' | 'right'
}

export interface Label {
  group: THREE.Group
  setText: (newText: string, options?: LabelOptions) => void
  setVisible: (visible: boolean) => void
  setPosition: (x: number, y: number, z?: number) => void
  destroy: () => void
}

/**
 * Create a simple text label (no background or border)
 */
export function createLabel(options: LabelOptions): Label {
  const {
    text,
    color = 0xffffff,
    scale = 0.08,
    align = 'left',
  } = options

  let textMesh = createBitmapText(text, {
    color,
    scale,
    align,
  })

  return {
    group: textMesh,
    setText: (newText: string, newOptions?: LabelOptions) => {
      const opts = { color, scale, align, ...newOptions }
      const parent = textMesh.parent
      const position = textMesh.position.clone()
      
      parent?.remove(textMesh)
      // Dispose old text
      textMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      textMesh = createBitmapText(newText, {
        color: opts.color,
        scale: opts.scale,
        align: opts.align,
      })
      textMesh.position.copy(position)
      parent?.add(textMesh)
    },
    setVisible: (visible: boolean) => {
      textMesh.visible = visible
    },
    setPosition: (x: number, y: number, z: number = 0) => {
      textMesh.position.set(x, y, z)
    },
    destroy: () => {
      textMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      textMesh.parent?.remove(textMesh)
    },
  }
}

// =============================================================================
// MENU COMPONENT
// =============================================================================

export interface MenuOption {
  text: string
  value: string
}

export interface MenuOptions {
  options: MenuOption[]
  selectedColor?: number
  unselectedColor?: number
  backgroundColor?: number
  borderColor?: number
  scale?: number
  spacing?: number
}

export interface Menu {
  group: THREE.Group
  selectedIndex: number
  select: (index: number) => void
  selectNext: () => void
  selectPrevious: () => void
  getSelectedValue: () => string
  setVisible: (visible: boolean) => void
  setPosition: (x: number, y: number, z?: number) => void
  destroy: () => void
}

/**
 * Create a vertical menu with selectable options
 */
export function createMenu(options: MenuOptions): Menu {
  const {
    options: menuOptions,
    selectedColor = 0xffff00,
    unselectedColor = 0xffffff,
    scale = 0.1,
    spacing = 0.3,
  } = options

  const group = new THREE.Group()
  const optionMeshes: THREE.Group[] = []
  let selectedIndex = 0

  // Create option text elements
  menuOptions.forEach((option, index) => {
    const textMesh = createBitmapText(option.text, {
      color: index === 0 ? selectedColor : unselectedColor,
      scale,
      align: 'left',
    })
    textMesh.position.set(0, -index * spacing, 0)
    group.add(textMesh)
    optionMeshes.push(textMesh)
  })

  function updateSelection() {
    optionMeshes.forEach((mesh, index) => {
      // Update color based on selection
      const isSelected = index === selectedIndex
      const color = isSelected ? selectedColor : unselectedColor
      
      // Update all child materials (pixels)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.color.setHex(color)
        }
      })
    })
  }

  return {
    group,
    selectedIndex,
    select: (index: number) => {
      if (index >= 0 && index < menuOptions.length) {
        selectedIndex = index
        updateSelection()
      }
    },
    selectNext: () => {
      selectedIndex = (selectedIndex + 1) % menuOptions.length
      updateSelection()
    },
    selectPrevious: () => {
      selectedIndex = (selectedIndex - 1 + menuOptions.length) % menuOptions.length
      updateSelection()
    },
    getSelectedValue: () => {
      return menuOptions[selectedIndex].value
    },
    setVisible: (visible: boolean) => {
      group.visible = visible
    },
    setPosition: (x: number, y: number, z: number = 0) => {
      group.position.set(x, y, z)
    },
    destroy: () => {
      // Dispose all option meshes
      optionMeshes.forEach(mesh => {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
      })
      group.parent?.remove(group)
    },
  }
}
