import * as gql from '@shapes/graphql';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ShapeClient, useShapeQuery } from '../src';

import { MockedProvider } from '@apollo/client/testing';
import renderer = require('react-test-renderer');
import React from 'react';
import fetch from 'cross-fetch';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const wait = require('waait');

const schema = new gql.ShapeSchemaBuilder()
  .type({
    Language: {
      fields: {
        code: gql.ID["!"],
        name: gql.String,
        native: gql.String,
        rtl: gql.Boolean
      }
    },
    State: {
      fields: {
        code: gql.String,
        name: gql.String["!"],
        country: gql.$('Country')["!"]
      }
    },
    Continent: {
      fields: {
        code: gql.ID["!"],
        name: gql.String["!"],
        countries: gql.List(gql.$('Country')["!"])["!"]
      }
    }
  })
  .type((_) => ({
    Country: {
      fields: {
        code: gql.ID["!"],
        name: gql.String["!"],
        native: gql.String["!"],
        phone: gql.String["!"],
        continent: _.Continent["!"],
        capital: gql.String,
        currency: gql.String,
        languages: gql.List(_.Language["!"])["!"],
        emoji: gql.String["!"],
        emojiU: gql.String["!"],
        states: gql.List(_.State["!"])["!"]
      }
    }
  }))
  .input({
    StringQueryOperatorInput: {
      eq: gql.String["!"],
      ne: gql.String["!"],
      in: gql.List(gql.String)["!"],
      nin: gql.List(gql.String)["!"],
      regex: gql.String["!"],
      glob: gql.String["!"]
    }
  })
  .input((_) => ({
    CountryFilterInput: {
      code: _.StringQueryOperatorInput,
      currency: _.StringQueryOperatorInput,
      continent: _.StringQueryOperatorInput,
    },
    ContinentFilterInput: {
      code: _.StringQueryOperatorInput,
    },
    LanguageFilterInput: {
      code: _.StringQueryOperatorInput,
    }
  }))
  .type((_) => ({
    Query: {
      fields: {
        continents: gql.Function({ filter: _.ContinentFilterInput }, gql.List(_.Continent["!"])["!"]),
        continent: gql.Function({ code: gql.ID["!"] }, _.Continent),
        countries: gql.Function({ filter: _.CountryFilterInput }, gql.List(_.Country["!"])["!"]),
        country: gql.Function({ code: gql.ID["!"] }, _.Country),
        languages: gql.Function({ filter: _.LanguageFilterInput }, gql.List(_.Language["!"])["!"]),
        language: gql.Function({ code: gql.ID }, _.Language)
      }
    }
  }))
  .build({
    query: 'Query'
  })
  ;

const client = new ShapeClient({
  schema,
  apolloClient: new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      // TODO: a public API, probably should use a local implementation
      // works though :)
      uri: 'https://countries.trevorblades.com/',
      fetch
    })
  })
});

it('should fetch data', async () => {
  const data = await client.query((root) => root
    .country({ code: 'US' }, (country) => country
      .name()
      .languages((l) => l
        .name())));

  expect(data.data).toEqual({
    country: {
      __typename: 'Country',
      name: 'United States',
      languages: [{
        __typename: 'Language',
        name: 'English'
      }]
    }
  })
});

const getCountries = schema.query.compile({ code: gql.ID["!"] }, ({ code }, root) => root
  .country({ code }, (country) => country
    .name()
    .languages((l) => l
      .name())));

it('should render countries', async () => {
  function CountryComponent({ code }: {
    code: string
  }) {
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

  const mocks = [{
    request: {
      query: getCountries.queryAST,
      variables: {
        code: 'US'
      }
    },
    result: {
      data: {
        country: {
          __typename: 'Country',
          name: 'United States',
          languages: [{
            __typename: 'Language',
            name: 'English'
          }]
        }
      }
    }
  }]

  const doc = renderer.create(<MockedProvider mocks={mocks}>
    <CountryComponent code="US"></CountryComponent>
  </MockedProvider>);
  expect(doc.toJSON()).toEqual({
    children: [
      "Loading...",
    ],
    props: {},
    type: "p",
  });

  await wait(0);

  expect(doc.toJSON()).toEqual({
    "children": [
      {
        "children": [
          {
            "children": null,
            "props": {},
            "type": "td",
          },
        ],
        "props": {},
        "type": "table",
      },
      {
        "children": [
          "Country: $",
          "United States",
        ],
        "props": {},
        "type": "p",
      },
      {
        "children": [
          "Languages:",
        ],
        "props": {},
        "type": "p",
      },
      {
        "children": [
          "$",
          {
            "children": [
              "$",
              "English",
            ],
            "props": {},
            "type": "li",
          },
        ],
        "props": {},
        "type": "ul",
      },
    ],
    "props": {},
    "type": "div",
  });
});