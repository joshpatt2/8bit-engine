/**
 * 8BIT QUEST - Test Game
 * Demonstrates the 8bit-engine with:
 * - Title screen
 * - World map (SMB3-style)
 * - 3 Platformer levels
 */

import { Game } from '../engine/game'
import { createTitleScene } from './title-scene'
import type { LevelStatus } from './map-scene'
import { createMapScene } from './map-scene'
import { createLevelScene } from './level-scene'

export function startGame(container: HTMLElement): void {
  // Create game instance
  const game = new Game({
    container,
    title: '8BIT QUEST',
    controls: 'Arrows/WASD: Move | Z: Jump/Select<br>Enter: Start | Shift: Select | X: Back',
  })

  // Level completion tracking (game-specific state)
  const levelStatus: LevelStatus = {
    level1: 'unlocked',
    level2: 'locked',
    level3: 'locked',
  }

  // Register scenes
  game.registerScene(
    createTitleScene(game.scene, game.camera, game.renderer, game.input, game.sceneManager)
  )

  game.registerScene(
    createMapScene(game.scene, game.camera, game.renderer, game.input, game.sceneManager, levelStatus)
  )

  game.registerScene(
    createLevelScene('level1', game.scene, game.camera, game.renderer, game.input, game.sceneManager, () => {
      levelStatus.level1 = 'complete'
      levelStatus.level2 = 'unlocked'
    })
  )

  game.registerScene(
    createLevelScene('level2', game.scene, game.camera, game.renderer, game.input, game.sceneManager, () => {
      levelStatus.level2 = 'complete'
      levelStatus.level3 = 'unlocked'
    })
  )

  game.registerScene(
    createLevelScene('level3', game.scene, game.camera, game.renderer, game.input, game.sceneManager, () => {
      levelStatus.level3 = 'complete'
      console.log('🎉 Game Complete!')
    })
  )

  // Start at title
  game.switchToScene('title')
  game.start()
}

