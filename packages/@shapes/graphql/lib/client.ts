import { DocumentNode } from 'graphql';
import { GraphQLAST, GraphQLASTNode, GraphQLInputFields, GraphQLInputType, InputParameter, Type } from './ast';
import { GraphQLSchema } from './schema';
import { GQL, GqlResult, GqlResultType, Selector } from './selector';
import { Value } from './value';

export function gqlClient<S extends GraphQLSchema>(schema: S): GqlClient<S> {
  throw new Error('todo');
}

export interface GqlClient<S extends GraphQLSchema> {
  query<
    U extends GqlQueryResult
  >(
    f: (i: GqlRoot<S['graph'], Extract<S['graph'][S['query']], Type>>) => U
  ): Promise<GetGqlQueryResult<U>>;

  compileQuery<
    U extends GqlQueryResult
  >(
    f: (i: GqlRoot<S['graph'], Extract<S['graph'][S['query']], Type>>) => U
  ): CompiledGqlQuery<never, undefined, GetGqlQueryResult<U>>;

  compileQuery<
    Name extends string,
    U extends GqlQueryResult
  >(
    queryName: Name,
    f: (root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], Type>>) => U
  ): CompiledGqlQuery<Name, undefined, GetGqlQueryResult<U>>;

  compileQuery<
    Parameters extends GraphQLInputFields,
    U extends GqlQueryResult
  >(
    parameters: Parameters,
    f: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], Type>>) => U
  ): CompiledGqlQuery<never, {
    [parameterName in keyof Parameters]: Value<S['graph'], Parameters[parameterName]>;
  }, GetGqlQueryResult<U>>;

  compileQuery<
    Name extends string,
    Parameters extends GraphQLInputFields,
    U extends GqlQueryResult
  >(
    name: Name,
    parameters: Parameters,
    f: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], Type>>) => U
  ): CompiledGqlQuery<never, {
    [parameterName in keyof Parameters]: Value<S['graph'], Parameters[parameterName]>;
  }, GetGqlQueryResult<U>>;

  mutation: S['mutation'] extends keyof S['graph'] ?
    <U extends GqlResult>(f: (i: GqlRoot<S['graph'], Extract<S['graph'][S['mutation']], Type>>) => U) => Promise<GqlResultType<U>> :
    never;
}

export type GqlRoot<Graph extends GraphQLAST, Root extends Type> = {
  [field in keyof GraphQLAST.GetInheritedFields<Graph, Root['id']>]: Selector<
    Graph,
    Extract<GraphQLAST.GetInheritedFields<Graph, Root['id']>[field], GraphQLASTNode>,
    Root['id']
  >
};

type GqlQueryResult = GqlResult | Record<string, GqlResult>;
type GetGqlQueryResult<U extends GqlQueryResult> =
  U extends GqlResult<infer T> ? T :
  U extends Record<string, GqlResult> ? {
    [alias in keyof U]: GqlResultType<U[alias]>
  } :
  never;


export interface CompiledGqlQuery<
  Name extends string,
  Input,
  Output,
> {
  queryName: Name;
  execute: Input extends undefined ?
    (input?: Input) => Promise<Output> :
    (input: Input) => Promise<Output>;
}
