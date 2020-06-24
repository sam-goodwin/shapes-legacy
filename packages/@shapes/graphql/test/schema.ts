import * as gql from '../src';

export const schemaBuilder = new gql.ShapeSchemaBuilder()
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
        bool: gql.Boolean,
        list: gql.List(gql.Int),
        complexList: gql.List(gql.Self),
        fn: gql.Function({a: gql.ID}, gql.Self["!"]),
        forwardCircular: gql.$('A')
      }
    }
  })
  .type((_) => ({
    Dog: {
      implements: ['Animal'],
      fields: {
        bark: gql.String["!"]
      }
    },
    Bird: {
      implements: ['Animal'],
      fields: {
        tweets: gql.Boolean["!"]
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
;