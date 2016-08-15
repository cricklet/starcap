/* @flow */

import { unobserveArray, observeArray, observeObject, Observer } from './observe'

// borrowed from: http://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
export function mapObject(obj: Object, mapFunc: any): Object {
  return Object.keys(obj).reduce(function(newObj, value) {
      newObj[value] = mapFunc(obj[value]);
      return newObj;
  }, {});
}

export function valuesArray <V> (obj: {[key: string]: V}): Array<V> {
  return Object.keys(obj).map(function(key) {return obj[key]})
}

export function valuesSet <V> (obj: {[key: string]: V}): Set<V> {
  var set = new Set()
  for (let k in obj) {
    set.add(obj[k])
  }
  return set
}

export function hasValue <V> (obj: {[key: string]: V}, v: V): boolean {
  return valuesSet(obj).has(v)
}

export class AutoMap<O> {
  // I REALLY REALLY want to test this code... but I don't want to deal with
  // setting up a testing framework right now...

  /*:: map: {[key: string]: O}; */
  /*:: hash: (o: O) => string; */

  constructor(hash: (o: O) => string, objects?: Array<O>) {
    this.map = {}
    this.hash = hash
    if (objects) this.observe(objects)
  }
  observe<OO>(objects: Array<OO & O>): void {
    for (let obj of objects) {
      this.add(obj)
    }
    observeArray(objects,
      (o) => this.add(o),
      (o) => this._remove(o))
  }
  hasKey(key: string): boolean {
    return key in this.map
  }
  add(obj: O): void {
    this.map[this.hash(obj)] = obj
  }
  _remove(obj: O): void {
    delete this.map[this.hash(obj)]
  }
  get(id: string): O {
    return this.map[id]
  }
}

export class AutoArray<O, R> {
  /*:: observers: {[key: string]: Observer }; */
  /*:: objects: {[key: string]: O }; */
  /*:: results: {[key: string]: R }; */
  /*:: processor: (o: O) => ?R; */
  /*:: hash: (o: O) => string; */

  constructor(hash: (o: O) => string, processor: (o: O) => ?R) {
    this.observers = {}
    this.objects = {}
    this.results = {}
    this.processor = processor
    this.hash = hash
  }
  observe<OO>(observables: Array<OO & O>): void {
    for (let obj of observables) {
      this.watch(obj)
    }
    observeArray(
      observables,
      (o) => this.watch(o),
      (o) => this.unwatch(o))
  }
  watch(object: O) {
    let observer = observeObject(
      object,
      (o, addedKey) => this._update(o),
      (o, removedKey) => this._update(o),
      (o, changedKey) => {})

    let h = this.hash(object)

    if (h in this.observers)
      throw "Wat, should not be observing yet"

    this.observers[h] = observer
    this.objects[h] = object
    this._update(object)
  }
  unwatch(object: O) {
    let h = this.hash(object)

    if (!(h in this.observers))
      throw "Wat, we should be observing"

    unobserveArray(this.observers[h], object)

    delete this.observers[h]
    delete this.objects[h]
    if (h in this.results)
      delete this.results[h]
  }
  _update(object: O) {
    let result = this.processor(object)
    let h = this.hash(object)

    if (result) {
      if (h in this.results) return
      this.results[h] = result
    } else {
      if (h in this.results)
        delete this.results[h]
    }
  }
  * all (): Iterable<[O, R]> {
    for (let h in this.results) {
      let object: O = this.objects[h]
      let result: R = this.results[h]
      yield [object, result]
    }
  }
  * objects (): Iterable<O> {
    for (let h in this.results) {
      let object: O = this.objects[h]
      yield object
    }
  }
}

export class DepthArray {
  /*:: depths: {[x: string]: number}; */
  /*:: ordered: Array<string>; */

  constructor() {
    this.depths = {}
    this.ordered = []
  }
  observe <X> (objects: Array<X>, conversion: (x:X) => string) {
    for (let obj of objects) {
      this.add(conversion(obj))
    }
    observeArray(
      objects,
      (x) => this.add(conversion(x)),
      (x) => this._remove(conversion(x)))
  }
  add(val: string, depth?: number) {
    if (depth === undefined) depth = Math.random()

    // quit if we're already tracking this object
    if (val in this.depths) return;

    let i = 0
    for (; i < this.ordered.length; i ++) {
      let otherVal = this.ordered[i]
      let otherDepth = this.depths[otherVal]

      if (depth < otherDepth)
        break
    }

    this.depths[val] = depth
    this.ordered.splice(i, 0, val)
  }
  update(val: string, depth?: number) {
    this._remove(val)
    this.add(val, depth)
  }
  _remove(val: string) {
    delete this.depths[val]
    for (let i = 0; i < this.ordered.length; i ++) {
      if (val === this.ordered[i]) {
        this.ordered.splice(i, 1)
        break
      }
    }
  }
  depth(val: string) {
    return this.depths[val]
  }
  * inOrder (): Iterable<string> {
    for (let str of this.ordered) {
      yield str
    }
  }
  * inReverseOrder (): Iterable<string> {
    for (let i = this.ordered.length - 1; i >= 0; i --) {
      yield this.ordered[i]
    }
  }
}

export function * zip<A,B>(as: Array<A>, bs: Array<B>): Iterable<[A,B]> {
  if (as.length != bs.length) throw "Wat, can't zip different length arrays"
  for (let i = 0; i < as.length; i ++) {
    yield [as[i], bs[i]]
  }
}

export function * combine<A,B>(as: Array<A>, bs: Array<B>): Iterable<A|B> {
  for (let a of as) yield a
  for (let b of bs) yield b
}

export function Get(o: {}, k: string) {
  // necessary for weird flow reasons
  if (k in o) return o[k]
  return undefined
}
