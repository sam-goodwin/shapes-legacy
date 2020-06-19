import { EnumType, GraphQLAST, GraphQLInputFields, GraphQLReturnFields, InputType, InterfaceType, ReferenceType, Type, UnionType } from './ast';
import { RowLacks } from './util';

export function schemaBuilder(): GraphQLSchemaBuilder<{}> {
  return new GraphQLSchemaBuilder<{}>({});
}

export interface GraphQLSchema<
  T extends GraphQLAST = GraphQLAST,
  Query extends keyof T = keyof T,
  Mutation extends keyof T | undefined = keyof T | undefined
> {
  readonly graph: T;
  readonly query: Query;
  readonly mutation: Mutation;
}

export class GraphQLSchemaBuilder<G extends GraphQLAST = GraphQLAST> {
  constructor(public readonly graph: G) {}

  public build<
    Q extends keyof G,
    M extends keyof G | undefined
  >(props: {
    query: Q,
    mutation?: M
  }): GraphQLSchema<G, Q, M> {
    return {
      graph: this.graph,
      mutation: props.mutation!,
      query: props.query
    };
  }

  public import<S2 extends {graph: GraphQLAST}>(types: S2): GraphQLSchemaBuilder<G & S2['graph']> {
    return new GraphQLSchemaBuilder({
      ...this.graph,
      ...types
    }) as any;
  }

  public interface<I extends InterfaceDefinitions<G>>(i: RowLacks<I, keyof G> | ((schema: G) => I)): GraphQLSchemaBuilder<G & {
    [ID in Extract<keyof I, string>]: InterfaceType<
      ID,
      (
        I[ID]['fields'] extends (...args: any[]) => GraphQLReturnFields ? ReturnType<I[ID]['fields']> :
        I[ID]['fields'] extends GraphQLReturnFields ? I[ID]['fields']:
        never
      ),
      I[ID]['extends'] extends (keyof G)[] ? I[ID]['extends'] : undefined
    >;
  }> {
    return new GraphQLSchemaBuilder({
      ...this.graph,
      ...(Object.entries(i).map(([ID, v]) => ({
        [ID]: new InterfaceType(ID, typeof v.fields === 'function' ? v.fields({
          ...this.graph,
          [ID]: new ReferenceType(ID)
        }) : v.fields, v.extends)
      })).reduce((a, b) => ({...a, ...b})))
    }) as any;
  }

  public type<I extends TypeDefinitions<G>>(i: RowLacks<I, keyof G> | ((schema: G) => I)): GraphQLSchemaBuilder<G & {
    [ID in keyof I]: ID extends string ? Type<
      ID,
      I[ID]['fields'] extends (...args: any[]) => GraphQLReturnFields ?
        ReturnType<I[ID]['fields']> :
        Extract<I[ID]['fields'], GraphQLReturnFields>,
      I[ID]['implements'] extends (keyof G)[] ? I[ID]['implements'] : undefined
    > : never;
  }> {
    return new GraphQLSchemaBuilder({
      ...this.graph,
      ...(Object.entries(i).map(([ID, v]) => ({
        [ID]: new InterfaceType(ID, typeof v.fields === 'function' ? v.fields({
          ...this.graph,
          [ID]: new ReferenceType(ID)
        }) : v.fields, v.implements)
      })).reduce((a, b) => ({...a, ...b})))
    }) as any;
  }

  public input<I extends InputTypeDefinitions<G>>(i: RowLacks<I, keyof G> | ((schema: G) => I)): GraphQLSchemaBuilder<G & {
    [ID in keyof I]: ID extends string ?
      InputType<
        ID,
        I[ID] extends (...args: any[]) => infer U ?
          Extract<U, GraphQLInputFields> :
          Extract<I[ID], GraphQLInputFields>
      > :
      never;
  }> {
    return new GraphQLSchemaBuilder({
      ...this.graph,
      ...(Object.entries(i).map(([ID, v]) => ({
        [ID]: new InputType(ID, typeof v.fields === 'function' ? v.fields({
          ...this.graph,
          [ID]: new ReferenceType(ID)
        }) : v.fields)
      })).reduce((a, b) => ({...a, ...b})))
    }) as any;
  }

  public union<U extends UnionDefinitions<G>>(union: U): GraphQLSchemaBuilder<G & {
    [ID in keyof U]: ID extends string ? UnionType<ID, U[ID]> : never;
  }> {
    return new GraphQLSchemaBuilder({
      ...this.graph,
      ...(Object.entries(union).map(([ID, u]) => ({
        [ID]: new UnionType(ID, u)
      })).reduce((a, b) => ({...a, ...b})))
    }) as any;
  }

  public enum<D extends EnumDefinitions>(definitions: D): GraphQLSchemaBuilder<G & {
    [ID in keyof D]: ID extends string ? EnumType<ID, D[ID]> : never;
  }> {
    return new GraphQLSchemaBuilder({
      ...this.graph,
      ...(Object.entries(definitions).map(([ID, v]) => ({
        [ID]: new EnumType(ID, v)
      })).reduce((a, b) => ({...a, ...b})))
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
  fields: GraphQLReturnFields
}
type InterfaceDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: InterfaceDefinition<T>;
};

interface TypeDefinition<
  T extends GraphQLAST = GraphQLAST,
  E extends (GraphQLAST.CollectNodes<{type: 'interface'}, T>['id'])[] | undefined =
    (GraphQLAST.CollectNodes<{type: 'interface'}, T>['id'])[] | undefined
> {
  implements?: E;
  fields: GraphQLReturnFields;
}
type TypeDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: TypeDefinition<T>;
};

type InputTypeDefinition<T extends GraphQLAST = GraphQLAST> = GraphQLReturnFields | ((schema: T) => GraphQLReturnFields);
type InputTypeDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: InputTypeDefinition<T>;
};

type EnumDefinitions = {
  [ID in string]: {
    [id in string]: string;
  }
};

type UnionDefinitions<T extends GraphQLAST = GraphQLAST> = {
  [ID in string]: GraphQLAST.CollectNodes<{type: 'type'}, T>['id'][]
};
