import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';
const renderer = new THREE.WebGLRenderer();
const scene = new THREE.Scene();
let camera = null
let controls = null
let scoreDiv = null
let showSolving = false
let stopSolving = false
let solving = false

const availableColors = ['R','G','W','B']

const initialStack = [
//  R,   L,   T,   B,   Bk,  F
  ['R', 'W', 'W', 'B', 'G', 'R'],
  ['G', 'W', 'B', 'R', 'B', 'W'],
  ['B', 'B', 'R', 'G', 'W', 'G'],
  ['R', 'R', 'G', 'W', 'R', 'B']
]
// Duplicate the initial stack so we can reset the cubes
let stack = initialStack.map ( layer => layer.slice() )

const cubes = []

const stackHeight = 4
let totalTries = 0
const buttonHeight = 40

const RIGHT = 0 // 0
const LEFT = 1 // 1
const TOP = 2 // 2
const BOTTOM = 3 // 3
const BACK = 4 // 4
const FRONT = 5 // 5

const setupCube = () => {
  const sides = []
  for(let i = 0; i < 6; i++) {
    const randomColor = Math.floor(Math.random() * availableColors.length)
    sides[i] = availableColors[randomColor]
  }
  return sides
}

const setupCubes = () => {
  const stack = []
  for(let i = 0; i < stackHeight; i++) {
    stack.push(setupCube())
  }
  return stack
}

// Check that the stack is solved, there should be one of each color
// on each side of the stack
const checkSolution = (stack) => {
  // Check that each side has one of each color
  const sides = [LEFT, FRONT, RIGHT, BACK]
  let solvedSides = 0
  for(let i = 0; i < sides.length; i++) {
    const side = sides[i]
    const colors = { 'R': 0, 'G': 0, 'W': 0, 'B': 0 }
    stack.forEach(layer => {
      colors[layer[side]]++
    })
    if(colors['R'] != 1) { return false }
    if(colors['G'] != 1) { return false}
    if(colors['W'] != 1) { return false}
    if(colors['B'] != 1) { return false }
  }

  return true
}

