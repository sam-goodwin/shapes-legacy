import type { DocumentNode, EnumTypeDefinitionNode, FieldDefinitionNode, ListTypeNode, NameNode, NamedTypeNode, OperationTypeDefinitionNode, SchemaDefinitionNode, TypeDefinitionNode, TypeNode, UnionTypeDefinitionNode } from 'graphql';
import { GraphQLASTNode, GraphQLInputType, GraphQLReturnType } from './ast';
import { GraphQLSchema } from './schema';

/**
 * Compiles a GraphQL Document from
 * @param schema
 */
export function toGraphQLAST(schema: GraphQLSchema): DocumentNode {
  return {
    kind: 'Document',
    definitions: [
      schemaDefinition(schema),
      ...Object.values(schema.graph).map(typeDefinitionNode)
    ],
  };
}

export function schemaDefinition(schema: GraphQLSchema): SchemaDefinitionNode {
  const operationTypes: OperationTypeDefinitionNode[] = [operationTypeDefinition('query', schema.query)];
  if (!schema.mutation === undefined) {
    operationTypes.push(operationTypeDefinition('mutation', schema.mutation as string));
  }
  return {
    kind: 'SchemaDefinition',
    operationTypes
  };
  function operationTypeDefinition(operation: OperationTypeDefinitionNode['operation'], value: string): OperationTypeDefinitionNode {
    return {
      kind: 'OperationTypeDefinition',
      operation,
      type: nameTypeNode(value )
    };
  }
}

export function typeDefinitionNode(node: GraphQLASTNode): TypeDefinitionNode {
  if (node.type === 'interface' || node.type === 'type') {
    const interfaces = node.type === 'interface' ? node.interfaces : node.interfaces;
    return {
      fields: Object.entries(node.fields).map(([fieldName, field]) => ({
        kind: 'FieldDefinition',
        name: nameNode(fieldName),
        type: typeNode(node.id, field)
      }) as FieldDefinitionNode),
      // @ts-ignore
      interfaces: interfaces === undefined ? undefined : interfaces.map((n) => nameTypeNode(n)),
      kind: node.type === 'interface' ? 'InterfaceTypeDefinition' : 'ObjectTypeDefinition',
      name: nameNode(node.id)
    } as TypeDefinitionNode;
  } else if (node.type === 'union') {
    return {
      kind: 'UnionTypeDefinition',
      name: nameNode(node.id),
      types: node.union.map((value) => ({
        kind: 'NamedType',
        name: nameNode(value)
      }))
    } as UnionTypeDefinitionNode;
  } else if(node.type === 'enum') {
    return {
      kind: 'EnumTypeDefinition',
      name: nameNode(node.id),
      // @ts-ignore
      values: Object.entries(node.values).map(([name, value]) => ({
        kind: 'EnumValueDefinition',
        // @ts-ignore
        name: nameNode(value)
      }))
    } as EnumTypeDefinitionNode;
  }
  throw new Error(`invalid definition: ${node.type}`);
}

export function typeNode(self: string, field: GraphQLReturnType): TypeNode {
  const type: NamedTypeNode | ListTypeNode = (() => {
    if (field.type === 'list') {
      return {
        kind: 'ListType',
        type: typeNode(self, field.item)
      } as ListTypeNode;
    } else if (field.type === 'self') {
      return nameTypeNode(self);
    } else if (field.type === 'reference') {
      return nameTypeNode(field.id);
    } else if (field.type !== 'function') {
      return nameTypeNode(field.id);
    } else {
      throw new Error(`invalid field AST node: ${field.type}`);
    }
  })();

  if (field.required) {
    return {
      kind: 'NonNullType',
      type
    };
  } else {
    return type;
  }
}

export function inputTypeNode(type: GraphQLInputType): TypeNode {
  if (type.type === 'list') {
    return {
      kind: 'ListType',
      type: inputTypeNode(type.item)
    } as ListTypeNode;
  } else if (type.type === 'reference') {
    return nameTypeNode(type.id);
  } else {
    throw new Error(`invalid field AST node: ${type.type}`);
  }
}

export function nameTypeNode(name: string): NamedTypeNode {
  return {
    kind: 'NamedType',
    name: nameNode(name)
  };
}
export function nameNode(value: string): NameNode {
  return {
    kind: 'Name',
    value
  };
}