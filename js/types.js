/* @flow */

////////////////////////////////////////////////////////////
// Game state types

export let CrewEnum = {
  ENG: 'eng',
  SCI: 'sci',
  SEC: 'sec'
}

type CrewEnumType =
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

type Entity = {
  id: string,
  x: number,
  y: number,
  ax: number,
  ay: number,
  vx: number,
  vy: number,
  width: number,
  height: number,
  roomIndex: number
}

export type Player =
  & Entity
  & {
  }

export type CrewMember =
  & Entity
  & {
    type: CrewEnumType,
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

////////////////////////////////////////////////////////////
// Intermediate types

export let ActionEnum = {
  LEFT: 'left',
  RIGHT: 'right',
  JUMP: 'jump',
  USE: 'use',
  THROW: 'throw',
  CARRY: 'carry',
  SHOOT: 'shoot'
}

export type Action = // yeah yeah, DRY :(
  | 'left'
  | 'right'
  | 'jump'
  | 'use'
  | 'throw'
  | 'carry'
  | 'shoot'
