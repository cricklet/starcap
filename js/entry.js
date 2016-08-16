/* @flow */

import * as Canvas from './canvas'
import * as Utils from './utils'
import { ArrayObserver } from 'observe-js'
import * as Lazy from './lazy'

import {
  CrewEnum,
  RoomEnum,
  ActionEnum,
  DirectionEnum,
  CharacterAnimationEnum,
  SpawnEventEnum
} from './types'

import type {
  Player,
  CrewMember,
  CrewEnumType,
  Room,
  GameState,
  Action,
  Character,
  Furniture,
  RGB,
  Recolor,
  CharacterAnimationComponent,
  CarrierComponent,
  CharacterAnimation,
  Direction,
  ImagerComponent,
  CarriableComponent,
  FurnitureEvent,
  InteractorComponent,
  SpawnerComponent,
  ButtonComponent,
  Alien,
  SpawnEvent,
  AIComponent,
  ActorComponent
} from './types'

let FPS = 60.0;
let DT = 1.0 / FPS;

let ANIM_FPS = 8.0;

let PLAYER_HEIGHT = 1
let PLAYER_WIDTH = 0.875
let ROOM_WIDTH = 8
let ROOM_HEIGHT = 2.5

let FLOOR_HEIGHT = 0.3
let FURNITURE_HEIGHT = 0.6
let WALL_START_HEIGHT = 0.65

let BUTTON_COOLOFF = 0.5
let TELEPORT_COOLOFF = 0.5

function transformToPixels(units) {return units * 75}
function transformToUnits(pixels) {return pixels / 75.0}

let CANVAS_WIDTH = transformToPixels(ROOM_WIDTH)
let CANVAS_HEIGHT = transformToPixels(ROOM_HEIGHT)
let CANVAS_PLAYER_HEIGHT = transformToPixels(PLAYER_HEIGHT)

function genId(): string {return Math.random().toString().substring(2, 6)}

function stringToHash(s: string): number {
  // from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  let hash = 0, i = 0, len = s.length, chr;
  while ( i < len ) {
    hash  = ((hash << 5) - hash + s.charCodeAt(i++)) << 0;
  }
  return hash;
};

function defaultAnimation(): CharacterAnimationComponent {
  return {
    kind: 'animation',
    direction: DirectionEnum.LEFT,
    animation: CharacterAnimationEnum.STAND,
    time: 0
  }
}

function defaultCarrier(): CarrierComponent {
  return {
    kind: 'carrier',
    carrying: undefined
  }
}

function defaultCarriable(): CarriableComponent {
  return {
    kind: 'carriable'
  }
}

function defaultInteractor(): InteractorComponent {
  return {
    kind: 'interactor'
  }
}

function defaultAI(): AIComponent {
  return {
    kind: 'ai',
    actions: [],
    nextThink: Math.random() + 0.5
  }
}

function generateCrewMember(
  x: number,
  roomIndex: number,
  type: CrewEnumType
): CrewMember {
  return {
    kind: 'crew',
    id: genId(),
    x: x, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    roomIndex: roomIndex,
    type: type,

    // components
    carriable: defaultCarriable(),
    animation: defaultAnimation(),
    ai: defaultAI(),
    actor: defaultActor()
  }
}

function generateSpawner(
  x: number,
  roomIndex: number
): (ev: FurnitureEvent) => Alien | CrewMember {
  return (ev: FurnitureEvent) => {
    let character;

    if (ev == SpawnEventEnum.SEC_TELEPORT)
      character = generateCrewMember(x, roomIndex, CrewEnum.SEC)
    if (ev == SpawnEventEnum.ENG_TELEPORT)
      character = generateCrewMember(x, roomIndex, CrewEnum.ENG)

    if (character === undefined)
      throw "Unknown spawn event"

    return Object.assign(character, {y: ROOM_HEIGHT})
  }
}

function defaultActor(): ActorComponent {
  return {
    kind: 'actor',
    actions: new Set()
  }
}

