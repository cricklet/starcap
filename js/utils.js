
// borrowed from: http://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
export function mapObject(obj, mapFunc){
    return Object.keys(obj).reduce(function(newObj, value) {
        newObj[value] = mapFunc(obj[value]);
        return newObj;
    }, {});
}
