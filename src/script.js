import './style.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import {
  OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js'

import * as dat from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import {
  Text,
  preloadFont
} from 'troika-three-text'
import gsap from "gsap";

import {
  EffectComposer
} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {
  RenderPass
} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {
  DotScreenPass
} from 'three/examples/jsm/postprocessing/DotScreenPass.js'
import {
  GlitchPass
} from 'three/examples/jsm/postprocessing/GlitchPass.js'
import {
  ShaderPass
} from 'three/examples/jsm/postprocessing/ShaderPass.js'
import {
  RGBShiftShader
} from 'three/examples/jsm/Shaders/RGBShiftShader.js'
import {
  SMAAPass
} from 'three/examples/jsm/postprocessing/SMAAPass.js'
import {
  UnrealBloomPass
} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {
  FilmPass
} from 'three/examples/jsm/postprocessing/FilmPass.js';
import {
  PixelShader
} from 'three/examples/jsm/shaders/PixelShader.js';
import {
  VignetteShader
} from 'three/examples/jsm/shaders/VignetteShader.js';

/***************************
 * VARIABLES
 ***************************/

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

let aspect = sizes.width / sizes.height
let frustumSize = 10

let controls, renderer, camera, scene, canvas, effectComposer, gui, stats, bgMaterial, aboutElement, linkElement
let world, physicsMaterial
let textColor, textBorderColor

const hitSound = new Audio('./sounds/hit.mp3')
const clickSound = new Audio('./sounds/typeclick1.mp3')

const textureLoader = new THREE.TextureLoader();

let elapsedTime = 0,
  deltaTime = 0

const clock = new THREE.Clock()

let settings = {
  controlsEnabled: false,
  debugEnabled: false,
  statsEnabled: false
}

let postSettings = {
  bloomPass: false,
  rgbShiftPass: true,
  filmPass: false,
  pixelPass: false,
  vignettePass: false
}

/***************************
 * INIT
 ***************************/

function initScene() {
  canvas = document.querySelector('canvas.webgl')

  aboutElement = document.getElementById("about")
  linkElement = document.getElementById("aboutlink")

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)
  // orthographic camera
  camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,
    frustumSize * aspect / 2,
    frustumSize / 2,
    frustumSize / -2,
    0.5,
    10
  )

  camera.position.set(0, 4.8, 1)
  scene.add(camera)

  if (settings.controlsEnabled == true) {
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
  }

  // renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  document.addEventListener('keydown', onKeyPress)

  if (settings.debugEnabled == true) {
    gui = new dat.GUI({
      hideable: false
    })
    //gui.close()
  }

  if (settings.statsEnabled == true) {
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
  }
}

function createBackground() {
  createFillSprite()

  bgMaterial = new THREE.SpriteMaterial()
  bgMaterial.color = new THREE.Color(0xffffff)

  var bgSprite = new THREE.Sprite(bgMaterial)
  bgSprite.position.copy(new THREE.Vector3(0, 4.8, -5))
  bgSprite.scale.copy(new THREE.Vector3(sizes.width, sizes.height, 1))
  scene.add(bgSprite)

  // aboutElement.style.color = colorPicker.current()
  // linkElement.style.color = colorPicker.current()
}

/***************************
 * TEXT INPUT
 ***************************/
let maxCharacters = 25
let inputString = ""
let ignoreKeys = ["Enter", "Backspace", "Shift", "Tab", "Escape", "Esc", "CapsLock", "Control", "Alt", "Meta", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Delete", "End", "Home", "PageDown", "PageUp", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F8", "F10", "F11", "F12", "F13", "F14", "F15", "F16", "F15", "F17", "F18", "F19", "F20", "Dead"]

