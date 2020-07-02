import { BooleanNode, EnumTypeNode, FloatNode, GraphQLAST, GraphQLNode, IDNode, InputTypeNode, IntNode, InterfaceTypeNode, ListTypeNode, ReferenceTypeNode, RequestTypeNodes, ReturnTypeNodes, SelfTypeNode, StringNode, TypeNode, UnionTypeNode } from './ast';
import { KeysOfType, UnionToIntersection } from './util';

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
  Node extends InterfaceTypeNode<infer ID, infer F, any> ? Values<Graph, F, ID> :
  Node extends InterfaceTypeNode<infer ID, infer F, infer Extends> ?
    Values<Graph, F, ID> & UnionToIntersection<{
      [i in Extract<keyof Extends, number>]:
        Value<Graph, Graph[Extract<Extends[i], keyof Graph>], Extract<Extends[i], keyof Graph>>;
    }[Extract<keyof Extends, number>]> :

  Node extends TypeNode<infer ID, infer F, any> ? Values<Graph, F, ID> :
  Node extends TypeNode<infer ID, infer F, infer Implements> ?
    Values<Graph, F, ID> & UnionToIntersection<{
      [i in Extract<keyof Implements, number>]: 
        Graph[Extract<Implements[i], keyof Graph>] extends InterfaceTypeNode<infer ID2, infer F2, undefined> ?
          Values<Graph, F2, ID2> :
        Graph[Extract<Implements[i], keyof Graph>] extends InterfaceTypeNode<infer ID2, infer F2, infer Extends> ?
          Values<Graph, F2, ID2> & UnionToIntersection<{
            [i in Extract<keyof Extends, number>]: Value<Graph, Graph[Extract<Extends[i], keyof Graph>], Extract<Extends[i], keyof Graph>>;
          }[Extract<keyof Extends, number>]> :
        never
    }[Extract<keyof Implements, number>]>
    :
  Node extends UnionTypeNode<any, infer U> ? {
    [_ in keyof Node]: _Value<Graph, Graph[Extract<U[keyof U], keyof Graph>]>;
  }[keyof Node] :
  Node extends ListTypeNode<infer I> ? Value<Graph, I, Self>[] :
  Node extends SelfTypeNode ? {
    [_ in keyof Node]: _Value<Graph, Graph[Self], Self>;
  }[keyof Node] :
  Node extends ReferenceTypeNode<infer $ref> ? {
    [_ in keyof Node]: _Value<Graph, Graph[$ref], $ref>;
  }[keyof Node] :
  never
;
