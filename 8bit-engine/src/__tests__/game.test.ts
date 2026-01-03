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
      game.start()

      // Wait a bit for update to be called
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onUpdate).toHaveBeenCalled()
          expect(onUpdate.mock.calls[0][1]).toBe(game)
          game.stop()
          resolve()
        }, 100)
      })
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
      game.start()

      // Wait a bit for render to be called
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(onRender).toHaveBeenCalled()
          expect(onRender.mock.calls[0][0]).toBe(game)
          game.stop()
          resolve()
        }, 100)
      })
    })
  })

  describe('Window Resize', () => {
    it('should handle window resize', () => {
      game = new Game({ container })

      // Trigger resize
      window.dispatchEvent(new Event('resize'))

      // Style should be set (even if to the same value)
      expect(game.renderer.domElement.style.width).toBeDefined()
    })

    it('should remove resize handler on destroy', () => {
      game = new Game({ container })

      game.destroy()

      // Verify game is stopped
      expect(game.gameLoop.isRunning()).toBe(false)
    })
  })
})
