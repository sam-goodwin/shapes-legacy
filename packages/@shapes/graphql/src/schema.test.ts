import * as gql from '.';

const schema = gql.schemaBuilder()
  .enum({
    Direction: {
      DOWN: 'DOWN',
      LEFT: 'LEFT',
      RIGHT: 'RIGHT',
      UP: 'UP',
    }
  } as const)
  .interface({
    Person: {
      fields: {
        age: gql.Int["!"],
        friends: gql.List(gql.Self["!"]),
        id: gql.ID["!"],
        name: gql.String["!"]
      }
    }
  })
  /*
  type Dog implements Animal {

  }
  */
  .type((_) => ({
    Dog: {
      fields: {
        bark: gql.String["!"]
      },
      implements: ['Person']
    }
  }))
  .type((_) => ({
    Bird: {
      fields: {
        tweet: gql.String
      },
      implements: ['Person']
    }
  }))
  .type((_) => ({
    Query: {
      fields: {
        /**
         * type Query {
         *   getPerson(id: ID): Person
         * }
         */
        getPerson: gql.Function({id: gql.ID}, _.Person),
        move: gql.Function({Direction: _.Direction}, gql.String["!"])
      }
    }
  }))
  .build({
    query: 'Query'
  })
;

// @ts-ignore
const gqlSchema = gql.toGraphQLAST(schema);

const client = gql.gqlClient(schema);

// @ts-ignore
const query = client.compileQuery('Test', (client) => client.getPerson({id: 'id'}, (person) => person
  .id()
));
// @ts-ignore
const query2 = client.compileQuery({id: gql.ID}, ({id}, root) =>
  // @ts-ignore
  root.getPerson({id}, (person) => person
    .id()
    // @ts-ignore
    .$on('Bird', (bird) => bird
      .tweet()
      .age()
    )
  )
);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const {id} = await query.execute();
  console.log(id)

  const r = await query2.execute({id: 'id'})
  if (r.__typename === "Bird") {
    r.tweet;
  }
})()

const result = client.query((q) => ({
  // @ts-ignore
  a: q.getPerson({id: 'id'}, (person) => person
    .id()
    .$on('Dog', (dog) => dog
      .bark()
    )
    .$on('Bird', (bird) => bird
      .friends((f) => f
        .id())
      .tweet())
    ),
    // @ts-ignore
  b: q.move({
      Direction: 'UP'
  })
}));

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const {a, b} = await result;
  if (a.__typename === "Dog") {
    a.bark;
  } else {}
})();
