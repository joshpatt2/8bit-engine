/**
 * Built-in Systems
 * 
 * Common systems for the entity system.
 */

import type { Entity } from './entity'
import type { System } from './system'
import {
  COMPONENT,
  type TransformComponent,
  type VelocityComponent,
  type SpriteComponent,
  type AnimationComponent,
} from './component'

// =============================================================================
// MOVEMENT SYSTEM
// =============================================================================

/**
 * Movement System
 * Updates entity positions based on velocity
 */
export class MovementSystem implements System {
  public readonly name = 'movement'
  public readonly requiredComponents = [COMPONENT.TRANSFORM, COMPONENT.VELOCITY]
  
  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
      const velocity = entity.getComponent<VelocityComponent>(COMPONENT.VELOCITY)!
      
      // Update position based on velocity
      transform.position.x += velocity.x * deltaTime
      transform.position.y += velocity.y * deltaTime
      transform.position.z += velocity.z * deltaTime
    }
  }
}

// =============================================================================
// SPRITE RENDER SYSTEM
// =============================================================================

/**
 * Sprite Render System
 * Synchronizes sprite meshes with entity transforms
 */
export class SpriteRenderSystem implements System {
  public readonly name = 'spriteRender'
  public readonly requiredComponents = [COMPONENT.TRANSFORM, COMPONENT.SPRITE]
  
  public update(entities: Entity[]): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
      const sprite = entity.getComponent<SpriteComponent>(COMPONENT.SPRITE)!
      
      // Sync mesh with transform
      sprite.mesh.position.copy(transform.position)
      sprite.mesh.rotation.copy(transform.rotation)
      sprite.mesh.scale.copy(transform.scale)
      sprite.mesh.visible = sprite.visible
    }
  }
}

// =============================================================================
// ANIMATION SYSTEM
// =============================================================================

/**
 * Animation System
 * Updates frame-based animations
 */
export class AnimationSystem implements System {
  public readonly name = 'animation'
  public readonly requiredComponents = [COMPONENT.ANIMATION]
  
  public update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const animation = entity.getComponent<AnimationComponent>(COMPONENT.ANIMATION)!
      
      if (!animation.playing) continue
      
      animation.elapsed += deltaTime
      
      if (animation.elapsed >= animation.frameTime) {
        animation.elapsed = 0
        animation.currentFrame++
        
        if (animation.currentFrame >= animation.frameCount) {
          if (animation.loop) {
            animation.currentFrame = 0
          } else {
            animation.currentFrame = animation.frameCount - 1
            animation.playing = false
          }
        }
      }
    }
  }
}

// =============================================================================
// LIFETIME SYSTEM
// =============================================================================

/**
 * Lifetime Component
 * Entities with this component will be destroyed after a set time
 */
export interface LifetimeComponent {
  remaining: number
}

export function createLifetime(duration: number): LifetimeComponent {
  return { remaining: duration }
}

/**
 * Lifetime System
 * Destroys entities after their lifetime expires
 */
export class LifetimeSystem implements System {
  public readonly name = 'lifetime'
  public readonly requiredComponents = ['lifetime']
  
  private entitiesToDestroy: Entity[] = []
  
  public update(entities: Entity[], deltaTime: number): void {
    this.entitiesToDestroy = []
    
    for (const entity of entities) {
      const lifetime = entity.getComponent<LifetimeComponent>('lifetime')!
      lifetime.remaining -= deltaTime
      
      if (lifetime.remaining <= 0) {
        this.entitiesToDestroy.push(entity)
      }
    }
    
    // Destroy expired entities
    for (const entity of this.entitiesToDestroy) {
      entity.destroy()
    }
  }
}
