import * as Canvas from './canvas'
import type {
  CrewEnum,
  RoomEnum,
  Player,
  CrewMember,
  Room,
  GameState
} from './types.js'

let player: Player = {
  x: 0.5, y: 0, roomIndex: 0
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

$(document).ready(() => {
  let CANVAS_WIDTH = 600
  let CANVAS_HEIGHT = 200

  let canvas = $('#world-canvas')[0]

  let canvasContext = canvas.getContext('2d')
  canvasContext.imageSmoothingEnabled = false

  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  var buffer = Canvas.createBuffer(canvas.width, canvas.height)

})
