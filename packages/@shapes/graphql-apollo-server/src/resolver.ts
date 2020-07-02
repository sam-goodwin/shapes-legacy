import * as gql from '@shapes/graphql';

import { AST, ShapeSchema } from '@shapes/graphql';
import { GraphQLAST } from '@shapes/graphql/esm/ast';

export type Resolvers<S extends ShapeSchema<any, any>> = {
  [type in keyof S['graph']]?:
    S['graph'][type] extends AST.TypeNode<infer Self, any> ? {
      [field in keyof ShapeSchema.GetInheritedFields<S['graph'], Self>]?: Resolver<
        {
          [f in keyof gql.ShapeSchema.GetInheritedFields<S['graph'], Self>]+?: any;
        } & {
          [f in string]+?: f extends keyof gql.ShapeSchema.GetInheritedFields<S['graph'], Self> ? never : any;
        },
        S['graph'],
        Extract<ShapeSchema.GetInheritedFields<S['graph'], Self>[field], AST.GraphQLNode>
      >;
    } :
    S['graph'][type] extends AST.InterfaceTypeNode<infer Self, infer Fields> ? {
      __resolveType(obj: {
        [fieldName in keyof Fields]?: gql.Value<S['graph'], Fields[fieldName]>;
      } & Record<string, unknown>, context: any, info: any): ShapeSchema.GetInterfaceTypes<S['graph'], Self>;
    }:
    S['graph'][type] extends AST.UnionTypeNode<any, infer U> ? {
      __resolveType(obj: Record<string, unknown>, context: any, info: any): U[Extract<keyof U, number>];
    }: never
  ;
}

export type Resolver<
  Parent,
  G extends AST.GraphQLAST,
  Node extends AST.GraphQLNode,
> =
  Node extends AST.FunctionNode<infer Args, infer Returns> ? (parent: Parent, args: {
    [argName in keyof Args]: gql.Value<G, Args[argName]>;
  }) => ResolverValue<G, Returns> :
  (parent: Parent) => ResolverValue<G, Node>;


type ResolverValue<G extends GraphQLAST, T> = T extends gql.AST.ScalarType<any> | gql.AST.ListTypeNode<gql.AST.ScalarType<any>> ?
  gql.Value<G, T> | Promise<gql.Value<G, T>> : // if it is a primitive type, require type-safety
  any 