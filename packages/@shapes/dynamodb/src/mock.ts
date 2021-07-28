import { array, map, set, any, binary, bool, Enum, integer, number, optional, string, timestamp, Struct, Value } from '@shapes/core';

import '.';

// tslint:disable: member-access
export class Nested extends Struct('Nested', {
  /**
   * This is a nested string.
   */
  a: string
}) {}

export type Direction = Value.Of<typeof Direction>;
export const Direction = Enum('Direction', {
  Up: 'UP',
  Down: 'DOWN',
  Left: 'LEFT',
  Right: 'RIGHT'
} as const);

export class MyType extends Struct('MyType', {
  /**
   * Field documentation.
   */
  id: string,

  count: optional(number),
  integer,
  bool,
  ts: timestamp,

  nested: Nested,
  array: array(string),
  complexArray: array(Nested),
  stringSet: set(string),
  numberSet: set(number),
  map: map(string),
  complexMap: map(Nested),

  binaryField: binary,
  binarySet: set(binary),
  anyField: any,
  direction: Direction
}) {}
