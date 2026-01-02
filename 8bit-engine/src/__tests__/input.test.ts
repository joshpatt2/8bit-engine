/**
 * Input System Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Input } from '../engine/input'

describe('Input', () => {
  let input: Input
  let cleanupFns: (() => void)[] = []

  beforeEach(() => {
    input = new Input()
    cleanupFns = []
  })

  afterEach(() => {
    cleanupFns.forEach(fn => fn())
    cleanupFns = []
  })

  describe('Keyboard Input', () => {
    it('should detect key press', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      window.dispatchEvent(event)
      
      expect(input.isPressed('up')).toBe(true)
    })

    it('should detect key release', () => {
      // Press key
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      window.dispatchEvent(downEvent)
      expect(input.isPressed('up')).toBe(true)

      // Release key
      const upEvent = new KeyboardEvent('keyup', { key: 'ArrowUp' })
      window.dispatchEvent(upEvent)
      expect(input.isPressed('up')).toBe(false)
    })

    it('should map WASD to arrow keys', () => {
      const wEvent = new KeyboardEvent('keydown', { key: 'w' })
      window.dispatchEvent(wEvent)
      expect(input.isPressed('up')).toBe(true)

      const aEvent = new KeyboardEvent('keydown', { key: 'a' })
      window.dispatchEvent(aEvent)
      expect(input.isPressed('left')).toBe(true)

      const sEvent = new KeyboardEvent('keydown', { key: 's' })
      window.dispatchEvent(sEvent)
      expect(input.isPressed('down')).toBe(true)

      const dEvent = new KeyboardEvent('keydown', { key: 'd' })
      window.dispatchEvent(dEvent)
      expect(input.isPressed('right')).toBe(true)
    })

    it('should map Z/Enter to A button', () => {
      const zEvent = new KeyboardEvent('keydown', { key: 'z' })
      window.dispatchEvent(zEvent)
      expect(input.isPressed('a')).toBe(true)

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(enterEvent)
      expect(input.isPressed('start')).toBe(true)
    })

    it('should map X/Shift to B button', () => {
      const xEvent = new KeyboardEvent('keydown', { key: 'x' })
      window.dispatchEvent(xEvent)
      expect(input.isPressed('b')).toBe(true)

      const shiftEvent = new KeyboardEvent('keydown', { key: 'Shift' })
      window.dispatchEvent(shiftEvent)
      expect(input.isPressed('select')).toBe(true)
    })
  })

  describe('justPressed', () => {
    it('should return true only on first frame after press', () => {
      const event = new KeyboardEvent('keydown', { key: 'z' })
      window.dispatchEvent(event)

      // First check - should be true
      expect(input.justPressed('a')).toBe(true)

      // Update input state
      input.update()

      // Second check - should be false (not "just" pressed anymore)
      expect(input.justPressed('a')).toBe(false)
      
      // But isPressed should still be true
      expect(input.isPressed('a')).toBe(true)
    })

    it('should work again after releasing and re-pressing', () => {
      // Press
      const downEvent = new KeyboardEvent('keydown', { key: 'z' })
      window.dispatchEvent(downEvent)
      expect(input.justPressed('a')).toBe(true)

      input.update()
      expect(input.justPressed('a')).toBe(false)

      // Release
      const upEvent = new KeyboardEvent('keyup', { key: 'z' })
      window.dispatchEvent(upEvent)
      input.update()

      // Press again
      window.dispatchEvent(downEvent)
      expect(input.justPressed('a')).toBe(true)
    })
  })

  describe('Multiple Keys', () => {
    it('should handle multiple simultaneous key presses', () => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const aEvent = new KeyboardEvent('keydown', { key: 'z' })

      window.dispatchEvent(upEvent)
      window.dispatchEvent(rightEvent)
      window.dispatchEvent(aEvent)

      expect(input.isPressed('up')).toBe(true)
      expect(input.isPressed('right')).toBe(true)
      expect(input.isPressed('a')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle unknown keys gracefully', () => {
      const event = new KeyboardEvent('keydown', { key: 'F1' })
      window.dispatchEvent(event)
      
      // Should not throw, just ignore unknown keys
      expect(() => input.isPressed('up')).not.toThrow()
    })

    it('should handle rapid key presses', () => {
      for (let i = 0; i < 10; i++) {
        const down = new KeyboardEvent('keydown', { key: 'z' })
        const up = new KeyboardEvent('keyup', { key: 'z' })
        window.dispatchEvent(down)
        input.update()
        window.dispatchEvent(up)
        input.update()
      }

      expect(() => input.isPressed('a')).not.toThrow()
    })
  })
})
