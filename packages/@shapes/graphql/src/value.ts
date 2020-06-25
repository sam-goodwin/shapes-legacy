import { BooleanNode, EnumTypeNode, FloatNode, GraphQLAST, GraphQLNode, IDNode, InputTypeNode, IntNode, ListTypeNode, ReferenceTypeNode, RequestTypeNodes, ReturnTypeNodes, SelfTypeNode, StringNode, TypeNode, UnionTypeNode } from './ast';
import { KeysOfType } from './util';

export type Values<
  Graph extends GraphQLAST,
  Args extends RequestTypeNodes | ReturnTypeNodes,
  Self extends keyof Graph = never
> = {
  [arg in keyof Args]+?: Value<Graph, Args[arg], Self>;
} & {
  [arg in KeysOfType<Args, {required: true;}>]-?: Value<Graph, Args[arg], Self>;
};

export type Value<
  Graph extends GraphQLAST,
  Node extends GraphQLNode,
  Self extends keyof Graph = never
> = (Node['required'] extends true ?
  _Value<Graph, Node, Self> :
  undefined | _Value<Graph, Node, Self>
);

type _Value<
  Graph extends GraphQLAST,
  Node extends GraphQLNode,
  Self extends keyof Graph = never
> =
  Node extends StringNode | IDNode ? string :
  Node extends IntNode | FloatNode ? number :
  Node extends BooleanNode ? boolean :
  Node extends InputTypeNode<infer ID, infer F> ? Values<Graph, F, ID> :
  Node extends EnumTypeNode<string, infer V> ? V[keyof V] :
  Node extends TypeNode<infer ID, infer F> ? Values<Graph, F, ID> :
  Node extends UnionTypeNode<any, infer U> ? {
    [_ in keyof Node]: _Value<Graph, Graph[Extract<U[keyof U], keyof Graph>]>;
  }[keyof Node] :
  Node extends ListTypeNode<infer I> ? {
    [_ in keyof I]: Value<Graph, I, Self>[]
  }[keyof I] :
  Node extends SelfTypeNode ? {
    [_ in keyof Node]: _Value<Graph, Graph[Self], Self>;
  }[keyof Node] :
  Node extends ReferenceTypeNode<infer $ref> ? {
    [_ in keyof Node]: _Value<Graph, Graph[$ref], $ref>;
  }[keyof Node] :
  never
;
