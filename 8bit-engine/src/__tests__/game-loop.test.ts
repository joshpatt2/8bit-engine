import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameLoop } from '../engine/game-loop'

describe('GameLoop', () => {
  let updateCount: number
  let renderCount: number
  
  beforeEach(() => {
    updateCount = 0
    renderCount = 0
  })

  const createTestLoop = (targetFPS = 60) => {
    return new GameLoop({
      update: () => {
        updateCount++
      },
      render: () => {
        renderCount++
      },
      targetFPS
    })
  }

  it('should create a game loop with default 60 FPS', () => {
    const loop = createTestLoop()
    expect(loop).toBeDefined()
    expect(loop.isRunning()).toBe(false)
  })

  it('should start and stop the game loop', () => {
    const loop = createTestLoop()
    loop.start()
    expect(loop.isRunning()).toBe(true)
    loop.stop()
    expect(loop.isRunning()).toBe(false)
  })

  it('should cap accumulator to prevent death spiral on long frame times', () => {
    const loop = createTestLoop(60) // 60 FPS = ~16.67ms per frame
    
    // Mock both performance.now and requestAnimationFrame
    let currentTime = 0
    let rafCallback: FrameRequestCallback | null = null
    
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime)
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })
    
    // Start the loop - first frame at time 0
    loop.start()
    
    // Simulate a massive time jump (tab switch for 5 seconds)
    currentTime = 5000
    
    // Manually trigger the next frame
    if (rafCallback) {
      rafCallback(currentTime)
    }
    
    // With a 5000ms frame:
    // - Without cap: would run ~300 updates (5000 / 16.67)
    // - With cap: should run at most 5 updates (5 * 16.67 = ~83ms cap)
    expect(updateCount).toBeLessThanOrEqual(5)
    expect(updateCount).toBeGreaterThan(0)
    
    // Clean up
    loop.stop()
    vi.restoreAllMocks()
  })
})
