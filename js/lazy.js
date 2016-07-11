/* @flow */

type Unevaled<O> = { kind: 'unevaled', eval: () => O }
type Evaled<O> = { kind: 'evaled', value: O }
export type Thunk<O> = Unevaled<O> | Evaled<O>

export function thunk<O>(fo: () => O): Thunk<O> {
  return { kind: 'unevaled', eval: fo }
}
export function partial<O>(fo: () => O): Thunk<O> {
  return { kind: 'unevaled', eval: fo }
}
export function value<O>(o: O): Thunk<O> {
  return { kind: 'evaled', value: o }
}
export function evaluate<O>(thunk: Thunk<O>): O {
  if (thunk.kind === 'unevaled') return thunk.eval()
  else return thunk.value
}
