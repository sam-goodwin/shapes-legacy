import 'jest';
import * as gql from '../src';

import { schemaBuilder } from './schema';

const schema = schemaBuilder
  .type((_) => ({
    Query: {
      fields: {
        getAnimal: gql.Function({ id: gql.ID["!"] }, _.Animal),
        dogs: gql.List(_.Dog)
      }
    },
    Mutation: {
      fields: {
        addAnimal: gql.Function({ id: gql.ID["!"] }, _.Animal["!"])
      }
    }
  }))
  .build({
    query: 'Query',
    mutation: 'Mutation'
  })
;

it('should compile a query to GraphQL AST', () => {
  const query = schema.query.compile('A', { id: gql.ID["!"] }, ({ id }, root) => root
    .getAnimal({ id }, (person) => person
      .id()
      .name()
      .bool()
      .float()
      .int()
      .list()
      .parent((parent) => parent
        .id())
      .fn({ a: 'a' }, (animal) => animal
        .id())
      .complexList((s) => s
        .id())
      .forwardCircular((c) => c
        .b((b) => b
          .a((a) => a
            .i())))
      .$on('Dog', (dog) => dog
        .bark())
      .$on('Bird', (bird) => bird
        .tweets())
    )
    .dogs((dog) => dog
      .id()
      .bark())
  );
  expect(query.query).toEqual(`query A($id: ID!) {
  getAnimal(id: $id) {
    __typename
    id
    name
    bool
    float
    int
    list
    parent {
      __typename
      id
    }
    fn(a: "a") {
      __typename
      id
    }
    complexList {
      __typename
      id
    }
    forwardCircular {
      b {
        a {
          i
        }
      }
    }
    ... on Dog {
      bark
    }
    ... on Bird {
      tweets
    }
  }
  dogs {
    id
    bark
  }
}
`)
  expect(query.queryAST).toEqual({
    "kind": "Document",
    "definitions": [{
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
                    "value": "__typename",
                  }
                },
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
                    "value": "bool",
                  },
                },
                {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "float",
                  },
                },
                {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "int",
                  },
                },
                {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "list",
                  },
                },
                {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "parent",
                  },
                  "selectionSet": {
                    "kind": "SelectionSet",
                    "selections": [
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "__typename",
                        }
                      },
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "id",
                        },
                      },
                    ],
                  },
                },
                {
                  "arguments": [
                    {
                      "kind": "Argument",
                      "name": {
                        "kind": "Name",
                        "value": "a",
                      },
                      "value": {
                        "kind": "StringValue",
                        "value": "a",
                      },
                    },
                  ],
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "fn",
                  },
                  "selectionSet": {
                    "kind": "SelectionSet",
                    "selections": [
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "__typename",
                        }
                      },
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "id",
                        },
                      },
                    ],
                  },
                },
                {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "complexList",
                  },
                  "selectionSet": {
                    "kind": "SelectionSet",
                    "selections": [
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "__typename",
                        }
                      },
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "id",
                        },
                      },
                    ],
                  },
                }, {
                  "kind": "Field",
                  "name": {
                    "kind": "Name",
                    "value": "forwardCircular",
                  },
                  "selectionSet": {
                    "kind": "SelectionSet",
                    "selections": [
                      {
                        "kind": "Field",
                        "name": {
                          "kind": "Name",
                          "value": "b",
                        },
                        "selectionSet": {
                          "kind": "SelectionSet",
                          "selections": [
                            {
                              "kind": "Field",
                              "name": {
                                "kind": "Name",
                                "value": "a",
                              },
                              "selectionSet": {
                                "kind": "SelectionSet",
                                "selections": [
                                  {
                                    "kind": "Field",
                                    "name": {
                                      "kind": "Name",
                                      "value": "i",
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
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
          {
          "kind": "Field",
          "name": {
            "kind": "Name",
            "value": "dogs",
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
                  "value": "bark",
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
    }]
  });
});