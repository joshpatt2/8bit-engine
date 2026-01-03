/**
 * Entity System - Components
 * 
 * Components are pure data structures that hold state.
 * They contain no logic - that's what Systems are for.
 */

import * as THREE from 'three'

// =============================================================================
// COMPONENT NAMES (constants for type safety)
// =============================================================================

export const COMPONENT = {
  TRANSFORM: 'transform',
  VELOCITY: 'velocity',
  SPRITE: 'sprite',
  HEALTH: 'health',
  COLLISION: 'collision',
  INPUT: 'input',
  ANIMATION: 'animation',
  LIFETIME: 'lifetime',
} as const

// =============================================================================
// CORE COMPONENTS
// =============================================================================

/**
 * Transform Component
 * Position, rotation, and scale in 3D space
 */
export interface TransformComponent {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

export function createTransform(
  x: number = 0,
  y: number = 0,
  z: number = 0
): TransformComponent {
  return {
    position: new THREE.Vector3(x, y, z),
    rotation: new THREE.Euler(0, 0, 0),
    scale: new THREE.Vector3(1, 1, 1),
  }
}

/**
 * Velocity Component
 * Linear velocity for movement
 */
export interface VelocityComponent {
  x: number
  y: number
  z: number
}

export function createVelocity(
  x: number = 0,
  y: number = 0,
  z: number = 0
): VelocityComponent {
  return { x, y, z }
}

/**
 * Sprite Component
 * Visual representation using Three.js mesh
 */
export interface SpriteComponent {
  mesh: THREE.Mesh
  color?: number
  visible: boolean
}

export function createSprite(mesh: THREE.Mesh, color?: number): SpriteComponent {
  return {
    mesh,
    color,
    visible: true,
  }
}

/**
 * Health Component
 * Health and damage state
 */
export interface HealthComponent {
  current: number
  max: number
  invulnerable: boolean
}

export function createHealth(max: number = 100): HealthComponent {
  return {
    current: max,
    max,
    invulnerable: false,
  }
}

/**
 * Collision Component
 * Simple bounding box collision
 */
export interface CollisionComponent {
  width: number
  height: number
  depth: number
  isTrigger: boolean
  layer: number
}

export function createCollision(
  width: number = 1,
  height: number = 1,
  depth: number = 1,
  layer: number = 0
): CollisionComponent {
  return {
    width,
    height,
    depth,
    isTrigger: false,
    layer,
  }
}

/**
 * Input Component
 * Marks an entity as player-controlled
 */
export interface InputComponent {
  moveSpeed: number
  jumpPower: number
}

export function createInput(
  moveSpeed: number = 5,
  jumpPower: number = 10
): InputComponent {
  return {
    moveSpeed,
    jumpPower,
  }
}

/**
 * Animation Component
 * Frame-based animation state
 */
export interface AnimationComponent {
  currentFrame: number
  frameCount: number
  frameTime: number
  elapsed: number
  loop: boolean
  playing: boolean
}

export function createAnimation(
  frameCount: number = 1,
  frameTime: number = 0.1
): AnimationComponent {
  return {
    currentFrame: 0,
    frameCount,
    frameTime,
    elapsed: 0,
    loop: true,
    playing: true,
  }
}