function initialGameState(): GameState {
  return {
    player: {
      kind: 'player',
      id: genId(),
      x: 3, y: 0, vx: 0, vy: 0, ax: 0, ay: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      roomIndex: 0,

      // components
      animation: defaultAnimation(),
      carrier: defaultCarrier(),
      imager: defaultImager(PLAYER_IMAGES),
      interactor: defaultInteractor(),
      actor: defaultActor()
    },
    crew: [
      generateCrewMember(5, 1, CrewEnum.ENG),
      generateCrewMember(2, 2, CrewEnum.SEC),
    ],
    furnitures: [
      {
        kind: 'furniture',
        type: 'console_green',
        id: genId(),
        x: 6.4,
        width: 8 * 0.12,
        height: 6 * 0.12,
        roomIndex: 0,
      },
      {
        kind: 'furniture',
        type: 'console_red',
        id: genId(),
        x: 4.9,
        width: 8 * 0.12,
        height: 6 * 0.12,
        roomIndex: 0,
      },
      {
        kind: 'furniture',
        type: 'screen',
        id: genId(),
        x: 2.5,
        width: 20 * 0.12,
        height: 16 * 0.12,
        roomIndex: 0,
      },
      {
        kind: 'furniture',
        type: 'core',
        id: genId(),
        x: 2,
        width: 24 * 0.12,
        height: 16 * 0.12,
        roomIndex: 1,
      },
      {
        kind: 'furniture',
        type: 'console_engine',
        id: genId(),
        x: 4.52,
        width: 20 * 0.12,
        height: 11 * 0.12,
        roomIndex: 1,
      },
      {
        kind: 'furniture',
        type: 'console_tall',
        id: genId(),
        x: 1.5,
        width: 6 * 0.12,
        height: 16 * 0.12,
        roomIndex: 2,
      },
      {
        kind: 'furniture',
        type: 'med_table',
        id: genId(),
        x: 3.1,
        width: 12 * 0.12,
        height: 6 * 0.12,
        roomIndex: 2,
      },
      {
        kind: 'furniture',
        type: 'chair_left',
        id: genId(),
        x: 4.6,
        width: 6 * 0.12,
        height: 8 * 0.12,
        roomIndex: 2,
      },
      {
        kind: 'furniture',
        type: 'med_cab',
        id: genId(),
        x: 5.5,
        width: 6 * 0.12,
        height: 12 * 0.12,
        roomIndex: 2,
      },
      {
        kind: 'furniture',
        type: 'chair',
        id: genId(),
        x: 6.6,
        width: 6 * 0.12,
        height: 8 * 0.12,
        roomIndex: 2,
      },
      {
        kind: 'furniture',
        type: 'teleporter',
        id: 'teleporter0',
        foreground: true,
        x: 2.5,
        width: 17 * 0.12,
        height: 16 * 0.12,
        roomIndex: 3,
        spawner: {
          kind: 'spawner',
          events: [],
          spawn: generateSpawner(2.5, 3),
          time: -1
        }
      },
      {
        kind: 'furniture',
        type: 'sec_button',
        id: genId(),
        x: 4,
        width: 6 * 0.12,
        height: 6 * 0.12,
        roomIndex: 3,
        button: {
          kind: 'button',
          eventToFire: SpawnEventEnum.SEC_TELEPORT,
          time: -1,
          notify: 'teleporter0'
        }
      },
      {
        kind: 'furniture',
        type: 'eng_button',
        id: genId(),
        x: 4.8,
        width: 6 * 0.12,
        height: 6 * 0.12,
        roomIndex: 3,
        button: {
          kind: 'button',
          eventToFire: SpawnEventEnum.ENG_TELEPORT,
          time: -1,
          notify: 'teleporter0'
        }
      },
      {
        kind: 'furniture',
        type: 'console_blue',
        id: genId(),
        x: 6,
        width: 8 * 0.12,
        height: 6 * 0.12,
        roomIndex: 3,
      }
    ],
    rooms: [
      {
        type: RoomEnum.BRIDGE
      },
      {
        type: RoomEnum.ENGINE
      },
      {
        type: RoomEnum.MEDBAY
      },
      {
        type: RoomEnum.STORE
      }
    ]
  }
}

let DAMAGE_IMAGES = [
  'damage0.png', 'damage1.png', 'damage2.png', 'damage3.png', 'damage4.png']

let FURNITURE_IMAGES = {
  'console_red': ['img/console_red.png'],
  'console_green': ['img/console_green.png'],
  'screen': ['img/screen.png'],
  'core': ['img/core.png', 'img/core2.png', 'img/core3.png'],
  'console_engine': ['img/console_engine.png'],
  'console_tall': ['img/console_tall.png'],
  'med_table': ['img/med_table.png'],
  'console_weird': ['img/console_weird.png'],
  'chair': ['img/chair.png'],
  'chair_left': ['img/chair_left.png'],
  'med_cab': ['img/med_cab.png'],
  'teleporter': ['img/teleporter.png'],
  'sec_button': ['img/sec_button.png'],
  'eng_button': ['img/eng_button.png'],
  'console_blue': ['img/console_blue.png'],
}

let ACTIVE_IMAGES = {
  'teleporter': ['img/teleporter_alt.png', 'img/teleporter_alt2.png'],
  'sec_button': ['img/sec_button_alt.png'],
  'eng_button': ['img/eng_button_alt.png'],
}

let FURNITURE_ANIMATION_DT = {
  'teleporter': 0.2
}

function generateFurnitureImage(furniture: Furniture, time: number) {
  let images = FURNITURE_IMAGES[furniture.type]
  let dt = FURNITURE_ANIMATION_DT[furniture.type] || 1.0

  let button: ?ButtonComponent = furniture.button
  if (button && isButtonPressed(button)) {
    images = ACTIVE_IMAGES[furniture.type]
  }

  let spawner: ?SpawnerComponent = furniture.spawner
  if (spawner && isSpawnerActive(spawner)) {
    images = ACTIVE_IMAGES[furniture.type]
  }

  return images[Math.floor((time / dt) % images.length)]
}

function generateFurnitureRect(furniture: Furniture) {
  return {
    x0: furniture.x - furniture.width * 0.5,
    x1: furniture.x + furniture.width * 0.5,
    y0: FURNITURE_HEIGHT,
    y1: FURNITURE_HEIGHT + furniture.height
  }
}

type AnimationMap = {[anim: CharacterAnimation]: Array<string>}
type OrientedAnimationMap = {[dir: Direction]: AnimationMap}

function _generateAnimationMap(imagesMap: AnimationMap, oldStr: string, newStr: string): AnimationMap {
  return Utils.mapObject(
    imagesMap,
    (images) => images.map((image) => image.replace(oldStr, newStr)))
}

function _generateOrientedAnimationMap(dirImagesMap: OrientedAnimationMap, oldStr: string, newStr: string): OrientedAnimationMap {
  return Utils.mapObject(
    dirImagesMap,
    (imagesMap) => _generateAnimationMap(imagesMap, oldStr, newStr))
}

let _RIGHT_PLAYER_IMAGES: AnimationMap = {
  [CharacterAnimationEnum.RUN]: ['img/right_cap.png', 'img/right_cap_run_0.png'],
  [CharacterAnimationEnum.STAND]: ['img/right_cap.png'],
  [CharacterAnimationEnum.JUMP]: ['img/right_cap_run_0.png'],
  [CharacterAnimationEnum.SKID]: ['img/right_cap.png'] }

let PLAYER_IMAGES = {
  [DirectionEnum.LEFT]:  _generateAnimationMap(_RIGHT_PLAYER_IMAGES,  'right', 'left'),
  [DirectionEnum.RIGHT]: _RIGHT_PLAYER_IMAGES
}

