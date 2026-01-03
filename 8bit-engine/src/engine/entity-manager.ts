/**
 * Entity Manager
 * 
 * Central management for all entities in the game.
 * Handles entity creation, destruction, and queries.
 */

import { Entity, type EntityId } from './entity'
import { SystemManager } from './system'

// =============================================================================
// ENTITY MANAGER
// =============================================================================

export class EntityManager {
  private entities: Map<EntityId, Entity> = new Map()
  private systemManager: SystemManager = new SystemManager()
  private entitiesToDestroy: Set<EntityId> = new Set()
  
  /**
   * Create a new entity
   */
  public createEntity(tag?: string): Entity {
    const entity = new Entity(tag)
    this.entities.set(entity.id, entity)
    return entity
  }
  
  /**
   * Get an entity by ID
   */
  public getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id)
  }
  
  /**
   * Get all entities
   */
  public getEntities(): Entity[] {
    return Array.from(this.entities.values())
  }
  
  /**
   * Get active entities only
   */
  public getActiveEntities(): Entity[] {
    return this.getEntities().filter(e => e.isActive())
  }
  
  /**
   * Get entities by tag
   */
  public getEntitiesByTag(tag: string): Entity[] {
    return this.getEntities().filter(e => e.tag === tag)
  }
  
  /**
   * Get entities that have specific components
   */
  public getEntitiesWithComponents(...componentNames: string[]): Entity[] {
    return this.getActiveEntities().filter(e => 
      e.hasComponents(...componentNames)
    )
  }
  
  /**
   * Destroy an entity (deferred until end of frame)
   */
  public destroyEntity(id: EntityId): void {
    this.entitiesToDestroy.add(id)
  }
  
  /**
   * Immediately remove an entity
   */
  private removeEntity(id: EntityId): boolean {
    const entity = this.entities.get(id)
    if (entity) {
      entity.destroy()
      this.entities.delete(id)
      return true
    }
    return false
  }
  
  /**
   * Process deferred entity destructions
   */
  private processDestructions(): void {
    for (const id of this.entitiesToDestroy) {
      this.removeEntity(id)
    }
    this.entitiesToDestroy.clear()
  }
  
  /**
   * Get the system manager
   */
  public getSystemManager(): SystemManager {
    return this.systemManager
  }
  
  /**
   * Update all systems with all active entities
   */
  public update(deltaTime: number): void {
    const activeEntities = this.getActiveEntities()
    this.systemManager.update(activeEntities, deltaTime)
    this.processDestructions()
  }
  
  /**
   * Clear all entities
   */
  public clear(): void {
    for (const entity of this.entities.values()) {
      entity.destroy()
    }
    this.entities.clear()
    this.entitiesToDestroy.clear()
  }
  
  /**
   * Get entity count
   */
  public getEntityCount(): number {
    return this.entities.size
  }
  
  /**
   * Get active entity count
   */
  public getActiveEntityCount(): number {
    return this.getActiveEntities().length
  }
}
