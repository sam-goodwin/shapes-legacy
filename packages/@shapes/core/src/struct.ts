import { Metadata } from './metadata';
import { Pointer } from './pointer';
import { Shape } from './shape';
import { RequiredKeys } from './util';
import { Value } from './value';

import { Compact, RowLacks } from 'typelevel-ts';

export type Fields = Readonly<{
  [field: string]: Shape;
}>;
export namespace Fields {
  /**
   * Computes a natural representation of the fields by applying `+?` to `optional` fields.
   */
  export type Natural<M extends Fields> = {
    /**
     * Write each field and their documentation to the structure.
     * Write them all as '?' for now.
     */
    [m in keyof M]+?: Pointer.Resolve<M[m]>;
  } & {
    /**
     * Remove '?' from required properties.
     */
    [m in RequiredKeys<M>]-?: Pointer.Resolve<M[m]>;
  };
}

/**
 * A StructShape is used to model complex types of named fields.
 *
 * E.g.
 * ```
 * class Nested extends Struct({
 *   count: integer
 * }) {}
 * Nested.Fields; // {count: IntegerShape}
 *
 * class MyClass extends Struct({
 *   key: string,
 *   nested: Nested
 * }) {}
 * MyClass.Fields; // {key: StringShape, nested: ClassShape<{count: IntegerShape}, Nested>}
 * ```
 *
 * @typeparam M Struct Fields (key-value pairs of shapes)
 * @typeparam I instance type of this Struct (the value type)
 */
export class StructShape<F extends Fields = Fields, FQN extends string | undefined = string | undefined> extends Shape {
  public readonly Kind: 'structShape' = 'structShape';

  /**
   * Globally unique identifier of this Struct type.
   */
  public readonly FQN: FQN;

  [key: string]: any;

  constructor(
    public readonly Fields: Readonly<F>,
    public readonly Metadata: Metadata,
    FQN?: FQN,
  ) {
    super();
    this.FQN = FQN!;
  }

  public getMetadata(): any[] {
    return Object.values(this.Metadata);
  }
}
export namespace StructShape {
  export type GetFields<T extends StructShape<any>> = T extends StructShape<infer M> ? M : never;
}

/**
 * Maps a Struct's fields to a structure that represents it at runtime.
 *
 * It supports adding `?` to optional fields and maintins developer documentation.
 *
 * E.g.
 * ```ts
 * class A extends Struct({
 *   /**
 *    * Inline documentation.
 *    *\/
 *   a: string
 * }) {}
 *
 * new A({
 *   a: 'a'; // <- the above "Inline documentation" docs are preserved, traced back to the source.
 * }).a; // <- same here
 * ```
 */
export type FieldValues<M extends Fields> = {
  /**
   * Write each field and their documentation to the structure.
   * Write them all as '?' for now.
   */
  [m in keyof M]+?: Value.Of<Pointer.Resolve<M[m]>>;
} & {
  /**
   * Remove '?' from required properties.
   */
  [m in RequiredKeys<M>]-?: Value.Of<Pointer.Resolve<M[m]>>;
};

export interface StructClass<M extends Fields = Fields, FQN extends string | undefined = string | undefined> extends StructShape<M, FQN> {
  /**
   * Constructor takes values for each field.
   */
  new (values: {
    // compact StructValue<T> by enumerating its keys
    // produces a cleaner interface instead of `{a: string} & {}`
    [m in keyof FieldValues<M>]: FieldValues<M>[m];
  }): {
    [m in keyof FieldValues<M>]: FieldValues<M>[m];
  };

  /**
   * Extend this Struct with new fields to create a new `StructType`.
   *
   * Example:
   * ```ts
   * class A extends Struct({
   *   a: string,
   *   b: string
   * }) {}
   *
   * class B extends A.Extend({
   *   c: string
   * }) {}
   * ```
   *
   * @param fields new Struct fields
   */
  Extend<M2 extends Fields>(fields: RowLacks<M2, keyof M>): Extend<M, undefined, M2>;
  Extend<FQN2 extends string, M2 extends Fields>(fqn: FQN2, fields: RowLacks<M2, keyof M>): Extend<M, FQN2, M2>;

  /**
   * Pick fields from a `Struct` to create a new `StructType`.
   *
   * Example:
   * ```ts
   * class A extends Struct({
   *   a: string,
   *   b: string
   * }) {}
   *
   * class B extends A.Pick(['b']) {}
   * B.fields.b;
   * B.fields.a; // <- compile-time error
   * ```
   *
   * @param fields array of fields to select
   */
  Pick<M2 extends (keyof M)[]>(fields: M2): PickField<M, undefined, M2>;
  Pick<FQN2 extends string, M2 extends (keyof M)[]>(fqn: FQN2, fields: M2): PickField<M, FQN2, M2>;

  /**
   * Omit fields from a `Struct` to create a new `StructType`.
   *
   * Example:
   * ```ts
   * class A extends Struct({
   *   a: string,
   *   b: string
   * }) {}
   *
   * class B extends A.Omit(['a']) {}
   * B.fields.b;
   * B.fields.a; // <- compile-time error
   * ```
   *
   * @param fields array of fields to select
   */
  Omit<M2 extends (keyof M)[]>(fields: M2): OmitField<M, undefined, M2>;
  Omit<FQN2 extends string, M2 extends (keyof M)[]>(fqn: FQN2, fields: M2): OmitField<M, FQN2, M2>;
}

/**
 * Dynamically constructs a class using a map of field names to shapes.
 *
 * class A extends Struct({
 *   /**
 *    * Inline documentation.
 *    *\/
 *   a: string
 * }) {}
 *
 * @param fields key-value pairs of fields and their shape (type).
 */
