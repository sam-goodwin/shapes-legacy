import { ArrayShape, MapShape, SetShape } from './collection';
import { BinaryShape, boolean, BoolShape, IntegerShape, nothing, NothingShape, number, NumberShape, PrimitiveShapes, string, StringShape, timestamp, TimestampShape } from './primitive';
import { Shape } from './shape';

declare module "./shape" {
  namespace Shape {
    function infer<T>(value: T): Infer<T>;
  }
}

export type Infer<T> =
  T extends undefined | null ? NothingShape :
  T extends boolean ? BoolShape :
  T extends Buffer ? BinaryShape :
  T extends Date ? TimestampShape :
  T extends number ? NumberShape :
  T extends string ? StringShape :
  T extends bigint ? IntegerShape :
  T extends (infer I)[] ? ArrayShape<Infer<I>> :
  T extends Map<string, infer V> ? MapShape<Infer<V>> :
  T extends Set<infer I> ? SetShape<Infer<I>> :
  T extends object ? {
    Members: {
      [m in keyof T]: Infer<T[m]>;
    }
  } & Shape :
  never
  ;

export function inferShape<T>(value: T): Infer<T> {
  if (value === undefined || value === null) {
    return nothing as Infer<T>;
  } else if (typeof value === 'string') {
    return string as Infer<T>;
  } else if (typeof value === 'boolean') {
    return boolean as Infer<T>;
  } else if (typeof value === 'number') {
    return number as Infer<T>;
  } else if (typeof value === 'undefined') {
    return nothing as Infer<T>;
  } else if (value instanceof Date) {
    return timestamp as Infer<T>;
  }
  throw new Error(`cannot infer shape for: ${value}`);
}

Shape.infer = inferShape;
