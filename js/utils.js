/* @flow */

// borrowed from: http://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
export function mapObject(obj: Object, mapFunc: any): Object {
    return Object.keys(obj).reduce(function(newObj, value) {
        newObj[value] = mapFunc(obj[value]);
        return newObj;
    }, {});
}

export class DepthArray<O> {
  depths: Array<number>;
  objects: Array<O>;

  constructor (objects?: Array<O>, depths?: Array<any>) {
    this.depths = depths || []
    this.objects = objects || []
  }
  push (object: O, depth?: number) {
    if (depth === undefined) depth = Math.random()
    for (let i = 0; i < this.size(); i ++) {
      if (depth < this.depths[i]) {
        this.depths.splice(i, 0, depth)
        this.objects.splice(i, 0, object)
        break
      }
    }
  }
  size () {
    return this.depths.length
  }
  objects () {
    return this.objects
  }
}
