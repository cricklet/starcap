/* @flow */

import { ArrayObserver, ObjectObserver } from 'observe-js'

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

export function observeArray <O> (
  objects: Array<O>,
  onAdd: (obj: O) => void,
  onRemove: (obj: O) => void
): void {
  let observer = new ArrayObserver(objects)
  observer.open((splices) => {
    for (let splice of splices) {
      if (splice._removed) {
        for (let val of splice._removed) {
          onRemove(val)
        }
      }
      if (splice.addedCount) {
        for (let i = 0; i < splice.addedCount; i ++) {
          onAdd(objects[i + splice.index])
        }
      }
    }
  })
  return observer
}

export function observeObject <O> (
  object: O,
  onKeyAdded: (obj: O, key: string) => void,
  onKeyRemoved: (obj: O, key: string) => void,
  onKeyChanged: (obj: O, key: string) => void
): void {
  let observer = new ObjectObserver(object)
  observer.open(function(added, removed, changed, getOldValueFn) {
    for (let key of Object.keys(added)) onKeyAdded(object, key)
    for (let key of Object.keys(removed)) onKeyRemoved(object, key)
    for (let key of Object.keys(changed)) onKeyChanged(object, key)
  })
  return observer
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
    observeArray(objects, this.add, this._remove)
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

export class AutoArray<O> {
  /*:: objects: Set<O>; */
  /*:: observers: {[key: string]: ObjectObserver}; */
  /*:: checker: (o: O) => boolean; */
  /*:: hash: (o: O) => string; */

  constructor(hash: (o: O) => string, checker: (o: O) => boolean) {
    this.objects = new Set()
    this.observers = {}
    this.checker = checker
    this.hash = hash
  }
  observe<OO>(objects: Array<OO & O>): void {
    for (let obj of objects) {
      this.watch(obj)
    }
    observeArray(
      objects,
      (o) => this.watch(o),
      (o) => this.unwatch(o))
  }
  watch(object: O) {
    let observer = observeObject(
      object,
      (o, addedKey) => this._update(o),
      (o, removedKey) => this._update(o),
      (o, changedKey) => {})

    if (this.hash(object) in this.observers)
      throw "Wat, should not be observing yet"

    this.observers[this.hash(object)] = observer
    this._update(object)
  }
  unwatch(object: O) {
    if (!this.observers[this.hash(object)])
      throw "Wat, we should be observing"

    delete this.observers[this.hash(object)]
    if (this.objects.has[object])
      this.objects.delete(object)
  }
  _update(object: O) {
    if (this.checker(object)) {
      if (this.objects.has(object)) return
      this.objects.add(object)
    } else {
      if (!this.objects.has(object)) return
      this.objects.delete(object)
    }
  }
  * all (): Iterable<O> {
    for (let str of this.objects) {
      yield str
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
