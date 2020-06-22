import 'jest';

import *  as gql from '@shapes/graphql';
import { ShapeClient, useShapeQuery } from '../src';
import { GraphQLSchemaBuilder } from '@shapes/graphql';

export const schema = new GraphQLSchemaBuilder()
  .type({
    A: {
      fields: {
        id: gql.ID
      }
    }
  })
  .type((_) => ({
    Query: {
      fields: {
        getA: gql.Function({id: gql.ID}, _.A)
      }
    }
  }))
  .build({
    query: 'Query'
  });

const mockClient: any = {};

const client = new ShapeClient({
  schema,
  apolloClient: mockClient
});

const query = client.queryCompiler.compile({id: gql.ID["!"]}, ({id}, q) => q
  .getA({id}, (a) => a
    .id()
  )
);

export const {data, error, loading} = useShapeQuery(query, {
  variables: {
    id: 'id'
  }
});

it('should proxy calls to the Apollo Client', () => {
  // TODO
  expect(1).toEqual(1);
});
