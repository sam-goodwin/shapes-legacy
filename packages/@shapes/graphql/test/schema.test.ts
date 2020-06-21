import 'jest';

import * as gql from '../src';
import { schemaBuilder } from './schema';

it('should synthesize GraphQL schema', () => {
  const schema = schemaBuilder
    .type((_) => ({
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
  complexList: [Animal]
  fn(a: ID): Animal!
  forwardCircular: A
}

type Dog implements Animal {
  bark: String!
}

type Bird implements Animal {
  tweets: Boolean!
}

union All = Dog | Bird

type A {
  i: String
  b: B
}

type B {
  a: A
}

type Query {
  getAnimal(id: ID!): Animal
}

type Mutation {
  addAnimal(id: ID!): Animal!
}

schema {
  query: Query
  mutation: Mutation
}
`);
});
