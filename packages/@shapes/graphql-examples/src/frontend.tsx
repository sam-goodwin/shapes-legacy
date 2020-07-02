/* eslint-disable sort-imports */

import { CountrySchema } from './schema';
import { useShapeQuery, ShapeClient } from '@shapes/graphql-apollo-client';

import { ApolloProvider, ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

import React from 'react';

const client = new ShapeClient({
  schema: CountrySchema,
  apolloClient: new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: 'http://localhost:4000'
    })
  })
});

/**
 * We use the `CountrySchema` to compile a GraphQL query.
 */
const getCountries = CountrySchema.query.compile({
  code: CountrySchema.graph.CountryCode
}, ({ code }, root) => root
  .country({ code }, (country) => country
    .name()
    .languages((l) => l
      .name()
    )
  )
);

/**
 * Then, export a react component that hooks into the query
 */
export const CountryComponent: React.FunctionComponent<{
  code: keyof typeof CountrySchema['graph']['CountryCode']['values'];
}> = ({code}) => {
  /**
   * `useShapeQuery` executes the `getCountries` query and returns a type-safe response.
   */
  const { data, error, loading } = useShapeQuery(getCountries, {
    variables: {
      code
    }
  });

  if (loading) {
    return <p>Loading...</p>
  } else if (error) {
    return <p>Error: ${error.message}</p>
  } else if (data === undefined) {
    return <p>Country not found: ${code}</p>
  }

  return (
    <div>
      <table>
        <td></td>
      </table>
      <p>Country: ${data.country.name}</p>
      <p>Languages:</p>
      <ul>
        ${data.country.languages.map(({ name }) =>
        <li key={name}>${name}</li>
      )}
      </ul>
    </div>
  );
}

export const CountryApp = (
  <ApolloProvider client={client.apolloClient}>
    <CountryComponent code='US'></CountryComponent>
  </ApolloProvider>
)
