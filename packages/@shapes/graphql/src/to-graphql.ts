import type * as gql from 'graphql';
import { InterfaceTypeNode, RequestTypeNode, ReturnTypeNode, RootNode, TypeNode, isFunctionNode } from './ast';
import { GraphQLSchema } from './schema';

import { print } from 'graphql/language/printer';

/**
 * Prints a Schema in the GraphQL schema format.
 *
 * @param schema - schema to print
 */
export function printGraphQLSchema(schema: GraphQLSchema<any, any, any>): string {
  return print(toGraphQLAST(schema));
}

/**
 * Convert a Schema to GraphQL AST.
 *
 * @param schema - schema to convert.
 */
export function toGraphQLAST(schema: GraphQLSchema<any, any, any>): gql.DocumentNode {
  return {
    kind: 'Document',
    definitions: [
      ...Object.values(schema.graph).map((t) => typeDefinitionNode(t as RootNode)),
      schemaDefinition(schema),
    ]
  };
}

export function schemaDefinition(schema: GraphQLSchema<any, any, any>): gql.SchemaDefinitionNode {
  const operationTypes: gql.OperationTypeDefinitionNode[] = [operationTypeDefinition('query', schema.query.root.id)];
  if (schema.mutation !== undefined) {
    operationTypes.push(operationTypeDefinition('mutation', schema.mutation.root.id));
  }
  return {
    kind: 'SchemaDefinition',
    operationTypes
  };
  function operationTypeDefinition(operation: gql.OperationTypeDefinitionNode['operation'], value: string): gql.OperationTypeDefinitionNode {
    return {
      kind: 'OperationTypeDefinition',
      operation,
      type: nameTypeNode(value )
    };
  }
}

export function typeDefinitionNode(node: RootNode): gql.TypeDefinitionNode {
  if (node.type === 'interface' || node.type === 'type') {
    const interfaces = node.type === 'interface' ? node.interfaces : node.interfaces;
    return {
      kind: node.type === 'interface' ? 'InterfaceTypeDefinition' : 'ObjectTypeDefinition',
      name: nameNode(node.id),
      interfaces: interfaces === undefined ? undefined : interfaces.map((n) => nameTypeNode(n)),
      fields: Object.entries(node.fields).map(([fieldName, field]) => fieldDefinitionNode(node, fieldName, field))
    } as gql.TypeDefinitionNode;
  } else if (node.type === 'union') {
    return {
      kind: 'UnionTypeDefinition',
      name: nameNode(node.id),
      types: node.union.map((value) => ({
        kind: 'NamedType',
        name: nameNode(value)
      }))
    } as gql.UnionTypeDefinitionNode;
  } else if(node.type === 'enum') {
    return {
      kind: 'EnumTypeDefinition',
      name: nameNode(node.id),
      values: Object.values(node.values).map((value) => ({
        kind: 'EnumValueDefinition',
        name: nameNode(value)
      }))
    } as gql.EnumTypeDefinitionNode;
  }
  throw new Error(`invalid definition: ${node.type}`);
}

export function fieldDefinitionNode(self: TypeNode | InterfaceTypeNode, fieldName: string, field: ReturnTypeNode): gql.FieldDefinitionNode {
  return {
    kind: 'FieldDefinition',
    name: nameNode(fieldName),
    type: typeNode(self.id, isFunctionNode(field) ? field.returns : field),
    arguments: isFunctionNode(field) ? Object.entries(field.args).map(([argName, argType]) => ({
      kind: 'InputValueDefinition',
      name: nameNode(argName),
      type: inputTypeNode(argType)
    } as gql.InputValueDefinitionNode)): undefined
  };
}

export function typeNode(self: string, field: ReturnTypeNode): gql.TypeNode {
  const type: gql.NamedTypeNode | gql.ListTypeNode = (() => {
    if (field.type === 'list') {
      return {
        kind: 'ListType',
        type: typeNode(self, field.item)
      } as gql.ListTypeNode;
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

export function inputTypeNode(node: RequestTypeNode): gql.TypeNode {
  const type = (() => {
    if (node.type === 'list') {
      return {
        kind: 'ListType',
        type: inputTypeNode(node.item)
      } as gql.ListTypeNode;
    } else if (node.type === 'reference' || node.type === 'scalar' || node.type === 'enum') {
      return nameTypeNode(node.id);
    } {
      throw new Error(`invalid field AST node: ${node.type}`);
    }
  })();

  if (node.required) {
    return {
      kind: 'NonNullType',
      type
    };
  } else {
    return type;
  }
}

export function nameTypeNode(name: string): gql.NamedTypeNode {
  return {
    kind: 'NamedType',
    name: nameNode(name)
  };
}
export function nameNode(value: string): gql.NameNode {
  return {
    kind: 'Name',
    value
  };
}