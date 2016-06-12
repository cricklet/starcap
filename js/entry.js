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

function unitsToPixels(units) {return units * 75}
function pixelsToUnits(pixels) {return pixels / 75.0}

let CANVAS_WIDTH = unitsToPixels(ROOM_WIDTH)
let CANVAS_HEIGHT = unitsToPixels(ROOM_HEIGHT)
let CANVAS_PLAYER_HEIGHT = unitsToPixels(PLAYER_HEIGHT)

function initialGameState(): GameState {
  return {
    player: {
      x: 3, y: 0, roomIndex: 0
    },
    crew: [
      {
        x: 0.7, y: 0, roomIndex: 0, type: CrewEnum.ENG
      },
      {
        x: 0.7, y: 0, roomIndex: 1, type: CrewEnum.SEC
      }
    ],
    rooms: [
      {
        type: RoomEnum.BRIDGE
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

function renderPlayer(player: Player): Sprite {
  return {
    color: '#f3e2d3',
    x0: player.x - PLAYER_WIDTH * 0.5,
    x1: player.x + PLAYER_WIDTH * 0.5,
    y0: player.y,
    y1: player.y + PLAYER_HEIGHT
  }
}

let PLAYER_SPEED = 4;

function thinkPlayer(player: Player, inputs: Inputs, dt: number): { x: number } {
  let vx = 0;
  let vy = 0;
  if (inputs.a) vx -= 1;
  if (inputs.d) vx += 1;

  return {x: player.x + vx * dt * PLAYER_SPEED}
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
    let dPlayer = thinkPlayer(gameState.player, inputs, DT)
    Object.assign(gameState.player, dPlayer)

    Canvas.drawBackground(buffer, '#eee')

    let playerSprite: Sprite = renderPlayer(gameState.player)
    Canvas.drawRect(buffer,
      playerSprite.color,
      unitsToPixels(playerSprite.x0),
      unitsToPixels(playerSprite.y0),
      unitsToPixels(playerSprite.x1),
      unitsToPixels(playerSprite.y1))

    Canvas.drawBuffer(screen, buffer)
    return DT;
  }

  runLoop(step)
})
