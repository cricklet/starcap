/* @flow */

////////////////////////////////////////////////////////////
// Game state types

export let CrewEnum = {
  ENG: 'eng',
  SCI: 'sci',
  SEC: 'sec'
}

type CrewEnumType = // yeah yeah, DRY :(
  | 'eng'
  | 'sci'
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
  vx: number,
  vy: number,
  roomIndex: number
}

export type CrewMember = {
  type: CrewEnumType,
  x: number,
  y: number,
  vx: number,
  vy: number,
  roomIndex: number
}

export type Character = Player | CrewMember

export type Room = {
  type: RoomEnumType
}

export type GameState = {
  player: Player,
  crew: Array<CrewMember>,
  rooms: Array<Room>
}
