import 'jest';

import * as gql from '@shapes/graphql';

import { ShapeServer } from '../src';

const schema = new gql.ShapeSchemaBuilder()
  .interface({
    I: {
      fields: {
        i: gql.String["!"]
      }
    }
  })
  .type({
    A: {
      implements: ['I'],
      fields: {
        /**
         * A field.
         */
        a: gql.String["!"]
      }
    },
    B: {
      implements: ['I'],
      fields: {
        b: gql.String
      }
    }
  })
  .type((_) => ({
    Thing: {
      fields: {
        thingList: gql.List(_.A)["!"]
      }
    }
  }))
  .union({
    U: ['A', 'B']
  })
  .type((_) => ({
    Query: {
      fields: {
        a: _.A,
        fn: gql.Function({id: gql.ID["!"]}, _.U),
        getThing: gql.Function({}, _.Thing)
      }
    }
  }))
  .build({
    query: 'Query'
  })
;

export const s = new ShapeServer({
  schema,
  resolvers: {
    Query: {
      getThing() {
        return {
          thingList: [{
            a: 'a'
          }]
        }
      }
    },
    I: {
      __resolveType(parent) {
        if(parent.a) {
          return 'A';
        } else {
          return 'B';
        }
      },
    },
    A: {
      a: () => 'a'
    },
    B: {
      b: () => 'b'
    },
    U: {
      __resolveType(obj) {
        if (obj.a) {
          return 'A';
        } else if (obj.b) {
          return 'B';
        } else {
          throw new Error('');
        }
      }
    }
  }
});
