import * as Canvas from './canvas'
import type {
  CrewEnum,
  RoomEnum,
  Player,
  CrewMember,
  Room,
  GameState
} from './types.js'


// Let's think about dimensions.
// The player's height should be 1 unit.
// The world itself should be, let's say, 6 units by 3 units
// 0,0 is bottom left & 1,1 is top right

let PLAYER_HEIGHT = 1
let PLAYER_WIDTH = 0.8
let ROOM_WIDTH = 8
let ROOM_HEIGHT = 2.5

function unitsToPixels(units) {return units * 75}
function pixelsToUnits(pixels) {return pixels / 75.0}

let CANVAS_WIDTH = unitsToPixels(ROOM_WIDTH)
let CANVAS_HEIGHT = unitsToPixels(ROOM_HEIGHT)
let CANVAS_PLAYER_HEIGHT = unitsToPixels(PLAYER_HEIGHT)

let player: Player = {
  x: 3, y: 0, roomIndex: 0
}

let INITIAL_STATE: GameState = {
  player: {
    x: 0.5, y: 0, roomIndex: 0
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

$(document).ready(() => {
  let screenEl = $('#world-canvas')[0]
  let screen: Canvas.Buffer = Canvas.setupBuffer(screenEl, CANVAS_WIDTH, CANVAS_HEIGHT)
  let buffer: Canvas.Buffer = Canvas.createBuffer(CANVAS_WIDTH, CANVAS_HEIGHT)

  let playerSprite: Sprite = renderPlayer(player)
  Canvas.drawRect(buffer,
    playerSprite.color,
    unitsToPixels(playerSprite.x0),
    unitsToPixels(playerSprite.y0),
    unitsToPixels(playerSprite.x1),
    unitsToPixels(playerSprite.y1))

  Canvas.drawBuffer(screen, buffer)
})
