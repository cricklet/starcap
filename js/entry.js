/* @flow */

import * as Canvas from './canvas'
import * as Utils from './utils'
import { ArrayObserver } from 'observe-js'
import * as Lazy from './lazy'

import {
  CrewEnum,
  RoomEnum,
  ActionEnum
} from './types'

import type {
  Player,
  CrewMember,
  CrewEnumType,
  Room,
  GameState,
  Action,
  Character,
  RGB,
  Recolor
} from './types'

let FPS = 60.0;
let DT = 1.0 / FPS;

let ANIM_FPS = 8.0;

let PLAYER_HEIGHT = 1
let PLAYER_WIDTH = 0.875
let ROOM_WIDTH = 8
let ROOM_HEIGHT = 2.5

let FLOOR_HEIGHT = 0.25

function transformToPixels(units) {return units * 75}
function transformToUnits(pixels) {return pixels / 75.0}

let CANVAS_WIDTH = transformToPixels(ROOM_WIDTH)
let CANVAS_HEIGHT = transformToPixels(ROOM_HEIGHT)
let CANVAS_PLAYER_HEIGHT = transformToPixels(PLAYER_HEIGHT)

function genId(): string {return Math.random().toString().substring(2, 6)}

function stringToHash(s: string): number {
  // from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  let hash = 0, i = 0, len = s.length, chr;
  while ( i < len ) {
    hash  = ((hash << 5) - hash + s.charCodeAt(i++)) << 0;
  }
  return hash;
};
function initialGameState(): GameState {
  return {
    player: {
      kind: 'player',
      id: genId(),
      x: 3, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      roomIndex: 0,
      carrying: undefined
    },
    crew: [
      {
        kind: 'crew',
        id: genId(),
        x: 5, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        roomIndex: 1,
        type: CrewEnum.ENG
      },
      {
        kind: 'crew',
        id: genId(),
        x: 2, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        roomIndex: 2,
        type: CrewEnum.SEC
      },
      {
        kind: 'crew',
        id: genId(),
        x: 4, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        roomIndex: 2,
        type: CrewEnum.SCI
      }
    ],
    rooms: [
      {
        type: RoomEnum.BRIDGE
      },
      {
        type: RoomEnum.ENGINE
      },
      {
        type: RoomEnum.STORE
      }
    ]
  }
}

let AnimationEnum = {
  RUN: 'run',
  STAND: 'stand',
  SKID: 'skid',
  JUMP: 'jump'
}

type Animation =
  | 'run'
  | 'stand'
  | 'skid'
  | 'jump'

let DirectionEnum = {
  LEFT: 'left',
  RIGHT: 'right'
}

type Direction =
  | 'left'
  | 'right'

type AnimationState = {
  animation: Animation,
  direction: Direction,
  time: number
}

type AnimationMap = {[key: Animation]: Array<string>}
type OrientedAnimationMap = {[dir: Direction]: AnimationMap}

function _generateAnimationMap(imagesMap: AnimationMap, oldStr: string, newStr: string): AnimationMap {
  return Utils.mapObject(
    imagesMap,
    (images) => images.map((image) => image.replace(oldStr, newStr)))
}

function _generateOrientedAnimationMap(dirImagesMap: OrientedAnimationMap, oldStr: string, newStr: string): OrientedAnimationMap {
  return Utils.mapObject(
    dirImagesMap,
    (imagesMap) => _generateAnimationMap(imagesMap, oldStr, newStr))
}

let _RIGHT_PLAYER_IMAGES: AnimationMap = {
  [AnimationEnum.RUN]: ['img/right_cap.png', 'img/right_cap_run_0.png'],
  [AnimationEnum.STAND]: ['img/right_cap.png'],
  [AnimationEnum.JUMP]: ['img/right_cap_run_0.png'],
  [AnimationEnum.SKID]: ['img/right_cap.png'] }

let PLAYER_IMAGES = {
  [DirectionEnum.LEFT]:  _generateAnimationMap(_RIGHT_PLAYER_IMAGES,  'right', 'left'),
  [DirectionEnum.RIGHT]: _RIGHT_PLAYER_IMAGES
}

