import { ArgumentNode, FieldNode, InlineFragmentNode, ObjectFieldNode, SelectionNode, SelectionSetNode, ValueNode } from 'graphql';
import { assertIsInterfaceTypeNode, assertIsTypeNode, assertIsTypeOrInterfaceNode, GraphQLAST, GraphQLNode, InputParameter, InterfaceTypeNode, isFunctionNode, isInputParameter, isInputTypeNode, isInterfaceTypeNode, isListTypeNode, isPrimitiveType, isRequestTypeNode, isScalarTypeNode, isSelfTypeNode, isTypeNode, isUnionTypeNode, RequestTypeNode, ReturnTypeNode, ReturnTypeNodes, TypeNode, UnionTypeNode } from './ast';
import { Value } from './value';

export function parseType(graph: GraphQLAST, type: TypeNode) {

}

// symbol to hide shit behind
const selections = Symbol.for('selections');
type selections = typeof selections;

interface SelectionSetBuilderProto {
  [selections]: SelectionNode[];
}

export function parseTypeInterfaceUnionNode(
  graph: GraphQLAST,
  node: TypeNode | InterfaceTypeNode | UnionTypeNode
): ((selector: (s: any) => any) => SelectionSetNode) {
  // intercepts calls in selectors to build the sequence of SelectionNodes.
  class Builder {
    private readonly [selections]: SelectionNode[];
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

    (Builder.prototype as any).$on = parseOnSelector(graph, unionTypes, node.id, 'union');
  } else if (isInterfaceTypeNode(node)) {
    parseFields(graph, node, Builder.prototype);
    (Builder.prototype as any).$on = parseOnSelector(graph, findTypes(graph, node), node.id, 'interface');
  } else if (isTypeNode(node)) {
    parseFields(graph, node, Builder.prototype);
  }
  return (selector: any) => {
    const builder = new Builder();
    selector(builder);

    return {
      kind: 'SelectionSet',
      selections: builder[selections]
    };
  };
}

function parseOnSelector(graph: GraphQLAST, types: TypeNode[], alias: string, type: 'union' | 'interface') {
  const unionTypes = types.map(type => {
    return {
      [type.id]: parseTypeInterfaceUnionNode(graph, type)
    };
  }).reduce((a, b) => ({...a, ...b}));

  return function(this: SelectionSetBuilderProto, id: string, selector: (selector: any) => any) {
    if (typeof id !== 'string') {
      throw new Error(`type name must be a string, got: '${id}'`);
    }
    const selectUnionType = unionTypes[id];
    if (selectUnionType === undefined) {
      throw new Error(`type '${id}' does not ${type === 'union' ? 'exist in' : 'implement'} '${alias}'`);
    }
    this[selections].push({
      kind: 'InlineFragment',
      typeCondition: {
        kind: id,
      },
      selectionSet: selectUnionType(selector)
    } as InlineFragmentNode);
    return this;
  };
}

function parseFields(graph: GraphQLAST, self: TypeNode | InterfaceTypeNode, builder: any) {
  const fields = findFields(graph, self);
  for (const [fieldName, field] of Object.entries(fields)) {
    const fieldSelector = parseFieldSelector(graph, self, field, fieldName);

    builder[fieldName] = function(...args: any[]) {
      this[selections].push(fieldSelector(...args));
      return this;
    };
  }
}

function parseFieldSelector(graph: GraphQLAST, self: TypeNode | InterfaceTypeNode, field: ReturnTypeNode, fieldName: string): (...args: any[]) => SelectionNode {
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
    return (itemSelector: (s: any) => SelectionSetNode) => ({
      kind: 'Field',
      name,
      selectionSet: itemSelector(item)
    } as FieldNode);
  } else if (isFunctionNode(field)) {

    let returnSelector: undefined | ((selector: any) => SelectionSetNode);
    if (isTypeNode(field.returns) || isInterfaceTypeNode(field.returns) || isUnionTypeNode(field.returns)) {
      returnSelector = parseTypeInterfaceUnionNode(graph, field.returns);
    }

    return (args: {}, selector?: any) => {
      const argNodes = Object.entries(args).map(([argName, argValue]) => {
        const argType = field.args[argName];
        if (argType === undefined) {
          throw new Error(`unknown argument: ${argName}`);
        }

        return {
          kind: 'Argument',
          name: {
            kind: 'Name',
            value: argName
          },
          value: valueNode(graph, argType, argValue as any),
        } as ArgumentNode;
      });

      return {
        kind: 'Field',
        name,
        selectionSet: returnSelector ? selector(returnSelector) : undefined,
        arguments: argNodes
      } as SelectionNode;
    };
  }
  throw new Error(`cannot parse field selector for field type: ${field.type}`);
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
        value: `$${value.id}`
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
    } else if (argType.id === 'Bool') {
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