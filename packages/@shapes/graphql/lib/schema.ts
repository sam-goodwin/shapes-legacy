import { EnumTypeNode, GraphQLAST, InputTypeNode, InterfaceTypeNode, ReferenceTypeNode, RequestTypeNodes, ReturnTypeNodes, TypeNode, UnionTypeNode } from './ast';
import { RowLacks } from './util';

export interface Schema<
  T extends GraphQLAST = GraphQLAST,
  Query extends keyof T = keyof T,
  Mutation extends keyof T | undefined = keyof T | undefined
> {
  readonly graph: T;
  readonly query: Query;
  readonly mutation: Mutation;
}

export class SchemaBuilder<G extends GraphQLAST = {}> {
  public readonly graph: G;
  constructor(graph?: G) {
    this.graph = graph || {} as any;
  }

  public build<
    Q extends keyof G,
    M extends keyof G | undefined
  >(props: {
    query: Q,
    mutation?: M
  }): Schema<G, Q, M> {
    return {
      graph: this.graph,
      query: props.query,
      mutation: props.mutation!
    };
  }

  public import<S2 extends {graph: GraphQLAST}>(types: S2): SchemaBuilder<G & S2['graph']> {
    return new SchemaBuilder({
      ...this.graph,
      ...types
    }) as any;
  }

  public interface<I extends InterfaceDefinitions<G>>(def: RowLacks<I, keyof G> | ((schema: G) => I)): SchemaBuilder<G & {
    [ID in Extract<keyof I, string>]: InterfaceTypeNode<
      ID,
      (
        I[ID]['fields'] extends (...args: any[]) => ReturnTypeNodes ? ReturnType<I[ID]['fields']> :
        I[ID]['fields'] extends ReturnTypeNodes ? I[ID]['fields']:
        never
      ),
      I[ID]['extends'] extends (keyof G)[] ? I[ID]['extends'] : undefined
    >;
  }> {
    return new SchemaBuilder<any>({
      ...this.graph,
      ...(Object.entries(typeof def === 'function' ? def(this.graph) : def).map(([ID, interfaceDef]) => ({
        [ID]: new InterfaceTypeNode(ID, interfaceDef.fields, interfaceDef.extends)
      })).reduce((a, b) => ({...a, ...b}), {}))
    }) as any;
  }

  public type<I extends TypeDefinitions<G>>(def: RowLacks<I, keyof G> | ((schema: G) => I)): SchemaBuilder<G & {
    [ID in keyof I]: ID extends string ? TypeNode<
      ID,
      I[ID]['fields'] extends (...args: any[]) => ReturnTypeNodes ?
        ReturnType<I[ID]['fields']> :
        Extract<I[ID]['fields'], ReturnTypeNodes>,
      I[ID]['implements'] extends (keyof G)[] ? I[ID]['implements'] : undefined
    > : never;
  }> {
    return new SchemaBuilder<any>({
      ...this.graph,
      ...(Object.entries(typeof def === 'function' ? def(this.graph) : def).map(([ID, typeDef]) => ({
        [ID]: new TypeNode(ID, typeDef.fields, typeDef.implements)
      })).reduce((a, b) => ({...a, ...b}), {}))
    }) as any;
  }

  public input<I extends InputTypeDefinitions>(def: RowLacks<I, keyof G> | ((schema: G) => I)): SchemaBuilder<G & {
    [ID in keyof I]: ID extends string ?
      InputTypeNode<
        ID,
        I[ID] extends (...args: any[]) => infer U ?
          Extract<U, RequestTypeNodes> :
          Extract<I[ID], RequestTypeNodes>
      > :
      never;
  }> {
    return new SchemaBuilder({
      ...this.graph,
      ...(Object.entries(typeof def === 'function' ? def(this.graph) : def).map(([ID, fields]) => ({
        [ID]: new InputTypeNode(ID, fields)
      })).reduce((a, b) => ({...a, ...b}), {}))
    }) as any;
  }

  public union<U extends UnionDefinitions<G>>(union: U): SchemaBuilder<G & {
    [ID in keyof U]: ID extends string ? UnionTypeNode<ID, U[ID]> : never;
  }> {
    return new SchemaBuilder<any>({
      ...this.graph,
      ...(Object.entries(union).map(([ID, u]) => ({
        [ID]: new UnionTypeNode(ID, u)
      })).reduce((a, b) => ({...a, ...b}), {}))
    }) as any;
  }

  public enum<D extends EnumDefinitions>(definitions: D): SchemaBuilder<G & {
    [ID in keyof D]: ID extends string ? EnumTypeNode<ID, D[ID]> : never;
  }> {
    return new SchemaBuilder({
      ...this.graph,
      ...(Object.entries(definitions).map(([ID, v]) => ({
        [ID]: new EnumTypeNode(ID, v)
      })).reduce((a, b) => ({...a, ...b}), {}))
      // [id]: new EnumType(id, values)
    }) as any;
  }
}

type Interfaces<T extends GraphQLAST> = (GraphQLAST.CollectNodes<{type: 'interface'}, T>['id'])[];

interface InterfaceDefinition<
  T extends GraphQLAST = GraphQLAST,
  E extends Interfaces<T> | undefined = Interfaces<T> | undefined
> {
  extends?: E;
  fields: ReturnTypeNodes
}
type InterfaceDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: InterfaceDefinition<T>;
};

interface TypeDefinition<
  G extends GraphQLAST = GraphQLAST,
  E extends (GraphQLAST.CollectNodes<{type: 'interface'}, G>['id'])[] | undefined =
    (GraphQLAST.CollectNodes<{type: 'interface'}, G>['id'])[] | undefined
> {
  implements?: E;
  fields: ReturnTypeNodes;
}
type TypeDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: TypeDefinition<T>;
};

type InputTypeDefinitions = {
  [ID in string]: RequestTypeNodes;
};

type EnumDefinitions = {
  [ID in string]: {
    [id in string]: string;
  }
};

type UnionDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: GraphQLAST.CollectNodes<{type: 'type'}, T>['id'][]
};
