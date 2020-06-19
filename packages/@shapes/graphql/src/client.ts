import { GqlResult, GqlResultType } from './selector';
import { GqlRoot, QueryCompiler } from './query';
import { DocumentNode } from 'graphql';
import { Schema } from './schema';
import { TypeNode } from './ast';

export type RequestApi = (url: string, query: string | DocumentNode) => any;

export interface ClientProps<S extends Schema> {
  /**
   * The GraphQL Schema.
   */
  schema: S;
  /**
   * URL of the GraphQL API.
   */
  apiUrl: string;
  /**
   * Function for making HTTP requests.
   */
  requestApi?: RequestApi;
}

export class Client<S extends Schema> {
  /**
   * GraphQL Schema.
   */
  public readonly schema: S;
  /**
   * Root of the Query API.
   */
  public readonly queryRootType: S['graph'][S['query']];
  /**
   * Compiler for constructing type-safe GraphQL queries.
   */
  public readonly queryCompiler: QueryCompiler<S['graph'], Extract<this['queryRootType'], TypeNode>>;
  /**
   * Root of the Mutation API (if defined).
   */
  public readonly mutationRootType: S['mutation'] extends keyof S['graph'] ? S['graph'][S['mutation']] : undefined = undefined as any;
  /**
   * Compiler for constructing type-safe GraphQL mutations (if defined).
   */
  public readonly mutationCompiler: S['mutation'] extends keyof S['graph'] ? QueryCompiler<S['graph'], Extract<this['mutationRootType'], TypeNode>> : undefined = undefined as any;

  constructor(props: ClientProps<S>) {
    this.schema = props.schema;
    this.queryRootType = this.schema.graph[this.schema.query] as any;
    this.queryCompiler = new QueryCompiler(this.schema.graph, this.queryRootType as any);
    if (this.schema.mutation) {
      this.mutationRootType = this.schema.graph[this.schema.mutation] as any;
      this.mutationCompiler = new QueryCompiler(this.schema.graph, this.mutationRootType as any) as any;
    }
  }

  public query<T extends GqlResult>(
    _query: (s: GqlRoot<S['graph'], Extract<this['queryRootType'], TypeNode>>) => T
  ): Promise<GqlResultType<T>> {
    throw new Error('todo');
  }
}