let keysPos1 = ['1', 'q', 'a', 'z', 'Q', 'A', 'Z']
let keysPos2 = ['2', 'w', 's', 'x', 'W', 'S', 'X']
let keysPos3 = ['3', 'e', 'd', 'c', 'E', 'D', 'C']
let keysPos4 = ['4', 'r', 'f', 'v', 'R', 'F', 'V']
let keysPos5 = ['5', 't', 'g', 'b', 'T', 'G', 'B']
let keysPos6 = ['6', 'y', 'h', 'n', 'Y', 'H', 'N']
let keysPos7 = ['7', 'u', 'j', 'm', 'U', 'J', 'M']
let keysPos8 = ['8', 'i', 'k', ',', 'I', 'K', '<']
let keysPos9 = ['9', 'o', 'l', '.', 'O', 'L', '>']
let keysPos10 = ['0', 'p', ';', '/', 'P', ':', '?', '[', ']']

let enterTimer = 0
let canEnter = true

function onKeyPress(e) {
  let keycode = e.key

  // disables quick find hotkeys in firefox
  //e.preventDefault()
  //console.log(keycode)

  // character input, build string
  if (!ignoreKeys.includes(keycode)) {
    if (inputString.length < maxCharacters) {
      //inputString += keycode // String.fromCharCode(e.key);
      inputString = keycode
      //inputField.innerHTML = inputString

      let position = new THREE.Vector3(0, 0, 0)

      if (keysPos1.includes(keycode))
        position.x = -5
      else if (keysPos2.includes(keycode))
        position.x = -4
      else if (keysPos3.includes(keycode))
        position.x = -3
      else if (keysPos4.includes(keycode))
        position.x = -2
      else if (keysPos5.includes(keycode))
        position.x = -1
      else if (keysPos6.includes(keycode))
        position.x = 1
      else if (keysPos7.includes(keycode))
        position.x = 2
      else if (keysPos8.includes(keycode))
        position.x = 3
      else if (keysPos9.includes(keycode))
        position.x = 4
      else if (keysPos10.includes(keycode))
        position.x = 5

      let radius = 0.25

      createPhysicsText(radius, position, inputString)

      clickSound.currentTime = 0
      clickSound.play()
    }
  }

  if (keycode === "Enter" && canEnter === true) {
    enterTimer = elapsedTime + 0.08
    createFillSprite()
  }
}

function getRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/***************************
 * PRELOAD TEXT
 ***************************/

let preloadedFont
let FONTURL = './fonts/open-sans-v18-latin-800.woff'

preloadFont({
    font: FONTURL,
  },
  (font) => {
    preloadedFont = font.parameters.font;
  },
)

function createText(text) {
  const myText = new Text()
  myText.fontSize = 1

  myText.text = text
  myText.color = textColor
  myText.font = preloadedFont
  myText.anchorX = 'center'
  myText.anchorY = 'middle'
  myText.outlineOpacity = 1
  myText.outlineWidth = 0.03
  myText.outlineColor = textBorderColor
  myText.sync()

  return myText
}

/***************************
 * SOUNDS
 ***************************/

const playHitSound = (collision) => {
  const impactStrength = collision.contact.getImpactVelocityAlongNormal()

  if (impactStrength > 1.5) {
    hitSound.volume = Math.random()
    hitSound.currentTime = 0
    hitSound.play()
  }
}

const onCollisionEnter = (collision) => {
  //console.log(collision)
}

/***************************
 * PHYSICS
 ***************************/

function initCannon() {
  // Setup our world
  world = new CANNON.World();
  world.gravity.set(0, -9, 0);
  world.broadphase = new CANNON.SAPBroadphase(world) // big performance improvement
  world.allowSleep = true; // another big perf improvement

  // Create a slippery material (friction coefficient = 0.0)
  physicsMaterial = new CANNON.Material("slipperyMaterial");
  var physicsContactMaterial = new CANNON.ContactMaterial(
    physicsMaterial,
    physicsMaterial, {
      friction: 0.1, // friction coefficient
      restitution: 0.7 // restitution
    }

  );
  // We must add the contact materials to the world
  world.addContactMaterial(physicsContactMaterial);

  // Create a plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({
    mass: 0
  });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  world.addBody(groundBody);

  const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(10, 10),
    new THREE.MeshStandardMaterial({
      color: '#777777',
      metalness: 0.3,
      roughness: 0.4,
    })
  )
  //floor.receiveShadow = true
  floor.rotation.x = -Math.PI * 0.5
  scene.add(floor)
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // update effect composer
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  effectComposer.setSize(sizes.width, sizes.height)

  // update orthographic camera
  camera.left = frustumSize * aspect / -2
  camera.right = frustumSize * aspect / 2
  camera.top = frustumSize / 2
  camera.bottom = frustumSize / -2
  camera.updateProjectionMatrix()
})

