import { UnionToIntersection } from './util';

export type GraphQLASTNode = GraphQLReturnType | GraphQLInputType;

export type GraphQLAST = Record<string, GraphQLASTNode>
export namespace GraphQLAST {
  /**
   * Collect all nodes from the AST that are of a certain type.
   */
  export type CollectNodes<T extends {type: GraphQLASTNode['type']}, S extends GraphQLAST> = Extract<S[keyof S], T>;

  /**
   * Get fields inherited from a type/interface's implemented/extended interfaces.
   */
  export type GetInheritedFields<G extends GraphQLAST, T extends keyof G> =
    G[T] extends Type<string, infer F1, infer Implements> | InterfaceType<any, infer F1, infer Implements> ?
      Implements extends (keyof G)[] ? UnionToIntersection<{
        [k in Implements[Extract<keyof Implements, number>]]:
          G[k] extends InterfaceType<any, infer F2, infer Extends> ?
            Extends extends (keyof G)[] ?
              F1 & F2 & GetInheritedFields<G, Extends[Extract<keyof Extends, number>]> :
              F1 & F2 :
          F1
      }[Implements[Extract<keyof Implements, number>]]> :
      F1 :
    never
  ;

  export type GetInheritedFieldNames<G extends GraphQLAST, T extends keyof G> = keyof GetInheritedFields<G, T>;

  /**
   * Get all interfaces extended by another interface.
   */
  export type GetInterfaces<G extends GraphQLAST, ID extends keyof G> =
    G[ID] extends InterfaceType<any, any, infer Extends> ?
      Extends extends (keyof G)[] ?
        ID | { [k in keyof Extends]: GetInterfaces<G, Extends[Extract<keyof Extends, number>]> }[keyof Extends] :
        ID :
      never
  ;

  /**
   * Get the types that implement an interface.
   */
  export type GetInterfaceTypes<G extends GraphQLAST, I extends keyof G> = {
    [ID in keyof G]: G[ID] extends Type<infer T, any, infer Implements> ?
      I extends GetInterfaces<G, Extract<Implements[Extract<keyof Implements, number>], keyof G>> ?
        T :
        never :
      never
  }[keyof G];
}

export type GraphQLType = (
  | EnumType
  | FunctionType
  | InterfaceType
  | ListType<GraphQLType>
  | ReferenceType
  | ScalarType
  | Type
  | UnionType
);

export type GraphQLReturnFields = Record<string, GraphQLReturnType>;

export type GraphQLReturnType = (
  | EnumType
  | FunctionType
  | InterfaceType
  | ListType<GraphQLReturnType>
  | ReferenceType
  | ScalarType
  | Type
  | UnionType
  | SelfType
);

export type GraphQLInputType = (
  | EnumType
  | InputType
  | ListType<GraphQLInputType>
  | ScalarType
  | ReferenceType
);

export type GraphQLInputFields = Record<string, GraphQLInputType>;

export class BaseType {
  // @ts-ignore
  public readonly required: boolean;
  // @ts-ignore
  public get ['!'](): this & {required: true;} {
    return {
      ...this,
      required: true
    } as const;
  }
}

export class ScalarType<ID extends string = string> extends BaseType {
  public readonly type: 'scalar' = 'scalar';
  constructor(
    public readonly id: ID
  ) {
    super();
  }
}

export class ListType<T extends GraphQLASTNode = GraphQLASTNode> extends BaseType {
  public readonly type: 'list' = 'list';
  public readonly id?: never;

  constructor(
    public readonly item: T,
  ) {
    super();
  }
}

export class ReferenceType<ID extends string = string> extends BaseType {
  public readonly type: 'reference' = 'reference';
  constructor(
    public readonly id: ID
  ) {
    super();
  }
}

export class SelfType extends BaseType {
  public readonly type: 'self' = 'self';
}

export class InterfaceType<
  ID extends string = string,
  F extends GraphQLReturnFields = GraphQLReturnFields,
  E extends string[] | undefined = string[] | undefined
> extends BaseType {
  public readonly type: 'interface' = 'interface';

  public readonly interfaces: E;

  constructor(
    public readonly id: ID,
    public readonly fields: F,
    _extends: E
  ) {
    super();
    this.interfaces = _extends;
  }
}

export class Type<
  ID extends string = string,
  F extends GraphQLReturnFields = GraphQLReturnFields,
  I extends string[] | undefined = string[] | undefined
> extends BaseType {
  public readonly type: 'type' = 'type';

  public readonly interfaces: I;

  constructor(
    public readonly id: ID,
    public readonly fields: F,
    _implements: I
  ) {
    super();
    this.interfaces = _implements;
  }
}

export class InputType<
  ID extends string = string,
  F extends GraphQLInputFields = GraphQLInputFields
> extends BaseType {
  public readonly type: 'input' = 'input';

  constructor(
    public readonly id: ID,
    public readonly fields: F,
  ) {
    super();
  }
}

export type UnionValue =
  | Type
  | InterfaceType
  | UnionType
;
export class UnionType<
  ID extends string = string,
  U extends string[] = string[]
> extends BaseType {
  public readonly type: 'union' = 'union';
  constructor(
    public readonly id: ID,
    public readonly union: U
  ) {
    super();
  }
}

export type EnumValues = Record<string, string>
export class EnumType<
  ID extends string = string,
  E extends EnumValues = EnumValues
> extends BaseType {
  public readonly type: 'enum' = 'enum';
  constructor(
    public readonly id: ID,
    public readonly values: E
  ) {
    super();
  }
}

export class FunctionType<
  Args extends GraphQLInputFields = GraphQLInputFields,
  Returns extends GraphQLReturnType = GraphQLReturnType
> extends BaseType {
  public readonly id?: never;
  // @ts-ignore
  public readonly type: 'function';

  constructor(
    public readonly args: Args,
    public readonly returns: Returns
  ) {
    super();
  }
}

export class InputParameter<ID extends string, T extends GraphQLInputType> {
  // @ts-ignore
  public readonly type: 'parameter';
  constructor(
    public readonly id: ID,
    public readonly parameterType: T
  ) {}
}

export type PrimtiveType =
  | ScalarType
  | EnumType
  | ListType<PrimtiveType>
;

export function isPrimitiveType(node: GraphQLASTNode): node is PrimtiveType {
  return node.type === 'scalar' || node.type === 'enum' || (node.type === 'list' && isPrimitiveType(node.item));
}

export function assertIsType(type: GraphQLASTNode): asserts type is Type {
  if (type.type !== 'type') {
    throw new Error('can only query a root type');
  }
}
export function isType(type: GraphQLASTNode): type is Type {
  return type.type !== 'type';
}

export function isTypeOrInterface(type: GraphQLASTNode): type is Type | InterfaceType {
  return type !== undefined && (type.type === 'type' || type.type === 'interface');
}
export function assertIsTypeOrInterface(type: GraphQLASTNode): asserts type is Type {
  if (type && isTypeOrInterface(type)) {
    throw new Error('can only query a root type');
  }
}
