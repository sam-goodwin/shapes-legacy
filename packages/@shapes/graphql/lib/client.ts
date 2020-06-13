import { GraphQLAST, GraphQLNode, InputParameter, RequestTypeNodes, TypeNode } from './ast';
import { GraphQLSchema } from './schema';
import { GqlResult, GqlResultType, Selector } from './selector';
import { Value } from './value';

export function gqlClient<S extends GraphQLSchema>(schema: S): GqlClient<S> {
  throw new Error('todo');
}

export class GqlClient<S extends GraphQLSchema> {
  public query<
    U extends GqlQueryResult
  >(
    f: (i: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): Promise<GetGqlQueryResult<U>> {
    throw new Error(`Not Implemented`);
  }

  public compileQuery<
    U extends GqlQueryResult
  >(
    f: (i: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<never, undefined, GetGqlQueryResult<U>>;

  public compileQuery<
    Name extends string,
    U extends GqlQueryResult
  >(
    queryName: Name,
    f: (root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<Name, undefined, GetGqlQueryResult<U>>;

  public compileQuery<
    Parameters extends RequestTypeNodes,
    U extends GqlQueryResult
  >(
    parameters: Parameters,
    f: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<never, {
    [parameterName in keyof Parameters]: Value<S['graph'], Parameters[parameterName]>;
  }, GetGqlQueryResult<U>>;

  public compileQuery<
    Name extends string,
    Parameters extends RequestTypeNodes,
    U extends GqlQueryResult
  >(
    name: Name,
    parameters: Parameters,
    f: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<never, {
    [parameterName in keyof Parameters]: Value<S['graph'], Parameters[parameterName]>;
  }, GetGqlQueryResult<U>>;

  public compileQuery(a: any, b?: any, c?: any): CompiledGqlQuery<string, any, any> {
    throw new Error(`Not Implemented`);
  }

  mutation: S['mutation'] extends keyof S['graph'] ?
    <U extends GqlResult>(f: (i: GqlRoot<S['graph'], Extract<S['graph'][S['mutation']], TypeNode>>) => U) => Promise<GqlResultType<U>> :
    never;
}

export type GqlRoot<Graph extends GraphQLAST, Root extends TypeNode> = {
  [field in keyof GraphQLAST.GetInheritedFields<Graph, Root['id']>]: Selector<
    Graph,
    Extract<GraphQLAST.GetInheritedFields<Graph, Root['id']>[field], GraphQLNode>,
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
