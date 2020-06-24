# Shapes

Shapes is a library for defining TypeScript-native schemas and APIs. Instead of custom Schema Definition Languages (SDLs) and code generators (e.g. Prisma, Swagger, OpenAPI, etc.), Shapes define APIs and derive client interfaces entirely within a native TypeScript environment.

# @shapes/graphql

`@shapes/graphql` is a library for defining GraphQL schemas and writing type-safe queries with TypeScript.

![Query Building Demo](demo/query.gif)

## Install

```shell
npm install --save @shapes/graphql
npm install --save @shapes/graphql-apollo-client
```

## Schemas

GraphQL Schemas are created with a `GraphQLSchemaBuilder`:

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

<details>
  <summary>Click to see a demo of the experience!</summary>
  
  ![Query Building Demo](demo/schema.gif)
</details>

### Scalar Types

Scalar types such as `ID`, `String`, `Int`, `Float` and `Bool` are constants available in `@shapes/graphql`. Use these values as fields when defining your own types.

### Required Fields

In ordinary GraphQL, fields are nullable by default and marked as required with the `!` (bang operator). Shapes is the same. All types expose a `['!']` getter which returns that same type, marked as required.

```ts
gql.String // String - optional string
gql.String['!'] // String! - required string
```

### Types (User-Defined)

Types are created with the `type` builder method. Each object entry represents a new type to be created.

```ts
import gql = require('@shapes/graphql');

schema.type({
  // The keys in the object are the type names.
  MyType: {
    // fields are an object of field names and GraphQL types.
    fields: {
      // a scalar field with GraphQL type: `ID!`
      id: gql.ID['!'],
      // a list of integers: `[Int]`
      list: gql.List(gql.Int)
    }
  }
})
```

This TypeScript code is equivalent to the following GraphQL document:
```gql
type MyType {
  id: ID!
  list: [Int]
}
```

### Referencing other Types as fields.

The `type` builder method can accept a function to create new types. The `GraphQLSchemaBuilder` will pass in a reference to all previously defined types in the schema so you can use them as fields.

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

Equivalent GraphQL:
```gql
type OtherType {
  myType: MyType
}
```

### Self-Type
A type can also circularly reference itself with the special `Self` type:

```ts
// previously defined types are passed in to your lambda
schema.type(_ => ({
  Type: {
    fields: {
      // circularly reference `Type`
      mySelf: gql.Self
    }
  }
}))
```

Equivalent GraphQL:
```gql
type Type {
  mySelf: Type
}
```

### Circular References
Sometimes you need to reference a type that hasn't yet been defined. For example, when two types reference each other (`A => B` and `B => A`). To form this relationship, use the `$` (read: "reference") helper to create a forward-reference to a type by its name. 

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
    // the referenced type, `B`.
    B: {
      fields: {
        a: _.A['!'] // reference to a previously defined type.
      }
    }
  }))
```

Equivalent GraphQL:
```gql
type A {
  b: B
}

type B {
  a: A!
}
```

### Interfaces

Interfaces in GraphQL define common fields re-used across types.

```gql
interface Animal {
  name: String!
}
```

This GQL interface is created by calling the `interface` builder method:

```ts
.interface({
  // defining a new interface named Animal
  Animal: {
    fields: {
      // it has one field, `name`, of type `String!`
      name: gql.String['!']
    }
  }
});
```

GraphQL types can then implement zero, one or many interfaces:
```gql
type Dog implements Animal {
  name: String!
  bark: String
}
```

This declaration is achieved in Shapes by providing a list of interface names "implemented" by a type.
```ts
.type({
  Dog: {
    // this type implemented the Animal interface
    implements: ['Animal'],
    fields: {
      // adding an additional field specific to Dog
      bark: gql.String
    }
  }
});
```

Interfaces in GraphQL can also "extend" other interfaces.
```gql
interface Bird extends Animal {
  tweet: String
}
```

Just like when "implementing" an interface, you can optionally provide a list of interfaces "extended" by an interface:
```ts
.interface({
  Bird: {
    // Bird is an interface that extends the Animal interface
    extends: ['Animal'],
    fields: {
      // adding an additional field specific to Bird
      tweet: gql.String
    }
  }
});
```

### Root Types (query, mutation and subscription)

To finalize the schema, you must call `build` and provide the IDs of the API's root types: `query`, `mutation` and `subscription`.

```ts
schema.build({
  query: 'QueryTypeName',
  mutation: 'MutationTypeName',
  subscription: 'SubscriptionTypeName'
})
```

This step is equivalent to the `schema` section in a GraphQL document:
```gql
schema {
  Query: QueryTypeName,
  Mutation: MutationTypeName,
  Subscroption: SubscroptionTypeName,
}
```

*Note*: Only `query` is mandatory - `mutation` and `subscription` are optional, as per the GraphQL specification.

## Queries

Queries are designed to mirror the native GraphQL syntax. After creating a schema, you can compile queries for it by accessing the `query`, `mutation` or `subscription` "roots".

```ts
const schema = new GraphQLSchemaBuilder().type(..).build(..);

// type-safe GraphQL query
const query = schema.query.compile(root => root
  .id()
  .list()
);
```

This syntax is equivalent to the following GraphQL document:
```gql
query {
  id
  list
}
```

## Clients
The core module, `@shapes/graphql`, does not provide any way to query a live GraphQL server. It is for building schemas and synthesizing GraphQL documents for use in existing GraphQL client implementations.

`@shapes/graphql-apollo-client` is an integration with the popular `@apollo/client` library, extending its client and react hooks with Shape's type-safe capabilities.

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
