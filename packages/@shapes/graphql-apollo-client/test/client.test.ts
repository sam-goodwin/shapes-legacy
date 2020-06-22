import 'jest';

import sinon = require('sinon');

import * as gql from '@shapes/graphql';
import { GraphQLSchemaBuilder } from '@shapes/graphql';
import { ShapeClient } from '../src';

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

it('should proxy calls to the Apollo Client', async () => {
  const mockClient = {
    query: sinon.fake.resolves({
      data: {
        getA: {
          id: 'id'
        }
      }
    })
  };
  
  const client = new ShapeClient({
    schema,
    apolloClient: mockClient as any
  });
  // TODO
  const a = await client.query((root) => root
    .getA({id: 'id'}, (a) => a
      .id()
    )
  );

  if (a.data) {
    expect(a.data.getA.id).toEqual('id');
  } else {
    fail('data was undefined');
  }
});
