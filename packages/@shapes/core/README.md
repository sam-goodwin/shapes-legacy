# @shapes/core

'Shape' is the type-system that makes the Punchcard Type-Safe abstraction of AWS possible. It supplements TypeScript with a virtual type-system available at runtime that makes possible all sorts of ORM and DSL use-cases.

# Ecosystem
* [@shapes/dynamodb](../dynamodb) - DSL for working with AWS DynamoDB. Supports type-safe Query, Update and Conditional expressions, and maps between the raw attribute values and the shape definition.
* [@shapes/hive](../hive) - maps Shapes to AWS Glue (Hive) schemas to support declaring Hive/Glue tables with a Struct.
* [@shapes/json](../json) - JSON serialization.
* [@shapes/jsonpath](../jsonpath) - Type-safe DSL for constructing JSON path expressions from Shapes.
* [@shapes/jsonschema](../jsonschema) - Maps a Shape to its corresponding JSON schema.

# Why do we need a virtual type-system?

Say you define a class in TypeScript:

```ts
class MyType {
  readonly key: string;
}
```

To build a generic ORM like we're used to in languages like Java, we need to reflect on this type's members. To do this in TS, you must enable the [`--emitDecoratorMetadata`](https://www.typescriptlang.org/docs/handbook/compiler-options.html) flag and use the [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) package:

```ts
var t = Reflect.getMetadata('design:type', MyType, 'key');
console.log(t.name); // 'string'
```

This is great, but it has one deal-breaking caveat: [it does not retain generic information](https://github.com/microsoft/TypeScript/issues/7169). So, you cannot retrieve the type of an item in an `Array`:

```ts
class MyType {
  items: string[];
}
var t = Reflect.getMetadata('design:type', MyType, 'items');
console.log(t.name); // 'Array', not `[Array, string]`
```

A decorator can be used as a workaround, as we see in popular libraries like [type-graphql](https://github.com/MichalLytek/type-graphql):

```ts
class MyType {
  @Field(_ => [typeGraphql.String])
  items: string[];
}
```

But this is unfortunately redundant. We're defining the type twice!

# Shapes

Punchcard Shapes is another workaround, except it eliminates the above redundancy while also supporting advanced type-level machinery such as [conditional types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#conditional-types) and [mapped types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#mapped-types), which comes in handy when implementing type-safe ORMs and DSLs.

Types are constructed in the same way as ordinary data in JavaScript!

```ts
class MyType extends Struct({
  /**
   * In-line documentation goes here.
   */
  items: array(string)
}) {}
```

`MyType` is what we call a "Struct". It is constructed by extending the result of a function call (`Struct`) which dynamically creates a class containing static references to its type information and a type-safe constructor that accepts and validates the members.

## Type-Safe Constructor
The constructor takes an object where each key is a member, and its type is known:
```ts
const myType = new MyType({
  items: ['an', 'array', 'of', 'strings'] // checked by the TS compiler as string[]
});
```

## Static Reflection
The `MyType` class has a static reference to the Struct's type information:
```ts
MyType.Fields.items; // ArrayShape<StringShape>
```

This is similar to the `Type.class` static reference in Java:
```java
java.lang.String.class; // Class<String>
```

## Dynamic Reflection
That same information is available dynamically on an instance via the `TypeShape.Fields` symbol:
```ts
const myType: MyType = ...;
myType[TypeShape.Fields].items; // ArrayShape<StringShape>;
```

This is similar to the `instance.getClass()` method call in Java:
```java
"some string".getClass(); // Class<String>
```

## Traits (type-safe decorators)

What about decorators though?

Decorators in TypeScript can only be declared on top-level declarations, so we can not apply them to the arguments passed in to `Struct`:

```ts
class MyType extends Struct({
  @Decorator() // not possible, bummer
  items: array(string)
}) {}
```

To use ordinary decorators, you must redundantly declare the member:

```ts
class MyType extends Struct({
  items: array(string)
}) {
  @Decorator() // possible
  items: string[];
}
```

This is unfortunate, but it is par for the course when compared to the `type-graphql` example - a maximum redundancy of 2.

To eiminate this redundancy, Shapes also provide its own decorator replacement called "Traits". Any Shape can have a trait "applied" to it:

```ts
class MyType extends Struct({
  items: array(string)
    .apply(Trait())
}) {}
```

Traits take decorators even further, however, as they can also augment the type-level information of the shape they are applied to.

For example, the minimum value of an integer can be annotated on the type and used in type-level machinery to change behavior:

```ts
class MyType extends Struct({
  myNumber: integer
    .apply(Minimum(0))
}) {}
MyType.Fields.myNumber;
// is of type:
NumberShape & {
  [import('@shapes/core').Decorated.Data]: {
    minimum: 0
  }
}
```

The metadata is made available on the shape with the `Decorated.Data` symbol.

Then, using conditional types, we can vary behavior of a DSL derived from this type:
```ts
type ChangeBehavior<T> =
  T extends Decorated<any, {minimum: 0}> ?
    PositiveIntegers :
    AnyNumber
  ;
```

## Validation
Traits are used to annotate Structs with validation information. Common use-cases include:

### `Optional` - mark a member as optional, equivalent to `?` in TS.
```ts
class MyType extends Struct({
  key: string.apply(Optional),
  // or use short-hand
  shortHand: optional(string)
}) {}
```
Note: the signatures also understand that this field is optional (thanks to the information being available at the type-level):

```ts
const myType = new MyType({}); // still compiles if we don't provide a value for the optional members
```

### Min/Max numbers
```ts
class MyType extends Struct({
  myNumber: number
    .apply(Minimum(0))
    .apply(Maximum(256))
}) {}
```

### Min/Max length of a string
```ts
class MyType extends Struct({
  myNumber: string
    .apply(MinLength(0))
    .apply(MaxLength(256))
}) {}
```

# Shape Reference

## Primitives
* `any` - accepts any type, equivalent to `any`.
* `binary` - binary data, equivalent to `Buffer` in TS.
* `boolean` - `true | false`, equivalent to `boolean` in TS.
* `integer` - whole numbers, maps to `number` in TS.
* `nothing` - null value, equivalent to `undefined | null | void` in TS.
* `number` - all numbers (integer or floating point), equivalent to `number` in TS.
* `string` - strings of characters (text), equivalent to `string` in TS.
* `timestamp` - a date and time (to millisecond granularity), equivalent to `Date` in TS.
* `unknown` - accepts any type, but is safer than `any` as it requires checking when used, equivalent to `unknown` in TS.

## Collections
* `array(T)` - an array of items, equivalent to `Array<T>` in TS.
* `set(T)` - a set of items, equivalent to `Set<T>` in TS, but also supports a non-primitive `T`.
* `map(T)` - a map of string keys to values, equivalent to `{[key: string]: T; }` in TS.

## Struct
* `Struct(M)` - a class with named and well-typed members: