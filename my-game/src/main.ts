import './style.css'
import * as THREE from 'three'

// Scene setup
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a1a2e)

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 5, 10)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.querySelector<HTMLDivElement>('#app')!.appendChild(renderer.domElement)

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 10, 5)
scene.add(directionalLight)

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(20, 20)
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d3436,
  side: THREE.DoubleSide
})
const ground = new THREE.Mesh(groundGeometry, groundMaterial)
ground.rotation.x = -Math.PI / 2
scene.add(ground)

// Grid helper
const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x333333)
scene.add(gridHelper)

// Player cube
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00d9ff })
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
cube.position.y = 0.5
scene.add(cube)

// Input handling
const keys: { [key: string]: boolean } = {}
const speed = 0.1

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true
})

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false
})

// HUD
const hud = document.createElement('div')
hud.id = 'hud'
hud.innerHTML = `
  <strong>WASD</strong> to move<br>
  <strong>Q/E</strong> to rotate<br>
  <span id="position">Position: (0, 0)</span>
`
document.body.appendChild(hud)

const positionDisplay = document.querySelector('#position')!

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Game loop
function animate() {
  requestAnimationFrame(animate)

  // Movement
  if (keys['w']) cube.position.z -= speed
  if (keys['s']) cube.position.z += speed
  if (keys['a']) cube.position.x -= speed
  if (keys['d']) cube.position.x += speed

  // Rotation
  if (keys['q']) cube.rotation.y += 0.05
  if (keys['e']) cube.rotation.y -= 0.05

  // Keep cube within bounds
  cube.position.x = Math.max(-9, Math.min(9, cube.position.x))
  cube.position.z = Math.max(-9, Math.min(9, cube.position.z))

  // Update HUD
  positionDisplay.textContent = `Position: (${cube.position.x.toFixed(1)}, ${cube.position.z.toFixed(1)})`

  // Camera follows cube (slightly)
  camera.position.x = cube.position.x * 0.3
  camera.position.z = cube.position.z * 0.3 + 10
  camera.lookAt(cube.position)

  renderer.render(scene, camera)
}

animate()
