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

  // required components
  animation: CharacterAnimationComponent,
  imager: ImagerComponent,
  carrier: CarrierComponent,
  interactor: InteractorComponent,
  actor: ActorComponent,
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

  // required components
  carriable: CarriableComponent,
  animation: CharacterAnimationComponent,
  ai: AIComponent,
  actor: ActorComponent,
}

export type Alien = {
  kind: 'alien',
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

export type Furniture = {
  kind: 'furniture',
  id: string,
  type: string,
  x: number,
  width: number,
  height: number,
  foreground?: boolean,
  roomIndex: number,

  spawner?: SpawnerComponent,
  button?: ButtonComponent,
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
// Character components

export let CharacterAnimationEnum = {
  RUN: 'run',
  STAND: 'stand',
  SKID: 'skid',
  JUMP: 'jump'
}

export type CharacterAnimation =
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

export type AIComponent = {
  kind: 'ai',
  actions: Array<Action>,
  nextThink: number
}

export type ActorComponent = {
  kind: 'actor',
  actions: Set<Action>
}

export type CharacterAnimationComponent = {
  kind: 'animation',
  animation: CharacterAnimation,
  direction: Direction,
  time: number
}

export type ImagerComponent = {
  kind: 'imager',
  computeImage: (
    dir: Direction,
    anim: CharacterAnimation,
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

export type InteractorComponent = {
  kind: 'interactor'
}

export type BeamingDownComponent = {
  kind: 'beaming',
  time: number
}

export let SpawnEventEnum = {
  SEC_TELEPORT: 'security teleporter',
  ENG_TELEPORT: 'engineering teleporter'
}

export type SpawnEvent =
  | 'security teleporter'
  | 'engineering teleporter'

export type FurnitureEvent =
  | SpawnEvent

export type ButtonComponent = {
  kind: 'button',
  eventToFire: FurnitureEvent,
  time: number, // is -1 if no presses
  notify: string
}

export type SpawnerComponent = {
  kind: 'spawner',
  events: Array<FurnitureEvent>,
  spawn: (ev: FurnitureEvent) => Alien | CrewMember,
  time: number // is -1 if no interactions
}

////////////////////////////////////////////////////////////
// Intermediate types

export let ActionEnum = {
  LEFT: 'left',
  RIGHT: 'right',
  SLOW_LEFT: 'slow-left',
  SLOW_RIGHT: 'slow-right',
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
  | 'slow-left'
  | 'slow-right'

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
