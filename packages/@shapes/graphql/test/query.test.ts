import 'jest';

import * as gql from '../lib';
import { schemaBuilder } from './schema';

const schema = schemaBuilder
  .type(_ => ({
    Query: {
      fields: {
        getAnimal: gql.Function({id: gql.ID["!"]}, _.Animal),
      }
    },
    Mutation: {
      fields: {
        addAnimal: gql.Function({id: gql.ID["!"]}, _.Animal["!"])
      }
    }
  }))
  .build({
    query: 'Query',
    mutation: 'Mutation'
  })
;

const compiler = new gql.QueryCompiler(schema);

it('should', () => {
  const query = compiler.compileQuery('A', {id: gql.ID["!"]}, ({id}, root) => {
    console.log(id, root);
    return root.getAnimal({id}, person => person
      .id()
      .name()
      .$on('Dog', dog => dog
        .bark())
      .$on('Bird', bird => bird
        .tweets())
    );
  });
  expect(query.operationDefinitionNode).toEqual({
    "kind": "OperationDefinition",
    "name": {
      "kind": "Name",
      "value": "A"
    },
    "operation": "query",
    "selectionSet": {
      "kind": "SelectionSet",
      "selections": [
        {
          "arguments": [
            {
              "kind": "Argument",
              "name": {
                "kind": "Name",
                "value": "id",
              },
              "value": {
                "kind": "Variable",
                "name": {
                  "kind": "Name",
                  "value": "id",
                },
              },
            },
          ],
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "getAnimal",
          },
          "selectionSet": {
            "kind": "SelectionSet",
            "selections": [
              {
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "id",
                },
              },
              {
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "name",
                },
              },
              {
                "kind": "Field",
                "name": {
                  "kind": "Name",
                  "value": "__typename"
                }
              },
              {
                "kind": "InlineFragment",
                "selectionSet": {
                  "kind": "SelectionSet",
                  "selections": [
                    {
                      "kind": "Field",
                      "name": {
                        "kind": "Name",
                        "value": "bark",
                      },
                    },
                  ],
                },
                "typeCondition": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Dog",
                  },
                },
              },
              {
                "kind": "InlineFragment",
                "selectionSet": {
                  "kind": "SelectionSet",
                  "selections": [
                    {
                      "kind": "Field",
                      "name": {
                        "kind": "Name",
                        "value": "tweets",
                      },
                    },
                  ],
                },
                "typeCondition": {
                  "kind": "NamedType",
                  "name": {
                    "kind": "Name",
                    "value": "Bird",
                  },
                },
              },
            ],
          },
        },
      ],
    },
    "variableDefinitions": [
      {
        "kind": "VariableDefinition",
        "type": {
          "kind": "NonNullType",
          "type": {
            "kind": "NamedType",
            "name": {
              "kind": "Name",
              "value": "ID",
            },
          },
        },
        "variable": {
          "kind": "Variable",
          "name": {
            "kind": "Name",
            "value": "id",
          },
        },
      },
    ],
  });
});