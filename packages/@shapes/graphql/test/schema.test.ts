import * as gql from '../lib';

const schema = gql.schemaBuilder()
  .enum({
    Direction: {
      UP: 'UP',
      DOWN: 'DOWN',
      LEFT: 'LEFT',
      RIGHT: 'RIGHT',
    }
  } as const)
  .interface({
    Person: {
      fields: {
        id: gql.ID["!"],
        name: gql.String["!"],
        age: gql.Int["!"],
        friends: gql.List(gql.Self["!"])
      }
    }
  })
  /*
  type Dog implements Animal {

  }
  */
  .type(_ => ({
    Dog: {
      implements: ['Person'],
      fields: {
        bark: gql.String["!"]
      }
    }
  }))
  .type(_ => ({
    Bird: {
      implements: ['Person'],
      fields: {
        tweet: gql.String
      }
    }
  }))
  .type(_ => ({
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

const gqlSchema = gql.toGraphQLAST(schema);

const client = gql.gqlClient(schema);

const query = client.compileQuery('Test', client => client.getPerson({id: 'id'}, person => person
  .id()
));
const query2 = client.compileQuery({id: gql.ID}, ({id}, root) =>
  root.getPerson({id}, person => person
    .id()
    .$on('Bird', bird => bird
      .tweet()
      .age()
    )
  )
);

query.execute().then(r => r.id);
query2.execute({id: 'id'}).then(r => {
  if (r.__typename === 'Bird') {
    r.tweet;
  }
});

const result = client.query(q => ({
  a: q.getPerson({id: 'id'}, person => person
    .id()
    .$on('Dog', dog => dog
      .bark()
    )
    .$on('Bird', bird => bird
      .friends(f => f
        .id())
      .tweet())
  ),

  b: q.move({
    Direction: 'UP'
  })
})
);
result.then(({a, b}) => {
  if (a.__typename === 'Dog') {
    a.bark;
  } else {
  }
});
