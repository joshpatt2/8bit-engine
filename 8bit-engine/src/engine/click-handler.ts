/**
 * Click Handler
 * Mouse click detection for UI elements using raycasting
 */

import * as THREE from 'three'

export class ClickHandler {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private camera: THREE.Camera
  private scene: THREE.Scene
  private canvas: HTMLCanvasElement
  private boundHandleClick: (event: MouseEvent) => void

  constructor(camera: THREE.Camera, scene: THREE.Scene, canvas: HTMLCanvasElement) {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.camera = camera
    this.scene = scene
    this.canvas = canvas

    // Bind event listener
    this.boundHandleClick = this.handleClick.bind(this)
    this.canvas.addEventListener('click', this.boundHandleClick)
  }

  private handleClick(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Update the raycaster with the camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // Get all objects in the scene
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    // Check if we hit any buttons
    for (const intersect of intersects) {
      const object = intersect.object
      
      // Check if this object has a click handler
      if (object.userData.isButton && object.userData.onClick) {
        object.userData.onClick()
        break // Only trigger the first button hit
      }
    }
  }

  destroy(): void {
    this.canvas.removeEventListener('click', this.boundHandleClick)
  }
}
