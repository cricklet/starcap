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
let PLAYER_WIDTH = 0.6
let ROOM_WIDTH = 8
let ROOM_HEIGHT = 2.5

let UNITS_TO_PIXELS = 75
let CANVAS_WIDTH = UNITS_TO_PIXELS * ROOM_WIDTH
let CANVAS_HEIGHT = UNITS_TO_PIXELS * ROOM_HEIGHT
let CANVAS_PLAYER_HEIGHT = UNITS_TO_PIXELS * PLAYER_HEIGHT

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

export type Sprite = {
  image: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number
}

export function renderPlayer(player: Player): Sprite {
  return {
    image: 'player.png',
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
})
