import * as gql from '@shapes/graphql';

import { AST, ShapeSchema } from '@shapes/graphql';

export type Resolvers<G extends AST.GraphQLAST> = {
  [type in keyof G]?:
    G[type] extends AST.TypeNode<infer Self, any> ? {
      [field in keyof ShapeSchema.GetInheritedFields<G, Self>]?: Resolver<
        G,
        Extract<ShapeSchema.GetInheritedFields<G, Self>[field], AST.GraphQLNode>,
        Self
      >;
    } :
    G[type] extends AST.InterfaceTypeNode<infer Self, infer Fields> ? {
      __resolveType(parent: {
        [fieldName in keyof Fields]?: gql.Value<G, Fields[fieldName]>;
      } & Record<string, unknown>, context: any, info: any): ShapeSchema.GetInterfaceTypes<G, Self>;
    }:
    G[type] extends AST.UnionTypeNode<any, infer U> ? {
      __resolveType(obj: any, context: any, info: any): U[Extract<keyof U, number>];
    }: never
  ;
}

export type Resolver<G extends AST.GraphQLAST, Node extends AST.GraphQLNode, Self extends keyof G = never> =
  Node extends AST.FunctionNode<infer Args, infer Returns> ? (args: {
    [argName in keyof Args]: gql.Value<G, Args[argName]>;
  }) => gql.Value<G, Returns> | Promise<gql.Value<G, Returns>> :
  () => gql.Value<G, Node, Self> | Promise<gql.Value<G, Node, Self>>
;