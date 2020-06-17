import { FunctionNode, GraphQLAST, GraphQLNode, InputParameter, InterfaceTypeNode, ListTypeNode, PrimtiveTypeNode, ReferenceTypeNode, RequestTypeNode, RequestTypeNodes, ReturnTypeNodes, SelfTypeNode, TypeNode, UnionTypeNode } from './ast';
import { Value } from './value';

export const GQL = Symbol.for('@shapes/graphql');
export type GQL = typeof GQL;
export interface GqlResult<T = any> {
  [GQL]: {
    read(json: any): T;
  }
}

export type GqlResultType<T extends GqlResult> = ReturnType<T[GQL]['read']>;

export type FunctionParameters<
  Graph extends GraphQLAST,
  Parameters extends RequestTypeNodes,
  Self extends keyof Graph = never
> = {
  [parameterName in keyof Parameters]:
    | Value<Graph, Parameters[parameterName], Self>
    | InputParameter<string, Parameters[parameterName]>
  ;
};

export type Selector<
  Graph extends GraphQLAST,
  Node extends GraphQLNode,
  Self extends keyof Graph = never
> =
  Node extends FunctionNode<infer Args, infer Returns> ?
    Returns extends PrimtiveTypeNode ?
      (args: FunctionParameters<Graph, Args, Self>) => GqlResult<Value<Graph, Returns, Self>> :
      <R extends GqlResult>(
        args: FunctionParameters<Graph, Args, Self>,
        selector: (s: Selector<Graph, Returns>) => R
      ) => R :

  Node extends SelfTypeNode ? {
    [_ in keyof Node]: Selector<Graph, Graph[Self], Self>
  }[keyof Node] :

  Node extends ReferenceTypeNode<infer ID> ? {
    [_ in keyof Node]: Selector<Graph, Graph[ID], ID>
  }[keyof Node] :

  Node extends TypeNode ?
    TypeSelector<Node['id'], Graph> :

  Node extends InterfaceTypeNode | UnionTypeNode ?
    SubTypeSelector<Node['id'], Graph> :

  Node extends ListTypeNode<infer I> ? <R extends GqlResult>(
    selector: (s: Selector<Graph, I, Self>) => R
  ) => GqlResult<GqlResultType<R>[]> :

  () => GqlResult<Value<Graph, Node, Self>>
;

export type TypeSelector<
  Self extends keyof Graph,
  Graph extends GraphQLAST
> =
  Graph[Self] extends TypeNode<any, infer Fields> ?
  TypeFieldSelectors<
    Self,
    Graph,
    Fields & GraphQLAST.GetInheritedFields<Graph, Self>,
    keyof (Fields & GraphQLAST.GetInheritedFields<Graph, Self>),
    {}
  > :
  never
;

export type TypeFieldSelectors<
  Self extends keyof Graph,
  Graph extends GraphQLAST,
  Fields extends ReturnTypeNodes,
  Unselected extends keyof Fields,
  Accumulator extends object,
> =
 & GqlResult<Accumulator>
 & {
  [field in Unselected]: TypeFieldSelector<
    Self,
    Graph,
    Fields,
    Exclude<Unselected, field>,
    Fields[field],
    field,
    Accumulator
  >;
};

/**
 * Defines the call signature for a field on a type.
 */
export type TypeFieldSelector<
  Self extends keyof Graph,
  Graph extends GraphQLAST,
  Fields extends ReturnTypeNodes,
  Unselected extends keyof Fields,
  Node extends GraphQLNode,
  Field extends keyof Fields,
  Accumulator extends object