/***************************
 * 
 ***************************/

const objectsToUpdate = []
const textObjects = []

const createPhysicsText = (radius, position, text) => {

  const textObject = createText(text)
  textObjects.push(textObject)
  scene.add(textObject)

  // cannon.js body
  const shape = new CANNON.Sphere(radius)
  const body = new CANNON.Body({
    mass: 1,
    shape: shape,
    material: physicsMaterial
  })
  body.position.copy(position)
  //body.addEventListener('collide', playHitSound)
  body.addEventListener('collide', onCollisionEnter)
  world.addBody(body)

  // save in objects to update
  objectsToUpdate.push({
    mesh: textObject,
    body: body
  })

  // give it some velocity
  body.velocity.set(getRandomNumber(-1, 1), 12, 0)

  setTimeout(function () {
    world.removeBody(body)
    scene.remove(textObject)
  }, 10000);
}

// GET THE NEXT COLOR
var colorPicker = (function () {
  //var colors = ["#FF6138", "#FFBE53", "#2980B9", "#282741"];
  //var colors = ["#7400b8", "#6930c3", "#5e60ce", "#5390d9", "#4ea8de", "#48bfe3", "#56cfe1", "#64dfdf", "#72efdd", "#80ffdb"]
  //var colors = ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff", "#fffffc"]
  //var colors = ["f94144", "f3722c", "f8961e", "f9844a", "f9c74f", "90be6d", "43aa8b", "4d908e", "577590", "277da1"]
  //var colors = ["50514f", "f25f5c", "ffe066", "247ba0", "70c1b3"]
  //var colors = ["ff595e", "ffca3a", "8ac926", "1982c4", "6a4c93"]
  var colors = ["f9c80e", "f86624", "ea3546", "662e9b", "43bccd", "ff595e", "8ac926", "1982c4", "6a4c93"]

  var index = 0;

  function next() {
    index = index++ < colors.length - 1 ? index : 0;
    return '#' + colors[index];
  }

  function current() {
    return '#' + colors[index];
  }
  return {
    next: next,
    current: current
  }
})()

let bgPosition = new THREE.Vector3(0, 0, -2)
let ripplePosition = new THREE.Vector3(0, 0, -1)
let spriteOffPosition = new THREE.Vector3(0, -1000, 0)
let vec3zero = new THREE.Vector3()
let vec3one = new THREE.Vector3(1, 1, 1)

let pageFillSprites = []
let spritePoolCount = 300

function createSpritePool() {
  for (let i = 0; i < spritePoolCount; i++) {
    var sprite = new THREE.Sprite(createSpriteMaterial())
    sprite.position.copy(spriteOffPosition)
    sprite.scale.copy(vec3zero)
    pageFillSprites.push(sprite)
    scene.add(sprite)
  }
}

var spritePicker = (function () {
  let index = 0

  function next() {
    index = index++ < pageFillSprites.length - 1 ? index : 0
    //console.log(index)
    return pageFillSprites[index]
  }

  return {
    next: next,
  }
})()

