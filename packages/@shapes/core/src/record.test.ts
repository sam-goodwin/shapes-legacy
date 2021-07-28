import 'jest';
import { any, AnyShape, binary, NothingShape, number, NumberShape, optional, string, StringShape, Struct, union, UnionShape } from '.';
import { array, ArrayShape, map, MapShape, set, SetShape } from '.';

// tslint:disable: member-access

class Nested extends Struct('Nested', {
  a: string
}) {}

class MyType extends Struct('MyType', {
  anyType: any,
  binaryType: binary,
  id: string,
  count: optional(number),
  nested: Nested,
  array: array(string),
  complexArray: array(Nested),
  set: set(string),
  complexSet: set(Nested),
  map: map(string),
  complexMap: map(Nested),
  union: union(string, number)
}) {}

it('should have Kind, "structShape"', () => {
  expect(MyType.Kind).toStrictEqual('structShape');
});

it('should parse members', () => {
  expect(MyType.Fields.anyType).toStrictEqual(new AnyShape());
  expect(MyType.Fields.id).toStrictEqual(new StringShape());
  expect(MyType.Fields.count).toStrictEqual(new UnionShape([new NumberShape(), new NothingShape()]));
  expect(MyType.Fields.nested).toStrictEqual(Nested);
  expect(MyType.Fields.array).toStrictEqual(new ArrayShape(new StringShape()));
  expect(MyType.Fields.complexArray).toStrictEqual(new ArrayShape(Nested));
  expect(MyType.Fields.set).toStrictEqual(new SetShape(new StringShape()));
  expect(MyType.Fields.complexSet).toStrictEqual(new SetShape(Nested),);
  expect(MyType.Fields.map).toStrictEqual(new MapShape(new StringShape()));
  expect(MyType.Fields.complexMap).toStrictEqual(new MapShape(Nested));
  expect(MyType.Fields.union).toStrictEqual(new UnionShape([new StringShape(), new NumberShape()]));
});

class Empty extends Struct('Empty', {}) {}

it('should support no members', () => {
  expect(Empty.Fields).toStrictEqual({});
});
