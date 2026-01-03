# Entity System Documentation

## Overview

The 8bit-engine now includes a complete Entity-Component-System (ECS) architecture for managing game objects. This system follows the Carmack principles of simplicity and pragmatism while providing powerful composition-based game object management.

## What is ECS?

Entity-Component-System is a software architectural pattern commonly used in game development that separates:

- **Entities**: Lightweight objects with unique IDs (containers for components)
- **Components**: Pure data structures with no logic
- **Systems**: Pure logic that operates on entities with specific components

### Why ECS?

- **Composition over inheritance**: Build complex behaviors by combining simple components
- **Data-oriented design**: Components are pure data, making them cache-friendly
- **Flexibility**: Easy to add/remove/change entity behavior at runtime
- **Testability**: Pure functions (systems) are easy to test
- **Performance**: Systems can process entities in batches efficiently

## Architecture

### Core Classes

#### Entity (`entity.ts`)

```typescript
const entity = new Entity('player')
entity.addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
entity.addComponent(COMPONENT.VELOCITY, createVelocity(5, 0, 0))
```

- Unique ID assignment
- Component storage (Map-based)
- Active/inactive state
- Tag support for categorization

#### Components (`component.ts`)

Pure data structures:

```typescript
interface TransformComponent {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

interface VelocityComponent {
  x: number
  y: number
  z: number
}
```

Factory functions for easy creation:
```typescript
const transform = createTransform(x, y, z)
const velocity = createVelocity(vx, vy, vz)
```

#### Systems (`system.ts`, `systems.ts`)

Logic that processes entities:

```typescript
class MovementSystem implements System {
  public readonly name = 'movement'
  public readonly requiredComponents = [COMPONENT.TRANSFORM, COMPONENT.VELOCITY]
  
  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>(COMPONENT.TRANSFORM)!
      const velocity = entity.getComponent<VelocityComponent>(COMPONENT.VELOCITY)!
      
      transform.position.x += velocity.x * deltaTime
      transform.position.y += velocity.y * deltaTime
      transform.position.z += velocity.z * deltaTime
    }
  }
}
```

#### EntityManager (`entity-manager.ts`)

Central management:

```typescript
const entityManager = new EntityManager()

// Create entities
const player = entityManager.createEntity('player')

// Add systems
entityManager.getSystemManager().addSystem(new MovementSystem())

// Update loop
entityManager.update(deltaTime)
```

## Built-in Components

### COMPONENT.TRANSFORM
Position, rotation, and scale in 3D space.

```typescript
createTransform(x, y, z)
```

### COMPONENT.VELOCITY
Linear velocity for movement.

```typescript
createVelocity(x, y, z)
```

### COMPONENT.SPRITE
Visual representation using Three.js mesh.

```typescript
{
  mesh: THREE.Mesh
  color?: number
  visible: boolean
}
```

### COMPONENT.HEALTH
Health and damage state.

```typescript
createHealth(maxHP)
```

### COMPONENT.COLLISION
Simple bounding box collision.

```typescript
createCollision(width, height, depth, layer)
```

### COMPONENT.INPUT
Marks entity as player-controlled.

```typescript
createInput(moveSpeed, jumpPower)
```

### COMPONENT.ANIMATION
Frame-based animation state.

```typescript
createAnimation(frameCount, frameTime)
```

### COMPONENT.LIFETIME
Auto-destroy after duration.

```typescript
createLifetime(duration)
```

## Built-in Systems

### MovementSystem
Updates entity positions based on velocity.

**Required Components**: Transform, Velocity

### SpriteRenderSystem
Synchronizes Three.js meshes with entity transforms.

**Required Components**: Transform, Sprite

### AnimationSystem
Updates frame-based animations.

**Required Components**: Animation

### LifetimeSystem
Destroys entities after their lifetime expires.

**Required Components**: Lifetime

## Usage Examples

### Simple Moving Entity

```typescript
import {
  EntityManager,
  COMPONENT,
  createTransform,
  createVelocity,
  MovementSystem
} from './engine'

const manager = new EntityManager()
manager.getSystemManager().addSystem(new MovementSystem())

const entity = manager.createEntity()
  .addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
  .addComponent(COMPONENT.VELOCITY, createVelocity(5, 0, 0))

// In game loop
function update(deltaTime: number) {
  manager.update(deltaTime)
}
```

### Player with Input

