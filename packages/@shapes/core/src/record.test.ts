import 'jest';
import { any, AnyShape, binary, NothingShape, number, NumberShape, optional, string, StringShape, Type, union, UnionShape } from '.';
import { array, ArrayShape, map, MapShape, set, SetShape } from '.';

// tslint:disable: member-access

class Nested extends Type('Nested', {
  a: string
}) {}

class MyType extends Type('MyType', {
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

it('should have Kind, "recordShape"', () => {
  expect(MyType.Kind).toStrictEqual('recordShape');
});

it('should parse members', () => {
  expect(MyType.Members.anyType).toStrictEqual(new AnyShape());
  expect(MyType.Members.id).toStrictEqual(new StringShape());
  expect(MyType.Members.count).toStrictEqual(new UnionShape([new NumberShape(), new NothingShape()]));
  expect(MyType.Members.nested).toStrictEqual(Nested);
  expect(MyType.Members.array).toStrictEqual(new ArrayShape(new StringShape()));
  expect(MyType.Members.complexArray).toStrictEqual(new ArrayShape(Nested));
  expect(MyType.Members.set).toStrictEqual(new SetShape(new StringShape()));
  expect(MyType.Members.complexSet).toStrictEqual(new SetShape(Nested),);
  expect(MyType.Members.map).toStrictEqual(new MapShape(new StringShape()));
  expect(MyType.Members.complexMap).toStrictEqual(new MapShape(Nested));
  expect(MyType.Members.union).toStrictEqual(new UnionShape([new StringShape(), new NumberShape()]));
});

class Empty extends Type('Empty', {}) {}

it('should support no members', () => {
  expect(Empty.Members).toStrictEqual({});
});
