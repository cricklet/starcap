import * as Canvas from './canvas'
import {
  CrewType,
  RoomType,
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
      x: 0.7, y: 0, roomIndex: 0, type: CrewType.Engineering
    },
    {
      x: 0.7, y: 0, roomIndex: 1, type: CrewType.Security
    }
  ],
  rooms: [
    {
      type: RoomType.Bridge
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
