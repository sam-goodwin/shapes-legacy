import { GraphQLNode, BoolNode, EnumTypeNode, FloatNode, GraphQLAST, RequestTypeNodes, ReturnTypeNodes, IDNode, InputTypeNode, IntNode, ReferenceTypeNode, SelfTypeNode, StringNode, TypeNode } from './ast';
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
> =
  Node extends { required: true; } ?
    _Value<Graph, Node, Self> :
    undefined | _Value<Graph, Node, Self>
;

type _Value<
  Graph extends GraphQLAST,
  Node extends GraphQLNode,
  Self extends keyof Graph = never
> =
  Node extends StringNode | IDNode ? string :
  Node extends IntNode | FloatNode ? number :
  Node extends BoolNode ? boolean :
  Node extends InputTypeNode<infer ID, infer F> ? Values<Graph, F, ID> :
  Node extends EnumTypeNode<string, infer V> ? V[keyof V] :
  Node extends TypeNode<infer ID, infer F> ? Values<Graph, F, ID> :
  Node extends SelfTypeNode ? {
    [_ in keyof Node]: Exclude<Value<Graph, Graph[Self], Self>, undefined>
  }[keyof Node] :
  Node extends ReferenceTypeNode<infer $ref> ? {
    [_ in keyof Node]: Exclude<Value<Graph, Graph[$ref], $ref>, undefined>
  }[keyof Node] :
  never
;
