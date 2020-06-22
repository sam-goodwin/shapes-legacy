import * as gql from '@shapes/graphql';
import { QueryHookOptions, QueryResult, useQuery } from '@apollo/client';

export function useShapeQuery<TVariables extends Record<string, any>, TData>(
  query: gql.CompiledVariableGqlQuery<TVariables, TData>,
  options: QueryHookOptions<TData, TVariables> & {
    variables: TVariables;
  }
): QueryResult<TData, TVariables>;

export function useShapeQuery<TData>(
  query: gql.CompiledGqlQuery<TData>,
  options?: QueryHookOptions<TData, undefined> 
): QueryResult<TData, undefined>;

export function useShapeQuery(
  query: gql.CompiledGqlQuery<any> | gql.CompiledVariableGqlQuery<any, any>,
  options?: QueryHookOptions<any, any>
): any {
  return useQuery({
    kind: 'Document',
    definitions: [query.queryAST]
  }, options)
}