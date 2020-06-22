import * as gql from '@shapes/graphql';
import { ApolloClient, ApolloQueryResult } from '@apollo/client';
import { GqlResult, GqlRoot } from '@shapes/graphql';

/**
 * Props for cponstructing a new `ShapeApolloClient`.
 */
export interface ShapeClientProps<TSchema extends gql.GraphQLSchema<any, any, any>, TCacheShape = any> {
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
export class ShapeClient<TSchema extends gql.GraphQLSchema<any, any, any>, TCacheShape = any> {
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

  public query<
    Result extends GqlResult
  >(
    queryBlock: (i: GqlRoot<TSchema['graph'], TSchema['query']['root']>) => Result
  ): Promise<ApolloQueryResult<gql.GqlResultType<Result>>> {
    const {queryAST} = this.schema.query.compile(queryBlock as any);
    return this.apolloClient.query({
      query: {
        kind: 'Document',
        definitions: [queryAST]
      }
    });
  }

  public mutate<
    Result extends GqlResult
  >(
    mutationBlock: TSchema['mutation'] extends gql.QueryCompiler<any, any> ? (i: GqlRoot<TSchema['graph'], TSchema['mutation']['root']>) => Result : never
  ): TSchema['mutation'] extends undefined ? never : Promise<ApolloQueryResult<gql.GqlResultType<Result>>> {
    if (this.schema.mutation === undefined) {
      throw new TypeError('no mutation API defined on schema');
    }
    const {queryAST} = this.schema.mutation.compile(mutationBlock as any);
    return this.apolloClient.query({
      query: {
        kind: 'Document',
        definitions: [queryAST]
      }
    }) as any;
  }
}


