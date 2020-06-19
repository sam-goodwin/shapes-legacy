# Shapes

Shapes is a library for defining TypeScript-native schemas and APIs. Instead of external Schema Definition Languages (SDLs) and code generators, Shapes moves everything into TypeScript and leverages its powerful type-system to generate APIs on the fly entirely within the same environment.

# @shapes/graphql

`@shapes/graphql` is a TypeScript library for defining GraphQL schemas and generating type-safe queries natively within TypeScript.

```shell
npm install @shapes/graphql
```

## Querying a GraphQL API.

![Query Building Demo](demo/query.gif)

## Create a GraphQL Schema.

![Schema Building Demo](demo/schema.gif)

The `SchemaBuilder` type provides methods for incrementally defining types in a GraphQL schema. 

```ts
import gql = require('@shapes/graphql');

const schema = new gql.SchemaBuilder()
  .type({
    // The keys in the object are the type names.
    MyType: {
      // fields are an object of field names and GraphQL types.
      fields: {
        // a simple field with GraphQL type: `ID!`
        id: gql.ID['!'],
        // a list of integers: `[Int]`
        list: gql.List(gql.Int)
      }
    }
  })
  .build({
    // root of the Query API
    query: 'MyType',
    // mutation: undefined, // optional: the root fo the Mutation API
  });
```



### Defining a Type

The simplest type definition is an object containing fields.
```ts
schema.type({
  // The keys in the object are the type names.
  MyType: {
    // fields are an object of field names and GraphQL types.
    fields: {
      // a simple field with GraphQL type: `ID!`
      id: gql.ID['!'],
      // a list of integers: `[Int]`
      list: gql.List(gql.Int)
    }
  }
})
```

### Referencing other Types as fields.

Previously defined types can be accessed when defining a type:

```ts
// previously defined types are passed in to your lambda
schema.type(_ => ({
  OtherType: {
    fields: {
      myType: _.MyType // reference a previously defined type
    }
  }
}))
```

A type can also circularly reference itself via the special `Self` type:

```ts
// previously defined types are passed in to your lambda
schema.type(_ => ({
  Type: {
    fields: {
      // circularly reference myself
      mySelf: gql.Self
    }
  }
}))
```

Sometimes you need to reference a type that hasn't yet been defined. For example,
when two types reference each other (`A => B` and `B => A`). To form this relationship,
use the `$` (read: 'reference') helper to create a forward-reference to a type by its name. 

```ts
schema
  .type({
    A: {
      fields: {
        b: gql.$('B') // forward reference to a not-yet-defined type.
      }
    }
  })
  .type(_ => ({
    // the referenced type, B.
    B: {
      fields: {
        a: _.A // safe reference to a previously defined type.
      }
    }
  }))
```

### Build a Schema

To finalize a schema, 

## Type-Safe GraphQL Queries
