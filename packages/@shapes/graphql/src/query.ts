import { ArgumentNode, DocumentNode, FieldNode, InlineFragmentNode, SelectionNode, SelectionSetNode, ValueNode, VariableDefinitionNode } from 'graphql';
import { GqlResult, GqlResultType, Selector } from './selector';
import { GraphQLAST, InputParameter, InterfaceTypeNode, RequestTypeNode, RequestTypeNodes, ReturnTypeNode, ReturnTypeNodes, TypeNode, UnionTypeNode, assertIsInterfaceTypeNode, assertIsTypeNode, assertIsTypeOrInterfaceNode, isFunctionNode, isInputParameter, isInputTypeNode, isInterfaceTypeNode, isListTypeNode, isPrimitiveType, isReferenceTypeNode, isRequestTypeNode, isScalarTypeNode, isSelfTypeNode, isTypeNode, isUnionTypeNode } from './ast';
import { Value, Values } from './value';
import { KeysOfType } from './util';
import { inputTypeNode } from './to-graphql';
import { print } from 'graphql/language/printer';

/**
 * Type-safe interface for compiling GraphQL queries.
 */
export class QueryCompiler<G extends GraphQLAST, Root extends TypeNode> {
  private readonly rootBuilder: SelectionSetBuilderType;

  constructor(
    /**
     * GraphQL type-system.
     */
    graph: G,
    /**
     * Root type of the query/mutation API.
     */
    public readonly root: Root
  ) {
    assertIsTypeNode(root);
    this.rootBuilder = parseNode(graph, root);
  }

  /**
   * Compiles an anonymous query.
   *
   * ```ts
   * compiler.compile(root => root
   *   .id()
   * );
   * ```
   * @param query - function which builds the query.
   */
  public compile<
    Result extends GqlResult
  >(
    query: (i: GqlRoot<G, Root>) => Result
  ): CompiledGqlQuery<GqlResultType<Result>>;

  /**
   * Compiles a named query.
   *
   * ```ts
   * compiler.compile('QueryName', root => root
   *   .id()
   * );
   * ```
   *
   * @param queryName - name of the query.
   * @param query - function which builds the query.
   */
  public compile<
    QueryName extends string,
    Result extends GqlResult
  >(
    queryName: QueryName,
    query: (root: GqlRoot<G, Root>) => Result
  ): CompiledGqlQuery<GqlResultType<Result>>;

  /**
   * Compiles an anonymous query that accepts input parameters.
   *
   * ```ts
   * compiler.compile({id: gql.ID['!']}, ({id}, root) => root
   *   .getPerson({id}, person => person
   *     .name()
   *   )
   * );
   * ```
   *
   * @param parameters - query parameters.
   * @param query - function which builds the query.
   */
  public compile<
    Parameters extends RequestTypeNodes,
    Result extends GqlResult
  >(
    parameters: Parameters,
    query: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<G, Root>) => Result
  ): CompiledVariableGqlQuery<{
    [arg in keyof Values<G, Parameters>]+?: Values<G, Parameters>[arg];
  } & {
    [arg in KeysOfType<Values<G, Parameters>, {required: true;}>]-?: Values<G, Parameters>[arg];
  }, GqlResultType<Result>>;

  /**
   * Compiles a named query that also accepts input parameters.
   *
   * ```ts
   * compiler.compile('QueryName', {id: gql.ID['!']}, ({id}, root) => root
   *   .getPerson({id}, person => person
   *     .name()
   *   )
   * );
   * ```
   *
   * @param queryName - query name
   * @param parameters - query parameters.
   * @param query - function which builds the query.
   */
  public compile<
    QueryName extends string,
    Parameters extends RequestTypeNodes,
    Result extends GqlResult
  >(
    queryName: QueryName,
    parameters: Parameters,
    query: (parameters: {
      [parameterName in keyof Parameters]: InputParameter<Extract<parameterName, string>, Parameters[parameterName]>
    }, root: GqlRoot<G, Root>) => Result
  ): CompiledVariableGqlQuery<{
    [arg in keyof Values<G, Parameters>]+?: Values<G, Parameters>[arg];
  } & {
    [arg in KeysOfType<Values<G, Parameters>, {required: true;}>]-?: Values<G, Parameters>[arg];
  }, GqlResultType<Result>>;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public compile(a: any, b?: any, c?: any): CompiledGqlQuery<any, any> {
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
    })).reduce((a, b) => ({...a, ...b}), {});

    const queryResult: SelectionSetBuilder = Object.keys(parameters).length === 0 ?
      (query as any)(new (this.rootBuilder)([])) :
      (query as any)(inputParameters, new (this.rootBuilder)([]))
    ;
    const selectionSet: SelectionSetNode = {
      kind: 'SelectionSet',
      selections: queryResult.$selections
    };

    const documentNode: DocumentNode ={
      kind: 'Document',
      definitions: [{
      
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
      }]
    };

    return {
      query: print(documentNode),
      queryAST: documentNode,
      parseQueryResponse(json: any): any {
        // TODO
        return json;
      },
      serializeParameters(input: any): any {
        // TODO
        return input;
      }
    } as any;
  }
}

