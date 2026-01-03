/**
 * SceneRenderer - Internal Rendering Backend
 * 
 * INTERNAL CLASS - NOT EXPORTED FROM ENGINE
 * 
 * This class encapsulates Three.js rendering implementation details.
 * It provides a high-level API for screen rendering while hiding
 * the underlying Three.js Scene, Camera, and Renderer.
 * 
 * Screens use this abstraction instead of directly accessing Three.js objects.
 */

import * as THREE from 'three'

export interface CameraConfig {
  type: 'orthographic' | 'perspective'
  // Orthographic camera config
  left?: number
  right?: number
  top?: number
  bottom?: number
  near?: number
  far?: number
  // Perspective camera config
  fov?: number
  aspect?: number
}

/**
 * Internal rendering backend using Three.js
 * This class is not exposed in the public engine API
 */
export class SceneRenderer {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer

  constructor(
    container: HTMLElement,
    width: number,
    height: number,
    cameraConfig: CameraConfig
  ) {
    // Create scene
    this.scene = new THREE.Scene()

    // Create camera based on config
    this.camera = this.createCamera(cameraConfig, width, height)

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(1)
    container.appendChild(this.renderer.domElement)
  }

  /**
   * Create camera based on configuration
   */
  private createCamera(config: CameraConfig, width: number, height: number): THREE.Camera {
    if (config.type === 'perspective') {
      const fov = config.fov ?? 75
      const aspect = config.aspect ?? (width / height)
      const near = config.near ?? 0.1
      const far = config.far ?? 1000
      return new THREE.PerspectiveCamera(fov, aspect, near, far)
    } else {
      // Orthographic (default)
      const left = config.left ?? -8
      const right = config.right ?? 8
      const top = config.top ?? 6
      const bottom = config.bottom ?? -6
      const near = config.near ?? 0.1
      const far = config.far ?? 100
      return new THREE.OrthographicCamera(left, right, top, bottom, near, far)
    }
  }

  /**
   * Render the current scene
   */
  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Add a renderable object to the scene
   */
  addObject(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  /**
   * Remove an object from the scene
   */
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  /**
   * Clear all objects from the scene with proper disposal
   */
  clear(): void {
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0]
      this.disposeObject(obj)
      this.scene.remove(obj)
    }
  }

  /**
   * Dispose of an object and its resources
   */
  private disposeObject(obj: THREE.Object3D): void {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) {
        obj.geometry.dispose()
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => mat.dispose())
        } else {
          obj.material.dispose()
        }
      }
    }
  }

  /**
   * Set scene background color
   */
  setBackgroundColor(color: number): void {
    this.scene.background = new THREE.Color(color)
  }

  /**
   * Add ambient light to the scene
   */
  addAmbientLight(intensity: number = 1): void {
    const light = new THREE.AmbientLight(0xffffff, intensity)
    this.scene.add(light)
  }

  /**
   * Get the underlying Three.js scene
   * 
   * ⚠️ ADVANCED: This breaks abstraction and should only be used
   * when the high-level API is insufficient. Direct manipulation
   * of the scene can lead to unexpected behavior.
   * 
   * Use cases:
   * - Components like WorldMap that need direct scene access
   * - Custom Three.js manipulations not covered by the API
   * 
   * @returns The Three.js Scene object
   */
  getThreeScene(): THREE.Scene {
    return this.scene
  }

  /**
   * Get the underlying Three.js camera
   * 
   * ⚠️ ADVANCED: Use sparingly, prefer high-level API when possible
   * 
   * @returns The Three.js Camera object
   */
  getCamera(): THREE.Camera {
    return this.camera
  }

  /**
   * Get the renderer's DOM element
   * 
   * @returns The canvas element
   */
  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  /**
   * Get the underlying Three.js renderer
   * 
   * ⚠️ ADVANCED: Use sparingly, prefer high-level API when possible
   * 
   * @returns The Three.js WebGLRenderer object
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  /**
   * Resize the renderer
   */
  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height)
    
    // Update camera aspect if perspective
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.clear()
    this.renderer.dispose()
  }
}
