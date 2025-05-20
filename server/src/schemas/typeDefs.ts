const typeDefs = `
  type Yapper {
    _id: ID
    name: String
    email: String
    password: String
    skills: [String]!
  }

  type Auth {
    token: ID!
    yapper: Yapper
  }
  
  input YapperInput {
    name: String!
    email: String!
    password: String!
  }

  type Query {
    yappers: [Yapper]!
    yapper(yapperId: ID!): Yapper
    me: Yapper
  }

  type Mutation {
    addYapper(input: YapperInput!): Auth
    login(email: String!, password: String!): Auth

    addSkill(yapperId: ID!, skill: String!): Yapper
    removeYapper: Yapper
    removeSkill(skill: String!): Yapper
  }
`;

export default typeDefs;