const createFillSprite = () => {
  const currentColor = new THREE.Color(colorPicker.current())
  const nextColor = new THREE.Color(colorPicker.next())
  textColor = currentColor
  textBorderColor = nextColor

  for (let i = 0; i < textObjects.length; i++) {
    textObjects[i].color = textColor
    textObjects[i].outlineColor = textBorderColor
  }

  // page fill
  var pageFillSprite = spritePicker.next()
  pageFillSprite.material.opacity = 1
  pageFillSprite.material.color = nextColor
  pageFillSprite.position.copy(bgPosition)

  gsap.to(pageFillSprite.scale, {
    duration: 1,
    ease: 'linear',
    x: 30,
    y: 30,
    onComplete: () => {
      pageFillSprite.scale.copy(vec3zero)
      //pageFillSprite.position.copy(spriteOffPosition)
      bgMaterial.color = nextColor
      // aboutElement.style.color = colorPicker.current()
      // linkElement.style.color = colorPicker.current()
    }
  });

  // ripple
  var rippleSprite = spritePicker.next()
  rippleSprite.material.opacity = 1
  rippleSprite.material.color = currentColor
  rippleSprite.position.copy(ripplePosition)

  gsap.to(rippleSprite.scale, {
    duration: 1,
    ease: 'expo.out',
    x: 8,
    y: 8,
    onComplete: () => {
      rippleSprite.scale.copy(vec3zero)
      //rippleSprite.position.copy(spriteOffPosition)
    }
  });

  gsap.to(rippleSprite.material, {
    duration: 0.75,
    delay: 0.25,
    ease: 'expo.out',
    opacity: 0
  });
}

const spriteTexture = textureLoader.load('./textures/sprite-circle-512.png');

const createSpriteMaterial = () => {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
  });
  return spriteMaterial
}

/********************************
 * POST PROCESSING
 ********************************/

let RenderTargetClass = null
let unrealBloomPass, effectFilm, rgbShiftParams, rgbShiftPass, pixelPass, pixelParms, vignettePass, vignetteParams

function postProcessing() {

  if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
    RenderTargetClass = THREE.WebGLMultisampleRenderTarget
    console.log('using WebGLMultisampleRenderTarget')
  } else {
    RenderTargetClass = THREE.WebGLRenderTarget
    console.log('using WebGLRenderTarget')
  }

  const renderTarget = new RenderTargetClass(
    800,
    600, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      encoding: THREE.sRGBEncoding
    }
  )

  // composer
  effectComposer = new EffectComposer(renderer, renderTarget)
  effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  effectComposer.setSize(sizes.width, sizes.height)

  // passes
  const renderPass = new RenderPass(scene, camera)
  effectComposer.addPass(renderPass)

  // rgb shift pass
  rgbShiftPass = new ShaderPass(RGBShiftShader)
  rgbShiftPass.uniforms['amount'].value = 0.004
  rgbShiftPass.uniforms['angle'].value = THREE.MathUtils.degToRad(90)
  rgbShiftPass.enabled = postSettings.rgbShiftPass
  effectComposer.addPass(rgbShiftPass)

  // unreal bloom pass
  unrealBloomPass = new UnrealBloomPass()
  unrealBloomPass.strength = 5.8
  unrealBloomPass.radius = 1.1
  unrealBloomPass.threshold = 0.17
  unrealBloomPass.enabled = postSettings.bloomPass
  effectComposer.addPass(unrealBloomPass)

  // noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale
  effectFilm = new FilmPass(0.25, 0.2, 640, false); //0.35, 0.025, 648, false
  effectFilm.enabled = postSettings.filmPass
  effectComposer.addPass(effectFilm)

  pixelPass = new ShaderPass(PixelShader)
  pixelPass.uniforms["resolution"].value = new THREE.Vector2(window.innerWidth, window.innerHeight)
  pixelPass.uniforms["resolution"].value.multiplyScalar(window.devicePixelRatio)
  pixelPass.uniforms["pixelSize"].value = 2;
  pixelPass.enabled = postSettings.pixelPass
  effectComposer.addPass(pixelPass)

  vignettePass = new ShaderPass(VignetteShader)
  vignettePass.uniforms["offset"].value = 0.95
  vignettePass.uniforms["darkness"].value = 1.6
  vignettePass.enabled = postSettings.vignettePass
  effectComposer.addPass(vignettePass)

  // for browers that don't support webgl2 (safari)
  if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
    // add smaa at the end of the passes
    const smaaPass = new SMAAPass()
    effectComposer.addPass(smaaPass)
    console.log('Using SMAA')
  }

  // debug gui
  if (settings.debugEnabled == true) {

    rgbShiftParams = {
      amount: 0.002,
      angle: 90
    }

    let f1 = gui.addFolder('RGBShift Pass');
    f1.add(rgbShiftParams, 'amount').min(0).max(0.1).step(0.001)
    f1.add(rgbShiftParams, 'angle').min(0).max(360).step(1)
    f1.add(rgbShiftPass, 'enabled')
    f1.open()

    let f2 = gui.addFolder('Bloom Pass');
    f2.add(unrealBloomPass, 'enabled')
    f2.add(unrealBloomPass, 'strength').min(0).max(10).step(0.001)
    f2.add(unrealBloomPass, 'radius').min(0).max(2).step(0.001)
    f2.add(unrealBloomPass, 'threshold').min(0).max(1).step(0.001)
    f2.open()

    let f3 = gui.addFolder('Film Pass');
    f3.add(effectFilm, 'enabled')
    f3.open()

    pixelParms = {
      pixelSize: 2
    }

    let f4 = gui.addFolder('Pixel Pass');
    f4.add(pixelParms, 'pixelSize').min(2).max(32).step(1)
    f4.add(pixelPass, 'enabled')
    f4.open()

    vignetteParams = {
      offset: 0.95,
      darkness: 1.6
    }

    let f5 = gui.addFolder('Vignette Pass');
    f5.add(vignetteParams, 'offset').min(0).max(3).step(0.01)
    f5.add(vignetteParams, 'darkness').min(0).max(10).step(0.1)
    f5.add(vignettePass, 'enabled')
    f5.open()
  }
}

