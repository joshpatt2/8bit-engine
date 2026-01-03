/**
 * Entity System - Systems
 * 
 * Systems contain logic and operate on entities with specific components.
 * They process entities each frame to implement game behavior.
 */

import type { Entity } from './entity'

// =============================================================================
// SYSTEM INTERFACE
// =============================================================================

export interface System {
  /** System name */
  readonly name: string
  
  /** Required component names for this system */
  readonly requiredComponents: string[]
  
  /**
   * Update this system
   * @param entities - All entities to process
   * @param deltaTime - Time since last frame in seconds
   */
  update(entities: Entity[], deltaTime: number): void
  
  /**
   * Optional: Called when system is initialized
   */
  init?(): void
  
  /**
   * Optional: Called when system is destroyed
   */
  destroy?(): void
}

// =============================================================================
// SYSTEM MANAGER
// =============================================================================

export class SystemManager {
  private systems: System[] = []
  
  /**
   * Add a system to the manager
   */
  public addSystem(system: System): this {
    this.systems.push(system)
    if (system.init) {
      system.init()
    }
    return this
  }
  
  /**
   * Remove a system by name
   */
  public removeSystem(name: string): boolean {
    const index = this.systems.findIndex(s => s.name === name)
    if (index !== -1) {
      const system = this.systems[index]
      if (system.destroy) {
        system.destroy()
      }
      this.systems.splice(index, 1)
      return true
    }
    return false
  }
  
  /**
   * Get a system by name
   */
  public getSystem(name: string): System | undefined {
    return this.systems.find(s => s.name === name)
  }
  
  /**
   * Update all systems
   */
  public update(entities: Entity[], deltaTime: number): void {
    for (const system of this.systems) {
      // Filter entities that have all required components and are active
      const validEntities = entities.filter(entity => 
        entity.isActive() && 
        entity.hasComponents(...system.requiredComponents)
      )
      
      system.update(validEntities, deltaTime)
    }
  }
  
  /**
   * Get all systems
   */
  public getSystems(): ReadonlyArray<System> {
    return this.systems
  }
  
  /**
   * Clear all systems
   */
  public clear(): void {
    for (const system of this.systems) {
      if (system.destroy) {
        system.destroy()
      }
    }
    this.systems = []
  }
}
