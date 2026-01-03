/**
 * Game Scenes / State Machine
 * Re-exports from engine for backward compatibility
 */

export { Scene, SceneManager } from '../engine/scenes'

// Game-specific scene types
export type SceneType = 'title' | 'map' | 'level1' | 'level2' | 'level3'
