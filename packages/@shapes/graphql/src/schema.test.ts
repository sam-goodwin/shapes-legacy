import 'jest';

import * as gql from '.';

it('should synthesize GraphQL schema', () => {
  const schema = new gql.ShapeSchemaBuilder()
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
          id: gql.Required(gql.ID),
          name: gql.Required(gql.String),
          parent: gql.Self,
          dog: gql.$('Dog'),
          int: gql.Int,
          float: gql.Float,
          bool: gql.Boolean,
          list: gql.List(gql.Int),
          complexList: gql.List(gql.Self),
          fn: gql.Function({a: gql.ID}, gql.Required(gql.Self)),
          forwardCircular: gql.$('A')
        }
      }
    })
    .type((_) => ({
      Dog: {
        implements: ['Animal'],
        fields: {
          bark: gql.Required(gql.String)
        }
      },
      Bird: {
        implements: ['Animal'],
        fields: {
          tweets: gql.Required(gql.Boolean)
        }
      }
    }))
    .union({
      All: ['Dog', 'Bird']
    })
    .type({
      A: {
        fields: {
          i: gql.String,
          b: gql.$('B')
        }
      },
      B: {
        fields: {
          a: gql.$('A')
        }
      }
    })
    .input({
      GetAnimalInput: {
        id: gql.ID["!"]
      }
    })
    .type((_) => ({
      Query: {
        fields: {
          getAnimal: gql.Function({input: _.GetAnimalInput["!"]}, _.Animal),
        }
      },
      Mutation: {
        fields: {
          addAnimal: gql.Function({id: gql.Required(gql.ID)}, gql.Required(_.Animal))
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
  bark: String!
}

type Bird implements Animal {
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

input GetAnimalInput {
  id: ID!
}

type Query {
  getAnimal(input: GetAnimalInput!): Animal
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
