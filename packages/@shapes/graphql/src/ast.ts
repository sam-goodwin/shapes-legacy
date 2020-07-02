/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export function isGraphQLASTNode(a: any): a is GraphQLNode {
  return typeof a.type === 'string';
}

export type GraphQLNode =
  | EnumTypeNode
  | FunctionNode
  | InputTypeNode
  | InterfaceTypeNode
  | ListTypeNode<any>
  | ReferenceTypeNode
  | ScalarTypeNode
  | SelfTypeNode
  | TypeNode
  | UnionTypeNode
  // | NonNullType<any>
;

export function isRootNode(node: any): node is RootNode {
  return node && typeof node.type === 'string' && (
       isEnumTypeNode(node)
    || isInputTypeNode(node)
    || isInterfaceTypeNode(node)
    || isTypeNode(node)
    || isUnionTypeNode(node)
  );
}

export type RootNode =
  | EnumTypeNode
  | InputTypeNode
  | InterfaceTypeNode
  | TypeNode
  | UnionTypeNode
;

export type GraphQLAST = Record<string, RootNode>

export type ReturnTypeNodes = Record<string, ReturnTypeNode>;

/**
 * The following types are valid in responses - they can be
 * used as the fields in Interfaces and Types
 */
export type ReturnTypeNode = (
  | EnumTypeNode
  | FunctionNode
  | InterfaceTypeNode
  | ReferenceTypeNode
  | ScalarTypeNode
  | TypeNode
  | UnionTypeNode
  | SelfTypeNode
  | ListTypeNode<ReturnTypeNode>
  // | NonNullType<ReturnTypeNode>
);

export function isRequestTypeNode(graph: GraphQLAST, node: any): node is RequestTypeNode  {
  return isGraphQLASTNode(node) && (
       isInputTypeNode(node)
    || isPrimitiveType(node)
    || (isListTypeNode(node) && isRequestTypeNode(graph, node.item))
    || isEnumTypeNode(node)
    || (isReferenceTypeNode(node) && isRequestTypeNode(graph, graph[node.id]))
    || isTypeNode(node)
    || isInterfaceTypeNode(node)
    || isUnionTypeNode(node)
    || isSelfTypeNode(node)
  );
}

export type RequestTypeNodes = Record<string, RequestTypeNode>;
export type RequestTypeNode = (
  | EnumTypeNode
  | InputTypeNode
  | ListTypeNode<RequestTypeNode>
  | ScalarTypeNode
  | ReferenceTypeNode
  // | NonNullType<RequestTypeNode>
);

class BaseType {
  public readonly required: boolean = false;
  public get ['!']() {
    return Required(this);
  }
}

export function Required<T>(t: T): T & {required: true} {
  return {
    ...t,
    required: true
  };
}

export class NonNullType<T> {
  public readonly type: 'non-null' = 'non-null'
  constructor(
    public readonly value: T
  ) {}
}

export function isScalarTypeNode(node: any): node is ScalarTypeNode {
  return node && node.type === 'scalar';
}

export class ScalarType<ID extends string> extends BaseType {
  public readonly type: 'scalar' = 'scalar';
  constructor(
    public readonly id: ID
  ) {
    super();
  }
}

export type ScalarTypeNode =
  | BooleanNode
  | FloatNode
  | IDNode
  | IntNode
  | StringNode
;

export type BooleanNode = typeof Boolean;
export const Boolean = new ScalarType('Boolean');

export type FloatNode = typeof Float;
export const Float = new ScalarType('Float');

export type IDNode = typeof ID;
export const ID = new ScalarType('ID');

export type IntNode = typeof Int;
export const Int = new ScalarType('Int');

export type StringNode = typeof String;
export const String = new ScalarType('String');

export function isPrimitiveType(node: GraphQLNode): node is PrimtiveTypeNode {
  return isScalarTypeNode(node) ||isEnumTypeNode(node) || (isListTypeNode(node) && isPrimitiveType(node.item));
}

export type PrimtiveTypeNode =
  | ScalarTypeNode
  | EnumTypeNode
  | ListTypeNode<PrimtiveTypeNode>
;

export function isListTypeNode(node: any): node is ListTypeNode {
  return node && node.type === 'list';
}

