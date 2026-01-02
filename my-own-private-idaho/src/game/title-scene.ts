/**
 * Title Scene
 * A lonely road stretching into the Idaho horizon
 */

import * as THREE from 'three'
import { Scene, SceneType, SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'

export function createTitleScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  let titleMesh: THREE.Mesh
  let subtitleMesh: THREE.Mesh
  let pressStartMesh: THREE.Mesh
  let blinkTimer = 0
  let clouds: THREE.Mesh[] = []
  let road: THREE.Mesh

  return {
    name: 'title' as SceneType,

    enter() {
      // Clear scene
      while (threeScene.children.length > 0) {
        threeScene.remove(threeScene.children[0])
      }

      // Idaho sky - warm golden orange at sunset
      threeScene.background = new THREE.Color(NES_PALETTE.ORANGE)

      // Ambient light
      const light = new THREE.AmbientLight(0xffffff, 1)
      threeScene.add(light)

      // Create drifting clouds
      for (let i = 0; i < 8; i++) {
        const cloudGeo = new THREE.BoxGeometry(
          1.5 + Math.random() * 2,
          0.3 + Math.random() * 0.3,
          0.2
        )
        const cloudMat = new THREE.MeshBasicMaterial({
          color: NES_PALETTE.LIGHT_YELLOW,
          transparent: true,
          opacity: 0.7
        })
        const cloud = new THREE.Mesh(cloudGeo, cloudMat)
        cloud.position.set(
          (Math.random() - 0.5) * 20,
          2 + Math.random() * 3,
          -2
        )
        threeScene.add(cloud)
        clouds.push(cloud)
      }

      // Ground - golden wheat fields
      const groundGeo = new THREE.PlaneGeometry(20, 6)
      const groundMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.TAN })
      const ground = new THREE.Mesh(groundGeo, groundMat)
      ground.position.set(0, -4, -1)
      threeScene.add(ground)

      // The Road - stretching to infinity
      const roadGeo = new THREE.PlaneGeometry(3, 8)
      const roadMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_GRAY })
      road = new THREE.Mesh(roadGeo, roadMat)
      road.position.set(0, -3, 0)
      road.rotation.x = -0.3
      threeScene.add(road)

      // Road center line
      const lineGeo = new THREE.PlaneGeometry(0.15, 6)
      const lineMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
      const centerLine = new THREE.Mesh(lineGeo, lineMat)
      centerLine.position.set(0, -2.9, 0.1)
      centerLine.rotation.x = -0.3
      threeScene.add(centerLine)

      // Title "MY OWN PRIVATE IDAHO"
      const titleGeo = new THREE.BoxGeometry(7, 1, 0.3)
      const titleMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
      titleMesh = new THREE.Mesh(titleGeo, titleMat)
      titleMesh.position.set(0, 3, 0)
      threeScene.add(titleMesh)

      // Subtitle decoration
      const subGeo = new THREE.BoxGeometry(4, 0.2, 0.2)
      const subMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.LIGHT_ORANGE })
      subtitleMesh = new THREE.Mesh(subGeo, subMat)
      subtitleMesh.position.set(0, 2, 0)
      threeScene.add(subtitleMesh)

      // "Press Start" indicator
      const startGeo = new THREE.BoxGeometry(3, 0.4, 0.2)
      const startMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
      pressStartMesh = new THREE.Mesh(startGeo, startMat)
      pressStartMesh.position.set(0, 0.5, 0)
      threeScene.add(pressStartMesh)

      // Mountains in the distance
      const mtColors = [NES_PALETTE.PURPLE, NES_PALETTE.DARK_BLUE]
      const mtPositions = [
        { x: -5, y: -1, scale: 2.5 },
        { x: 5, y: -0.8, scale: 3 },
        { x: 0, y: -0.5, scale: 2 },
      ]
      mtPositions.forEach((pos, i) => {
        const mtGeo = new THREE.ConeGeometry(pos.scale, pos.scale * 1.5, 4)
        const mtMat = new THREE.MeshBasicMaterial({
          color: mtColors[i % mtColors.length]
        })
        const mountain = new THREE.Mesh(mtGeo, mtMat)
        mountain.position.set(pos.x, pos.y, -3)
        threeScene.add(mountain)
      })

      blinkTimer = 0
    },

    exit() {
      clouds = []
    },

    update(dt: number) {
      blinkTimer += dt

      // Blink "Press Start"
      if (pressStartMesh) {
        pressStartMesh.visible = Math.floor(blinkTimer * 1.5) % 2 === 0
      }

      // Drift clouds slowly
      clouds.forEach((cloud, i) => {
        cloud.position.x += dt * 0.3 * (i % 2 === 0 ? 1 : 0.5)
        if (cloud.position.x > 12) {
          cloud.position.x = -12
        }
      })

      // Subtle title float
      if (titleMesh) {
        titleMesh.position.y = 3 + Math.sin(blinkTimer * 0.8) * 0.1
      }

      // Check for start
      if (input.justPressed('start') || input.justPressed('a')) {
        sceneManager.switchTo('road')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