```typescript
const player = manager.createEntity('player')
  .addComponent(COMPONENT.TRANSFORM, createTransform(0, 0, 0))
  .addComponent(COMPONENT.VELOCITY, createVelocity(0, 0, 0))
  .addComponent(COMPONENT.INPUT, createInput(5, 10))

// Custom logic to handle input
function updatePlayerInput(input: Input) {
  const players = manager.getEntitiesByTag('player')
  
  for (const player of players) {
    const velocity = player.getComponent<VelocityComponent>(COMPONENT.VELOCITY)!
    const inputComp = player.getComponent<InputComponent>(COMPONENT.INPUT)!
    
    velocity.x = 0
    if (input.isPressed('left')) velocity.x = -inputComp.moveSpeed
    if (input.isPressed('right')) velocity.x = inputComp.moveSpeed
  }
}
```

### Temporary Effects

```typescript
const particle = manager.createEntity('particle')
  .addComponent(COMPONENT.TRANSFORM, createTransform(x, y, 0))
  .addComponent(COMPONENT.VELOCITY, createVelocity(vx, vy, 0))
  .addComponent(COMPONENT.LIFETIME, createLifetime(2.0)) // Lives 2 seconds

manager.getSystemManager().addSystem(new LifetimeSystem())
```

### Custom System

```typescript
class GravitySystem implements System {
  public readonly name = 'gravity'
  public readonly requiredComponents = [COMPONENT.VELOCITY]
  
  update(entities: Entity[], deltaTime: number): void {
    for (const entity of entities) {
      const velocity = entity.getComponent<VelocityComponent>(COMPONENT.VELOCITY)!
      velocity.y -= 9.8 * deltaTime // Apply gravity
    }
  }
}

manager.getSystemManager().addSystem(new GravitySystem())
```

## Querying Entities

```typescript
// By tag
const enemies = manager.getEntitiesByTag('enemy')

// By components
const moveableEntities = manager.getEntitiesWithComponents(
  COMPONENT.TRANSFORM,
  COMPONENT.VELOCITY
)

// All active entities
const active = manager.getActiveEntities()
```

## Entity Lifecycle

### Creation
```typescript
const entity = manager.createEntity('tag')
```

### Deactivation
```typescript
entity.setActive(false) // Entity still exists but won't be processed
```

### Destruction
```typescript
manager.destroyEntity(entity.id) // Deferred until end of frame
```

## Performance Considerations

1. **Deferred Destruction**: Entity destruction is deferred until the end of the frame to avoid modifying collections during iteration.

2. **Component Storage**: Components are stored in a Map for O(1) access.

3. **System Filtering**: Systems automatically filter entities based on required components.

4. **Batch Processing**: Systems process all matching entities in a single pass.

## Testing

The entity system includes 39 comprehensive unit tests covering:
- Entity creation and component management
- EntityManager queries and lifecycle
- SystemManager execution
- Built-in systems (Movement, Animation, Lifetime)
- Component factories

Run tests:
```bash
npm test
```

## Demo

An interactive demo is available in `src/entity-demo.ts`:
- Player-controlled entity (yellow box)
- Bouncing entities with lifetime
- Real-time entity count display

The demo showcases:
- Entity creation
- Component composition
- System updates
- Input handling
- Entity queries

## Integration with Existing Engine

The entity system integrates seamlessly with the existing engine:

- **Screens**: Use EntityManager in your screen's update method
- **Sprite System**: Combine with NES-authentic sprite rendering
- **Input System**: Use existing Input class with INPUT component
- **Three.js**: SPRITE component wraps Three.js meshes

```typescript
class GameScreen extends BaseScreen {
  private entityManager = new EntityManager()
  
  onEnter(): void {
    this.entityManager.getSystemManager()
      .addSystem(new MovementSystem())
      .addSystem(new SpriteRenderSystem())
    
    // Create game entities...
  }
  
  onUpdate(deltaTime: number): void {
    this.entityManager.update(deltaTime)
  }
}
```

## Future Enhancements

Potential additions:
- Physics system (collision detection and response)
- Particle system
- State machine component
- Pathfinding component
- Audio component
- Network synchronization support

## Philosophy

The entity system follows the project's Carmack principles:

1. **Simplicity**: Straightforward implementation, no over-engineering
2. **Pragmatism**: Solves real problems, not theoretical ones
3. **Performance**: Efficient batch processing of entities
4. **Testability**: Pure functions are easy to test
5. **Flexibility**: Composition allows unlimited game object types

"Make something work, then make it better." - John Carmack