let _RIGHT_ALIEN_IMAGES: AnimationMap = {
  [CharacterAnimationEnum.RUN]: ['img/right_alien.png', 'img/right_alien_run_0.png'],
  [CharacterAnimationEnum.STAND]: ['img/right_alien.png'],
  [CharacterAnimationEnum.JUMP]: ['img/right_alien_run_0.png'],
  [CharacterAnimationEnum.SKID]: ['img/right_alien.png'] }

let ALIEN_IMAGES = {
  [DirectionEnum.LEFT]:  _generateAnimationMap(_RIGHT_ALIEN_IMAGES,  'right', 'left'),
  [DirectionEnum.RIGHT]: _RIGHT_ALIEN_IMAGES
}

function defaultImager(map: OrientedAnimationMap): ImagerComponent {
  let computeImage = (dir: Direction, anim: CharacterAnimation, time: number) => {
    let i = Math.floor(time * ANIM_FPS + 0.25)
    let images = map[dir][anim]
    let image = images[i % images.length]
    return image
  }
  return {
    kind: 'imager',
    computeImage: computeImage
  }
}

type Sprite = {
  sourceId: string,
  image?: string,
  imageRecolor?: Recolor,
  flip?: boolean,
  opacity?: number,
  color: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number
}

function transformRectToPixels(rect: {x0:number, y0:number, x1:number, y1:number})
: {x0:number, y0:number, x1:number, y1:number} {
  return {
    x0: transformToPixels(rect.x0),
    y0: transformToPixels(rect.y0),
    x1: transformToPixels(rect.x1),
    y1: transformToPixels(rect.y1)
  }
}

function crewMemberColor(crew: CrewMember): string {
  if (crew.type === CrewEnum.ENG) return 'rgb(223, 208, 0)'
  // if (crew.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
  if (crew.type === CrewEnum.SEC) return 'rgb(223, 0, 0)'
  throw "Unknown crew type"
}

function sameSign(x, y) {
  return x * y >= 0
}

function characterAnimation(
  oldAnimation: ?CharacterAnimationComponent,
  character: { vx: number, vy: number, ax: number, ay: number },
  isGrounded: boolean,
  isCarried: boolean,
  dt: number
): CharacterAnimationComponent {
  let isMoving = 0 < Math.abs(character.vx)
  let isAccelerating = 0 < Math.abs(character.ax)
  let isSpeedIncreasing = sameSign(character.vx, character.ax)

  let slowingDown = isMoving && isAccelerating && !isSpeedIncreasing

  let movingLeft  = character.vx < - 0
  let movingRight = character.vx >   0

  // Setup default Direction & CharacterAnimation
  let direction = DirectionEnum.RIGHT
  let animation = CharacterAnimationEnum.STAND

  if (oldAnimation) {
    animation = oldAnimation.animation
    direction = oldAnimation.direction
  }

  if (movingLeft)  direction = DirectionEnum.LEFT
  if (movingRight) direction = DirectionEnum.RIGHT

  if (isCarried) {
    animation = CharacterAnimationEnum.STAND
  } else if (!isGrounded) {
    animation = CharacterAnimationEnum.JUMP
  } else {
    if (slowingDown) animation = CharacterAnimationEnum.SKID
    else if (isMoving) animation = CharacterAnimationEnum.RUN
    else animation = CharacterAnimationEnum.STAND
  }

  let time = 0
  if (oldAnimation) {
    if (oldAnimation.animation !== animation) time = 0
    else time = oldAnimation.time + dt
  }

  return {
    kind: 'animation',
    direction: direction,
    animation: animation,
    time: time
  }
}

function generateShadowOpacity(character: {y: number }): number {
  return (2.0 - Math.min(character.y, 1.5)) / 2.0
}

function generateShadowRect(character: { x: number, y: number, width: number, height: number })
: { x0: number, y0: number, x1: number, y1: number } {
  let scale   = (16.0 - character.y) / 16.0

  return {
    x0: character.x - scale * character.width * 0.5,
    x1: character.x + scale * character.width * 0.5,
    y0: - 0.2 * character.width,
    y1: character.height - 0.2 * character.width
  }
}

function generateShadowSprite(
  id: string,
  opacity: number,
  rect: { x0: number, y0: number, x1: number, y1: number }
): Sprite {
  return {
    sourceId: id,
    color: 'rgb(50, 50, 50)',
    image: 'img/shadow.png',
    opacity: 0.5 * opacity * opacity,
    x0: rect.x0,
    x1: rect.x1,
    y0: rect.y0,
    y1: rect.y1
  }
}

function computeAnimationImage(
  animationState: CharacterAnimationComponent,
  directionalImagesMap: OrientedAnimationMap
): string {
  let animation = animationState.animation
  let direction = animationState.direction
  let time      = animationState.time

  let i = Math.floor(time * ANIM_FPS + 0.25)
  let images = directionalImagesMap[animationState.direction][animation]
  let image = images[i % images.length]

  return image
}

function adjustXForRoom(
  x: number,
  dRoom: number,
  roomWidth: number
): number {
  return x - roomWidth * dRoom
}

function adjustRectForRoom(
  rect: { x0: number, y0: number, x1: number, y1: number },
  dRoom: number,
  roomWidth: number
): { x0: number, y0: number, x1: number, y1: number } {
  return {
    x0: adjustXForRoom(rect.x0, dRoom, roomWidth),
    x1: adjustXForRoom(rect.x1, dRoom, roomWidth),
    y0: rect.y0,
    y1: rect.y1
  }
}

