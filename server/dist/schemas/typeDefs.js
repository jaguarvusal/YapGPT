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

  input UploadAudioInput {
    audioBase64: String!
    filename: String!
  }

  type AudioResponse {
    transcript: String!
    confidenceScore: Float!
    fillerWordCount: Int!
    grammarScore: Float!
    wordChoiceScore: Float!
    conciseness: Conciseness!
    charismaScore: Float!
    suggestions: [String]!
  }

  type Conciseness {
    wordCount: Int!
    sentenceCount: Int!
  }

  type Query {
    yappers: [Yapper]!
    yapper(yapperId: ID!): Yapper
    me: Yapper
  }

  type Mutation {
    addYapper(input: YapperInput!): Auth
    login(identifier: String!, password: String!): Auth

    addSkill(yapperId: ID!, skill: String!): Yapper
    removeYapper: Yapper
    removeSkill(skill: String!): Yapper
    uploadAudio(input: UploadAudioInput!): AudioResponse!
  }
`;
export default typeDefs;
