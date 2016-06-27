/* @flow */

////////////////////////////////////////////////////////////
// Game state types

export let CrewEnum = {
  ENG: 'eng',
  SCI: 'sci',
  SEC: 'sec'
}

export type CrewEnumType =
  | 'eng'
  | 'sci'
  | 'sec'

export let RoomEnum = {
  BRIDGE: 'bridge',
  ENGINE: 'engine',
  STORE: 'store'
}

export type RoomEnumType =
  | 'bridge'
  | 'engine'
  | 'store'

//// Unfortunately, the current version of flow doesn't support disjoint
//// unions that involve intersections.
// type _Entity = {
//   id: string,
//   x: number,
//   y: number,
//   ax: number,
//   ay: number,
//   vx: number,
//   vy: number,
//   width: number,
//   height: number,
//   roomIndex: number
// }

export type Player = {
  kind: 'player',
  carrying?: string,
  // DRY, DRY, DRY
  id: string,
  x: number,
  y: number,
  ax: number,
  ay: number,
  vx: number,
  vy: number,
  width: number,
  height: number,
  roomIndex: number,
}

export type CrewMember = {
  kind: 'crew',
  type: CrewEnumType,
  // DRY, DRY, DRY
  id: string,
  x: number,
  y: number,
  ax: number,
  ay: number,
  vx: number,
  vy: number,
  width: number,
  height: number,
  roomIndex: number,
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
  UP: 'up',
  JUMP: 'jump',
  USE: 'use',
  THROW: 'throw',
  CARRY: 'carry',
  SHOOT: 'shoot'
}

export type Action = // yeah yeah, DRY :(
  | 'left'
  | 'right'
  | 'up'
  | 'jump'
  | 'use'
  | 'throw'
  | 'carry'
  | 'shoot'

////////////////////////////////////////////////////////////
// Rendering types

export type RGB = {
  r:number, g:number, b:number, a?: number
}

export type RGBMatcher = (rgb: RGB) => boolean

export type Recolor = {
  hash: string,
  checkers: Array<RGBMatcher>,
  rgbs: Array<RGB>
}
