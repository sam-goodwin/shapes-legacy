/* eslint-disable @typescript-eslint/no-empty-interface */
import * as gql from '@shapes/graphql';

import { continents, countries, languages, } from 'countries-list';

/**
 * CountrySchema leverages the ShapeSchemaBuilder to define a GraphQL Query in code.
 */
export const CountrySchema = new gql.ShapeSchemaBuilder()
  .enum({
    /**
     * An Enum of valid two-letter continent codes.
     */
    ContinentCode: EnumKeys(continents),
    /**
     * An Enum of valid two-letter country codes.
     */
    CountryCode: EnumKeys(countries),
    /**
     * An Enum of valid two-letter language codes.
     */
    LanguageCode: EnumKeys(languages),
  })
  .type((_) => ({
    /**
     * Object type containing fields for languages.
     */
    Language: {
      fields: {
        /**
         * Language Code.
         */
        code: _.LanguageCode["!"],
        name: gql.String["!"],
        native: gql.String["!"],
        rtl: gql.Boolean["!"]
      }
    },
    /**
     * Object type for States in a country.
     */
    State: {
      fields: {
        code: gql.String["!"],
        name: gql.String["!"],
        country: gql.$('Country')["!"]
      }
    },
    /**
     * Object type for continents across the world.
     */
    Continent: {
      fields: {
        code: _.ContinentCode["!"],
        name: gql.String["!"],
        countries: gql.List(gql.$('Country')["!"])["!"]
      }
    }
  }))
  .type((_) => ({
    /**
     * Object type for 
     */
    Country: {
      fields: {
        /**
         * Country Code
         * 
         * E.g. `US`
         */
        code: _.CountryCode["!"],
        name: gql.String,
        native: gql.String,
        phone: gql.String,
        continent: _.Continent,
        capital: gql.String,
        currency: gql.String,
        languages: gql.List(_.Language),
        emoji: gql.String,
        emojiU: gql.String,
        states: gql.List(_.Language)
      }
    }
  }))
  .input((_) => ({
    StringQueryOperatorInput: OperatorInputType(gql.String),
    CountryCodeOperatorInput: OperatorInputType(_.CountryCode)
  }))
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
        continents: gql.Function({ filter: _.ContinentFilterInput["!"] }, gql.List(_.Continent["!"])["!"]),
        continent: gql.Function({ code: gql.ID["!"] }, _.Continent),
        countries: gql.Function({ filter: _.CountryFilterInput["!"] }, gql.List(_.Country["!"])["!"]),
        country: gql.Function({
          /**
           * Country Code
           * 
           * E.g. US
           */
          code: _.CountryCode
        }, _.Country),
        languages: gql.Function({ filter: _.LanguageFilterInput }, gql.List(_.Language["!"])["!"]),
        language: gql.Function({ code: gql.ID["!"] }, _.Language)
      }
    }
  }))
  .build({
    query: 'Query'
  })
;

/**
 * Type Constructor for an operator input type that is specific to an enum.
 * 
 * It is effectively a generic type in GraphQL.
 * ```gq
 * input OperatorInput<T extends Enum> {
 *   eq: T
 *   ne: T
 *   in: [T]
 *   nin: [T]
 *   regex: String
 *   glob: String
 * }
 * ```
 *
 * Ex (hypothetical GraphQL):
 * ```gql
 * // given an enum:
 * enum CountryCode {
 *   US: 'US'
 *   // etc.
 * }
 * 
 * input CountryCodeOperatorInput = OperatorInput<CountryCode>
 * ```
 * 
 * @param codeType - enum type representing valid values.
 */
function OperatorInputType<T extends gql.AST.ReturnTypeNode>(codeType: T) {
  return {
    eq: codeType,
    ne: codeType,
    in: gql.List(codeType),
    nin: gql.List(codeType),
    regex: gql.String,
    glob: gql.String
  };
}

/**
 * Cretes an Enum from an object's keys.
 * 
 * @param value - object whose keys will form an enum
 */
function EnumKeys<T extends Record<string, unknown>>(value: T) {
  return Object.keys(value).map((k) => ({
    [k]: k
  })).reduce((a, b) => ({...a, ...b})) as {
    [code in keyof T]: code
  };
}
