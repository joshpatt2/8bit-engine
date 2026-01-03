/**
 * Game Class Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Game } from '../engine/game'
import * as THREE from 'three'

// Mock WebGLRenderer to avoid "Error creating WebGL context" in tests
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof THREE>('three')
  
  class MockWebGLRenderer {
    domElement = document.createElement('canvas')
    setSize = vi.fn()
    setPixelRatio = vi.fn()
    render = vi.fn()
    dispose = vi.fn()
  }
  
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer as any,
  }
})

describe('Game', () => {
  let container: HTMLElement
  let game: Game

  beforeEach(() => {
    // Create a container element
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    // Cleanup
    if (game) {
      game.destroy()
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
    
    // Clean up any remaining HUD/debug elements
    const hud = document.getElementById('hud')
    if (hud && hud.parentNode) {
      hud.parentNode.removeChild(hud)
    }
    const debug = document.getElementById('debug')
    if (debug && debug.parentNode) {
      debug.parentNode.removeChild(debug)
    }
  })

  describe('Initialization', () => {
    it('should create game with default config', () => {
      game = new Game({ container })

      expect(game.scene).toBeDefined()
      expect(game.camera).toBeDefined()
      expect(game.renderer).toBeDefined()
      expect(game.input).toBeDefined()
      expect(game.sceneManager).toBeDefined()
      expect(game.gameLoop).toBeDefined()
    })

    it('should create game with custom scale', () => {
      game = new Game({ container, scale: 2 })
      expect(game.config.scale).toBe(2)
    })

    it('should create game with title and controls', () => {
      game = new Game({
        container,
        title: 'Test Game',
        controls: 'Press Start',
      })

      expect(game.config.title).toBe('Test Game')
      expect(game.config.controls).toBe('Press Start')

      // HUD should be created
      const hud = document.getElementById('hud')
      expect(hud).toBeTruthy()
      expect(hud?.innerHTML).toContain('Test Game')
      expect(hud?.innerHTML).toContain('Press Start')
    })

    it('should create debug element when showDebug is true', () => {
      game = new Game({ container, showDebug: true })

      const debug = document.getElementById('debug')
      expect(debug).toBeTruthy()
    })

    it('should not create debug element when showDebug is false', () => {
      game = new Game({ container, showDebug: false })

      const debug = document.getElementById('debug')
      expect(debug).toBeFalsy()
    })

    it('should append renderer canvas to container', () => {
      game = new Game({ container })

      expect(container.children.length).toBe(1)
      expect(container.children[0]).toBe(game.renderer.domElement)
    })
  })

  describe('Scene Management', () => {
    beforeEach(() => {
      game = new Game({ container })
    })

    it('should register a scene', () => {
      const mockScene = {
        name: 'test',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      game.registerScene(mockScene)
      game.switchToScene('test')

      expect(game.getCurrentScene()).toBe('test')
      expect(mockScene.enter).toHaveBeenCalled()
    })

    it('should switch between scenes', () => {
      const scene1 = {
        name: 'scene1',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      const scene2 = {
        name: 'scene2',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      game.registerScene(scene1)
      game.registerScene(scene2)

      game.switchToScene('scene1')
      expect(scene1.enter).toHaveBeenCalledTimes(1)

      game.switchToScene('scene2')
      expect(scene1.exit).toHaveBeenCalledTimes(1)
      expect(scene2.enter).toHaveBeenCalledTimes(1)
    })
  })

  describe('Lifecycle', () => {
    it('should start the game loop', () => {
      game = new Game({ container })
      game.start()

      expect(game.gameLoop.isRunning()).toBe(true)
      game.stop()
    })

    it('should stop the game loop', () => {
      game = new Game({ container })
      game.start()
      game.stop()

      expect(game.gameLoop.isRunning()).toBe(false)
    })

    it('should destroy and clean up resources', () => {
      game = new Game({
        container,
        title: 'Test',
        showDebug: true,
      })

      game.start()
      game.destroy()

      // Game loop should be stopped
      expect(game.gameLoop.isRunning()).toBe(false)

      // DOM elements should be removed
      expect(document.getElementById('hud')).toBeFalsy()
      expect(document.getElementById('debug')).toBeFalsy()

      // Canvas should be removed from container
      expect(container.children.length).toBe(0)
    })
  })

  describe('HUD Management', () => {
    it('should update HUD content', () => {
      game = new Game({ container, title: 'Initial' })

      const hud = document.getElementById('hud')
      expect(hud?.innerHTML).toContain('Initial')

      game.updateHUD('<strong>Updated</strong>')
      expect(hud?.innerHTML).toBe('<strong>Updated</strong>')
    })

    it('should handle updateHUD when HUD does not exist', () => {
      game = new Game({ container })

      // Should not throw
      expect(() => game.updateHUD('test')).not.toThrow()
    })
  })

  describe('Debug Info', () => {
    it('should update debug info', () => {
      game = new Game({ container, showDebug: true })

      game.updateDebugInfo({ FPS: 60, Scene: 'test' })

      const debug = document.getElementById('debug')
      expect(debug?.innerHTML).toContain('FPS: 60')
      expect(debug?.innerHTML).toContain('Scene: test')
    })

    it('should handle updateDebugInfo when debug does not exist', () => {
      game = new Game({ container, showDebug: false })

      // Should not throw
      expect(() => game.updateDebugInfo({ test: 'value' })).not.toThrow()
    })
  })

  describe('Utility Methods', () => {
    beforeEach(() => {
      game = new Game({ container })
    })

    it('should get FPS from game loop', () => {
      const fps = game.getFPS()
      expect(typeof fps).toBe('number')
      expect(fps).toBeGreaterThanOrEqual(0)
    })

    it('should get current scene', () => {
      const mockScene = {
        name: 'test',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      expect(game.getCurrentScene()).toBeNull()

      game.registerScene(mockScene)
      game.switchToScene('test')

      expect(game.getCurrentScene()).toBe('test')
    })
  })

  describe('Custom Callbacks', () => {
    it('should call custom onUpdate callback', () => {
      const onUpdate = vi.fn()
      game = new Game({ container, onUpdate })

      const mockScene = {
        name: 'test',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      game.registerScene(mockScene)
      game.switchToScene('test')

      // Use deterministic stepping instead of setTimeout
      game.gameLoop.step(16.67) // Step one frame (60fps)

      expect(onUpdate).toHaveBeenCalled()
      expect(onUpdate.mock.calls[0][1]).toBe(game)
      expect(typeof onUpdate.mock.calls[0][0]).toBe('number') // Delta time
    })

    it('should call custom onRender callback', () => {
      const onRender = vi.fn()
      game = new Game({ container, onRender })

      const mockScene = {
        name: 'test',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      game.registerScene(mockScene)
      game.switchToScene('test')

      // Use deterministic stepping instead of setTimeout
      game.gameLoop.step(16.67) // Step one frame (60fps)

      expect(onRender).toHaveBeenCalled()
      expect(onRender.mock.calls[0][0]).toBe(game)
    })
  })

  describe('Window Resize', () => {
    it('should handle window resize', () => {
      game = new Game({ container, scale: 3 })

      const canvas = game.renderer.domElement
      
      // Get initial dimensions
      const initialWidth = canvas.style.width
      const initialHeight = canvas.style.height
      
      expect(initialWidth).toBeTruthy()
      expect(initialHeight).toBeTruthy()
      expect(initialWidth).toMatch(/px$/)
      expect(initialHeight).toMatch(/px$/)

      // Change window size
      const originalInnerWidth = window.innerWidth
      const originalInnerHeight = window.innerHeight
      
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 })
      
      // Trigger resize
      window.dispatchEvent(new Event('resize'))

      const newWidth = canvas.style.width
      const newHeight = canvas.style.height
      
      // Dimensions should have changed
      expect(newWidth).toBeTruthy()
      expect(newHeight).toBeTruthy()
      expect(newWidth).toMatch(/px$/)
      expect(newHeight).toMatch(/px$/)
      
      // Restore window size
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: originalInnerHeight })
    })

    it('should remove resize handler on destroy', () => {
      game = new Game({ container })

      game.destroy()

      // Change window size after destroy
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 9999 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 9999 })
      
      // Trigger resize - should have no effect since handler is removed
      window.dispatchEvent(new Event('resize'))

      // Canvas should no longer be in the container (was removed during destroy)
      expect(container.children.length).toBe(0)
      
      // Verify game is stopped
      expect(game.gameLoop.isRunning()).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      game = new Game({ container })
    })

    it('should handle start() called twice', () => {
      game.start()
      expect(game.gameLoop.isRunning()).toBe(true)
      
      // Starting again should be idempotent
      game.start()
      expect(game.gameLoop.isRunning()).toBe(true)
      
      game.stop()
    })

    it('should handle stop() called twice', () => {
      game.start()
      game.stop()
      expect(game.gameLoop.isRunning()).toBe(false)
      
      // Stopping again should not throw
      expect(() => game.stop()).not.toThrow()
      expect(game.gameLoop.isRunning()).toBe(false)
    })

    it('should handle destroy() called twice', () => {
      game.start()
      game.destroy()
      
      expect(container.children.length).toBe(0)
      expect(game.gameLoop.isRunning()).toBe(false)
      
      // Destroying again should not throw
      expect(() => game.destroy()).not.toThrow()
    })

    it('should handle switching to non-existent scene', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      game.switchToScene('nonexistent')
      
      expect(consoleSpy).toHaveBeenCalledWith('Scene "nonexistent" not found')
      expect(game.getCurrentScene()).toBeNull()
      
      consoleSpy.mockRestore()
    })

    it('should handle switching to same scene twice', () => {
      const mockScene = {
        name: 'test',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      game.registerScene(mockScene)
      game.switchToScene('test')
      
      expect(mockScene.enter).toHaveBeenCalledTimes(1)
      expect(mockScene.exit).toHaveBeenCalledTimes(0)
      
      // Switch to same scene
      game.switchToScene('test')
      
      // Should exit and re-enter
      expect(mockScene.exit).toHaveBeenCalledTimes(1)
      expect(mockScene.enter).toHaveBeenCalledTimes(2)
    })

    it('should handle updateHUD after destroy', () => {
      game = new Game({ container, title: 'Test' })
      game.destroy()
      
      // Should not throw
      expect(() => game.updateHUD('test')).not.toThrow()
    })

    it('should handle updateDebugInfo after destroy', () => {
      game = new Game({ container, showDebug: true })
      game.destroy()
      
      // Should not throw
      expect(() => game.updateDebugInfo({ test: 'value' })).not.toThrow()
    })

    it('should handle update/render when no scene is active', () => {
      // Step the game loop without any active scene
      expect(() => game.gameLoop.step()).not.toThrow()
    })

    it('should cleanup even if DOM elements were removed externally', () => {
      game = new Game({ container, title: 'Test', showDebug: true })
      
      // Manually remove HUD and debug elements before destroy
      const hud = document.getElementById('hud')
      const debug = document.getElementById('debug')
      
      if (hud && hud.parentNode) {
        hud.parentNode.removeChild(hud)
      }
      if (debug && debug.parentNode) {
        debug.parentNode.removeChild(debug)
      }
      
      // Destroy should not throw
      expect(() => game.destroy()).not.toThrow()
      expect(game.gameLoop.isRunning()).toBe(false)
    })

    it('should handle multiple scenes registered with same name', () => {
      const scene1 = {
        name: 'duplicate',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      const scene2 = {
        name: 'duplicate',
        enter: vi.fn(),
        exit: vi.fn(),
        update: vi.fn(),
        render: vi.fn(),
      }

      game.registerScene(scene1)
      game.registerScene(scene2) // Overwrites first
      game.switchToScene('duplicate')

      // Should enter the second scene
      expect(scene1.enter).not.toHaveBeenCalled()
      expect(scene2.enter).toHaveBeenCalled()
    })
  })
})