export function List<T extends ReturnTypeNode>(item: T): ListTypeNode<T> {
  return new ListTypeNode(item);
}

export class ListTypeNode<T extends GraphQLNode = GraphQLNode> extends BaseType {
  public readonly type: 'list' = 'list';
  public readonly id?: never;

  constructor(
    public readonly item: T,
  ) {
    super();
  }
}

export function isReferenceTypeNode(node: GraphQLNode): node is ReferenceTypeNode {
  return node.type === 'reference';
}

export function $<ID extends string>(id: ID): ReferenceTypeNode<ID> {
  return new ReferenceTypeNode(id);
}

export class ReferenceTypeNode<ID extends string = string> extends BaseType {
  public readonly type: 'reference' = 'reference';
  constructor(
    public readonly id: ID
  ) {
    super();
  }
}

export function isSelfTypeNode(node: GraphQLNode): node is SelfTypeNode {
  return node.type === 'self';
}

export class SelfTypeNode extends BaseType {
  public readonly type: 'self' = 'self';
}

export const Self = new SelfTypeNode();

export function isInterfaceTypeNode(node: GraphQLNode): node is InterfaceTypeNode {
  return node.type === 'interface';
}
export function assertIsInterfaceTypeNode(node: GraphQLNode): asserts node is InterfaceTypeNode {
  if (!isInterfaceTypeNode(node)) {
    throw new Error(`expected an interface node, got: ${node.type}`);
  }
}

export function assertIsTypeOrInterfaceNode(node: GraphQLNode): asserts node is TypeNode {
  if (node && !(isTypeNode(node) || isInterfaceTypeNode(node))) {
    throw new Error('can only query a root type');
  }
}

export class InterfaceTypeNode<
  ID extends string = string,
  F extends ReturnTypeNodes = ReturnTypeNodes,
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

export function isTypeNode(node: GraphQLNode): node is TypeNode {
  return node.type === 'type';
}

export function assertIsTypeNode(node: GraphQLNode): asserts node is TypeNode {
  if (!isTypeNode(node)) {
    throw new Error(`expected a type node, got: ${node.type}, ${JSON.stringify(node)}`);
  }
}

export class TypeNode<
  ID extends string = string,
  F extends ReturnTypeNodes = ReturnTypeNodes,
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

export function isInputTypeNode(node: GraphQLNode): node is InputTypeNode {
  return node.type === 'input';
}

export class InputTypeNode<
  ID extends string = string,
  F extends RequestTypeNodes = RequestTypeNodes
> extends BaseType {
  public readonly type: 'input' = 'input';

  constructor(
    public readonly id: ID,
    public readonly fields: F,
  ) {
    super();
  }
}

export function isUnionTypeNode(node: GraphQLNode): node is UnionTypeNode {
  return node.type === 'union';
}

export type UnionValue =
  | TypeNode
  | InterfaceTypeNode
  | UnionTypeNode
;
export class UnionTypeNode<
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

export function isEnumTypeNode(node: any): node is EnumTypeNode {
  return node && node.type === 'enum';
}

export type EnumValues = Record<string, string>

export class EnumTypeNode<
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

export function isFunctionNode(node: GraphQLNode): node is FunctionNode {
  return node && node.type === 'function';
}

export function Function<
  Args extends RequestTypeNodes = RequestTypeNodes,
  Returns extends ReturnTypeNode = ReturnTypeNode
>(args: Args, returns: Returns): FunctionNode<Args, Returns> {
  return new FunctionNode(args, returns);
}

export class FunctionNode<
  Args extends RequestTypeNodes = RequestTypeNodes,
  Returns extends ReturnTypeNode = ReturnTypeNode
> extends BaseType {
  public readonly id?: never;
  public readonly type: 'function' = 'function';

  constructor(
    public readonly args: Args,
    public readonly returns: Returns
  ) {
    super();
  }
}

export function isInputParameter(a: any): a is InputParameter<string, RequestTypeNode> {
  return a.type === 'parameter';
}

export class InputParameter<ID extends string, T extends RequestTypeNode> {
  public readonly type: 'parameter' = 'parameter';
  constructor(
    public readonly id: ID,
    public readonly parameterType: T
  ) {}
}