function adjustRectForScale(
  rect: { x0: number, y0: number, x1: number, y1: number },
  scale: number
): { x0: number, y0: number, x1: number, y1: number } {
  let x = (rect.x0 + rect.x1) * 0.5
  let w = (rect.x1 - rect.x0) * scale
  let h = (rect.y1 - rect.y0) * scale
  return {
    x0: x - w * 0.5,
    x1: x + w * 0.5,
    y0: rect.y0,
    y1: rect.y0 + h
  }
}

function shouldDrawCharacter(
  character: { x: number, width: number },
  dRoom: number,
  roomWidth: number
): boolean {
  let x = adjustXForRoom(character.x, dRoom, roomWidth)
  return x > - character.width && x < roomWidth + character.width
}

function generateCharacterRect(
  character: { x: number, y: number, width: number, height: number }
): { x0: number, y0: number, x1: number, y1: number } {
  return {
    x0: character.x - character.width * 0.5,
    x1: character.x + character.width * 0.5,
    y0: character.y,
    y1: character.y + character.height
  }
}

function generateCharacterSprite(
  id: string,
  image: string,
  color: string,
  rect: { x0: number, y0: number, x1: number, y1: number },
  recolor: ?Recolor
): Sprite {
  let sprite: Sprite = {
    sourceId: id,
    color: color,
    image: image,
    x0: rect.x0,
    y0: rect.y0,
    x1: rect.x1,
    y1: rect.y1
  }
  if (recolor) sprite.imageRecolor = recolor

  return sprite
}

function getOrientedAnimationMap(character: Character): OrientedAnimationMap {
  if (character.kind === 'player') return PLAYER_IMAGES
  if (character.kind === 'crew') return PLAYER_IMAGES
  throw "Failed to get CharacterAnimation map"
}

let PERSON_COLORS: Array<RGB> = [
  {r:123,g:52,b:0}, // shaded hair
  {r:156,g:77,b:0}, // hair
  {r:255,g:197,b:145}, // shaded skin
  {r:255,g:212,b:165}  // bright skin
]

let ALT_PERSON_SCALES = [
  1, 0.95
]

let ALT_PERSON_COLORS: Array<Array<RGB>> = [
  PERSON_COLORS,
  [ // woman
    {r:123,g:52,b:0, a:0}, // shaded hair
    {r:156,g:77,b:0}, // hair
    {r:123,g:52,b:0}, // shaded skin
    {r:255,g:212,b:165}  // bright skin
  ]
]

let BODY_COLORS: Array<RGB> = [
  {r:99,g:181,b:26}, // darkest
  {r:124,g:199,b:38}, // medium
  {r:152,g:220,b:56} // lightest
]

let ALTERNATE_BODY_COLORS: {[type: CrewEnumType]: Array<RGB>} = {
  [CrewEnum.SEC]: [
    {r:179,g:20,b:38}, // darkest
    {r:207,g:18,b:45}, // medium
    {r:240,g:19,b:52} // lightest
  ],
  [CrewEnum.ENG]: [
    {r:186,g:179,b:0},
    {r:205,g:199,b:0},
    {r:228,g:220,b:0}
  ],
  // [CrewEnum.SCI]: [
  //   {r:52,g:88,b:183},
  //   {r:62,g:104,b:216},
  //   {r:73,g:133,b:229}
  // ]
}

function generateRecolors(oldRGBs: Array<RGB>, newRGBs: Array<RGB>): Recolor {
  return {
    oldRGBs: oldRGBs,
    newRGBs: newRGBs,
    hash: '' + stringToHash(
      oldRGBs.map((rgb) => Object.values(rgb)).join('') +
      newRGBs.map((rgb) => Object.values(rgb)).join('')
    )
  }
}

function combineRecolors(recolor1: Recolor, recolor2: Recolor): Recolor {
  return {
    oldRGBs: Array.from(Utils.combine(recolor1.oldRGBs, recolor2.oldRGBs)),
    newRGBs: Array.from(Utils.combine(recolor1.newRGBs, recolor2.newRGBs)),
    hash: recolor1.hash + recolor2.hash
  }
}

function computeImageScale(character: Character): number {
  return ALT_PERSON_SCALES[stringToHash(character.id) % ALT_PERSON_SCALES.length]
}

function computeImageRecolor(character: Character): ?Recolor {
  let recolors: Array<Recolor> = [];

  if (character.kind === 'crew') {
    let crew: CrewMember = character;
    recolors.push(
      generateRecolors(BODY_COLORS, ALTERNATE_BODY_COLORS[crew.type]))
  }

  recolors.push(
    generateRecolors(PERSON_COLORS, ALT_PERSON_COLORS[stringToHash(character.id) % ALT_PERSON_COLORS.length]))

  if (recolors.length === 0)
    return undefined

  return recolors.reduce(
    (prev, curr) => {
      if (prev === undefined) return curr
      return combineRecolors(prev, curr)
    })
}

function getCharacterColor(character: Character): string {
  if (character.kind === 'player') return 'rgb(154, 205, 50)'
  if (character.kind === 'crew') {
    let crew: CrewMember = character;
    if (crew.type === CrewEnum.ENG) return 'rgb(223, 208, 0)'
    // if (crew.type === CrewEnum.SCI) return 'rgb(49, 61, 172)'
    if (crew.type === CrewEnum.SEC) return 'rgb(223, 0, 0)'
    throw "Unknown crew type"
  }
  throw "Failed to get CharacterAnimation map"
}

function adjustFloorHeight(sprite: Sprite, floorHeight: number): { y0?: number, y1?: number } {
  return { y0: sprite.y0 + floorHeight, y1: sprite.y1 + floorHeight }
}

function computeRoomColor(room: Room): string {
  if (room.type == RoomEnum.BRIDGE) return '#f8f8f8'
  if (room.type == RoomEnum.ENGINE) return '#fee'
  if (room.type == RoomEnum.MEDBAY) return '#eef'
  if (room.type == RoomEnum.STORE) return '#eff'
  throw "Unknown room"
}

