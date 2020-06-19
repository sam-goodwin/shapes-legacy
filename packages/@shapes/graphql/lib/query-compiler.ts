import { ArgumentNode, FieldNode, InlineFragmentNode, ObjectFieldNode, OperationDefinitionNode, SelectionNode, SelectionSetNode, ValueNode, VariableDefinitionNode } from 'graphql';
import { assertIsInterfaceTypeNode, assertIsTypeNode, assertIsTypeOrInterfaceNode, GraphQLAST, GraphQLNode, InputParameter, InterfaceTypeNode, isFunctionNode, isInputParameter, isInputTypeNode, isInterfaceTypeNode, isListTypeNode, isPrimitiveType, isReferenceTypeNode, isRequestTypeNode, isScalarTypeNode, isSelfTypeNode, isTypeNode, isUnionTypeNode, RequestTypeNode, RequestTypeNodes, ReturnTypeNode, ReturnTypeNodes, TypeNode, UnionTypeNode } from './ast';
import { Schema } from './schema';
import { GqlResult, GqlResultType, Selector } from './selector';
import { inputTypeNode } from './to-graphql';
import { Value } from './value';

export class QueryCompiler<S extends Schema> {
  public readonly queryRoot: SelectionSetBuilderType;

  constructor(public readonly schema: S) {
    const queryRoot = schema.graph[schema.query];
    if (queryRoot === undefined) {
      throw new Error(`type '${schema.query}' does not exist in schema`);
    }
    assertIsTypeNode(queryRoot);
    this.queryRoot = parseTypeInterfaceUnionNode(schema.graph, queryRoot);
  }

