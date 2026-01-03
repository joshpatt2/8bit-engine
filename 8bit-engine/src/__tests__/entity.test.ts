/**
 * Entity System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Entity } from '../engine/entity'
import { EntityManager } from '../engine/entity-manager'
import { SystemManager } from '../engine/system'
import {
  COMPONENT,
  createTransform,
  createVelocity,
  createHealth,
  createAnimation,
  type TransformComponent,
} from '../engine/component'
import {
  MovementSystem,
  AnimationSystem,
  createLifetime,
  LifetimeSystem,
} from '../engine/systems'

describe('Entity', () => {
  beforeEach(() => {
    Entity.resetIdCounter()
  })

  it('should create entity with unique ID', () => {
    const entity1 = new Entity()
    const entity2 = new Entity()
    
    expect(entity1.id).toBe(1)
    expect(entity2.id).toBe(2)
  })

  it('should create entity with tag', () => {
    const entity = new Entity('player')
    
    expect(entity.tag).toBe('player')
  })

  it('should add and get components', () => {
    const entity = new Entity()
    const transform = createTransform(10, 20, 30)
    
    entity.addComponent(COMPONENT.TRANSFORM, transform)
    
    const retrieved = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)
    expect(retrieved).toBe(transform)
    expect(retrieved?.position.x).toBe(10)
    expect(retrieved?.position.y).toBe(20)
    expect(retrieved?.position.z).toBe(30)
  })

  it('should check if entity has component', () => {
    const entity = new Entity()
    
    expect(entity.hasComponent(COMPONENT.TRANSFORM)).toBe(false)
    
    entity.addComponent(COMPONENT.TRANSFORM, createTransform())
    
    expect(entity.hasComponent(COMPONENT.TRANSFORM)).toBe(true)
  })

  it('should check if entity has multiple components', () => {
    const entity = new Entity()
    entity.addComponent(COMPONENT.TRANSFORM, createTransform())
    entity.addComponent(COMPONENT.VELOCITY, createVelocity())
    
    expect(entity.hasComponents(COMPONENT.TRANSFORM, COMPONENT.VELOCITY)).toBe(true)
    expect(entity.hasComponents(COMPONENT.TRANSFORM, COMPONENT.HEALTH)).toBe(false)
  })

  it('should remove components', () => {
    const entity = new Entity()
    entity.addComponent(COMPONENT.TRANSFORM, createTransform())
    
    expect(entity.hasComponent(COMPONENT.TRANSFORM)).toBe(true)
    
    const removed = entity.removeComponent(COMPONENT.TRANSFORM)
    
    expect(removed).toBe(true)
    expect(entity.hasComponent(COMPONENT.TRANSFORM)).toBe(false)
  })

  it('should get all component names', () => {
    const entity = new Entity()
    entity.addComponent(COMPONENT.TRANSFORM, createTransform())
    entity.addComponent(COMPONENT.VELOCITY, createVelocity())
    
    const names = entity.getComponentNames()
    
    expect(names).toContain(COMPONENT.TRANSFORM)
    expect(names).toContain(COMPONENT.VELOCITY)
    expect(names.length).toBe(2)
  })

  it('should be active by default', () => {
    const entity = new Entity()
    
    expect(entity.isActive()).toBe(true)
  })

  it('should deactivate entity', () => {
    const entity = new Entity()
    
    entity.setActive(false)
    
    expect(entity.isActive()).toBe(false)
  })

  it('should destroy entity', () => {
    const entity = new Entity()
    entity.addComponent(COMPONENT.TRANSFORM, createTransform())
    
    entity.destroy()
    
    expect(entity.isActive()).toBe(false)
    expect(entity.hasComponent(COMPONENT.TRANSFORM)).toBe(false)
  })

  it('should allow method chaining', () => {
    const entity = new Entity()
      .addComponent(COMPONENT.TRANSFORM, createTransform())
      .addComponent(COMPONENT.VELOCITY, createVelocity())
    
    expect(entity.hasComponent(COMPONENT.TRANSFORM)).toBe(true)
    expect(entity.hasComponent(COMPONENT.VELOCITY)).toBe(true)
  })
})

describe('EntityManager', () => {
  let manager: EntityManager

  beforeEach(() => {
    Entity.resetIdCounter()
    manager = new EntityManager()
  })

  it('should create entities', () => {
    const entity = manager.createEntity()
    
    expect(entity).toBeDefined()
    expect(entity.id).toBe(1)
  })

  it('should create entities with tags', () => {
    const player = manager.createEntity('player')
    const enemy = manager.createEntity('enemy')
    
    expect(player.tag).toBe('player')
    expect(enemy.tag).toBe('enemy')
  })

  it('should get entity by ID', () => {
    const entity = manager.createEntity()
    
    const retrieved = manager.getEntity(entity.id)
    
    expect(retrieved).toBe(entity)
  })

  it('should get all entities', () => {
    manager.createEntity()
    manager.createEntity()
    manager.createEntity()
    
    const entities = manager.getEntities()
    
    expect(entities.length).toBe(3)
  })

  it('should get active entities only', () => {
    const entity1 = manager.createEntity()
    const entity2 = manager.createEntity()
    const entity3 = manager.createEntity()
    
    entity2.setActive(false)
    
    const activeEntities = manager.getActiveEntities()
    
    expect(activeEntities.length).toBe(2)
    expect(activeEntities).toContain(entity1)
    expect(activeEntities).not.toContain(entity2)
    expect(activeEntities).toContain(entity3)
  })

  it('should get entities by tag', () => {
    manager.createEntity('player')
    manager.createEntity('enemy')
    manager.createEntity('enemy')
    
    const enemies = manager.getEntitiesByTag('enemy')
    
    expect(enemies.length).toBe(2)
  })

  it('should get entities with specific components', () => {
    const entity1 = manager.createEntity()
    entity1.addComponent(COMPONENT.TRANSFORM, createTransform())
    entity1.addComponent(COMPONENT.VELOCITY, createVelocity())
    
    const entity2 = manager.createEntity()
    entity2.addComponent(COMPONENT.TRANSFORM, createTransform())
    
    const entity3 = manager.createEntity()
    entity3.addComponent(COMPONENT.VELOCITY, createVelocity())
    
    const moveable = manager.getEntitiesWithComponents(
      COMPONENT.TRANSFORM,
      COMPONENT.VELOCITY
    )
    
    expect(moveable.length).toBe(1)
    expect(moveable[0]).toBe(entity1)
  })

  it('should destroy entity (deferred)', () => {
    const entity = manager.createEntity()
    
    manager.destroyEntity(entity.id)
    
    // Entity still exists before update
    expect(manager.getEntity(entity.id)).toBeDefined()
    
    // Entity removed after update
    manager.update(0)
    
    expect(manager.getEntity(entity.id)).toBeUndefined()
  })

  it('should get entity count', () => {
    manager.createEntity()
    manager.createEntity()
    
    expect(manager.getEntityCount()).toBe(2)
  })

  it('should get active entity count', () => {
    const entity1 = manager.createEntity()
    manager.createEntity()
    
    entity1.setActive(false)
    
    expect(manager.getActiveEntityCount()).toBe(1)
  })

  it('should clear all entities', () => {
    manager.createEntity()
    manager.createEntity()
    
    manager.clear()
    
    expect(manager.getEntityCount()).toBe(0)
  })

  it('should update systems', () => {
    const entity = manager.createEntity()
    entity.addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
    entity.addComponent(COMPONENT.VELOCITY, createVelocity(10, 5, 0))
    
    manager.getSystemManager().addSystem(new MovementSystem())
    
    manager.update(1) // 1 second delta
    
    const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
    expect(transform.position.x).toBe(10)
    expect(transform.position.y).toBe(5)
  })
})

describe('SystemManager', () => {
  let systemManager: SystemManager
  let entities: Entity[]

  beforeEach(() => {
    Entity.resetIdCounter()
    systemManager = new SystemManager()
    entities = []
  })

  it('should add systems', () => {
    const system = new MovementSystem()
    
    systemManager.addSystem(system)
    
    expect(systemManager.getSystem('movement')).toBe(system)
  })

  it('should remove systems', () => {
    const system = new MovementSystem()
    systemManager.addSystem(system)
    
    const removed = systemManager.removeSystem('movement')
    
    expect(removed).toBe(true)
    expect(systemManager.getSystem('movement')).toBeUndefined()
  })

  it('should get all systems', () => {
    systemManager.addSystem(new MovementSystem())
    systemManager.addSystem(new AnimationSystem())
    
    const systems = systemManager.getSystems()
    
    expect(systems.length).toBe(2)
  })

  it('should update systems with matching entities', () => {
    const entity1 = new Entity()
    entity1.addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
    entity1.addComponent(COMPONENT.VELOCITY, createVelocity(5, 10, 0))
    
    const entity2 = new Entity()
    entity2.addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
    
    entities.push(entity1, entity2)
    
    systemManager.addSystem(new MovementSystem())
    systemManager.update(entities, 1)
    
    const transform1 = entity1.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
    const transform2 = entity2.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
    
    // Only entity1 has velocity, so only it moves
    expect(transform1.position.x).toBe(5)
    expect(transform1.position.y).toBe(10)
    expect(transform2.position.x).toBe(0)
    expect(transform2.position.y).toBe(0)
  })

  it('should skip inactive entities', () => {
    const entity = new Entity()
    entity.addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
    entity.addComponent(COMPONENT.VELOCITY, createVelocity(10, 10, 0))
    entity.setActive(false)
    
    entities.push(entity)
    
    systemManager.addSystem(new MovementSystem())
    systemManager.update(entities, 1)
    
    const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
    
    // Entity is inactive, so it shouldn't move
    expect(transform.position.x).toBe(0)
    expect(transform.position.y).toBe(0)
  })

  it('should clear all systems', () => {
    systemManager.addSystem(new MovementSystem())
    systemManager.addSystem(new AnimationSystem())
    
    systemManager.clear()
    
    expect(systemManager.getSystems().length).toBe(0)
  })
})

describe('Built-in Systems', () => {
  beforeEach(() => {
    Entity.resetIdCounter()
  })

  describe('MovementSystem', () => {
    it('should update entity positions based on velocity', () => {
      const entity = new Entity()
      entity.addComponent(COMPONENT.TRANSFORM, createTransform(100, 50, 0))
      entity.addComponent(COMPONENT.VELOCITY, createVelocity(10, -5, 2))
      
      const system = new MovementSystem()
      system.update([entity], 2) // 2 second delta
      
      const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
      expect(transform.position.x).toBe(120)
      expect(transform.position.y).toBe(40)
      expect(transform.position.z).toBe(4)
    })
  })

  describe('AnimationSystem', () => {
    it('should advance animation frames', () => {
      const entity = new Entity()
      const animation = createAnimation(4, 0.1)
      entity.addComponent(COMPONENT.ANIMATION, animation)
      
      const system = new AnimationSystem()
      
      expect(animation.currentFrame).toBe(0)
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(1)
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(2)
    })

    it('should loop animation', () => {
      const entity = new Entity()
      const animation = createAnimation(2, 0.1)
      entity.addComponent(COMPONENT.ANIMATION, animation)
      
      const system = new AnimationSystem()
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(1)
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(0) // Looped back
    })

    it('should stop animation when not looping', () => {
      const entity = new Entity()
      const animation = createAnimation(2, 0.1)
      animation.loop = false
      entity.addComponent(COMPONENT.ANIMATION, animation)
      
      const system = new AnimationSystem()
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(1)
      expect(animation.playing).toBe(true)
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(1) // Stays at last frame
      expect(animation.playing).toBe(false)
    })

    it('should not update paused animations', () => {
      const entity = new Entity()
      const animation = createAnimation(4, 0.1)
      animation.playing = false
      entity.addComponent(COMPONENT.ANIMATION, animation)
      
      const system = new AnimationSystem()
      
      system.update([entity], 0.1)
      expect(animation.currentFrame).toBe(0)
    })
  })

  describe('LifetimeSystem', () => {
    it('should destroy entities after lifetime expires', () => {
      const entity = new Entity()
      entity.addComponent('lifetime', createLifetime(1.0))
      
      const system = new LifetimeSystem()
      
      expect(entity.isActive()).toBe(true)
      
      system.update([entity], 0.5)
      expect(entity.isActive()).toBe(true)
      
      system.update([entity], 0.6)
      expect(entity.isActive()).toBe(false)
    })
  })
})

describe('Component Factories', () => {
  it('should create transform component', () => {
    const transform = createTransform(10, 20, 30)
    
    expect(transform.position.x).toBe(10)
    expect(transform.position.y).toBe(20)
    expect(transform.position.z).toBe(30)
    expect(transform.scale.x).toBe(1)
    expect(transform.scale.y).toBe(1)
    expect(transform.scale.z).toBe(1)
  })

  it('should create velocity component', () => {
    const velocity = createVelocity(5, -10, 2)
    
    expect(velocity.x).toBe(5)
    expect(velocity.y).toBe(-10)
    expect(velocity.z).toBe(2)
  })

  it('should create health component', () => {
    const health = createHealth(100)
    
    expect(health.current).toBe(100)
    expect(health.max).toBe(100)
    expect(health.invulnerable).toBe(false)
  })

  it('should create animation component', () => {
    const animation = createAnimation(8, 0.2)
    
    expect(animation.frameCount).toBe(8)
    expect(animation.frameTime).toBe(0.2)
    expect(animation.currentFrame).toBe(0)
    expect(animation.loop).toBe(true)
    expect(animation.playing).toBe(true)
  })
})