const animateRotationLeft = async (cube, finalRotate) => {
  while(cube.rotation.y < finalRotate) {
    cube.rotation.y += 0.7
    renderer.render(scene, camera)
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  cube.rotation.y = finalRotate
}


const animateRotationForward = async (cube, finalRotate) => {
  while(cube.rotation.x > finalRotate) {
    cube.rotation.x -= 0.7
    renderer.render(scene, camera)
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  cube.rotation.x = finalRotate
}

const animateRotationSideways = async (cube, finalRotate) => {
  while(cube.rotation.z < finalRotate) {
    cube.rotation.z += 0.7
    renderer.render(scene, camera)
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  cube.rotation.z = finalRotate
}

const rotateSideways = async (stack, layer) => {
  const top = stack[layer][TOP]
  const bottom = stack[layer][BOTTOM]
  const left  = stack[layer][LEFT]
  const right = stack[layer][RIGHT]

  stack[layer][TOP] = right
  stack[layer][BOTTOM] = left
  stack[layer][LEFT] = top
  stack[layer][RIGHT] = bottom

  const finalRotation = cubes[layer].rotation.z + Math.PI / 2
  if(showSolving && !stopSolving) {
    await animateRotationSideways(cubes[layer], finalRotation)
  }
}

// [top left front right back bottom]
const rotateForward = async (stack, layer) => {
  const top = stack[layer][TOP]
  const bottom = stack[layer][BOTTOM]
  const back  = stack[layer][BACK]
  const front = stack[layer][FRONT]

  stack[layer][TOP] = back
  stack[layer][BOTTOM] = front
  stack[layer][BACK] = bottom
  stack[layer][FRONT] = top

  const finalRotation = cubes[layer].rotation.x - Math.PI / 2
  if(showSolving && !stopSolving) {
    await animateRotationForward(cubes[layer], finalRotation)
  }
}

const rotateLeft = async (stack, layer) => {
  const left  = stack[layer][LEFT]
  const right = stack[layer][RIGHT]
  const back  = stack[layer][BACK]
  const front = stack[layer][FRONT]

  stack[layer][LEFT] = front
  stack[layer][RIGHT] = back
  stack[layer][BACK] = left
  stack[layer][FRONT] = right

  const finalRotation = cubes[layer].rotation.y + Math.PI / 2
  if(showSolving && !stopSolving) {
    await animateRotationLeft(cubes[layer], finalRotation)
  }
}

const solve = async (stack, layer = 0) => {
  if(stopSolving) { return null }
  if(layer == stackHeight) {
    totalTries++
    scoreDiv.innerHTML = `Total tries: ${totalTries}`
    if(checkSolution(stack)) {
      return stack
    } else {
      return null
    }
  }

  // First position - rear
  // Order of rotations that we do to try all 6 sides
  // check, rotate forward, check, rotate forward, check, rotate forward
  // check, rotate left, check, (rotate left, rotate left) check
  if(await solve(stack, layer+1)) {
    return stack
  }

  // Rotate sideways 3 times
  for(let i = 0; i < 3; i++) {
    await rotateSideways(stack, layer)
    if(await solve(stack, layer+1)) {
      return stack
    }
  }
  // Rotate sideways back to original position
  await rotateSideways(stack, layer)

  // Second position - top
  // Rotate forward
  await rotateForward(stack, layer)
  if(await solve(stack, layer+1)) {
    return stack
  }
  // rotate left 3 times
  for(let i = 0; i < 3; i++) {
    await rotateLeft(stack, layer)
    if(await solve(stack, layer+1)) {
      return stack
    }
  }
  // rotate left back to original position
  await rotateLeft(stack, layer)

  // Third position - front
  // rotate forwrad
  await rotateForward(stack, layer)
  if(await solve(stack, layer+1)) {
    return stack
  }
  // Rotate sideways 3 times
  for(let i = 0; i < 3; i++) {
    await rotateSideways(stack, layer)
    if(await solve(stack, layer+1)) {
      return stack
    }
  }
  // Rotate sideways back to original position
  await rotateSideways(stack, layer)

  // Forth position - bottom
  await rotateForward(stack, layer)
  // rotate left 3 times
  for(let i = 0; i < 3; i++) {
    await rotateLeft(stack, layer)
    if(await solve(stack, layer+1)) {
      return stack
    }
  }
  // rotate left back to original position
  await rotateLeft(stack, layer)

  // Fifth position - right
  await rotateSideways(stack, layer)
  // rotate forward 3 times
  for(let i = 0; i < 3; i++) {
    await rotateForward(stack, layer)
    if(await solve(stack, layer+1)) {
      return stack
    }
  }
  // rotate forward back to original position
  await rotateForward(stack, layer)

  // Sixth position - left
  await rotateSideways(stack, layer)
  await rotateSideways(stack, layer)

  // rotate forward 3 times
  for(let i = 0; i < 3; i++) {
    await rotateForward(stack, layer)
    if(await solve(stack, layer+1)) {
      return stack
    }
  }

  return null
}

const allowRotation = () => {
  controls.update()
  renderer.render(scene, camera)
  requestAnimationFrame(allowRotation)
}

const resetCubes = () => {
  stack = JSON.parse(JSON.stringify(initialStack))
  renderCurrentStack()
}

// Rotate the cubes to their current position
const renderCurrentStack = () => {
  for(let i = 0; i < stackHeight; i++) {
    const cube = cubes[i]
    const stackLayer = stack[i]
    const colorMap = {'R': 'red', 'G': 'green', 'W': 'white', 'B': 'blue'}
    cube.rotation.x = 0
    cube.rotation.y = 0
    cube.rotation.z = 0

//  R,   L,   T,   B,   Bk,  F
    let color = colorMap[stackLayer[RIGHT]]
    cube.material[0].color.set(color)
    color = colorMap[stackLayer[LEFT]]
    cube.material[1].color.set(color)
    color = colorMap[stackLayer[TOP]]
    cube.material[2].color.set(color)
    color = colorMap[stackLayer[BOTTOM]]
    cube.material[3].color.set(color)
    color = colorMap[stackLayer[BACK]]
    cube.material[4].color.set(color)
    color = colorMap[stackLayer[FRONT]]
    cube.material[5].color.set(color)
  }
}

const waitForStop = async () => {
  if(solving) {
    stopSolving = true
    while(solving) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    stopSolving = false
  }
}

const placeCubes = (stack) => {
  for(let i = 0; i < stackHeight; i++) {
    const geometry = new THREE.BoxGeometry();
    const colors = stack[i].map(color => {
      switch(color) {
        case 'R': return 'red'
        case 'G': return 'green'
        case 'W': return 'white'
        case 'B': return 'blue'
      }
    })
    const materials = colors.map(color => new THREE.MeshBasicMaterial({ color }));
    const cube = new THREE.Mesh(geometry, materials);
    cube.position.y = i * 1.0;
    scene.add(cube);
    cubes.push(cube)
  }
}

export const setupScene = async () => {
  camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(2, 0, 4);

  // render text in the top right that we can update with the totalTries
  scoreDiv = document.createElement('div')
  scoreDiv.style.position = 'absolute'
  scoreDiv.style.top = '0px'
  scoreDiv.style.right = '0px'
  scoreDiv.style.color = 'white'
  scoreDiv.style.fontSize = `${buttonHeight}px`
  scoreDiv.style.fontFamily = 'monospace'
  scoreDiv.innerHTML = `Total tries: ${totalTries}`
  document.body.appendChild(scoreDiv)

  // Create a renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Controls to allow rotation of scene
  controls = new OrbitControls( camera, renderer.domElement );
  controls.target.set( 0, 0, 0 )

  const addButton = (text, pos, callack) => {
    const button = document.createElement('button')
    button.style.position = 'absolute'
    button.style.top = `${pos}px`
    button.style.left = '0px'
    button.style.color = 'white'
    button.style.fontSize = '40px'
    button.style.fontFamily = 'monospace'
    button.style.backgroundColor = 'black'
    button.innerHTML = text
    document.body.appendChild(button)
    return button
  } 

  const showSol = addButton('Show Solution', 0)
  showSol.onclick = async () => {
    await waitForStop()
    totalTries = 0
    showSolving = false
    resetCubes()
    await solve(stack)
    renderCurrentStack()
  }

  const startSol = addButton('Start Solving', buttonHeight+15)
  startSol.onclick = async () => {
    await waitForStop()
    solving = true
    totalTries = 0
    showSolving = true
    resetCubes()
    await solve(stack)
    solving = false
  }

  const resetButton = addButton('Reset', buttonHeight*2+30)
  resetButton.onclick = async () => {
    await waitForStop()
    resetCubes()
  }

  const resizeScene = () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
  }

  // Handle window resize
  window.addEventListener('resize', () => { resizeScene(); })
  resizeScene();

  renderer.render(scene, camera);
  placeCubes(stack)
  requestAnimationFrame(allowRotation)
}