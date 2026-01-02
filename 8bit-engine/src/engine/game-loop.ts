/**
 * Game Loop
 * Fixed timestep game loop inspired by NES ~60 FPS
 */

export interface GameLoopCallbacks {
  update: (deltaTime: number) => void
  render: () => void
}

export class GameLoop {
  private lastTime: number = 0
  private accumulator: number = 0
  private readonly fixedDeltaTime: number = 1000 / 60 // ~16.67ms for 60 FPS
  private running: boolean = false
  private frameId: number = 0

  // Performance tracking
  private fps: number = 0
  private frameCount: number = 0
  private fpsTime: number = 0
  private callbacks: GameLoopCallbacks

  constructor(callbacks: GameLoopCallbacks) {
    this.callbacks = callbacks
    this.loop = this.loop.bind(this)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.running = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
    }
  }

  private loop(): void {
    if (!this.running) return

    const currentTime = performance.now()
    const frameTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // FPS calculation
    this.frameCount++
    this.fpsTime += frameTime
    if (this.fpsTime >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.fpsTime = 0
    }

    // Fixed timestep updates
    this.accumulator += frameTime
    while (this.accumulator >= this.fixedDeltaTime) {
      this.callbacks.update(this.fixedDeltaTime / 1000) // Convert to seconds
      this.accumulator -= this.fixedDeltaTime
    }

    // Render
    this.callbacks.render()

    this.frameId = requestAnimationFrame(this.loop)
  }

  getFPS(): number {
    return this.fps
  }

  isRunning(): boolean {
    return this.running
  }
}