> =
  Node extends FunctionNode<infer Args, infer Returns> ?
    Returns extends PrimtiveTypeNode ?
      (args: FunctionParameters<Graph, Args, Self>) => TypeFieldSelectors<
        Self,
        Graph,
        Fields,
        Extract<Unselected, keyof Fields>,
        Accumulator & {
          [field in Field]: Value<Graph, Returns, Self>;
        }
      > :
      <R extends GqlResult>(
        args: FunctionParameters<Graph, Args, Self>,
        selector: (s: Selector<Graph, Returns, Self>) => R
      ) => TypeFieldSelectors<
        Self,
        Graph,
        Fields,
        Extract<Unselected, keyof Fields>,
        Accumulator & {
          [field in Field]: GqlResultType<R>;
        }
      > :

  Node extends SelfTypeNode ?
    <R extends GqlResult>(
      selector: (s: Selector<Graph, Graph[Self], Self>) => R
    ) => TypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: GqlResultType<R>;
      }
    > :

  Node extends ReferenceTypeNode<infer $ref> ?
    <R extends GqlResult>(
      selector: (s: Selector<Graph, Graph[$ref], $ref>) => R
    ) => TypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: GqlResultType<R>;
      }
    > :

  Node extends TypeNode | InterfaceTypeNode | UnionTypeNode ?
    <R extends GqlResult>(
      selector: (s: Selector<Graph, Node, Self>) => R
    ) => TypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: GqlResultType<R>;
      }
    > :

  Node extends ListTypeNode<infer I> ?
    I extends PrimtiveTypeNode ? () => TypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: Value<Graph, I, Self>[]
      }
    > :
    I extends ReferenceTypeNode<infer $ref> ?
      Graph[$ref] extends PrimtiveTypeNode ?
        () => TypeFieldSelectors<
          Self,
          Graph,
          Fields,
          Extract<Unselected, keyof Fields>,
          Accumulator & {
            [field in Field]: Value<Graph, I, Self>[]
          }
        > :
        <R extends GqlResult>(
          selector: (s: Selector<Graph, I, Self>) => R
        ) => TypeFieldSelectors<
          Self,
          Graph,
          Fields,
          Extract<Unselected, keyof Fields>,
          Accumulator & {
            [field in Field]: GqlResultType<R>[]
          }
        > :
    <R extends GqlResult>(
      selector: (s: Selector<Graph, I, Self>) => R
    ) => TypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: GqlResultType<R>[]
      }
    > :

  () => TypeFieldSelectors<
    Self,
    Graph,
    Fields,
    Unselected,
    Accumulator & {
      [field in Field]: Value<Graph, Node, Self>;
    }
  >
;

export type SubTypeSelector<
  ID extends keyof Graph,
  Graph extends GraphQLAST
> =
  Graph[ID] extends InterfaceTypeNode<infer ID, infer Fields, any> ?
    SubTypeFieldSelectors<
      ID,
      Graph,
      Fields & GraphQLAST.GetInheritedFields<Graph, ID>,
      keyof Fields | GraphQLAST.GetInheritedFieldNames<Graph, ID>,
      {},
      GraphQLAST.GetInterfaceTypes<Graph, ID>
    > :
  Graph[ID] extends UnionTypeNode<any, infer V> ?
    SubTypeFieldSelectors<
      ID,
      Graph,
      {},
      never,
      {},
      V[Extract<keyof V, number>]
    > :
  never
;

export type SubTypeFieldSelectors<
  Self extends keyof Graph,
  Graph extends GraphQLAST,
  Fields extends ReturnTypeNodes,
  Unselected extends keyof Fields,
  Accumulator extends object,
  Subtypes extends keyof Graph
> =
& OnSelector<
  Graph,
  Subtypes,
  Exclude<keyof Fields, Unselected>,
  Accumulator
>
& GqlResult<Accumulator & {__typename: Subtypes}>
& {
 [field in Unselected]: InterfaceFieldSelector<
   Graph,
   Self,
   Fields,
   Exclude<Unselected, field>,
   Fields[field],
   field,
   Accumulator,
   Subtypes
 >;
};

export type OnSelector<
  Graph extends GraphQLAST,
  Subtypes extends keyof Graph,
  ExcludeFields extends string | symbol | number,
  Accumulator extends object,
> = GqlResult<Accumulator> & {
  $on<T extends Subtypes, R extends GqlResult>(
    type: T,
    selector: (s: Omit<TypeSelector<
      Extract<T, keyof Graph>,
      Graph
    >, ExcludeFields>) => R
  ): _OnSelector<
    Graph,
    Exclude<Subtypes, T>,
    ExcludeFields,
    Accumulator,
    (GqlResultType<R> & {
      __typename: T
    })
  >
};

type _OnSelector<
  Graph extends GraphQLAST,
  Subtypes extends keyof Graph,
  ExcludeFields extends string | symbol | number,
  Accumulator extends object,
  OnAccumulator extends object
