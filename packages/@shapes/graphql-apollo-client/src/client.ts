import * as gql from '@shapes/graphql';
import { ApolloClient } from '@apollo/client';
import { QueryCompiler } from '@shapes/graphql';

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

  /**
   * Root of the Query API.
   */
  public readonly queryRootType: TSchema['graph'][TSchema['query']];
  /**
   * Compiler for constructing type-safe GraphQL queries.
   */
  public readonly queryCompiler: QueryCompiler<TSchema['graph'], Extract<this['queryRootType'], gql.AST.TypeNode>>;
  /**
   * Root of the Mutation API (if defined).
   */
  public readonly mutationRootType: TSchema['mutation'] extends keyof TSchema['graph'] ? TSchema['graph'][TSchema['mutation']] : undefined = undefined as any;
  /**
   * Compiler for constructing type-safe GraphQL mutations (if defined).
   */
  public readonly mutationCompiler: TSchema['mutation'] extends keyof TSchema['graph'] ? QueryCompiler<TSchema['graph'], Extract<this['mutationRootType'], gql.AST.TypeNode>> : undefined = undefined as any;

  constructor(props: ShapeClientProps<TSchema, TCacheShape>) {
    this.schema = props.schema;
    this.apolloClient = props.apolloClient;
    this.queryRootType = props.schema.query as any;
    this.queryCompiler = new QueryCompiler(this.schema.graph, this.queryRootType as any);
    this.mutationRootType = props.schema.mutation as any;
    if (this.mutationRootType) {
      this.mutationCompiler = new QueryCompiler(this.schema.graph, this.mutationRootType as any) as any;
    }
  }
}


