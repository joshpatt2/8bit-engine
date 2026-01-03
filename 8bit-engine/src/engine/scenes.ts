/**
 * Game Scenes / State Machine
 * Manages transitions between different game states/screens
 */

export type SceneType = string

export interface Scene {
  name: SceneType
  enter: () => void
  exit: () => void
  update: (dt: number) => void
  render: () => void
}

export class SceneManager {
  private scenes: Map<SceneType, Scene> = new Map()
  private currentScene: Scene | null = null
  private currentSceneName: SceneType | null = null

  register(scene: Scene): void {
    this.scenes.set(scene.name, scene)
  }

  switchTo(sceneName: SceneType): void {
    if (this.currentScene) {
      this.currentScene.exit()
    }

    const nextScene = this.scenes.get(sceneName)
    if (!nextScene) {
      console.error(`Scene "${sceneName}" not found`)
      return
    }

    this.currentScene = nextScene
    this.currentSceneName = sceneName
    this.currentScene.enter()
  }

  update(dt: number): void {
    if (this.currentScene) {
      this.currentScene.update(dt)
    }
  }

  render(): void {
    if (this.currentScene) {
      this.currentScene.render()
    }
  }

  getCurrentScene(): SceneType | null {
    return this.currentSceneName
  }
}
