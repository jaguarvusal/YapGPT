import { gql } from 'graphql-tag';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
const characters = [
    {
        id: "1",
        name: "Elodie",
        description: "A sophisticated and charming AI assistant who brings elegance to every conversation.",
        imageUrl: "/characters/elodie.png",
        voiceId: "alloy"
    },
    {
        id: "2",
        name: "Camila",
        description: "A warm and engaging AI assistant who makes every interaction feel natural and fun.",
        imageUrl: "/characters/camila.png",
        voiceId: "echo"
    },
    {
        id: "3",
        name: "Anya",
        description: "A witty and playful AI assistant who adds spark to every conversation.",
        imageUrl: "/characters/anya.png",
        voiceId: "fable"
    }
];
const typeDefs = gql `
  type Character {
    id: ID!
    name: String!
    description: String!
    imageUrl: String!
    voiceId: String!
  }

  type Query {
    characters: [Character!]!
  }

  input MessageInput {
    role: String!
    content: String!
  }

  type AnalysisResponse {
    analysis: String!
  }

  type Mutation {
    generateChatResponse(characterId: ID!, message: String!): String!
    generateVoice(text: String!, voiceId: String!): String!
    convertSpeechToText(audioBase64: String!): String!
    analyzeConversation(conversation: [MessageInput!]!): AnalysisResponse!
  }
`;
const resolvers = {
    Query: {
        characters: async () => {
            // ... existing characters resolver ...
        }
    },
    Mutation: {
        generateChatResponse: async (_, { characterId, message }) => {
            try {
                // Get character details based on characterId
                const character = characters.find(c => c.id === characterId);
                if (!character) {
                    throw new Error('Character not found');
                }
                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are ${character.name}. ${character.description}`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                });
                return response.choices[0].message.content || "Sorry, I couldn't generate a response.";
            }
            catch (error) {
                console.error('Error generating chat response:', error);
                throw new Error('Failed to generate chat response');
            }
        },
        generateVoice: async (_, { text, voiceId }) => {
            try {
                const response = await openai.audio.speech.create({
                    model: "tts-1",
                    voice: voiceId,
                    input: text
                });
                const buffer = await response.arrayBuffer();
                return Buffer.from(buffer).toString('base64');
            }
            catch (error) {
                console.error('Error generating voice:', error);
                throw new Error('Failed to generate voice');
            }
        },
        convertSpeechToText: async (_, { audioBase64 }) => {
            try {
                const audioBuffer = Buffer.from(audioBase64, 'base64');
                // Create a Blob from the buffer
                const blob = new Blob([audioBuffer], { type: 'audio/wav' });
                const file = new File([blob], 'audio.wav', { type: 'audio/wav' });
                const response = await openai.audio.transcriptions.create({
                    file: file,
                    model: "whisper-1"
                });
                return response.text;
            }
            catch (error) {
                console.error('Error converting speech to text:', error);
                throw new Error('Failed to convert speech to text');
            }
        },
        analyzeConversation: async (_, { conversation }) => {
            try {
                const prompt = `Please analyze this flirting conversation and provide constructive feedback. Focus on:
1. Conversation flow and engagement
2. Response quality and appropriateness
3. Areas for improvement
4. Positive aspects to maintain

Conversation:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Please provide a concise, encouraging analysis that helps the user improve their flirting skills.`;
                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are a flirting coach analyzing a conversation. Provide constructive, encouraging feedback that helps the user improve their flirting skills."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                });
                return {
                    analysis: response.choices[0].message.content || "Unable to analyze conversation."
                };
            }
            catch (error) {
                console.error('Error analyzing conversation:', error);
                throw new Error('Failed to analyze conversation');
            }
        }
    }
};
export { typeDefs, resolvers };
