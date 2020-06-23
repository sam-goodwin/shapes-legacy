# Shapes

Shapes is a library for defining TypeScript-native schemas and APIs. Instead of custom Schema Definition Languages (SDLs) and code generators, Shapes define APIs and derive API client interfaces on the fly within a native TypeScript environment.

# @shapes/graphql

`@shapes/graphql` is a library for defining GraphQL schemas and writing type-safe queries with TypeScript.

![Query Building Demo](demo/query.gif)

## Install

```shell
npm install --save @shapes/graphql
npm install --save @shapes/graphql-apollo-client
```

## Quick Start

GraphQL Schemas are defined natively within TypeScript.

<details>
  <summary>Click to see demo!</summary>
  
  ![Query Building Demo](demo/schema.gif)
</details>

The `GraphQLSchemaBuilder` type provides methods for incrementally defining types in a GraphQL schema. 

```ts
import gql = require('@shapes/graphql');

const schema = new gql.GraphQLSchemaBuilder()
  .type({
    // The keys in the object are the type names.
    MyType: {
      // fields are an object of field names and GraphQL types.
      fields: {
        // a simple field with GraphQL type: `ID!`
        id: gql.ID['!'],
        // a list of integers: `[Int]`
        list: gql.List(gql.Int['!'])
      }
    }
  })
  .build({
    // root of the Query API
    query: 'MyType',
    // mutation: undefined, // optional: the root fo the Mutation API
  });
```

This schema is equivalent to the following GraphQL document:
```gql
type MyType {
  id: ID!
  list: [Int!]
}

schema {
  query: MyType
}
```

Shape queries are designed to mirror the native GraphQL syntax:
```ts
// type-safe GraphQL query
const query = schema.query.compile(root => root
  .id()
  .list()
);
```

The TypeScript syntax is equivalent to this GraphQL document:
```gql
query {
  id
  list
}
```

The `@shapes/graphql-apollo-client` library extends the `@apollo/client` with type-safe wrappers of its client and react hooks:

1. `ShapeClient` wraps the `ApolloClient` with safe methods: `query`, `mutate` and `subscribe`.
```ts
import { ApolloClient } from '@apollo/client';
import { ShapeClient } from '@shapes/graphql-apollo-client';

const client = new ShapeClient({
  // the schema determines what queries are valid
  schema,
  // connections are delegated to an ApolloClient
  apolloClient: new ApolloClient(..)
});

const {data} = await client.query(root => root
  // select fields from the GraphQL API
  .id()
  .list()
);
// the type of data is inferred from the query:
data.id; // string
data.list; // number[] | undefined
```

Omitting fields also drops them from the response type:
```ts
const {data} = await client.query(root => root
  .id()
);
data.id; // string
// data.list; // TS Error - field 'list' does not exist
```

2. `useShapeQuery` provides a safe alternative to Apollo's `useQuery` React hook; It infers the response types from the provided query instead of returning `any` or requiring explicit type annotations like `useQuery`.

```tsx
const query = schema.query.compile(root => root
  .name()
);

function MyComponent() {
  // call the hook within a component
  const {data, loading, error} = useShapeQuery(query)

  if (loading) {
    return (<p>Loading..</p>)
  } else if (error) {
    return (<p>Error!</p>)
  }

  // use the returned data safely
  return (<p>Hello ${data.name}</p>)
}
```

### Scalar Types

Scalar types such as `ID`, `String`, `Int`, `Float` and `Bool` are constants available in `@shapes/graphql`. Use these values as fields when defining your own types.

### Required Fields

In ordinary GraphQL, fields are nullable by default and marked as required with the `!` (bang operator). Shapes is the same. All types expose a `['!']` getter which returns that same type, marked as required.

```ts
gql.String // String - optional string
gql.String['!'] // String! - required string
```

### Types

Types are defined with the `type` builder method - it accepts an object where each key represents the type's name and its fields are provided as properties.

```ts
import gql = require('@shapes/graphql');

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

This TypeScript code is equivalent to the following GraphQL:
```gql
type MyType {
  id: ID!
  list: [Int]
}
```

### Interfaces

Interfaces in GraphQL define common fields re-used across types.

```gql
interface Animal {
  name: String!
}

type Dog implements Animal {
  name: String!
  bark: String
}
```

You create interfaces in Shapes similarly to types:
```ts
schema
  .interface({
    Animal: {
      fields: {
        name: gql.String['!']
      }
    }
  })
  .type({
    Dog: {
      implements: ['I'],
      fields: {
        bark: gql.String
      }
    }
  })
```








### Root Types (query, mutation and subscription)

To finalize the schema, you must call `build` and provide the IDs of the API's root types: Query, Mutation and Subscription.

```ts
schema.build({
  query: 'MyType'
})
```

This step is equivalent to the `schema` section in a GraphQL document:
```gql
schema {
  Query: MyType
}
```

*Note*: Only `query` is mandatory. `mutation` and `subscription` are optional, as per the GraphQL specification.

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