function updateGUI() {
  //effectFilm.uniforms['noiseIntensity'].value = filmPassParams.noiseIntensity
  rgbShiftPass.uniforms['amount'].value = rgbShiftParams.amount
  rgbShiftPass.uniforms['angle'].value = rgbShiftParams.angle

  pixelPass.uniforms["pixelSize"].value = pixelParms.pixelSize

  vignettePass.uniforms["offset"].value = vignetteParams.offset
  vignettePass.uniforms["darkness"].value = vignetteParams.darkness
}

/********************************
 * ANIMATE
 ********************************/

let lastFrameTime = 0;
let currentTime = elapsedTime + 1

const tick = () => {
  elapsedTime = clock.getElapsedTime()
  deltaTime = elapsedTime - lastFrameTime
  lastFrameTime = elapsedTime
  //console.log(elapsedTime)

  canEnter = false
  if (enterTimer < elapsedTime) {
    canEnter = true
  }

  // update physics world
  world.step(1 / 60, deltaTime, 3)

  for (const object of objectsToUpdate) {
    object.mesh.position.copy(object.body.position)
    object.mesh.quaternion.copy(object.body.quaternion)
  }

  if (settings.controlsEnabled == true) {
    controls.update()
  }

  if (effectComposer) {
    effectComposer.render()

    if (settings.debugEnabled == true)
      updateGUI()
  }

  if (settings.statsEnabled == true) {
    stats.update();
  }

  // Render
  //renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

initScene()
initCannon()
createSpritePool()
createBackground()

postProcessing()

tick()


/**
 * Debug
 */

// if (settings.debugEnabled == true) {
//   const gui = new dat.GUI()
//   const debugObject = {}

//   debugObject.reset = () => {
//     for (const object of objectsToUpdate) {
//       // remove body
//       object.body.removeEventListener('collide', playHitSound)
//       world.removeBody(object.body)

//       // remove mesh
//       scene.remove(object.mesh)
//     }
//   }

//   gui.add(debugObject, 'reset')
// }