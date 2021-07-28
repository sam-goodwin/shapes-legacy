import { CollectionShapes } from "./collection";
import { LiteralShape } from "./literal";
import { PrimitiveShapes } from "./primitive";
import { Shape } from "./shape";
import { Fields, StructShape } from "./struct";
import { UnionShape } from "./union";

export type Shapes = 
  | PrimitiveShapes
  | CollectionShapes<Shape>
  | StructShape<Fields>
  | UnionShape<Shape[]>
  | LiteralShape
  ;