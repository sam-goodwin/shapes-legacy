import 'jest';

import * as gql from '../lib';
import { schemaBuilder } from './schema';

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