let _RIGHT_ALIEN_IMAGES: AnimationMap = {
  [AnimationEnum.RUN]: ['img/right_alien.png', 'img/right_alien_run_0.png'],
  [AnimationEnum.STAND]: ['img/right_alien.png'],
  [AnimationEnum.JUMP]: ['img/right_alien_run_0.png'],
  [AnimationEnum.SKID]: ['img/right_alien.png'] }

let ALIEN_IMAGES = {
  [DirectionEnum.LEFT]:  _generateAnimationMap(_RIGHT_ALIEN_IMAGES,  'right', 'left'),
  [DirectionEnum.RIGHT]: _RIGHT_ALIEN_IMAGES
}

type Sprite = {
  sourceId: string,
  image?: string,
  imageRecolor?: Recolor,
  flip?: boolean,
  opacity?: number,
  color: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number
}

function transformRectToPixels(rect: {x0:number, y0:number, x1:number, y1:number})
: {x0:number, y0:number, x1:number, y1:number} {
  return {
    x0: transformToPixels(rect.x0),
    y0: transformToPixels(rect.y0),
    x1: transformToPixels(rect.x1),
    y1: transformToPixels(rect.y1)
  }
}

function crewMemberColor(crew: CrewMember): string {
  if (crew.type === CrewEnum.ENG) return 'rgb(223, 208, 0)'
  if (crew.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
  if (crew.type === CrewEnum.SEC) return 'rgb(223, 0, 0)'
  throw "Unknown crew type"
}

function sameSign(x, y) {
  return x * y >= 0
}

function characterAnimation(
  oldAnimation: ?AnimationState,
  character: { vx: number, vy: number, ax: number, ay: number },
  isGrounded: boolean,
  dt: number
): AnimationState {
  let isMoving = 0 < Math.abs(character.vx)
  let isAccelerating = 0 < Math.abs(character.ax)
  let isSpeedIncreasing = sameSign(character.vx, character.ax)

  let slowingDown = isMoving && isAccelerating && !isSpeedIncreasing

  let movingLeft  = character.vx < - 0
  let movingRight = character.vx >   0

  // Setup default direction & animation
  let direction = DirectionEnum.RIGHT
  let animation = AnimationEnum.STAND

  if (oldAnimation) {
    animation = oldAnimation.animation
    direction = oldAnimation.direction
  }

  if (movingLeft)  direction = DirectionEnum.LEFT
  if (movingRight) direction = DirectionEnum.RIGHT

  if (!isGrounded) {
    animation = AnimationEnum.JUMP
  } else {
    if (slowingDown) animation = AnimationEnum.SKID
    else if (isMoving) animation = AnimationEnum.RUN
    else animation = AnimationEnum.STAND
  }

  let time = 0
  if (oldAnimation) {
    if (oldAnimation.animation !== animation) time = 0
    else time = oldAnimation.time + dt
  }

  return {
    direction: direction,
    animation: animation,
    time: time
  }
}

function generateShadowOpacity(character: {y: number }): number {
  return (2.0 - Math.min(character.y, 1.5)) / 2.0
}

function generateShadowRect(character: { x: number, y: number, width: number, height: number })
: { x0: number, y0: number, x1: number, y1: number } {
  let scale   = (16.0 - character.y) / 16.0

  return {
    x0: character.x - scale * character.width * 0.5,
    x1: character.x + scale * character.width * 0.5,
    y0: - 0.2 * character.width,
    y1: character.height - 0.2 * character.width
  }
}

function generateShadowSprite(
  id: string,
  opacity: number,
  rect: { x0: number, y0: number, x1: number, y1: number }
): Sprite {
  return {
    sourceId: id,
    color: 'rgb(50, 50, 50)',
    image: 'img/shadow.png',
    opacity: 0.5 * opacity * opacity,
    x0: rect.x0,
    x1: rect.x1,
    y0: rect.y0,
    y1: rect.y1
  }
}

function computeAnimationImage(
  animationState: AnimationState,
  directionalImagesMap: OrientedAnimationMap
): string {
  let animation = animationState.animation
  let direction = animationState.direction
  let time      = animationState.time

  let i = Math.floor(time * ANIM_FPS + 0.25)
  let images = directionalImagesMap[animationState.direction][animation]
  let image = images[i % images.length]

  return image
}

function adjustXForRoom(
  x: number,
  dRoom: number,
  roomWidth: number
): number {
  return x - roomWidth * dRoom
}

function adjustRectForRoom(
  rect: { x0: number, y0: number, x1: number, y1: number },
  dRoom: number,
  roomWidth: number
): { x0: number, y0: number, x1: number, y1: number } {
  return {
    x0: adjustXForRoom(rect.x0, dRoom, roomWidth),
    x1: adjustXForRoom(rect.x1, dRoom, roomWidth),
    y0: rect.y0,
    y1: rect.y1
  }
}

function adjustRectForScale(
  rect: { x0: number, y0: number, x1: number, y1: number },
  scale: number
): { x0: number, y0: number, x1: number, y1: number } {
  let x = (rect.x0 + rect.x1) * 0.5
  let w = (rect.x1 - rect.x0) * scale
  let h = (rect.y1 - rect.y0) * scale
  return {
    x0: x - w * 0.5,
    x1: x + w * 0.5,
    y0: rect.y0,
    y1: rect.y0 + h
  }
}

function shouldDrawCharacter(
  character: { x: number, width: number },
  dRoom: number,
  roomWidth: number
): boolean {
  let x = adjustXForRoom(character.x, dRoom, roomWidth)
  return x > - character.width && x < roomWidth + character.width
}

function generateCharacterRect(
  character: { x: number, y: number, width: number, height: number }
): { x0: number, y0: number, x1: number, y1: number } {
  return {
    x0: character.x - character.width * 0.5,
    x1: character.x + character.width * 0.5,
    y0: character.y,
    y1: character.y + character.height
  }
}

function generateCharacterSprite(
  id: string,
  image: string,
  color: string,
  rect: { x0: number, y0: number, x1: number, y1: number },
  recolor: ?Recolor
): Sprite {
  let sprite: Sprite = {
    sourceId: id,
    color: color,
    image: image,
    x0: rect.x0,
    y0: rect.y0,
    x1: rect.x1,
    y1: rect.y1
  }
  if (recolor) sprite.imageRecolor = recolor

  return sprite
}

function getOrientedAnimationMap(character: Character): OrientedAnimationMap {
  if (character.kind === 'player') return PLAYER_IMAGES
  if (character.kind === 'crew') return PLAYER_IMAGES
  throw "Failed to get animation map"
}

let PERSON_COLORS: Array<RGB> = [
  {r:123,g:52,b:0}, // shaded hair
  {r:156,g:77,b:0}, // hair
  {r:255,g:197,b:145}, // shaded skin
  {r:255,g:212,b:165}  // bright skin
]

let ALT_PERSON_SCALES = [
  1, 0.95
]

let ALT_PERSON_COLORS: Array<Array<RGB>> = [
  PERSON_COLORS,
  [ // woman
    {r:123,g:52,b:0, a:0}, // shaded hair
    {r:156,g:77,b:0}, // hair
    {r:123,g:52,b:0}, // shaded skin
    {r:255,g:212,b:165}  // bright skin
  ]
]

let BODY_COLORS: Array<RGB> = [
  {r:99,g:181,b:26}, // darkest
  {r:124,g:199,b:38}, // medium
  {r:152,g:220,b:56} // lightest
]

let ALTERNATE_BODY_COLORS: {[type: CrewEnumType]: Array<RGB>} = {
  [CrewEnum.SEC]: [
    {r:179,g:20,b:38}, // darkest
    {r:207,g:18,b:45}, // medium
    {r:240,g:19,b:52} // lightest
  ],
  [CrewEnum.ENG]: [
    {r:186,g:179,b:0},
    {r:205,g:199,b:0},
    {r:228,g:220,b:0}
  ],
  [CrewEnum.SCI]: [
    {r:52,g:88,b:183},
    {r:62,g:104,b:216},
    {r:73,g:133,b:229}
  ]
}

function generateRecolors(oldRGBs: Array<RGB>, newRGBs: Array<RGB>): Recolor {
  return {
    oldRGBs: oldRGBs,
    newRGBs: newRGBs,
    hash: '' + stringToHash(
      oldRGBs.map((rgb) => Object.values(rgb)).join('') +
      newRGBs.map((rgb) => Object.values(rgb)).join('')
    )
  }
}

function combineRecolors(recolor1: Recolor, recolor2: Recolor): Recolor {
  return {
    oldRGBs: Array.from(Utils.combine(recolor1.oldRGBs, recolor2.oldRGBs)),
    newRGBs: Array.from(Utils.combine(recolor1.newRGBs, recolor2.newRGBs)),
    hash: recolor1.hash + recolor2.hash
  }
}

function computeImageScale(character: Character): number {
  return ALT_PERSON_SCALES[stringToHash(character.id) % ALT_PERSON_SCALES.length]
}

function computeImageRecolor(character: Character): ?Recolor {
  let recolors: Array<Recolor> = [];
  if (character.kind === 'crew') {
    recolors.push(
      generateRecolors(BODY_COLORS, ALTERNATE_BODY_COLORS[character.type]))
  }

  recolors.push(
    generateRecolors(PERSON_COLORS, ALT_PERSON_COLORS[stringToHash(character.id) % ALT_PERSON_COLORS.length]))

  if (recolors.length === 0)
    return undefined

  return recolors.reduce(
    (prev, curr) => {
      if (prev === undefined) return curr
      return combineRecolors(prev, curr)
    })
}

function getCharacterColor(character: Character): string {
  if (character.kind === 'player') return 'rgb(154, 205, 50)'
  if (character.kind === 'crew') {
    if (character.type === CrewEnum.ENG) return 'rgb(223, 208, 0)'
    if (character.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
    if (character.type === CrewEnum.SEC) return 'rgb(223, 0, 0)'
    throw "Unknown crew type"
  }
  throw "Failed to get animation map"
}

function adjustFloorHeight(sprite: Sprite, floorHeight: number): { y0?: number, y1?: number } {
  return { y0: sprite.y0 + floorHeight, y1: sprite.y1 + floorHeight }
}

function computeRoomColor(room: Room): string {
  if (room.type == RoomEnum.BRIDGE) return '#eee'
  if (room.type == RoomEnum.ENGINE) return '#fee'
  if (room.type == RoomEnum.STORE) return '#efe'
  throw "Unknown room"
}

let PLAYER_SPEED = 8;
let PLAYER_ACCEL = 30;
let PLAYER_JUMP_SPEED = 7;
let PLAYER_THROW_XSPEED = 4;
let PLAYER_THROW_YSPEED = 3;
let GRAVITY_ACCEL = 40;

function thinkPlayerLocomotion(
  keysDown: KeysDown,
  canJump: boolean
): Set<Action> {
  let actions: Set<Action> = new Set()

  if (keysDown.a) actions.add(ActionEnum.LEFT)
  if (keysDown.d) actions.add(ActionEnum.RIGHT)
  if (keysDown.w) actions.add(ActionEnum.UP)
  if (canJump && keysDown.w) actions.add(ActionEnum.JUMP)

  return actions
}

function isGrounded(character: {y: number, vy: number}): boolean {
  return character.y <= 0.001 && character.vy <= 0.001
}

function canJump(character: {y: number, vy: number}): boolean {
  return isGrounded(character)
}

function horizontalCharacterPhysics(
  character: { vx: number }, actions: Set<Action>, isGrounded: boolean
): { ax: number, vx?: number } {
  let dplayer = {}
  dplayer.ax = 0

  let left  = actions.has(ActionEnum.LEFT)
  let right = actions.has(ActionEnum.RIGHT)

  let maxVelocity = Math.abs(character.vx) > PLAYER_SPEED
  let movingRight = character.vx >   0
  let movingLeft  = character.vx < - 0
  let maxRight = movingRight && maxVelocity
  let maxLeft  = movingLeft  && maxVelocity

  if (left && !right && !maxLeft ) dplayer.ax = - PLAYER_ACCEL // move left
  if (right && !left && !maxRight) dplayer.ax =   PLAYER_ACCEL // move right

  if ((left === right) && isGrounded) { // skid to a stop
    if (movingRight) dplayer.ax = - PLAYER_ACCEL
    if (movingLeft)  dplayer.ax =   PLAYER_ACCEL
  }

  if (isGrounded && maxVelocity) { // terminal velocity on ground
    if (movingRight) dplayer.vx =   PLAYER_SPEED
    if (movingLeft)  dplayer.vx = - PLAYER_SPEED
  }

  return dplayer
}

function verticalCharacterPhysics(isGrounded: boolean, actions: Set<Action>): { ay: number, vy?: number } {
  let dplayer = {}
  dplayer.ay = 0

  if (actions.has(ActionEnum.JUMP)) dplayer.vy = PLAYER_JUMP_SPEED
  if (!isGrounded) dplayer.ay = - GRAVITY_ACCEL

  return dplayer
}

function performAccel(character: {vx: number, vy: number, ax: number, ay: number}, dt: number)
: {vx?: number, vy?: number} {
  let dvx = character.ax * dt
  let dvy = character.ay * dt
  let vx = character.vx + dvx
  let vy = character.vy + dvy

  if (Math.abs(vx) < Math.abs(dvx)) vx = 0
  if (Math.abs(vy) < Math.abs(dvy)) vy = 0

  return { vx: vx, vy: vy }
}

function performVelocity(character: {x: number, y: number, vx: number, vy: number}, dt: number)
: {x?: number, y?: number} {
  return {
    x: character.x + character.vx * dt,
    y: character.y + character.vy * dt
  }
}

function adjustRoom(character: {x: number, y: number, roomIndex: number}): { x?: number, roomIndex?: number } {
  if (character.x < 0)
    return { x: character.x + ROOM_WIDTH, roomIndex: character.roomIndex - 1 }

  if (character.x > ROOM_WIDTH)
    return { x: character.x - ROOM_WIDTH, roomIndex: character.roomIndex + 1 }

  return {}
}

function clampRoom(character: {roomIndex: number}, numRooms: number): {roomIndex?: number} {
  let modRoom = character.roomIndex % numRooms
  return {
    roomIndex: modRoom >= 0 ? modRoom : modRoom + numRooms
  }
}

function clampFloor(character: {y: number, vy: number}): {y?: number, vy?: number} {
  if (character.y < 0.001 && character.vy < 0)
    return { y: 0, vy: 0 }

  return {}
}

function computeRoomDistance(srcRoom: number, destRoom: number, numRooms: number): number {
  let dRoom = destRoom - srcRoom
  while (dRoom < - numRooms * 0.5) dRoom += numRooms
  while (dRoom > numRooms * 0.5) dRoom -= numRooms
  return dRoom
}

function rectsOverlap(
  rect1: {x: number, y: number, width: number, height: number},
  rect2: {x: number, y: number, width: number, height: number}
): ?{ dx: number, dy: number } {
  let dx = rect2.x - rect1.x
  let dy = rect2.y - rect1.y

  let maxDx = rect1.width * 0.5 + rect2.width * 0.5
  let maxDy = rect1.height * 0.5 + rect2.height * 0.5

  if (Math.abs(dx) > maxDx || Math.abs(dy) > maxDy) return

  return { dx: dx, dy: dy }
}

function carryPhysics(
  carrier: {x: number, y: number, vx: number, vy: number, roomIndex: number},
  carried: {x: number, y: number, vx: number, vy: number, roomIndex: number},
  direction: Direction
): { x: number, y: number, vx: number, vy: number, roomIndex: number } {
  let x = carrier.x
  let y = carrier.y + PLAYER_HEIGHT * 0.2

  if (direction === DirectionEnum.LEFT) x -= PLAYER_WIDTH * 0.5
  else x += PLAYER_WIDTH * 0.5

  return { x: x, y: y, vx: carrier.vx, vy: carrier.vy, roomIndex: carrier.roomIndex }
}

function throwPhysics(
  carrier: { vx: number, vy: number },
  direction: Direction,
  actions: Set<Action>
): { vx: number, vy: number } {
  let vx = carrier.vx
  let vy = carrier.vy + PLAYER_THROW_YSPEED

  if (actions.has(ActionEnum.LEFT)) vx -= PLAYER_THROW_XSPEED
  if (actions.has(ActionEnum.RIGHT)) vx += PLAYER_THROW_XSPEED
  if (actions.has(ActionEnum.UP)) vy += PLAYER_THROW_XSPEED * 0.5

  if (!actions.a && !actions.d && !actions.w) {
    if (direction === DirectionEnum.LEFT)  vx -= PLAYER_THROW_XSPEED * 0.5
    if (direction === DirectionEnum.RIGHT) vx += PLAYER_THROW_XSPEED * 0.5
  }

  return { vx: vx, vy: vy }
}

function canPickup(
  player: Player,
  playerDirection: Direction,
  playerGrounded: boolean,
  crewMember: CrewMember,
  crewGrounded: boolean
): boolean {
  if (!playerGrounded || !crewGrounded)
    return false

  if (player.roomIndex !== crewMember.roomIndex)
    return false

  let overlap = rectsOverlap(player, crewMember)
  if (!overlap) return false

  let dx = overlap.dx
  let dy = overlap.dy

  if (playerDirection === DirectionEnum.LEFT)
    return dx < 0.2

  if (playerDirection === DirectionEnum.RIGHT)
    return dx > - 0.2

  return false
}

type KeysDown = {[key: string]: boolean}
type KeysPressed = Set<string>

let KEYS_DOWN_MAP = {
  '37': 'a',
  '38': 'w',
  '39': 'd',
  '40': 's'
}
let KEYS_PRESSED_MAP = {
  '189': '-',
  '187': '=',
  '32': ' ',
  '13': 'x'
}
function getChar(e: $.Event, keysMap: {[keyCode: string]: string}) {
  if (e.keyCode >= 48 && e.keyCode <= 90)
    return String.fromCharCode(e.keyCode).toLowerCase();

  if (e.keyCode in keysMap)
    return keysMap[e.keyCode];

  return null;
}

function bindInputs (keysDown: KeysDown, keysPressed: KeysPressed) {
  $(document).keydown(function (e) {
    let key = getChar(e, KEYS_DOWN_MAP);
    if (key) keysDown[key] = true;
  });
  $(document).keyup(function (e) {
    let key = getChar(e, KEYS_DOWN_MAP);
    if (key) keysDown[key] = false;
  });
  $(document).keypress(function (e) {
    let key = getChar(e, KEYS_PRESSED_MAP);
    if (key && !keysPressed.has(key)) keysPressed.add(key)
  });
}

function runLoop(step: (time: number) => number) {
  let lastTime = Date.now();
  let frameCount = 0;
  let frameStart = Date.now();

  let dt = 0.01;

  function loop () {
    // calculate FPS
    frameCount += 1
    if (Date.now() > frameStart + 1000) {
      console.log(frameCount + " fps")
      frameCount = 0
      frameStart = Date.now()
    }

    dt = step(dt)
    setTimeout(loop, 1000 * dt)
  };

  loop()
}

function * allCharacters(gameState: GameState) {
  for (let crewMember of gameState.crew) {
    yield crewMember
  }

  yield gameState.player
}

function * inDepthOrder <O> (entityMap: Utils.AutoMap<O>, depths: Utils.DepthArray)
: Iterable<O> {
  for (let id of depths.inOrder()) {
    if (entityMap.hasKey(id)) {
      yield entityMap.get(id)
    }
  }
}



$(document).ready(() => {
  let keysDown: KeysDown = {}
  let keysPressed: KeysPressed = new Set()
  bindInputs(keysDown, keysPressed)

  let screenEl = $('#world-canvas')[0]
  let screen: Canvas.Buffer = Canvas.setupBuffer(screenEl, CANVAS_WIDTH, CANVAS_HEIGHT)
  let buffer: Canvas.Buffer = Canvas.createBuffer(CANVAS_WIDTH, CANVAS_HEIGHT)

  let gameState = initialGameState()
  let animationStates: { [id: string]: AnimationState } = {}
  let characterActions: { [id: string]: Set<Action> } = {}

  let crewMap: Utils.AutoMap<CrewMember> = new Utils.AutoMap(o => o.id, gameState.crew)

  let characterMap: Utils.AutoMap<Character> = new Utils.AutoMap(o => o.id)
  characterMap.add(gameState.player)
  characterMap.observe(gameState.crew)

  // This gives us automatic randomized depths (i.e. z-distance) for each entity
  let depths: Utils.DepthArray = new Utils.DepthArray()
  depths.add(gameState.player.id, 0)
  depths.observe(gameState.crew, (o) => o.id)

  let step = (dt) => {
    let player = gameState.player
    let rooms = gameState.rooms

    // actions: wasd
    let playerActions: Set<Action> = thinkPlayerLocomotion(keysDown, canJump(player))
    characterActions[player.id] = playerActions

    // actions: carry or throw
    if (keysPressed.has(' ')) {
      if (canJump(player) && !player.carrying) playerActions.add(ActionEnum.CARRY)
      if (player.carrying !== undefined) playerActions.add(ActionEnum.THROW)
      keysPressed.delete(' ')
    }

    // figure out if player can pick up any crew members
    if (playerActions.has(ActionEnum.CARRY)) {
      // shouldn't be already carrying something
      if(player.carrying !== undefined) throw 'Wat carry fail'

      for (let crewMember of inDepthOrder(crewMap, depths)) {
        let pickup = canPickup(
          player, animationStates[player.id].direction, isGrounded(player),
          crewMember, isGrounded(crewMember))

        // pickup the crew member!
        if (pickup) {
          Object.assign(player, { carrying: crewMember.id })
          depths.update(crewMember.id, -0.05)
          break
        }
      }
    }

    // handle character physics
    for (let character of allCharacters(gameState)) {
      let actions: Set<Action> = characterActions[character.id]
      if (actions === undefined) actions = new Set()
      Object.assign(character, horizontalCharacterPhysics(character, actions, isGrounded(character)))
      Object.assign(character, verticalCharacterPhysics(isGrounded(character), actions))
    }

    // carry object
    if (player.carrying) {
      let playerDir = animationStates[player.id].direction
      let carriedEntity = characterMap.get(player.carrying)
      Object.assign(carriedEntity, carryPhysics(player, carriedEntity, playerDir))
    }

    // throw object
    if (playerActions.has(ActionEnum.THROW)) {
      if(player.carrying === undefined) throw 'Wat throw fail'

      let playerDir = animationStates[player.id].direction
      let carried = characterMap.get(player.carrying)
      Object.assign(carried, throwPhysics(player, playerDir, playerActions))
      Object.assign(player, { carrying: undefined })
      depths.update(carried.id)
    }

    // handle animation
    for (let character of allCharacters(gameState)) {
      animationStates[character.id] =
        characterAnimation(animationStates[character.id], character, isGrounded(character), dt)
    }

    // handle world physics
    for (let character of allCharacters(gameState)) {
      Object.assign(character, performAccel(character, DT))
      Object.assign(character, performVelocity(character, DT))
      Object.assign(character, adjustRoom(character))
      Object.assign(character, clampRoom(character, rooms.length))
      Object.assign(character, clampFloor(character))
    }

    // generate sprites
    let sprites: {[id: string]: Array<Sprite>} = {}
    for (let character: Character of allCharacters(gameState)) {
      let dRoom = computeRoomDistance(
        character.roomIndex,
        player.roomIndex,
        rooms.length)

      if (!shouldDrawCharacter(character, dRoom, ROOM_WIDTH))
        continue

      let image = computeAnimationImage(animationStates[character.id], getOrientedAnimationMap(character))
      let color = getCharacterColor(character)
      let recolor: ?Recolor = computeImageRecolor(character)
      let scale = computeImageScale(character)

      let characterRect = generateCharacterRect(character)
      characterRect = adjustRectForRoom(characterRect, dRoom, ROOM_WIDTH)
      characterRect = adjustRectForScale(characterRect, scale)

      let shadowOpacity = generateShadowOpacity(character)
      let shadowRect = adjustRectForRoom(
        generateShadowRect(character), dRoom, ROOM_WIDTH)

      sprites[character.id] = [
        generateShadowSprite(character.id, shadowOpacity, shadowRect),
        generateCharacterSprite(character.id, image, color, characterRect, recolor)
      ]
    }

    // adjust the depth of the sprites
    for (let id of Object.keys(sprites)) {
      for (let sprite of sprites[id] || []) {
        let height = FLOOR_HEIGHT + depths.depth(id) * 0.14
        Object.assign(sprite, adjustFloorHeight(sprite, height))
      }
    }

    // draw the background
    Canvas.drawBackground(buffer,
      computeRoomColor(gameState.rooms[player.roomIndex]))

    // draw the sprites in reverse depth order
    for (let id of depths.inReverseOrder()) {
      for (let sprite of sprites[id] || []) {
        if (sprite.image === undefined)
          Canvas.drawRect(buffer, sprite.color, transformRectToPixels(sprite))
        else
          Canvas.drawImage(buffer, sprite.image, transformRectToPixels(sprite), sprite)
      }
    }

    Canvas.drawBuffer(screen, buffer)
    return DT;
  }

  runLoop(step)
})
