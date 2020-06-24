// eslint-disable-next-line sort-imports
import * as gql from '@shapes/graphql';
import { MockedProvider } from '@apollo/client/testing';
import React from 'react';
import { useShapeQuery } from '../src';

import renderer = require('react-test-renderer');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const wait = require('waait');

const schema = new gql.ShapeSchemaBuilder()
  .type({
    Query: {
      fields: {
        name: gql.String["!"],
        age: gql.Int
      }
    }
  })
  .build({
    query: 'Query'
  });

const getPerson = schema.query.compile((root) => root
  .name()
  .age()
);
  
function ShapeComponent() {
  const { data, error, loading } = useShapeQuery(getPerson)

  if (loading) {
    return <p>Loading...</p>
  } else if (error || data === undefined) {
    return <p>Error!</p>
  }

  return (
    <p>Hello ${data.name} you are ${data.age} years old.</p>
  )
}

it('should', async () => {
  const mocks = [{
    request: {
      query: getPerson.queryAST,
    },
    result: {
      data: {
        name: 'sam',
        age: 31
      }
    }
  }];

  const component = renderer.create(<MockedProvider mocks={mocks}>
    <ShapeComponent></ShapeComponent>
  </MockedProvider>);

  expect(component.toJSON()).toEqual({
    children: [
      "Loading...",
    ],
    props: {},
    type: "p",
  });

  await wait(0);

  expect(component.toJSON()).toEqual({
    children: [
      "Hello $",
      "sam",
      " you are $",
      "31",
      " years old.",
    ],
    props: {},
    type: "p",
  });
});