export interface CompiledGqlQuery<
  Output,
  Document extends DocumentNode = DocumentNode
> {
  query: string;
  queryAST: Document;
  parseQueryResponse(json: any): Output;
  serializeParameters: never;
}
export interface CompiledVariableGqlQuery<
  Variables,
  Output,
  Document extends DocumentNode = DocumentNode
> {
  query: string;
  queryAST: Document;
  parseQueryResponse(json: any): Output;
  serializeParameters(input: Variables): any;
}

export type GqlRoot<Graph extends GraphQLAST, Root extends TypeNode> = Selector<Graph, Root, Root['id']>;

export interface SelectionSetBuilder {
  $selections: SelectionNode[];
}
export interface SelectionSetBuilderType {
  new (selections: SelectionNode[]): SelectionSetBuilder;
  prototype: any;
}

function parseNode(
  graph: GraphQLAST,
  node: TypeNode | InterfaceTypeNode | UnionTypeNode
): SelectionSetBuilderType {
  class Builder {
    constructor(public readonly $selections: SelectionNode[]) {
      if (this.$selections.length === 0) {
        if (isUnionTypeNode(node) || isInterfaceTypeNode(node)) {
          this.$selections.push({
            kind: 'Field',
            name: {
              kind: 'Name',
              value: '__typename'
            },
          });
        }
      }
    }
  }
  if (isUnionTypeNode(node)) {
    const unionTypes = node.union.map((u) => {
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
  const unionTypes = types.map((type) => {
    return {
      [type.id]: parseNode(graph, type)
    };
  }).reduce((a, b) => ({...a, ...b}));

  return function(this: InstanceType<SelectionSetBuilderType>, id: string, selector: (builder: any) => SelectionSetBuilder) {
    const unionType = unionTypes[id];
    if (unionType === undefined) {
      throw new Error(`type '${id}' does not ${type === 'union' ? 'exist in' : 'implement'} '${alias}'`);
    }
    return new builder(this.$selections.concat([{
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
    const item = isSelfTypeNode(field.item) ? self : parseNode(graph, field.item as TypeNode);
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
      returnSelector = parseNode(graph, field.returns);
    } else if (isSelfTypeNode(field.returns)) {
      returnSelector = self;
    } else if (isReferenceTypeNode(field.returns)) {
      const ref = graph[field.returns.id];
      if (ref === undefined) {
        throw new Error(`reference to ${field.returns.id} is not found in schema`);
      }
      if (isTypeNode(ref) || isInterfaceTypeNode(ref) || isUnionTypeNode(ref)) {
        returnSelector = parseNode(graph, ref);
      }
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
          value: valueNode(graph, argumentType as any, argValue),
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
  } else {
    let type: SelectionSetBuilderType;
    return (selector: (s: SelectionSetBuilder) => SelectionSetBuilder) => {
      if (!type) {
        type = parseNode(graph, field);
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
}

function valueNode<
  Graph extends GraphQLAST,
  T extends RequestTypeNode
>(graph: Graph, argType: T, value: Value<Graph, T> | InputParameter<string, T>): ValueNode {
  if (argType.required !== true && value === undefined) {
    return {
      kind: 'NullValue',
    };
  } else if (argType.required === true && value === undefined) {
    throw new Error(`argument type is required: ${argType.id!}`);
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
        values: (value as any[]).map((v) => valueNode(graph, argType.item as any, v))
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
  return Object.values(graph).map((type) => {
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
    ...(type.interfaces ? type.interfaces.map((interfaceName) => {
      const iface = graph[interfaceName];
      assertIsInterfaceTypeNode(iface);
      return findInterfaces(graph, iface);
    }).reduce((a, b) => a.concat(b)) : [])
  ];
}