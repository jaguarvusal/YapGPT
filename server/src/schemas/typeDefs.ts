const typeDefs = `
  type Yapper {
    _id: ID!
    name: String!
    email: String!
    password: String
    skills: [String]!
    activeLevel: Int!
    completedLevels: [Int]
    hearts: Int!
    streak: Int!
    lastLoginDate: String
    lastLoginTime: String
    heartRegenerationTimer: String
    following: [Yapper]
    followers: [Yapper]
    avatar: String
    createdAt: String
    updatedAt: String
  }

  type Auth {
    token: ID!
    yapper: Yapper!
  }
  
  input YapperInput {
    name: String!
    email: String!
    password: String!
    hearts: Int
    streak: Int
    lastLoginDate: String
    heartRegenerationTimer: String
  }

  input UploadAudioInput {
    audioBase64: String!
    filename: String!
  }

  input MessageInput {
    role: String!
    content: String!
  }

  type AnalysisResponse {
    analysis: String!
  }

  type AudioResponse {
    transcript: String!
    confidenceScore: Float!
    fillerWordCount: Int!
    grammarScore: Float!
    wordChoiceScore: Float!
    conciseness: Conciseness!
    charismaScore: Float!
    relevanceScore: Float!
    suggestions: [String]!
  }

  type Conciseness {
    wordCount: Int!
    sentenceCount: Int!
  }

  type Character {
    id: ID!
    name: String!
    personality: String!
    voiceId: String!
    sampleLine: String!
  }

  type FlirtResponse {
    message: String!
    audioUrl: String!
    score: Int!
    feedback: String!
  }

  type ChatResponse {
    response: String!
  }

  type SpeechToTextResponse {
    text: String!
  }

  type StreamedChatResponse {
    chunk: String!
    isComplete: Boolean!
    message: String!
    characterId: String!
  }

  type StreamedVoiceResponse {
    audioChunk: String!
    isComplete: Boolean!
    voiceId: String!
    text: String!
  }

  type Query {
    yappers: [Yapper]!
    yapper(yapperId: ID!): Yapper
    me: Yapper
    characters: [Character]!
  }

  type Mutation {
    addYapper(input: YapperInput!): Auth!
    login(identifier: String!, password: String!): Auth!
    updateProgress(activeLevel: Int!, completedLevels: [Int]!): Yapper
    updateHeartsAndStreak(hearts: Int!, streak: Int!, lastLoginDate: String, heartRegenerationTimer: String): Yapper
    updateAvatar(avatar: String!): Yapper
    addSkill(yapperId: ID!, skill: String!): Yapper
    removeYapper: Yapper
    removeSkill(skill: String!): Yapper
    uploadAudio(input: UploadAudioInput!): AudioResponse!
    
    generateVoiceResponse(voiceId: String!, text: String!): FlirtResponse!
    analyzeFlirting(text: String!): FlirtResponse!
    convertSpeechToText(audio: String!): SpeechToTextResponse!
    generateChatResponse(message: String!, characterId: String!): ChatResponse!
    streamChatResponse(message: String!, characterId: String!): StreamedChatResponse!
    streamVoiceResponse(voiceId: String!, text: String!): StreamedVoiceResponse!
    analyzeConversation(conversation: [MessageInput!]!): AnalysisResponse!
    followUser(userId: ID!): Yapper
    unfollowUser(userId: ID!): Yapper
  }

  type Subscription {
    chatResponseStream(message: String!, characterId: String!): StreamedChatResponse
    voiceResponseStream(voiceId: String!, text: String!): StreamedVoiceResponse
  }
`;

export default typeDefs;
