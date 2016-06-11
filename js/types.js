export let CrewEnum = {
  ENG: 'eng',
  SEC: 'sec'
}

type CrewEnumType = // yeah yeah, DRY :(
  | 'eng'
  | 'sec'

export let RoomEnum = {
  BRIDGE: 'bridge',
  ENGINE: 'engine',
  STORE: 'store'
}

type RoomEnumType =
  | 'bridge'
  | 'engine'
  | 'store'

export type Player = {
  x: number,
  y: number,
  roomIndex: number
}

export type CrewMember = {
  type: CrewEnumType,
  x: number,
  y: number,
  roomIndex: number
}

export type Room = {
  type: RoomEnumType
}

export type GameState = {
  player: Player,
  crew: Array<CrewMember>,
  rooms: Array<Room>
}
