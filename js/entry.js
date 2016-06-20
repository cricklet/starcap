/* @flow */

import * as Canvas from './canvas'

import * as Utils from './utils'

import {
  CrewEnum,
  RoomEnum,
  ActionEnum
} from './types'

import type {
  Player,
  CrewMember,
  Room,
  GameState,
  Action
} from './types'

let FPS = 60.0;
let DT = 1.0 / FPS;

let ANIM_FPS = 8.0;

let PLAYER_HEIGHT = 1
let PLAYER_WIDTH = 1
let ROOM_WIDTH = 8
let ROOM_HEIGHT = 2.5

let FLOOR_HEIGHT = 0.25

function transformToPixels(units) {return units * 75}
function transformToUnits(pixels) {return pixels / 75.0}

let CANVAS_WIDTH = transformToPixels(ROOM_WIDTH)
let CANVAS_HEIGHT = transformToPixels(ROOM_HEIGHT)
let CANVAS_PLAYER_HEIGHT = transformToPixels(PLAYER_HEIGHT)

function genId(): string {return Math.random().toString().substring(2, 6)}

function initialGameState(): GameState {
  return {
    player: {
      id: genId(),
      x: 3, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      roomIndex: 0
    },
    crew: [
      {
        id: genId(),
        x: 5, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        roomIndex: 1,
        type: CrewEnum.ENG
      },
      {
        id: genId(),
        x: 2, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        roomIndex: 2,
        type: CrewEnum.SEC
      },
      {
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

let CREW_IMAGES = {
  [CrewEnum.SEC]: _generateOrientedAnimationMap(ALIEN_IMAGES, 'alien', 'sec'),
  [CrewEnum.SCI]: _generateOrientedAnimationMap(ALIEN_IMAGES, 'alien', 'sci'),
  [CrewEnum.ENG]: _generateOrientedAnimationMap(ALIEN_IMAGES, 'alien', 'eng')
}

type Sprite = {
  sourceId: string,
  image?: string,
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

function renderShadow(character: { id: string, x: number, y: number }): Sprite {
  let scale   = (16.0 - character.y) / 16.0
  let opacity = Math.max(0, 2.0 - character.y) / 2.0

  return {
    sourceId: character.id,
    color: 'rgb(50, 50, 50)',
    image: 'img/shadow.png',
    opacity: 0.5 * opacity * opacity,
    x0: character.x - scale * PLAYER_WIDTH * 0.5,
    x1: character.x + scale * PLAYER_WIDTH * 0.5,
    y0: - 0.2 * PLAYER_WIDTH,
    y1: PLAYER_HEIGHT - 0.2 * PLAYER_WIDTH
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

function renderPlayer(player: Player, animationState: AnimationState): Sprite {
  let image = computeAnimationImage(animationState, PLAYER_IMAGES)

  return {
    sourceId: player.id,
    color: 'rgb(154, 205, 50)',
    image: image,
    x0: player.x - PLAYER_WIDTH * 0.5,
    x1: player.x + PLAYER_WIDTH * 0.5,
    y0: player.y,
    y1: player.y + PLAYER_HEIGHT
  }
}

function renderCrewMember(crew: CrewMember, animationState: AnimationState): Sprite {
  let image = computeAnimationImage(animationState, CREW_IMAGES[crew.type])

  return {
    sourceId: crew.id,
    color: crewMemberColor(crew),
    image: image,
    x0: crew.x - PLAYER_WIDTH * 0.5,
    x1: crew.x + PLAYER_WIDTH * 0.5,
    y0: crew.y,
    y1: crew.y + PLAYER_HEIGHT
  }
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
let GRAVITY_ACCEL = 40;

function thinkPlayer(inputs: Inputs, canJump: boolean): Set<Action> {
  let actions: Set<Action> = new Set()

  if (inputs.a) actions.add(ActionEnum.LEFT)
  if (inputs.d) actions.add(ActionEnum.RIGHT)
  if (canJump && inputs.w) actions.add(ActionEnum.JUMP)

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
    return { x: ROOM_WIDTH, roomIndex: character.roomIndex - 1 }

  if (character.x > ROOM_WIDTH)
    return { x: 0, roomIndex: character.roomIndex + 1 }

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

type Inputs = {[key: string]: boolean}

let KEY_CODE_TO_CHAR = {
  '37': 'a',
  '38': 'w',
  '39': 'd',
  '40': 's',
  '189': '-',
  '187': '=',
  '32': ' ',
  '13': 'x'
}
function getChar(e: $.Event) {
  if (e.keyCode >= 48 && e.keyCode <= 90)
    return String.fromCharCode(e.keyCode).toLowerCase();

  if (e.keyCode in KEY_CODE_TO_CHAR)
    return KEY_CODE_TO_CHAR[e.keyCode];

  return null;
}

function bindInputs (inputs: Inputs) {
  $(document).keydown(function (e) {
    let key = getChar(e);
    if (key) inputs[key] = true;
  });
  $(document).keyup(function (e) {
    let key = getChar(e);
    if (key) inputs[key] = false;
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

$(document).ready(() => {
  let inputs = {};
  bindInputs(inputs)

  let screenEl = $('#world-canvas')[0]
  let screen: Canvas.Buffer = Canvas.setupBuffer(screenEl, CANVAS_WIDTH, CANVAS_HEIGHT)
  let buffer: Canvas.Buffer = Canvas.createBuffer(CANVAS_WIDTH, CANVAS_HEIGHT)

  let gameState = initialGameState()
  let animationStates: { [id: string]: AnimationState } = {}

  let step = (dt) => {
    let player = gameState.player
    let rooms = gameState.rooms

    // handle input
    let playerActions: Set<Action> = thinkPlayer(inputs, canJump(player))
    Object.assign(player, horizontalCharacterPhysics(player, playerActions, isGrounded(player)))
    Object.assign(player, verticalCharacterPhysics(isGrounded(player), playerActions))

    // handle animation
    for (let character of allCharacters(gameState)) {
      animationStates[character.id] =
        characterAnimation(animationStates[character.id], character, isGrounded(character), dt)
    }

    Object.assign(player, performAccel(player, DT))
    Object.assign(player, performVelocity(player, DT))
    Object.assign(player, adjustRoom(player))
    Object.assign(player, clampRoom(player, rooms.length))
    Object.assign(player, clampFloor(player))

    Canvas.drawBackground(buffer,
      computeRoomColor(gameState.rooms[player.roomIndex]))

    let sprites = [];
    for (let crewMember of gameState.crew) {
      if (crewMember.roomIndex === player.roomIndex) {
        sprites.push(renderCrewMember(crewMember, animationStates[crewMember.id]))
        sprites.push(renderShadow(crewMember))
      }
    }
    sprites.push(renderPlayer(player, animationStates[player.id]))
    sprites.push(renderShadow(player))

    for (let sprite of sprites) {
      Object.assign(sprite, adjustFloorHeight(sprite, PLAYER_FLOOR_HEIGHT))
    }

    for (let sprite of sprites) {
      if (sprite.image === undefined)
        Canvas.drawRect(buffer, sprite.color, transformRectToPixels(sprite))
      else
        Canvas.drawImage(buffer, sprite.image, transformRectToPixels(sprite), sprite)
    }

    Canvas.drawBuffer(screen, buffer)
    return DT;
  }

  runLoop(step)
})
