import { SelectionNode, SelectionSetNode } from 'graphql';
import { assertIsTypeOrInterface, GraphQLAST, GraphQLReturnFields, InterfaceType, isPrimitiveType, Type } from './ast';

const selections = Symbol.for('selections');

export function parseTree(
  graph: GraphQLAST,
  node: Type
): ((selector: any) => SelectionSetNode) {
  class Builder {
    private readonly [selections]: SelectionNode[];
  }

  const fields = findFields(graph, node);
  for (const [fieldName, field] of Object.entries(fields)) {
    const fieldSelector: (...args: any[]) => SelectionNode = (() => {
      if (isPrimitiveType(field)) {
        return () => ({
          kind: 'Field',
          name: {
            kind: 'Name',
            value: fieldName
          },
        } as SelectionNode);
      } else if (field.type === 'list') {
        const item = parseTree(graph, field.item as Type);
        return () => ({
          kind: 'Field',
          name: {
            kind: 'Name',
            value: fieldName
          },
          selectionSet: item(item)
        } as SelectionNode);
      }
      throw new Error('');
    })();

    (Builder.prototype as any)[fieldName] = function(...args: any[]) {
      this[selections].push(fieldSelector(...args));
      return this;
    };
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

function assertIsFunction(a: any): asserts a is (selector: any) => any {
  if (typeof a !== 'function') {
    throw new Error('must be function');
  }
}

function findFields(graph: GraphQLAST, type: Type | InterfaceType): GraphQLReturnFields {
  let fields: any = {
    ...type.fields
  };
  if (type.interfaces !== undefined) {
    for (const i of type.interfaces) {
      const iface = graph[i];
      assertIsTypeOrInterface(iface);
      fields = {
        ...fields,
        ...findFields(graph, iface)
      };
    }
  }
  return fields;
}