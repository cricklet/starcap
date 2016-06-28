/* @flow */

////////////////////////////////////////////////////////////
// Game state types

export let CrewEnum = {
  ENG: 'eng',
  // SCI: 'sci',
  SEC: 'sec'
}

export type CrewEnumType =
  | 'eng'
  // | 'sci'
  | 'sec'

export let RoomEnum = {
  BRIDGE: 'bridge',
  ENGINE: 'engine',
  STORE: 'store',
  MEDBAY: 'medbay'
}

export type RoomEnumType =
  | 'bridge'
  | 'engine'
  | 'store'
  | 'medbay'

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

  components: {[kind: string]: Component},
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

  components: {[kind: string]: Component},
}

export type Character = Player | CrewMember

export type Furniture = {
  kind: 'furniture',
  id: string,
  type: string,
  x: number,
  width: number,
  height: number,
  roomIndex: number,
}

export type Room = {
  type: RoomEnumType
}

export type GameState = {
  player: Player,
  crew: Array<CrewMember>,
  furnitures: Array<Furniture>,
  rooms: Array<Room>
}

////////////////////////////////////////////////////////////
// Component types

export let AnimationEnum = {
  RUN: 'run',
  STAND: 'stand',
  SKID: 'skid',
  JUMP: 'jump'
}

export type Animation =
  | 'run'
  | 'stand'
  | 'skid'
  | 'jump'

export let DirectionEnum = {
  LEFT: 'left',
  RIGHT: 'right'
}

export type Direction =
  | 'left'
  | 'right'

export type AnimationComponent = {
  kind: 'animation',
  animation: Animation,
  direction: Direction,
  time: number
}

export type ImagerComponent = {
  kind: 'imager',
  computeImage: (
    dir: Direction,
    anim: Animation,
    time: number
  ) => string
}

export type CarrierComponent = {
  kind: 'carrier',
  carrying?: string
}

export type CarriableComponent = {
  kind: 'carriable'
}

export type Component =
  | AnimationComponent
  | ImagerComponent
  | CarrierComponent
  | CarriableComponent

////////////////////////////////////////////////////////////
// Intermediate types

export let ActionEnum = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  JUMP: 'jump',
  ACT: 'act'
}

export type Action = // yeah yeah, DRY :(
  | 'left'
  | 'right'
  | 'up'
  | 'jump'
  | 'act'

////////////////////////////////////////////////////////////
// Rendering types

export type RGB = {
  r:number, g:number, b:number, a?: number
}

export type Recolor = {
  hash: string,
  oldRGBs: Array<RGB>,
  newRGBs: Array<RGB>
}
