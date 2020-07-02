import 'jest';

import * as gql from '@shapes/graphql';
import * as sinon from 'sinon';
import { ShapeClient } from './client';
import { ShapeSchemaBuilder } from '@shapes/graphql';

export const schema = new ShapeSchemaBuilder()
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
  })
;

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
