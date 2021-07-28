import { Shape } from './shape';

export type Kind<S extends Shape = Shape> = S['Kind'];

export const Kinds: Kind<Shape>[] = [
  'anyShape',
  'arrayShape',
  'binaryShape',
  'boolShape',
  'enumShape',
  'functionShape',
  'literalShape',
  'mapShape',
  'neverShape',
  'nothingShape',
  'numberShape',
  'setShape',
  'stringShape',
  'structShape',
  'timestampShape',
  'unionShape'
]