  public compileQuery<
    U extends GqlQueryResult
  >(
    query: (i: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<never, undefined, GetGqlQueryResult<U>>;

  public compileQuery<
    Name extends string,
    U extends GqlQueryResult
  >(
    queryName: Name,
    query: (root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<undefined, GetGqlQueryResult<U>>;

  public compileQuery<
    Parameters extends RequestTypeNodes,
    U extends GqlQueryResult
  >(
    parameters: Parameters,
    query: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<{
    [parameterName in keyof Parameters]: Value<S['graph'], Parameters[parameterName]>;
  }, GetGqlQueryResult<U>>;

  public compileQuery<
    Name extends string,
    Parameters extends RequestTypeNodes,
    U extends GqlQueryResult
  >(
    name: Name,
    parameters: Parameters,
    query: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<S['graph'], Extract<S['graph'][S['query']], TypeNode>>) => U
  ): CompiledGqlQuery<{
    [parameterName in keyof Parameters]: Value<S['graph'], Parameters[parameterName]>;
  }, GetGqlQueryResult<U>>;

  public compileQuery(a: any, b?: any, c?: any): CompiledGqlQuery<any, any> {
    let queryName: string | undefined;
    let parameters: Record<string, RequestTypeNode> = {};
    let query: (((s: SelectionSetBuilder) => SelectionSetBuilder) | ((p: any, s: SelectionSetBuilder) => SelectionSetBuilder));
    if (typeof a === 'string') {
      queryName = a;
      if (typeof c === 'function') {
        query = c;
        parameters = b;
      } else {
        query = b;
      }
    } else {
      if (typeof b === 'function') {
        query = b;
        parameters = a;
      } else {
        query = a;
      }
    }
    const inputParameters = Object.entries(parameters).map(([name, parameter]) => ({
      [name]: new InputParameter(name, parameter)
    })).reduce((a, b) => ({...a, ...b}));

    const queryResult: SelectionSetBuilder = Object.keys(parameters).length === 0 ?
      (query as any)(new (this.queryRoot)([])) :
      (query as any)(inputParameters, new (this.queryRoot)([]))
    ;
    const selectionSet: SelectionSetNode = {
      kind: 'SelectionSet',
      selections: queryResult.$selections
    };

    const operationDefinitionNode: OperationDefinitionNode = {
      kind: 'OperationDefinition',
      operation: 'query',
      name: queryName === undefined ? undefined : {
        kind: 'Name',
        value: queryName
      },
      variableDefinitions: Object.entries(parameters).map(([name, parameter]) => ({
        kind: 'VariableDefinition',
        variable: {
          kind: 'Variable',
          name: {
            kind: 'Name',
            value: name
          }
        },
        type: inputTypeNode(parameter)
      } as VariableDefinitionNode)),
      selectionSet,
    };

    return {
      operationDefinitionNode,
      parseQueryResponse(json) {
        // TODO
        return json;
      },
      serializeParameters(input) {
        // TODO
        return input;
      }
    };
  }
}

export interface CompiledGqlQuery<
  Parameters,
  Output,
  OperationNode extends OperationDefinitionNode = OperationDefinitionNode
> {
  operationDefinitionNode: OperationNode;
  parseQueryResponse(json: any): Output;
  serializeParameters(input: Parameters): any;
}

export type GqlRoot<Graph extends GraphQLAST, Root extends TypeNode> = {
  [field in keyof GraphQLAST.GetInheritedFields<Graph, Root['id']>]: Selector<
    Graph,
    Extract<GraphQLAST.GetInheritedFields<Graph, Root['id']>[field], GraphQLNode>,
    Root['id']
  >
};

type GqlQueryResult = GqlResult | Record<string, GqlResult>;
type GetGqlQueryResult<U extends GqlQueryResult> =
  U extends GqlResult<infer T> ? T :
  U extends Record<string, GqlResult> ? {
    [alias in keyof U]: GqlResultType<U[alias]>
  } :
  never
;

export function isSelectionSetBuilder(a?: any): a is SelectionSetBuilder {
  return Array.isArray(a?.$selections);
}
export interface SelectionSetBuilder {
  $selections: SelectionNode[];
}
export interface SelectionSetBuilderType {
  new (selections: SelectionNode[]): SelectionSetBuilder;
  prototype: any;
}

export function parseTypeInterfaceUnionNode(
  graph: GraphQLAST,
  node: TypeNode | InterfaceTypeNode | UnionTypeNode
): SelectionSetBuilderType {
  class Builder {
    constructor(public readonly $selections: SelectionNode[]) {}
  }
  if (isUnionTypeNode(node)) {
    const unionTypes = node.union.map(u => {
      const unionType = graph[u];
      if (unionType === undefined) {
        throw new Error(`Type '${u}' in Union '${node.id}' does not exist in GraphQL Schema`);
      }
      assertIsTypeNode(unionType);
      return unionType;
    });

    (Builder.prototype as any).$on = parseOnSelector(graph, Builder, unionTypes, node.id, 'union');
  } else if (isInterfaceTypeNode(node)) {
    parseFields(graph, node, Builder);
    (Builder.prototype as any).$on = parseOnSelector(graph, Builder, findTypes(graph, node), node.id, 'interface');
  } else if (isTypeNode(node)) {
    parseFields(graph, node, Builder);
  }
  return Builder;
}

function parseOnSelector(graph: GraphQLAST, builder: SelectionSetBuilderType, types: TypeNode[], alias: string, type: 'union' | 'interface') {
  const unionTypes = types.map(type => {
    return {
      [type.id]: parseTypeInterfaceUnionNode(graph, type)
    };
  }).reduce((a, b) => ({...a, ...b}));

  return function(this: InstanceType<SelectionSetBuilderType>, id: string, selector: (builder: any) => SelectionSetBuilder) {
    if (typeof id !== 'string') {
      throw new Error(`type name must be a string, got: '${id}'`);
    }
    const unionType = unionTypes[id];
    if (unionType === undefined) {
      throw new Error(`type '${id}' does not ${type === 'union' ? 'exist in' : 'implement'} '${alias}'`);
    }
    return new builder(this.$selections.concat([
      ...(this.$selections.find(s => s.kind === 'Field' && s.name.value === '__typename') === undefined ? [{
        kind: 'Field',
        name: {
          kind: 'Name',
          value: '__typename'
        },
      } as const] : []), {
      kind: 'InlineFragment',
      typeCondition: {
        kind: 'NamedType',
        name: {
          kind: 'Name',
          value: id
        }
      },
      selectionSet: {
        kind: 'SelectionSet',
        selections: selector(new unionType([])).$selections
      }
    } as InlineFragmentNode]));
  };
}

function parseFields(graph: GraphQLAST, self: TypeNode | InterfaceTypeNode, builder: SelectionSetBuilderType) {
  const fields = findFields(graph, self);
  for (const [fieldName, field] of Object.entries(fields)) {
    const fieldSelector = parseFieldSelector(graph, builder, field, fieldName);

    builder.prototype[fieldName] = function(...args: any[]) {
      return new builder(this.$selections.concat([fieldSelector(...args)]));
    };
  }
}

function parseFieldSelector(
  graph: GraphQLAST,
  self: SelectionSetBuilderType,
  field: ReturnTypeNode,
  fieldName: string
): (...args: any[]) => SelectionNode {
  const name = {
    kind: 'Name',
    value: fieldName
  } as const;

  if (isPrimitiveType(field)) {
    return () => ({
      kind: 'Field',
      name
    } as FieldNode);
  } else if (isListTypeNode(field)) {
    const item = parseTypeInterfaceUnionNode(graph, field.item as TypeNode);
    return (itemSelector: (s: SelectionSetBuilder) => SelectionSetBuilder) => ({
      kind: 'Field',
      name,
      selectionSet: {
        kind: 'SelectionSet',
        selections: itemSelector(new item([])).$selections
      }
    } as FieldNode);
  } else if (isFunctionNode(field)) {
    let returnSelector: SelectionSetBuilderType;
    if (isTypeNode(field.returns) || isInterfaceTypeNode(field.returns) || isUnionTypeNode(field.returns)) {
      returnSelector = parseTypeInterfaceUnionNode(graph, field.returns);
    }

    return (args: Record<string, any>, selector?: (b: SelectionSetBuilder) => SelectionSetBuilder) => {
      const argumentNodes = Object.entries(args).map(([argumentName, argValue]) => {
        const argumentType = field.args[argumentName];
        if (argumentType === undefined) {
          throw new Error(`unknown argument: ${argumentName}`);
        }

        return {
          kind: 'Argument',
          name: {
            kind: 'Name',
            value: argumentName
          },
          value: valueNode(graph, argumentType as any, argValue as any),
        } as ArgumentNode;
      });

      return {
        kind: 'Field',
        name,
        arguments: argumentNodes,
        selectionSet: selector ? ({
          kind: 'SelectionSet',
          selections: selector(new returnSelector([])).$selections
        }) : undefined
      } as SelectionNode;
    };
  } else if (isSelfTypeNode(field)) {
    return (selfSelector: (s: SelectionSetBuilder) => SelectionSetBuilder) => ({
      kind: 'Field',
      name,
      selectionSet: {
        kind: 'SelectionSet',
        selections: selfSelector(new self([])).$selections
      }
    });
  } else if (isReferenceTypeNode(field)) {
    return parseFieldSelector(graph, self, graph[field.id] as any /*todo*/, fieldName);
  } else if (isTypeNode(field) || isInterfaceTypeNode(field) || isUnionTypeNode(field)) {
    let type: SelectionSetBuilderType;
    return (selector: (s: SelectionSetBuilder) => SelectionSetBuilder) => {
      if (!type) {
        type = parseTypeInterfaceUnionNode(graph, field);
      }
      return {
        kind: 'Field',
        name,
        selectionSet: {
          kind: 'SelectionSet',
          selections: selector(new type([])).$selections
        }
      };
    };
  }
  throw new Error(`cannot parse field selector for field type: ${(field as any).type}`);
}

function valueNode<
  Graph extends GraphQLAST,
  T extends RequestTypeNode
>(graph: Graph, argType: T, value: Value<Graph, T> | InputParameter<string, T>): ValueNode {
  if (argType.required === false && value === undefined) {
    return {
      kind: 'NullValue',
    };
  }
  if (argType.required === true && value === undefined) {
    throw new Error(`argument is required: ${argType}`);
  }
  if (isInputParameter(value)) {
    return {
      kind: 'Variable',
      name: {
        kind: 'Name',
        value: value.id
      }
    };
  } else if (isScalarTypeNode(argType)) {
    if (argType.id === 'String' || argType.id === 'ID') {
      return {
        kind: 'StringValue',
        value: value as string
      };
    } else if (argType.id === 'Int') {
      return {
        kind: 'IntValue',
        value: (value as number).toString(10)
      };
    } else if (argType.id === 'Float') {
      return {
        kind: 'FloatValue',
        value: (value as number).toString(10)
      };
    } else if (argType.id === 'Boolean') {
      return {
        kind: 'BooleanValue',
        value: value as boolean
      };
    } else {
      throw new Error(`unknown scalar type: ${argType.id}`);
    }
  } else if (argType.type === 'enum') {
    return {
      kind: 'EnumValue',
      value: value as string
    };
  } else if (isListTypeNode(argType)) {
    if (isRequestTypeNode(graph, argType.item)) {
      return {
        kind: 'ListValue',
        values: (value as any[]).map(v => valueNode(graph, argType.item as any, v))
      };
    }
  } else if (isInputTypeNode(argType)) {
    return {
      kind: 'ObjectValue',
      fields: Object.entries(argType.fields).map(([fieldname, field]) => ({
        kind: 'ObjectField',
        name: {
          kind: 'Name',
          value: fieldname
        },
        value: valueNode(graph, field, (value as any)[fieldname])
      }))
    };
  }

  throw new Error(`unknown node type: ${argType.type}`);
}

function findFields(graph: GraphQLAST, type: TypeNode | InterfaceTypeNode): ReturnTypeNodes {
  let fields: any = {
    ...type.fields
  };
  if (type.interfaces !== undefined) {
    for (const i of type.interfaces) {
      const iface = graph[i];
      assertIsTypeOrInterfaceNode(iface);
      fields = {
        ...fields,
        ...findFields(graph, iface)
      };
    }
  }
  return fields;
}

function findTypes(graph: GraphQLAST, iface: InterfaceTypeNode): TypeNode[] {
  const ifaces = new Set(findInterfaces(graph, iface));
  return Object.values(graph).map(type => {
    if (isTypeNode(type)) {
      for (const implementedIface of type.interfaces || []) {
        if (ifaces.has(implementedIface)) {
          return [type];
        }
      }
    }
    return [];
  }).reduce((a, b) => a.concat(b));
}

function findInterfaces(graph: GraphQLAST, type: InterfaceTypeNode): string[] {
  return [
    type.id,
    ...(type.interfaces ? type.interfaces.map(interfaceName => {
      const iface = graph[interfaceName];
      assertIsInterfaceTypeNode(iface);
      return findInterfaces(graph, iface);
    }).reduce((a, b) => a.concat(b)) : [])
  ];
}