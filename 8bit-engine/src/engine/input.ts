/**
 * Input Handler
 * NES-style input with D-pad + A/B buttons + Start/Select
 * Supports both keyboard and gamepad input
 */

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  a: boolean      // Z key or gamepad A
  b: boolean      // X key or gamepad B
  start: boolean  // Enter or gamepad Start
  select: boolean // Shift or gamepad Select
}

// Threshold for analog stick input (dead zone)
const STICK_THRESHOLD = 0.5

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
  
  // Keyboard handlers
  private boundHandleKeyDown: (e: KeyboardEvent) => void
  private boundHandleKeyUp: (e: KeyboardEvent) => void
  
  // Gamepad support
  private gamepadIndex: number | null = null
  private boundHandleGamepadConnected: (e: GamepadEvent) => void
  private boundHandleGamepadDisconnected: (e: GamepadEvent) => void

  constructor() {
    // Bind keyboard handlers
    this.boundHandleKeyDown = this.handleKeyDown.bind(this)
    this.boundHandleKeyUp = this.handleKeyUp.bind(this)
    window.addEventListener('keydown', this.boundHandleKeyDown)
    window.addEventListener('keyup', this.boundHandleKeyUp)
    
    // Bind gamepad handlers
    this.boundHandleGamepadConnected = this.handleGamepadConnected.bind(this)
    this.boundHandleGamepadDisconnected = this.handleGamepadDisconnected.bind(this)
    window.addEventListener('gamepadconnected', this.boundHandleGamepadConnected)
    window.addEventListener('gamepaddisconnected', this.boundHandleGamepadDisconnected)
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
      case ' ':  // Space maps to B for easier access
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

  private handleGamepadConnected(e: GamepadEvent): void {
    console.log('Gamepad connected:', e.gamepad.id)
    this.gamepadIndex = e.gamepad.index
  }

  private handleGamepadDisconnected(e: GamepadEvent): void {
    if (e.gamepad.index === this.gamepadIndex) {
      console.log('Gamepad disconnected')
      this.gamepadIndex = null
    }
  }

  private updateGamepad(): void {
    if (this.gamepadIndex === null) return

    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[this.gamepadIndex]
    if (!gamepad) return

    // Map gamepad buttons to NES buttons
    // Standard gamepad layout follows W3C spec
    // Button 0: A/Cross (bottom button)
    // Button 1: B/Circle (right button)
    // Button 2: X/Square (left button)
    // Button 3: Y/Triangle (top button)
    // Button 8: Select/Share
    // Button 9: Start/Options
    // Button 12: D-pad up
    // Button 13: D-pad down
    // Button 14: D-pad left
    // Button 15: D-pad right

    // D-pad buttons
    if (gamepad.buttons[12]) this.state.up = this.state.up || gamepad.buttons[12].pressed
    if (gamepad.buttons[13]) this.state.down = this.state.down || gamepad.buttons[13].pressed
    if (gamepad.buttons[14]) this.state.left = this.state.left || gamepad.buttons[14].pressed
    if (gamepad.buttons[15]) this.state.right = this.state.right || gamepad.buttons[15].pressed

    // Action buttons (A maps to button 0 and 3, B maps to button 1 and 2)
    if (gamepad.buttons[0]) this.state.a = this.state.a || gamepad.buttons[0].pressed
    if (gamepad.buttons[3]) this.state.a = this.state.a || gamepad.buttons[3].pressed
    if (gamepad.buttons[1]) this.state.b = this.state.b || gamepad.buttons[1].pressed
    if (gamepad.buttons[2]) this.state.b = this.state.b || gamepad.buttons[2].pressed

    // System buttons
    if (gamepad.buttons[9]) this.state.start = this.state.start || gamepad.buttons[9].pressed
    if (gamepad.buttons[8]) this.state.select = this.state.select || gamepad.buttons[8].pressed

    // Analog stick support (left stick axes 0 and 1)
    if (gamepad.axes.length >= 2) {
      const leftX = gamepad.axes[0]
      const leftY = gamepad.axes[1]

      // Map stick to D-pad with dead zone
      if (leftX < -STICK_THRESHOLD) this.state.left = true
      if (leftX > STICK_THRESHOLD) this.state.right = true
      if (leftY < -STICK_THRESHOLD) this.state.up = true
      if (leftY > STICK_THRESHOLD) this.state.down = true
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

  /** Check if any directional input is active */
  isMoving(): boolean {
    return this.state.up || this.state.down || this.state.left || this.state.right
  }

  /** Get normalized direction vector from input */
  getDirection(): { x: number; y: number } {
    const x = (this.state.right ? 1 : 0) - (this.state.left ? 1 : 0)
    const y = (this.state.down ? 1 : 0) - (this.state.up ? 1 : 0)
    return { x, y }
  }

  /** Call at the start of each frame to update previous state and poll gamepad */
  update(): void {
    this.previousState = { ...this.state }
    
    // Poll gamepad state (gamepad API requires polling)
    // Gamepad input will be OR'd with keyboard input
    this.updateGamepad()
  }

  /** Get the current input state */
  getState(): Readonly<InputState> {
    return this.state
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown)
    window.removeEventListener('keyup', this.boundHandleKeyUp)
    window.removeEventListener('gamepadconnected', this.boundHandleGamepadConnected)
    window.removeEventListener('gamepaddisconnected', this.boundHandleGamepadDisconnected)
  }
}
