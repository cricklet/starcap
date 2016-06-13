/* @flow */

import * as Canvas from './canvas'

import {
  CrewEnum,
  RoomEnum
} from './types'

import type {
  Player,
  CrewMember,
  Room,
  GameState
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

function initialGameState(): GameState {
  return {
    player: {
      id: Math.random(),
      x: 3, y: 0, vx: 0, vy: 0,
      roomIndex: 0
    },
    crew: [
      {
        id: Math.random(),
        x: 5, y: 0, vx: 0, vy: 0,
        roomIndex: 1,
        type: CrewEnum.ENG
      },
      {
        id: Math.random(),
        x: 2, y: 0, vx: 0, vy: 0,
        roomIndex: 2,
        type: CrewEnum.SEC
      },
      {
        id: Math.random(),
        x: 4, y: 0, vx: 0, vy: 0,
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

function renderPlayer(player: Player): Sprite {
  return {
    color: 'rgb(154, 205, 50)',
    x0: player.x - PLAYER_WIDTH * 0.5,
    x1: player.x + PLAYER_WIDTH * 0.5,
    y0: player.y,
    y1: player.y + PLAYER_HEIGHT
  }
}

function crewMemberColor(crew: CrewMember): string {
  if (crew.type === CrewEnum.ENG) return 'rgb(223, 208, 0)'
  if (crew.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
  if (crew.type === CrewEnum.SEC) return 'rgb(223, 0, 0)'
  throw "Unknown crew type"
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

let PLAYER_SPEED = 4;
let PLAYER_JUMP_SPEED = 6;
let GRAVITY_ACCEL = 20;

function walkPlayer(player: Player, inputs: Inputs): { vx: number } {
  let vx = 0;
  if (inputs.a) vx -= PLAYER_SPEED;
  if (inputs.d) vx += PLAYER_SPEED;

  return {
    vx: vx
  }
}

function canJump(character: {y: number, vy: number}): boolean {
  return character.y <= 0.001 && character.vy <= 0.001
}

function jumpPlayer(player: Player, inputs: Inputs, canJump: boolean): { vy?: number } {
  if (!canJump || !inputs.w)
    return {};

  return { vy: PLAYER_JUMP_SPEED }
}

function movePlayer(character: {x: number, y: number, vx: number, vy: number}, dt: number)
: {x?: number, y?: number} {
  return {
    x: character.x + character.vx * dt,
    y: character.y + character.vy * dt
  }
}

function thinkGravity(character: {y: number, vy: number}, dt: number): { vy?: number } {
  if (character.y > 0.001)
    return { vy: character.vy - GRAVITY_ACCEL * dt }

  return {}
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

$(document).ready(() => {
  let inputs = {};
  bindInputs(inputs)

  let screenEl = $('#world-canvas')[0]
  let screen: Canvas.Buffer = Canvas.setupBuffer(screenEl, CANVAS_WIDTH, CANVAS_HEIGHT)
  let buffer: Canvas.Buffer = Canvas.createBuffer(CANVAS_WIDTH, CANVAS_HEIGHT)

  let gameState = initialGameState()

  let step = () => {
    let player = gameState.player
    let rooms = gameState.rooms
    Object.assign(player, walkPlayer(player, inputs))
    Object.assign(player, jumpPlayer(player, inputs, canJump(player)))
    Object.assign(player, movePlayer(player, DT))
    Object.assign(player, thinkGravity(player, DT))
    Object.assign(player, adjustRoom(player))
    Object.assign(player, clampRoom(player, rooms.length))
    Object.assign(player, clampFloor(player, rooms.length))

    for (let crewMember of gameState.crew) {
      let rooms = gameState.rooms
      Object.assign(crewMember, movePlayer(crewMember, DT))
      Object.assign(crewMember, thinkGravity(crewMember, DT))
      Object.assign(crewMember, adjustRoom(crewMember))
      Object.assign(crewMember, clampRoom(crewMember, rooms.length))
      Object.assign(crewMember, clampFloor(crewMember, rooms.length))
    }

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
