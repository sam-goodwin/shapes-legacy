/* eslint-disable sort-imports */

import { CountrySchema } from './schema';
import { ShapeServer } from '@shapes/graphql-apollo-server';
import { continents, countries, languages } from 'countries-list';
import * as provinces from 'provinces';

import sift from 'sift';

/**
 * Credit to: https://github.com/trevorblades/countries/blob/master/index.js
 * 
 * I re-purposed their example.
 */

export const CountryServer = new ShapeServer({
  schema: CountrySchema,
  resolvers: {
    Country: {
      capital: (country) => country.capital || undefined,
      currency: (country) => country.currency || undefined,
      continent: (country) => ({
        code: country.continent?.code,
        name: country.continent?.code ? continents[country.continent.code as keyof typeof continents] : undefined
      }),
      languages: (country) => {
        return country.languages.map((code: keyof typeof languages) => {
          const language = languages[code];
          return {
            ...language,
            code
          };
        });
      },
      states: (country) => provinces.filter((province) => province.country === country.code)
    },
    State: {
      code: (state) => state.short,
      country: (state) => countries[state.country as keyof typeof countries]
    },
    Continent: {
      countries: (continent) =>
        Object.entries(countries)
          .filter((entry) => entry[1].continent === continent.code)
          .map(([code, country]) => ({
            ...country,
            code
          }))
    },
    Language: {
      rtl: (language) => Boolean(language.rtl)
    },
    Query: {
      continent(_parent, {code}) {
        const name = continents[code as keyof typeof continents];
        return (
          name && {
            code,
            name
          }
        );
      },
      continents: (_parent, {filter}) =>
        Object.entries(continents)
          .map(([code, name]) => ({
            code,
            name
          }))
          .filter((element) => filterToSift(filter)(element)),
      country(_parent, {code}) {
        const country = countries[code as keyof typeof countries];
        return (
          country && {
            ...country,
            code
          }
        );
      },
      countries: (_parent, {filter}) =>
        Object.entries(countries)
          .map(([code, country]) => ({
            ...country,
            code
          }))
          .filter((element) => filterToSift(filter)(element)),
      language(_parent, {code}) {
        const language = languages[code as keyof typeof languages];
        return (
          language && {
            ...language,
            code
          }
        );
      },
      languages: (_parent, {filter}) =>
        Object.entries(languages)
          .map(([code, language]) => ({
            ...language,
            code
          }))
          .filter((element) => filterToSift(filter)(element))
    }
  }
});

CountryServer.listen().then(({url}) => {
  return console.log(`Server listening on url: ${url}`);
}).catch((error) => {
  console.error(error);
});

function filterToSift(filter = {}) {
  return sift(
    Object.entries(filter).reduce(
      (acc, [key, operators]) => ({
        ...acc,
        [key]: operatorsToSift(operators)
      }),
      {}
    )
  );
}

function operatorsToSift(operators: any) {
  return Object.entries(operators).reduce(
    (acc, [operator, value]) => ({
      ...acc,
      ['$' + operator]: value
    }),
    {}
  );
}