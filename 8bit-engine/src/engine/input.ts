/**
 * Input Handler
 * NES-style input with D-pad + A/B buttons + Start/Select
 */

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  a: boolean      // Z key
  b: boolean      // X key
  start: boolean  // Enter
  select: boolean // Shift
}

export class Input {
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
    select: false,
  }

  private previousState: InputState = { ...this.state }
  private boundHandleKeyDown: (e: KeyboardEvent) => void
  private boundHandleKeyUp: (e: KeyboardEvent) => void

  constructor() {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
    this.boundHandleKeyUp = this.handleKeyUp.bind(this)
    window.addEventListener('keydown', this.boundHandleKeyDown)
    window.addEventListener('keyup', this.boundHandleKeyUp)
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.updateKey(e.key, true)
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.updateKey(e.key, false)
  }

  private updateKey(key: string, pressed: boolean): void {
    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.state.up = pressed
        break
      case 's':
      case 'arrowdown':
        this.state.down = pressed
        break
      case 'a':
      case 'arrowleft':
        this.state.left = pressed
        break
      case 'd':
      case 'arrowright':
        this.state.right = pressed
        break
      case 'z':
        this.state.a = pressed
        break
      case 'x':
        this.state.b = pressed
        break
      case 'enter':
        this.state.start = pressed
        break
      case 'shift':
        this.state.select = pressed
        break
    }
  }

  /** Check if a button is currently pressed */
  isPressed(button: keyof InputState): boolean {
    return this.state[button]
  }

  /** Check if a button was just pressed this frame */
  justPressed(button: keyof InputState): boolean {
    return this.state[button] && !this.previousState[button]
  }

  /** Check if a button was just released this frame */
  justReleased(button: keyof InputState): boolean {
    return !this.state[button] && this.previousState[button]
  }

  /** Call at the end of each frame to update previous state */
  update(): void {
    this.previousState = { ...this.state }
  }

  /** Get the current input state */
  getState(): Readonly<InputState> {
    return this.state
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown)
    window.removeEventListener('keyup', this.boundHandleKeyUp)
  }
}