function computeFloorColor(room: Room): string {
  if (room.type == RoomEnum.BRIDGE) return '#eee'
  if (room.type == RoomEnum.ENGINE) return '#eee'
  if (room.type == RoomEnum.MEDBAY) return '#eee'
  if (room.type == RoomEnum.STORE) return '#eee'
  throw "Unknown room"
}

let WALK_SPEED = 2;
let WALK_ACCEL = 15;

let PLAYER_SPEED = 8;
let PLAYER_ACCEL = 30;
let PLAYER_JUMP_SPEED = 7;
let PLAYER_THROW_XSPEED = 4;
let PLAYER_THROW_YSPEED = 3;
let GRAVITY_ACCEL = 40;

function thinkPlayerLocomotion(
  keysDown: KeysDown,
  canJump: boolean
): Set<Action> {
  let actions: Set<Action> = new Set()

  if (keysDown.a) actions.add(ActionEnum.LEFT)
  if (keysDown.d) actions.add(ActionEnum.RIGHT)
  if (keysDown.w) actions.add(ActionEnum.UP)
  if (canJump && keysDown.w) actions.add(ActionEnum.JUMP)

  return actions
}

function isGrounded(character: {y: number, vy: number}): boolean {
  return character.y <= 0.001 && character.vy <= 0.001
}

function canJump(character: {y: number, vy: number}): boolean {
  return isGrounded(character)
}

function horizontalCharacterPhysics(
  character: { vx: number }, actions: Set<Action>, isGrounded: boolean
): { ax: number, vx?: number } {
  let isSlow = actions.has(ActionEnum.SLOW_LEFT) || actions.has(ActionEnum.SLOW_RIGHT)
  let isFast = actions.has(ActionEnum.LEFT) || actions.has(ActionEnum.RIGHT)

  if (isSlow && isFast) throw "Can't be fast and slow at same time..."

  let SPEED = isSlow ? WALK_SPEED : PLAYER_SPEED
  let ACCEL = isSlow ? WALK_ACCEL : PLAYER_ACCEL

  let dplayer = {}
  dplayer.ax = 0

  let left  = actions.has(ActionEnum.LEFT) || actions.has(ActionEnum.SLOW_LEFT)
  let right = actions.has(ActionEnum.RIGHT) || actions.has(ActionEnum.SLOW_RIGHT)

  let maxVelocity = Math.abs(character.vx) > SPEED
  let movingRight = character.vx >   0
  let movingLeft  = character.vx < - 0
  let maxRight = movingRight && maxVelocity
  let maxLeft  = movingLeft  && maxVelocity

  if (left && !right && !maxLeft ) dplayer.ax = - ACCEL // move left
  if (right && !left && !maxRight) dplayer.ax =   ACCEL // move right

  if ((left === right) && isGrounded) { // skid to a stop
    if (movingRight) dplayer.ax = - ACCEL
    if (movingLeft)  dplayer.ax =   ACCEL
  }

  if (isGrounded && maxVelocity) { // terminal velocity on ground
    if (movingRight) dplayer.vx =   SPEED
    if (movingLeft)  dplayer.vx = - SPEED
  }

  return dplayer
}

function verticalCharacterPhysics(isGrounded: boolean, actions: Set<Action>): { ay: number, vy?: number } {
  let dplayer = {}
  dplayer.ay = 0

  if (actions.has(ActionEnum.JUMP)) dplayer.vy = PLAYER_JUMP_SPEED
  if (!isGrounded) dplayer.ay = - GRAVITY_ACCEL

  return dplayer
}

function performAccel(character: {vx: number, vy: number, ax: number, ay: number}, dt: number)
: {vx?: number, vy?: number} {
  let dvx = character.ax * dt
  let dvy = character.ay * dt
  let vx = character.vx + dvx
  let vy = character.vy + dvy

  if (Math.abs(vx) < Math.abs(dvx)) vx = 0
  if (Math.abs(vy) < Math.abs(dvy)) vy = 0

  return { vx: vx, vy: vy }
}

function performVelocity(character: {x: number, y: number, vx: number, vy: number}, dt: number)
: {x?: number, y?: number} {
  return {
    x: character.x + character.vx * dt,
    y: character.y + character.vy * dt
  }
}

function adjustRoom(character: {x: number, y: number, roomIndex: number}): { x?: number, roomIndex?: number } {
  if (character.x < 0)
    return { x: character.x + ROOM_WIDTH, roomIndex: character.roomIndex - 1 }

  if (character.x > ROOM_WIDTH)
    return { x: character.x - ROOM_WIDTH, roomIndex: character.roomIndex + 1 }

  return {}
}

function clampRoom(character: {roomIndex: number}, numRooms: number): {roomIndex?: number} {
  let modRoom = character.roomIndex % numRooms
  return {
    roomIndex: modRoom >= 0 ? modRoom : modRoom + numRooms
  }
}

function clampFloor(character: {y: number, vy: number}): {y?: number, vy?: number} {
  if (character.y < 0.001 && character.vy < 0)
    return { y: 0, vy: 0 }

  return {}
}

function computeRoomDistance(srcRoom: number, destRoom: number, numRooms: number): number {
  let dRoom = destRoom - srcRoom
  while (dRoom < - numRooms * 0.5) dRoom += numRooms
  while (dRoom > numRooms * 0.5) dRoom -= numRooms
  return dRoom
}

function rectsOverlap(
  rect1: {x: number, y: number, width: number, height: number},
  rect2: {x: number, y: number, width: number, height: number}
): ?{ dx: number, dy: number } {
  let dx = rect2.x - rect1.x
  let dy = rect2.y - rect1.y

  let maxDx = rect1.width * 0.5 + rect2.width * 0.5
  let maxDy = rect1.height * 0.5 + rect2.height * 0.5

  if (Math.abs(dx) > maxDx || Math.abs(dy) > maxDy) return

  return { dx: dx, dy: dy }
}

