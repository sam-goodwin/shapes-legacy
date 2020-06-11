import { EnumType, GraphQLASTNode, GraphQLAST, GraphQLInputFields, GraphQLReturnFields, InputType, ReferenceType, ScalarType, SelfType, Type } from './ast';
import { KeysOfType } from './util';

export type Values<
  Graph extends GraphQLAST,
  Args extends GraphQLInputFields | GraphQLReturnFields,
  Self extends keyof Graph = never
> = {
  [arg in keyof Args]+?: Value<Graph, Args[arg], Self>;
} & {
  [arg in KeysOfType<Args, {required: true;}>]-?: Value<Graph, Args[arg], Self>;
};

export type Value<
  Graph extends GraphQLAST,
  Node extends GraphQLASTNode,
  Self extends keyof Graph = never
> =
  Node extends { required: true; } ?
    _Value<Graph, Node, Self> :
    undefined | _Value<Graph, Node, Self>
;

type _Value<
  Graph extends GraphQLAST,
  Node extends GraphQLASTNode,
  Self extends keyof Graph = never
> =
  Node extends ScalarType<'String' | 'ID'> ? string :
  Node extends ScalarType<'Int' | 'Float'> ? number :
  Node extends ScalarType<'Bool'> ? boolean :
  Node extends InputType<infer ID, infer F> ? Values<Graph, F, ID> :
  Node extends EnumType<string, infer V> ? V[keyof V] :
  Node extends Type<infer ID, infer F> ? Values<Graph, F, ID> :
  Node extends SelfType ? {
    [_ in keyof Node]: Exclude<Value<Graph, Graph[Self], Self>, undefined>
  }[keyof Node] :
  Node extends ReferenceType<infer $ref> ? {
    [_ in keyof Node]: Exclude<Value<Graph, Graph[$ref], $ref>, undefined>
  }[keyof Node] :
  never
;
