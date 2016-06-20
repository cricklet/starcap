/* @flow */

import { ArrayObserver } from 'observe-js'

// borrowed from: http://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
export function mapObject(obj: Object, mapFunc: any): Object {
  return Object.keys(obj).reduce(function(newObj, value) {
      newObj[value] = mapFunc(obj[value]);
      return newObj;
  }, {});
}

export function observeArray <O> (
  objects: Array<O>,
  onAdd: (obj: O) => void,
  onRemove: (obj: O) => void
): void {
  new ArrayObserver(objects).open((splices) => {
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
  observe(objects: Array<O>) {
    for (let obj of objects) {
      this._add(obj)
    }
    observeArray(objects, this._add, this._remove)
  }
  _add(obj: O) {
    this.map[this.hash(obj)] = obj
  }
  _remove(obj: O) {
    delete this.map[this.hash(obj)]
  }
  get(id: string) {
    return this.map[id]
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