> =
& GqlResult<({
  __typename: Subtypes
} | OnAccumulator) & Accumulator>
& {
  $on<T extends Subtypes, R extends GqlResult>(
    type: T,
    selector: (s: Omit<TypeSelector<
      Extract<T, keyof Graph>,
      Graph
    >, ExcludeFields>) => R
  ): _OnSelector<
    Graph,
    Exclude<Subtypes, T>,
    ExcludeFields,
    Accumulator,
    OnAccumulator | (GqlResultType<R> & {
      __typename: T
    })
  >
};

export type InterfaceFieldSelector<
  Graph extends GraphQLAST,
  Self extends keyof Graph,
  Fields extends ReturnTypeNodes,
  Unselected extends keyof Fields,
  Node extends GraphQLNode,
  Field extends string | symbol | number,
  Accumulator extends object,
  Subtypes extends keyof Graph
> =
  Node extends FunctionNode<infer Args, infer Returns> ?
    Returns extends PrimtiveTypeNode ?
      (args: FunctionParameters<Graph, Args, Self>) => SubTypeFieldSelectors<
        Self,
        Graph,
        Fields,
        Extract<Unselected, keyof Fields>,
        Accumulator & {
          [field in Field]: Value<Graph, Returns, Self>;
        },
        Subtypes
      > :
      <R extends GqlResult>(
        args: FunctionParameters<Graph, Args, Self>,
        selector: (s: Selector<Graph, Returns, Self>) => R
      ) => SubTypeFieldSelectors<
        Self,
        Graph,
        Fields,
        Extract<Unselected, keyof Fields>,
        Accumulator & {
          [field in Field]: GqlResultType<R>;
        },
        Subtypes
      > :

    Node extends SelfTypeNode ?
      <R extends GqlResult>(
        selector: (s: Selector<Graph, Graph[Self], Self>) => R
      ) => SubTypeFieldSelectors<
        Self,
        Graph,
        Fields,
        Extract<Unselected, keyof Fields>,
        Accumulator & {
          [field in Field]: GqlResultType<R>;
        },
        Subtypes
      > :

    Node extends ReferenceTypeNode<infer $ref> ?
      <R extends GqlResult>(
        selector: (s: Selector<Graph, Graph[$ref], $ref>) => R
      ) => SubTypeFieldSelectors<
        Self,
        Graph,
        Fields,
        Extract<Unselected, keyof Fields>,
        Accumulator & {
          [field in Field]: GqlResultType<R>;
        },
        Subtypes
      > :

  Node extends TypeNode | InterfaceTypeNode | UnionTypeNode ?
    <R extends GqlResult>(
      selector: (s: Selector<Graph, Node, Self>) => R
    ) => SubTypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: GqlResultType<R>;
      },
      Subtypes
    > :

  Node extends ListTypeNode<infer I> ?
    I extends PrimtiveTypeNode ? () => SubTypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: Value<Graph, I, Self>[]
      },
      Subtypes
    > :
    I extends ReferenceTypeNode<infer $ref> ?
      Graph[$ref] extends PrimtiveTypeNode ?
        () => SubTypeFieldSelectors<
          Self,
          Graph,
          Fields,
          Extract<Unselected, keyof Fields>,
          Accumulator & {
            [field in Field]: Value<Graph, I, Self>[]
          },
          Subtypes
        > :
        <R extends GqlResult>(
          selector: (s: Selector<Graph, I, Self>) => R
        ) => SubTypeFieldSelectors<
          Self,
          Graph,
          Fields,
          Extract<Unselected, keyof Fields>,
          Accumulator & {
            [field in Field]: GqlResultType<R>[]
          },
          Subtypes
        > :
    <R extends GqlResult>(
      selector: (s: Selector<Graph, I, Self>) => R
    ) => SubTypeFieldSelectors<
      Self,
      Graph,
      Fields,
      Extract<Unselected, keyof Fields>,
      Accumulator & {
        [field in Field]: GqlResultType<R>[]
      },
      Subtypes
    > :

  () => SubTypeFieldSelectors<
    Self,
    Graph,
    Fields,
    Unselected,
    Accumulator & {
      [field in Field]: Value<Graph, Node, Self>;
    },
    Subtypes
  >
;


