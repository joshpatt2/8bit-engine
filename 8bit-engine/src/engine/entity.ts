/**
 * Entity System - Core Entity
 * 
 * Simple entity implementation following the Entity-Component-System pattern.
 * Entities are just IDs with a collection of components.
 */

// =============================================================================
// ENTITY TYPES
// =============================================================================

/** Unique identifier for an entity */
export type EntityId = number

// =============================================================================
// ENTITY CLASS
// =============================================================================

export class Entity {
  private static nextId: EntityId = 1
  
  /** Unique entity ID */
  public readonly id: EntityId
  
  /** Components attached to this entity */
  private components: Map<string, any> = new Map()
  
  /** Whether this entity is active */
  private active: boolean = true
  
  /** Optional tag for categorization */
  public tag?: string
  
  constructor(tag?: string) {
    this.id = Entity.nextId++
    this.tag = tag
  }
  
  /**
   * Add a component to this entity
   */
  public addComponent<T>(componentName: string, component: T): this {
    this.components.set(componentName, component)
    return this
  }
  
  /**
   * Get a component from this entity
   */
  public getComponent<T>(componentName: string): T | undefined {
    return this.components.get(componentName) as T | undefined
  }
  
  /**
   * Check if entity has a component
   */
  public hasComponent(componentName: string): boolean {
    return this.components.has(componentName)
  }
  
  /**
   * Check if entity has all specified components
   */
  public hasComponents(...componentNames: string[]): boolean {
    return componentNames.every(name => this.components.has(name))
  }
  
  /**
   * Remove a component from this entity
   */
  public removeComponent(componentName: string): boolean {
    return this.components.delete(componentName)
  }
  
  /**
   * Get all component names
   */
  public getComponentNames(): string[] {
    return Array.from(this.components.keys())
  }
  
  /**
   * Check if entity is active
   */
  public isActive(): boolean {
    return this.active
  }
  
  /**
   * Activate/deactivate this entity
   */
  public setActive(active: boolean): void {
    this.active = active
  }
  
  /**
   * Destroy this entity (deactivates it)
   */
  public destroy(): void {
    this.active = false
    this.components.clear()
  }
  
  /**
   * Reset entity ID counter (useful for testing)
   */
  public static resetIdCounter(): void {
    Entity.nextId = 1
  }
}
