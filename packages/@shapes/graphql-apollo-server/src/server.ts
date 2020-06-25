import * as apollo from '@apollo/server';
import { ShapeSchema, toGraphQLAST } from '@shapes/graphql';
import { Config } from 'apollo-server-core'
import { Resolvers } from './resolver';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ShapeServerProps<S extends ShapeSchema<any, any>> {
  schema: S;
  resolvers: Resolvers<S['graph']>;  
  apollo?: Pick<Config, | 'dataSources' | 'parseOptions' | 'context' | 'introspection' | 'schemaDirectives' | 'cacheControl' | 'plugins'>
;}

/**
 * A type-safe Apollo GraphQL Server.
 * 
 * ```ts
 * 
 * ```
 */
export class ShapeServer<S extends ShapeSchema<any, any>> {
  public readonly schema: S;
  public readonly resolvers: Resolvers<S['graph']>;

  public readonly server: apollo.ApolloServer;

  constructor(props: ShapeServerProps<S>) {
    this.schema = props.schema;
    this.resolvers = props.resolvers;

    this.server = new apollo.ApolloServer({
      modules: [{
        resolvers: props.resolvers as any,
        typeDefs: toGraphQLAST(this.schema)
      }],
      ...(props.apollo || {})
    });
  }
}
