import * as gql from '@shapes/graphql';
import { ApolloClient } from '@apollo/client';

/**
 * Props for cponstructing a new `ShapeApolloClient`.
 */
export interface ShapeClientProps<TSchema extends gql.GraphQLSchema, TCacheShape = any> {
  /**
   * GraphQL Schema.
   */
  schema: TSchema;
  /**
   * Apollo Client for communicating with the GraphQL API.
   */
  apolloClient: ApolloClient<TCacheShape>;
}

/**
 * Provides a type-safe interface over an `ApolloClient`, given a GraphQL Schema.
 */
export class ShapeClient<TSchema extends gql.GraphQLSchema, TCacheShape = any> {
  /**
   * Apollo Client for communicating with the GraphQL API.
   */
  public readonly apolloClient: ApolloClient<TCacheShape>;
  /**
   * GraphQL Schema of the API.
   */
  public readonly schema: TSchema;

  constructor(props: ShapeClientProps<TSchema, TCacheShape>) {
    this.schema = props.schema;
    this.apolloClient = props.apolloClient;
  }
}