function carryPhysics(
  carrier: {x: number, y: number, vx: number, vy: number, roomIndex: number},
  carried: {x: number, y: number, vx: number, vy: number, roomIndex: number},
  direction: Direction
): { x: number, y: number, vx: number, vy: number, roomIndex: number } {
  let x = carrier.x
  let y = carrier.y + PLAYER_HEIGHT * 0.2

  if (direction === DirectionEnum.LEFT) x -= PLAYER_WIDTH * 0.5
  else x += PLAYER_WIDTH * 0.5

  return { x: x, y: y, vx: carrier.vx, vy: carrier.vy, roomIndex: carrier.roomIndex }
}

function throwPhysics(
  carrier: { vx: number, vy: number },
  direction: Direction,
  actions: Set<Action>
): { vx: number, vy: number } {
  let vx = carrier.vx
  let vy = carrier.vy + PLAYER_THROW_YSPEED

  if (actions.has(ActionEnum.LEFT)) vx -= PLAYER_THROW_XSPEED
  if (actions.has(ActionEnum.RIGHT)) vx += PLAYER_THROW_XSPEED
  if (actions.has(ActionEnum.UP)) vy += PLAYER_THROW_XSPEED * 0.5

  if (!actions.a && !actions.d && !actions.w) {
    if (direction === DirectionEnum.LEFT)  vx -= PLAYER_THROW_XSPEED * 0.5
    if (direction === DirectionEnum.RIGHT) vx += PLAYER_THROW_XSPEED * 0.5
  }

  return { vx: vx, vy: vy }
}

function isButtonPressed(button: ButtonComponent): boolean {
  return button.time < BUTTON_COOLOFF && button.time > 0
}

function isButtonPressable(button: ButtonComponent): boolean {
  return !isButtonPressed(button)
}

function isSpawnerActive(spawner: SpawnerComponent): boolean {
  return spawner.time < TELEPORT_COOLOFF && spawner.time > 0
}

function canInteract(
  player: {x: number, y: number, width: number, height: number, roomIndex: number},
  playerDirection: Direction,
  object: {x: number, y: number, width: number, height: number, roomIndex: number}
): boolean {
  let overlap = rectsOverlap(player, object)
  if (!overlap) return false

  let dx = overlap.dx
  let dy = overlap.dy

  if (playerDirection === DirectionEnum.LEFT)
    return dx < 0.2

  if (playerDirection === DirectionEnum.RIGHT)
    return dx > - 0.2

  return false
}

function canPickup(
  character: Character,
  playerDirection: Direction,
  playerGrounded: boolean,
  crewMember: CrewMember,
  crewGrounded: boolean
): boolean {
  if (!playerGrounded || !crewGrounded)
    return false

  if (character.roomIndex !== crewMember.roomIndex)
    return false

  return canInteract(character, playerDirection, crewMember)
}

type KeysDown = {[key: string]: boolean}
type KeysPressed = Set<string>

let KEYS_DOWN_MAP = {
  '37': 'a',
  '38': 'w',
  '39': 'd',
  '40': 's'
}
let KEYS_PRESSED_MAP = {
  '189': '-',
  '187': '=',
  '32': ' ',
  '13': 'x'
}
function getChar(e: $.Event, keysMap: {[keyCode: string]: string}) {
  if (e.keyCode >= 48 && e.keyCode <= 90)
    return String.fromCharCode(e.keyCode).toLowerCase();

  if (e.keyCode in keysMap)
    return keysMap[e.keyCode];

  return null;
}

function bindInputs (keysDown: KeysDown, keysPressed: KeysPressed) {
  $(document).keydown(function (e) {
    let key = getChar(e, KEYS_DOWN_MAP);
    if (key) keysDown[key] = true;
  });
  $(document).keyup(function (e) {
    let key = getChar(e, KEYS_DOWN_MAP);
    if (key) keysDown[key] = false;
  });
  $(document).keypress(function (e) {
    let key = getChar(e, KEYS_PRESSED_MAP);
    if (key && !keysPressed.has(key)) keysPressed.add(key)
  });
}

function runLoop(step: (time: number) => number) {
  let lastTime = Date.now();
  let frameCount = 0;
  let frameStart = Date.now();

  let dt = 0.01;

  function loop () {
    // calculate FPS
    frameCount += 1
    if (Date.now() > frameStart + 1000) {
      console.log(frameCount + " fps")
      frameCount = 0
      frameStart = Date.now()
    }

    dt = step(dt)
    setTimeout(loop, 1000 * dt)
  };

  loop()
}

function * allCharacters(gameState: GameState): Iterator<Character> {
  for (let crewMember of gameState.crew) {
    yield crewMember
  }

  yield gameState.player
}

// function * charactersWithComponent(gameState: GameState, kind: string): Iterable<[Character, Component]> {
//   for (let character of allCharacters(gameState)) {
//     if (kind in character.components) {
//       let component = character.components[kind]
//       if (kind != component.kind)
//         throw "Wat, component has wrong type: " + component.kind + " != " + kind
//
//       yield [character, character.components[kind]]
//     }
//   }
// }

function * characterCarriers(gameState: GameState): Iterable<[Character, CarrierComponent]> {
  let character: Player = gameState.player
  let carrier: CarrierComponent = character.carrier

  yield [character, carrier]
}

function * inDepthOrder <O> (entityMap: Utils.AutoMap<O>, depths: Utils.DepthArray)
: Iterable<O> {
  for (let id of depths.inOrder()) {
    if (entityMap.hasKey(id)) {
      yield entityMap.get(id)
    }
  }
}

