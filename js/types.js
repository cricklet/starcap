
export type CrewType =
  | 'Engineering'
  | 'Security'

export type RoomType =
  | 'Bridge'
  | 'Engine'
  | 'Store'

export type Player = {
  x: number,
  y: number,
  roomIndex: number
}

export type CrewMember = {
  type: CrewType,
  x: number,
  y: number,
  roomIndex: number
}

export type Room = {
  type: RoomType
}

export type GameState = {
  player: PlayerType,
  crew: Array<CrewMember>,
  rooms: Array<Room>
}
