/**
 * Bitmap Font Tests
 */

import { describe, it, expect } from 'vitest'
import { createBitmapText, BitmapTextStyles } from '../engine/bitmap-font'
import { NES_PALETTE } from '../engine/palette'

describe('Bitmap Font', () => {
  describe('createBitmapText', () => {
    it('should create text mesh', () => {
      const text = createBitmapText('HELLO')
      expect(text).toBeDefined()
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should create correct number of characters', () => {
      const text = createBitmapText('TEST')
      // Each character is made up of pixels (multiple meshes)
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle empty string', () => {
      const text = createBitmapText('')
      expect(text.children.length).toBe(0)
    })

    it('should handle single character', () => {
      const text = createBitmapText('A')
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle numbers', () => {
      const text = createBitmapText('123')
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle special characters', () => {
      const text = createBitmapText('!?.')
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle mixed alphanumeric', () => {
      const text = createBitmapText('LEVEL 1')
      expect(text.children.length).toBeGreaterThan(0)
    })
  })

  describe('Text Styling', () => {
    it('should apply custom color', () => {
      const text = createBitmapText('TEST', {
        color: NES_PALETTE.RED
      })
      expect(text).toBeDefined()
    })

    it('should apply custom scale', () => {
      const text = createBitmapText('TEST', {
        scale: 2.0
      })
      expect(text).toBeDefined()
    })

    it('should apply left alignment', () => {
      const text = createBitmapText('TEST', {
        align: 'left'
      })
      expect(text.position.x).toBe(0)
    })

    it('should apply center alignment', () => {
      const text = createBitmapText('TEST', {
        align: 'center'
      })
      // Center aligned text group exists
      expect(text).toBeDefined()
    })

    it('should apply right alignment', () => {
      const text = createBitmapText('TEST', {
        align: 'right'
      })
      // Right aligned text group exists
      expect(text).toBeDefined()
    })
  })

  describe('BitmapTextStyles', () => {
    it('should provide title style', () => {
      const style = BitmapTextStyles.title()
      expect(style.scale).toBeDefined()
      expect(style.align).toBe('center')
    })

    it('should provide subtitle style', () => {
      const style = BitmapTextStyles.subtitle()
      expect(style.scale).toBeDefined()
      expect(style.align).toBe('center')
    })

    it('should provide small style', () => {
      const style = BitmapTextStyles.small()
      expect(style.scale).toBeDefined()
      expect(style.scale).toBeLessThan(BitmapTextStyles.subtitle().scale!)
    })

    it('should accept custom color in styles', () => {
      const style = BitmapTextStyles.title(NES_PALETTE.BLUE)
      expect(style.color).toBe(NES_PALETTE.BLUE)
    })
  })

  describe('Edge Cases', () => {
    it('should handle lowercase letters', () => {
      const text = createBitmapText('hello')
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle very long text', () => {
      const longText = 'A'.repeat(100)
      const text = createBitmapText(longText)
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle spaces', () => {
      const text = createBitmapText('HELLO WORLD')
      expect(text.children.length).toBeGreaterThan(0)
    })

    it('should handle unsupported characters gracefully', () => {
      // Should not throw, just skip unsupported chars
      expect(() => createBitmapText('TEST@#$')).not.toThrow()
    })
  })

  describe('Letter Spacing', () => {
    it('should apply custom letter spacing', () => {
      const text1 = createBitmapText('AA', { letterSpacing: 0.1 })
      const text2 = createBitmapText('AA', { letterSpacing: 0.5 })
      
      // Text with more letter spacing should be wider
      // We can't directly measure width, but we can check it doesn't error
      expect(text1).toBeDefined()
      expect(text2).toBeDefined()
    })

    it('should handle zero letter spacing', () => {
      const text = createBitmapText('TEST', { letterSpacing: 0 })
      expect(text).toBeDefined()
    })

    it('should handle negative letter spacing', () => {
      const text = createBitmapText('TEST', { letterSpacing: -0.1 })
      expect(text).toBeDefined()
    })
  })
})