$(document).ready(() => {
  let keysDown: KeysDown = {}
  let keysPressed: KeysPressed = new Set()
  bindInputs(keysDown, keysPressed)

  let screenEl = $('#world-canvas')[0]
  let screen: Canvas.Buffer = Canvas.setupBuffer(screenEl, CANVAS_WIDTH, CANVAS_HEIGHT)
  let buffer: Canvas.Buffer = Canvas.createBuffer(CANVAS_WIDTH, CANVAS_HEIGHT)

  let gameState = initialGameState()

  let crewMap: Utils.AutoMap<CrewMember> = new Utils.AutoMap(o => o.id, gameState.crew)

  let characterMap: Utils.AutoMap<Character> = new Utils.AutoMap(o => o.id)
  characterMap.add(gameState.player)
  characterMap.observe(gameState.crew)

  let furnitureMap: Utils.AutoMap<Furniture> = new Utils.AutoMap(o => o.id)
  furnitureMap.observe(gameState.furnitures)

  // This gives us automatic randomized depths (i.e. z-distance) for each entity
  let depths: Utils.DepthArray = new Utils.DepthArray()
  depths.add(gameState.player.id, 0)
  depths.observe(gameState.crew, (o) => o.id)

  // characters who can carry other characters
  let carrierArray: Utils.AutoArray<Character, CarrierComponent> = new Utils.AutoArray(
    o => o.id,
    o => Utils.Get(o, 'carrier'));
  carrierArray.watch(gameState.player)
  carrierArray.observe(gameState.crew)

  // engineers
  let engineerArray: Utils.AutoArray<CrewMember, bool> = new Utils.AutoArray(
    o => o.id,
    o => o.type === CrewEnum.ENG)
  engineerArray.observe(gameState.crew)

  // security
  let securityArray: Utils.AutoArray<CrewMember, bool> = new Utils.AutoArray(
    o => o.id,
    o => o.type === CrewEnum.SEC)
  securityArray.observe(gameState.crew)

  // furnitures that can be interacted with
  let interactorArray: Utils.AutoArray<Character, InteractorComponent> = new Utils.AutoArray(
    o => o.id,
    o => Utils.Get(o, 'interactor'))
  interactorArray.watch(gameState.player)
  interactorArray.observe(gameState.crew)

  let buttonArray: Utils.AutoArray<Furniture, ButtonComponent> = new Utils.AutoArray(
    o => o.id,
    o => o.button)
  buttonArray.observe(gameState.furnitures)

  let spawnerArray: Utils.AutoArray<Furniture, SpawnerComponent> = new Utils.AutoArray(
    o => o.id,
    o => o.spawner)
  spawnerArray.observe(gameState.furnitures)

  let time = 0
  let step = (dt) => {
    time += dt

    let rooms = gameState.rooms

    for (let character of allCharacters(gameState)) {
      let actor: ActorComponent = character.actor
      actor.actions.clear()
    }

    { // player actions
      let player = gameState.player
      let actor: ActorComponent = player.actor

      // actions: wasd
      actor.actions = thinkPlayerLocomotion(keysDown, canJump(player))

      // actions: carry or throw
      if (keysPressed.has(' ')) {
        actor.actions.add(ActionEnum.ACT)
        keysPressed.delete(' ')
      }
    }

    // engineer actions
    for (let character of gameState.crew) {
      let ai: AIComponent = character.ai
      let actor: ActorComponent = character.actor

      ai.nextThink -= dt

      // not time to think yet
      if (ai.nextThink > 0) {
        for (let action of ai.actions) {
          actor.actions.add(action)
        }
      } else {
        let choice = Math.random()
        if (choice < 0.2) {
          ai.actions = [ActionEnum.SLOW_LEFT]
          ai.nextThink = Math.random() + 0.5
        } else if (choice < 0.4) {
          ai.actions = [ActionEnum.SLOW_RIGHT]
          ai.nextThink = Math.random() + 0.5
        } else {
          ai.actions = []
          ai.nextThink = Math.random() + 0.75
        }
      }
    }

    // figure out if character can pick up any crew members
    for (let [character, carrier] of carrierArray.all()) {
      let animation: CharacterAnimationComponent = character.animation
      let actor: ActorComponent                  = character.actor

      // skip if there's no carrying action
      if (!actor.actions.has(ActionEnum.ACT)) continue

      // shouldn't be already carrying something
      if (carrier.carrying) continue

      // shouldn't be in the air
      if (!isGrounded(character)) continue

      for (let crewMember of inDepthOrder(crewMap, depths)) {
        let pickup = canPickup(
          character, animation.direction, isGrounded(character),
          crewMember, isGrounded(crewMember))

        // pickup the crew member!
        if (pickup) {
          Object.assign(carrier, { carrying: crewMember.id })
          depths.update(crewMember.id, -0.05)
          actor.actions.delete(ActionEnum.ACT)
          break
        }
      }
    }

    // handle carrying & throwing
    for (let [character, carrier] of carrierArray.all()) {
      let animation: CharacterAnimationComponent = character.animation
      let actor: ActorComponent                  = character.actor

      // move carried object
      if (carrier.carrying) {
        let characterDir = animation.direction
        let carriedEntity = characterMap.get(carrier.carrying)
        Object.assign(carriedEntity, carryPhysics(character, carriedEntity, characterDir))
      }

      // throw object
      if (carrier.carrying && actor.actions.has(ActionEnum.ACT)) {
        let characterDir = animation.direction
        let otherCharacter = characterMap.get(carrier.carrying)
        Object.assign(otherCharacter, throwPhysics(character, characterDir, actor.actions))
        Object.assign(carrier, { carrying: undefined })
        depths.update(otherCharacter.id)
        actor.actions.delete(ActionEnum.ACT)
      }
    }

    // figure out if there are buttons to be pressed
    for (let [character, interactor] of interactorArray.all()) {
      let animation: CharacterAnimationComponent = character.animation
      let actor: ActorComponent                  = character.actor
      let characterDir = animation.direction

      // skip if there's no carrying action
      if (!actor.actions.has(ActionEnum.ACT)) continue

      // loop through buttons
      for (let [furniture, button] of buttonArray.all()) {
        console.log(button)
        if (isButtonPressable(button) && canInteract(character, characterDir, {y: FURNITURE_HEIGHT, ...furniture})) {
          button.time = 0
          let buttonEvent = button.eventToFire
          let buttonAffects = button.notify

          // it's a spawn event!
          if (Utils.hasValue(SpawnEventEnum, buttonEvent)) {
            // notify other furniture
            let affectedFurniture = furnitureMap.get(buttonAffects)
            let spawner: ?SpawnerComponent = affectedFurniture.spawner
            if (spawner == null) throw 'Wat, bad spawner'

            spawner.events.push(buttonEvent)
            spawner.time = 0
            actor.actions.delete(ActionEnum.ACT)
            break
          }
        }
      }
    }

    // spawn characters
    for (let [furniture, spawner] of spawnerArray.all()) {
      while (spawner.events.length > 0) {
        let event = spawner.events.pop()
        let obj = spawner.spawn(event)
        if (obj.kind === 'crew') gameState.crew.push(obj)
      }
    }

    // increment furniture times
    for (let [furniture, button] of buttonArray.all()) {
      if (button.time >= 0)
        button.time += dt
    }

    for (let [furniture, spawner] of spawnerArray.all()) {
      if (spawner.time >= 0)
        spawner.time += dt
    }

    // handle character physics
    for (let character of allCharacters(gameState)) {
      let actor: ActorComponent = character.actor

      Object.assign(character, horizontalCharacterPhysics(character, actor.actions, isGrounded(character)))
      Object.assign(character, verticalCharacterPhysics(isGrounded(character), actor.actions))
    }

    // generate list of carried characters
    let carried: Set<string> = new Set()
    for (let [character, carrier] of carrierArray.all()) {
      if (carrier.carrying) {
        carried.add(carrier.carrying)
      }
    }
    let isCarried = (id) => carried.has(id)

    // handle animation
    for (let character of allCharacters(gameState)) {
      let animation: CharacterAnimationComponent = character.animation

      Object.assign(
        animation,
        characterAnimation(
          animation,
          character,
          isGrounded(character),
          isCarried(character.id),
          dt
        )
      )
    }

    // handle world physics
    for (let character of allCharacters(gameState)) {
      Object.assign(character, performAccel(character, DT))
      Object.assign(character, performVelocity(character, DT))
      Object.assign(character, adjustRoom(character))
      Object.assign(character, clampRoom(character, rooms.length))
      Object.assign(character, clampFloor(character))
    }

    // active area
    let activeRoom = gameState.player.roomIndex

    // generate sprites
    let sprites: {[id: string]: Array<Sprite>} = {}
    for (let character: Character of allCharacters(gameState)) {
      let animation: CharacterAnimationComponent = character.animation

      let dRoom = computeRoomDistance(
        character.roomIndex,
        activeRoom,
        rooms.length)

      if (!shouldDrawCharacter(character, dRoom, ROOM_WIDTH))
        continue

      let image = computeAnimationImage(animation, getOrientedAnimationMap(character))
      let color = getCharacterColor(character)
      let recolor: ?Recolor = computeImageRecolor(character)
      let scale = computeImageScale(character)

      let characterRect = generateCharacterRect(character)
      characterRect = adjustRectForRoom(characterRect, dRoom, ROOM_WIDTH)
      characterRect = adjustRectForScale(characterRect, scale)

      let shadowOpacity = generateShadowOpacity(character)
      let shadowRect = adjustRectForRoom(
        generateShadowRect(character), dRoom, ROOM_WIDTH)

      sprites[character.id] = [
        generateShadowSprite(character.id, shadowOpacity, shadowRect),
        generateCharacterSprite(character.id, image, color, characterRect, recolor)
      ]
    }

    // adjust the depth of the sprites
    for (let id of Object.keys(sprites)) {
      for (let sprite of sprites[id] || []) {
        let height = FLOOR_HEIGHT + depths.depth(id) * 0.14
        Object.assign(sprite, adjustFloorHeight(sprite, height))
      }
    }

    // draw the background
    Canvas.drawBackground(buffer,
      computeRoomColor(gameState.rooms[activeRoom]))

    // draw the floor
    Canvas.drawRect(buffer, '#ccc',
      transformRectToPixels({ x0: 0, y0: 0, x1: ROOM_WIDTH, y1: WALL_START_HEIGHT + 0.05 }))
    Canvas.drawRect(buffer, computeFloorColor(gameState.rooms[activeRoom]),
      transformRectToPixels({ x0: 0, y0: 0, x1: ROOM_WIDTH, y1: WALL_START_HEIGHT }))

    let drawFurniture = (furniture: Furniture) => {
      if (furniture.roomIndex != activeRoom) return
      let image = generateFurnitureImage(furniture, time)
      let rect = transformRectToPixels(generateFurnitureRect(furniture))
      Canvas.drawImage(buffer, image, rect, {})
    }

    // draw the background furnitures
    for (let furniture of gameState.furnitures) {
      if (furniture.foreground !== true)
        drawFurniture(furniture)
    }

    // draw the sprites in reverse depth order
    for (let id of depths.inReverseOrder()) {
      for (let sprite of sprites[id] || []) {
        if (sprite.image === undefined)
          Canvas.drawRect(buffer, sprite.color, transformRectToPixels(sprite))
        else
          Canvas.drawImage(buffer, sprite.image, transformRectToPixels(sprite), sprite)
      }
    }

    // draw the foreground furnitures
    for (let furniture of gameState.furnitures) {
      if (furniture.foreground === true)
        drawFurniture(furniture)
    }

    Canvas.drawBuffer(screen, buffer)
    return DT
  }

  runLoop(step)
})
