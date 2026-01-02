/**
 * Dream Scene
 * Surreal narcoleptic dream sequences
 */

import * as THREE from 'three'
import { Scene, SceneType, SceneManager } from './scenes'
import { NES_PALETTE } from '../engine/palette'
import { Input } from '../engine/input'

export function createDreamScene(
  threeScene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  input: Input,
  sceneManager: SceneManager
): Scene {
  let dreamTimer = 0
  const floatingObjects: THREE.Mesh[] = []
  let houseOfMother: THREE.Mesh

  return {
    name: 'dream' as SceneType,

    enter() {
      // Clear scene
      while (threeScene.children.length > 0) {
        threeScene.remove(threeScene.children[0])
      }

      // Dream sky - deep purple/blue
      threeScene.background = new THREE.Color(NES_PALETTE.PURPLE)

      // Dim ambient light for dreamlike quality
      const light = new THREE.AmbientLight(0xffffff, 0.7)
      threeScene.add(light)

      // Floating salmon (iconic Idaho image)
      for (let i = 0; i < 5; i++) {
        const salmonGeo = new THREE.BoxGeometry(1.2, 0.4, 0.3)
        const salmonMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.LIGHT_RED })
        const salmon = new THREE.Mesh(salmonGeo, salmonMat)
        salmon.position.set(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 8,
          -1
        )
        salmon.rotation.z = Math.random() * Math.PI * 2
        threeScene.add(salmon)
        floatingObjects.push(salmon)
      }

      // The house - mother's house in the distance
      const houseGeo = new THREE.BoxGeometry(3, 2, 0.5)
      const houseMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.TAN })
      houseOfMother = new THREE.Mesh(houseGeo, houseMat)
      houseOfMother.position.set(0, 3, -2)
      threeScene.add(houseOfMother)

      // Roof
      const roofGeo = new THREE.ConeGeometry(2.2, 1.5, 4)
      const roofMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.BROWN })
      const roof = new THREE.Mesh(roofGeo, roofMat)
      roof.position.set(0, 1.5, 0)
      roof.rotation.y = Math.PI / 4
      houseOfMother.add(roof)

      // Window light
      const windowGeo = new THREE.PlaneGeometry(0.5, 0.5)
      const windowMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.YELLOW })
      const window1 = new THREE.Mesh(windowGeo, windowMat)
      window1.position.set(-0.6, 0.2, 0.3)
      houseOfMother.add(window1)
      const window2 = new THREE.Mesh(windowGeo, windowMat)
      window2.position.set(0.6, 0.2, 0.3)
      houseOfMother.add(window2)

      // Door
      const doorGeo = new THREE.PlaneGeometry(0.6, 0.9)
      const doorMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.DARK_RED })
      const door = new THREE.Mesh(doorGeo, doorMat)
      door.position.set(0, -0.4, 0.3)
      houseOfMother.add(door)

      // Floating stars (more prominent than usual)
      for (let i = 0; i < 20; i++) {
        const starGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1)
        const starMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.LIGHT_CYAN })
        const star = new THREE.Mesh(starGeo, starMat)
        star.position.set(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 10,
          -3
        )
        threeScene.add(star)
        floatingObjects.push(star)
      }

      // Ground that warps
      const groundGeo = new THREE.PlaneGeometry(16, 4)
      const groundMat = new THREE.MeshBasicMaterial({
        color: NES_PALETTE.DARK_GREEN,
        transparent: true,
        opacity: 0.5
      })
      const ground = new THREE.Mesh(groundGeo, groundMat)
      ground.position.set(0, -4, 0)
      threeScene.add(ground)

      // Text hint
      const wakeGeo = new THREE.BoxGeometry(4, 0.3, 0.1)
      const wakeMat = new THREE.MeshBasicMaterial({ color: NES_PALETTE.WHITE })
      const wakeText = new THREE.Mesh(wakeGeo, wakeMat)
      wakeText.position.set(0, -5, 0)
      threeScene.add(wakeText)
      floatingObjects.push(wakeText)

      dreamTimer = 0
    },

    exit() {
      floatingObjects.length = 0
    },

    update(dt: number) {
      dreamTimer += dt

      // Float all objects dreamily
      floatingObjects.forEach((obj, i) => {
        obj.position.y += Math.sin(dreamTimer * 1.5 + i * 0.7) * dt * 0.5
        obj.rotation.z += dt * 0.2 * (i % 2 === 0 ? 1 : -1)
      })

      // The house breathes
      if (houseOfMother) {
        const scale = 1 + Math.sin(dreamTimer * 0.8) * 0.05
        houseOfMother.scale.set(scale, scale, 1)
        houseOfMother.position.y = 3 + Math.sin(dreamTimer * 0.5) * 0.3
      }

      // Background color shifts
      const colorPhase = (Math.sin(dreamTimer * 0.3) + 1) / 2
      const r = 0x68 + Math.floor(colorPhase * 0x30)
      const g = 0x44 + Math.floor(colorPhase * 0x20)
      const b = 0xfc - Math.floor(colorPhase * 0x40)
      threeScene.background = new THREE.Color((r << 16) | (g << 8) | b)

      // Press any button to wake up
      if (input.justPressed('start') || input.justPressed('a') || input.justPressed('b')) {
        sceneManager.switchTo('road')
      }
    },

    render() {
      renderer.render(threeScene, camera)
    },
  }
}
