import 'jest';

import * as gql from '../lib';

const schemaBuilder = new gql.SchemaBuilder()
  .enum({
    Direction: {
      UP: 'UP',
      DOWN: 'DOWN',
      LEFT: 'LEFT',
      RIGHT: 'RIGHT',
    }
  } as const)
  .interface({
    Animal: {
      fields: {
        id: gql.ID["!"],
        name: gql.String["!"],
        parent: gql.Self,
        dog: gql.$('Dog'),
        int: gql.Int,
        float: gql.Float,
        bool: gql.Bool,
        list: gql.List(gql.Int),
        fn: gql.Function({a: gql.ID}, gql.Self["!"])
      }
    }
  })
  .type(_ => ({
    Dog: {
      implements: ['Animal'],
      fields: {
        bark: gql.String["!"]
      }
    },
    Bird: {
      implements: ['Animal'],
      fields: {
        tweets: gql.Bool["!"]
      }
    }
  }))
  .union({
    All: ['Dog', 'Bird']
  })
;

it('should synthesize GraphQL schema with common names', () => {
  const schema = schemaBuilder
    .type(_ => ({
      Query: {
        fields: {
          getAnimal: gql.Function({id: gql.ID["!"]}, _.Animal),
        }
      },
      Mutation: {
        fields: {
          addAnimal: gql.Function({id: gql.ID["!"]}, _.Animal["!"])
        }
      }
    }))
    .build({
      query: 'Query',
      mutation: 'Mutation'
    })
  ;
  expect(gql.printGraphQLSchema(schema)).toEqual(
`enum Direction {
  UP
  DOWN
  LEFT
  RIGHT
}

interface Animal {
  id: ID!
  name: String!
  parent: Animal
  dog: Dog
  int: Int
  float: Float
  bool: Boolean
  list: [Int]
  fn(a: ID): Animal!
}

type Dog implements Animal {
  bark: String!
}

type Bird implements Animal {
  tweets: Boolean!
}

union All = Dog | Bird

type Query {
  getAnimal(id: ID!): Animal
}

type Mutation {
  addAnimal(id: ID!): Animal!
}
`);
});

it('should synthesize GraphQL schema with un-common names', () => {
  const schema = schemaBuilder
    .type(_ => ({
      Query2: {
        fields: {
          getAnimal: gql.Function({id: gql.ID["!"]}, _.Animal),
        }
      },
      Mutation2: {
        fields: {
          addAnimal: gql.Function({id: gql.ID["!"]}, _.Animal["!"])
        }
      }
    }))
    .build({
      query: 'Query2',
      mutation: 'Mutation2'
    })
  ;
  expect(gql.printGraphQLSchema(schema)).toEqual(
`schema {
  query: Query2
  mutation: Mutation2
}

enum Direction {
  UP
  DOWN
  LEFT
  RIGHT
}

interface Animal {
  id: ID!
  name: String!
  parent: Animal
  dog: Dog
  int: Int
  float: Float
  bool: Boolean
  list: [Int]
  fn(a: ID): Animal!
}

type Dog implements Animal {
  bark: String!
}

type Bird implements Animal {
  tweets: Boolean!
}

union All = Dog | Bird

type Query2 {
  getAnimal(id: ID!): Animal
}

type Mutation2 {
  addAnimal(id: ID!): Animal!
}
`);
});