export function Struct<FQN extends string, T extends Fields = any>(fields: T): StructClass<T, undefined>;
export function Struct<FQN extends string, T extends Fields = any>(fqn: FQN, fields: T): StructClass<T, FQN>;

export function Struct<T extends Fields>(a: any, b?: any) {
  const FQN = typeof a === 'string' ? a : undefined;
  const fields = typeof b === 'undefined' ? a : b;
  class NewType {
    public static readonly FQN: string | undefined = FQN;

    public static Extend<FQN extends string, M extends Fields>(
      a: FQN | RowLacks<M, keyof T>,
      b?: RowLacks<M, keyof T>
    ): Extend<T, FQN, M> {
      return Extend(this as any, typeof a === 'string' ? a : undefined, typeof a === 'string' ? b! : a) as any;
    }

    public static Pick<FQN extends string, M extends (keyof T)[]>(
      a: FQN | RowLacks<M, keyof T>,
      b?: RowLacks<M, keyof T>
    ): PickField<T, FQN, M> {
      return Pick(
        fields,
        typeof a === 'string' ? a : undefined,
        typeof a === 'string' ? b! : a
      ) as any;
    }

    public static Omit<FQN extends string, M extends (keyof T)[]>(
      a: FQN | RowLacks<M, keyof T>,
      b?: RowLacks<M, keyof T>
    ): OmitField<T, FQN, M> {
      return Omit(
        fields,
        typeof a === 'string' ? a : undefined,
        typeof a === 'string' ? b! : a
      ) as any;
    }

    constructor(values: {
      [K in keyof T]: Value.Of<Pointer.Resolve<T[K]>>;
    }) {
      for (const [name, value] of Object.entries(values)) {
        (this as any)[name] = value;
      }
    }
  }

  const shape = new StructShape<T, any>(fields, {}, FQN);
  Object.assign(NewType, shape);
  (NewType as any).equals = shape.equals.bind(NewType);
  (NewType as any).visit = shape.visit.bind(NewType);
  (NewType as any).apply = shape.apply.bind(NewType);
  (NewType as any).getMetadata = shape.getMetadata.bind(NewType);
  return NewType as any;
}

/**
 * Extend this Struct with new fields to create a new `StructType`.
 *
 * Example:
 * ```ts
 * class A extends Struct({
 *   a: string,
 *   b: string
 * }) {}
 *
 * class B extends Extend(A, {
 *   c: string
 * }) {}
 * ```
 *
 * You can not override the parent Struct's fields.
 *
 * ```ts
 * class A extends Extend(A, { a: integer }) {} // compile-time error
 * ```
 *
 * @param fields new Struct fields
 */
export function Extend<
  T extends StructClass,
  FQN extends string | undefined,
  M extends Fields
>(
  type: T,
  fqn: FQN,
  fields: RowLacks<M, keyof T['Fields']>
): Extend<T['Fields'], FQN, M> {
  return Struct(fqn!, {
    ...type.Fields,
    ...fields
  }) as any;
}

/**
 * Combine two sets of fields into a single `StructType`.
 */
export type Extend<T extends Fields, FQN extends string | undefined, M extends Fields> = StructClass<Compact<T & M>, FQN>;

/**
 * Picks fields from a `Struct` to create a new `StructType`.
 */
export type PickField<T extends Fields, FQN extends string | undefined, K extends (keyof T)[] | ReadonlyArray<keyof T>> =
  StructClass<
    Pick<T, Extract<K[keyof K], string>>,
    FQN
  >;

/**
 * Pick fields from a `Struct` to create a new `StructType`.
 *
 * Example:
 * ```ts
 * class A extends Struct({
 *   a: string,
 *   b: string
 * }) {}
 *
 * class B extends Pick(A, ['a']) {}
 * B.fields.a;
 * B.fields.b; // <- compile-time error
 * ```
 *
 * @param fields to select from
 * @param select array of fields to select
 */
export function Pick<T extends Fields, FQN extends string | undefined, M extends (keyof T)[]>(
  fields: T,
  fqn: FQN,
  select: M
): PickField<T, FQN, M> {
  const newFields: any = {};
  for (const key of select) {
    newFields[key] = fields[key];
    if (newFields[key] === undefined) {
      throw new Error(`attempted to select non-existent field: ${key}`);
    }
  }
  return Struct(fqn!, newFields) as any;
}

/**
 * Omits fields from a `Struct` to create a new `StructType`
 */
export type OmitField<T extends Fields, FQN extends string | undefined, K extends (keyof T)[]> =
  StructClass<
    Omit<T, Extract<K[keyof K], string>>,
    FQN
  >;

/**
 * Pick fields from a `Struct` to create a new `StructType`.
 *
 * Example:
 * ```ts
 * class A extends Struct({
 *   a: string,
 *   b: string
 * }) {}
 *
 * class B extends Pick(A, ['a']) {}
 * B.fields.a;
 * B.fields.b; // <- compile-time error
 * ```
 *
 * @param fields to select from
 * @param select array of fields to select
 */
export function Omit<T extends Fields, FQN extends string | undefined, M extends (keyof T)[]>(
  fields: T,
  fqn: FQN,
  select: M
): OmitField<T, FQN, M> {
  const newFields: any = {};
  for (const key of Object.keys(newFields).filter(f => select.find(s => f === s))) {
    newFields[key] = fields[key];
    if (newFields[key] === undefined) {
      throw new Error(`attempted to select non-existent field: ${key}`);
    }
  }
  return Struct(fqn!, newFields) as any;
}
