/* @flow */

import * as Canvas from './canvas'

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

let PLAYER_HEIGHT = 1
let PLAYER_WIDTH = 0.8
let ROOM_WIDTH = 8
let ROOM_HEIGHT = 2.5

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

type Sprite = {
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
  direction: Direction
}

function sameSign(x, y) {
  return x * y >= 0
}

function characterAnimation(
  oldAnimation: ?{ direction: Direction, animation: Animation },
  character: { vx: number, vy: number, ax: number, ay: number },
  isGrounded: boolean
): { direction: Direction, animation: Animation } {
  let isMoving = 0.01 < Math.abs(character.vx)
  let isAccelerating = 0.01 < Math.abs(character.ax)
  let isSpeedIncreasing = sameSign(character.vx, character.ax)

  let slowingDown = isMoving && isAccelerating && !isSpeedIncreasing

  let movingLeft  = character.vx < - 0.01
  let movingRight = character.vx >   0.01

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

  return {
    direction: direction,
    animation: animation
  }
}

function renderPlayer(player: Player): Sprite {
  return {
    color: 'rgb(154, 205, 50)',
    x0: player.x - PLAYER_WIDTH * 0.5,
    x1: player.x + PLAYER_WIDTH * 0.5,
    y0: player.y,
    y1: player.y + PLAYER_HEIGHT
  }
}

function renderCrewMember(crew: CrewMember): Sprite {
  return {
    color: crewMemberColor(crew),
    x0: crew.x - PLAYER_WIDTH * 0.5,
    x1: crew.x + PLAYER_WIDTH * 0.5,
    y0: crew.y,
    y1: crew.y + PLAYER_HEIGHT
  }
}

function computeRoomColor(room: Room): string {
  if (room.type == RoomEnum.BRIDGE) return '#eee'
  if (room.type == RoomEnum.ENGINE) return '#fee'
  if (room.type == RoomEnum.STORE) return '#efe'
  throw "Unknown room"
}

let PLAYER_SPEED = 8;
let PLAYER_ACCEL = 50;
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
  let movingRight = character.vx >   0.01
  let movingLeft  = character.vx < - 0.01
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
  return {
    vx: character.vx + character.ax * dt,
    vy: character.vy + character.ay * dt
  }
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
    var key = getChar(e);
    if (key) inputs[key] = true;
  });
  $(document).keyup(function (e) {
    var key = getChar(e);
    if (key) inputs[key] = false;
  });
}

function runLoop(step: () => number) {
  var lastTime = Date.now();
  var frameCount = 0;
  var frameStart = Date.now();

  function loop () {
    // calculate FPS
    frameCount += 1;
    if (Date.now() > frameStart + 1000) {
      console.log(frameCount + " fps");
      frameCount = 0;
      frameStart = Date.now();
    }

    let dt = step();
    setTimeout(loop, 1000 * dt);
  };

  loop();
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

  let step = () => {
    let player = gameState.player
    let rooms = gameState.rooms

    // handle input
    let playerActions: Set<Action> = thinkPlayer(inputs, canJump(player))
    Object.assign(player, horizontalCharacterPhysics(player, playerActions, isGrounded(player)))
    Object.assign(player, verticalCharacterPhysics(isGrounded(player), playerActions))

    let playerAnimation = characterAnimation(
      animationStates[player.id], player, isGrounded(player))

    // if (Math.random() < 0.05) console.log(playerAnimation)

    Object.assign(player, performAccel(player, DT))
    Object.assign(player, performVelocity(player, DT))
    Object.assign(player, adjustRoom(player))
    Object.assign(player, clampRoom(player, rooms.length))
    Object.assign(player, clampFloor(player))

    // for (let entity of allCharacters(gameState)) {
    // }

    Canvas.drawBackground(buffer,
      computeRoomColor(gameState.rooms[player.roomIndex]))

    let sprites = [];
    for (let crewMember of gameState.crew) {
      if (crewMember.roomIndex === player.roomIndex)
        sprites.push(renderCrewMember(crewMember))
    }
    sprites.push(renderPlayer(player))

    for (let sprite of sprites) {
      Canvas.drawRect(buffer, sprite.color, transformRectToPixels(sprite))
    }

    Canvas.drawBuffer(screen, buffer)
    return DT;
  }

  runLoop(step)
})
