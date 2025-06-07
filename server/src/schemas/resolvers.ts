import { Yapper } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import { saveBase64ToFile, transcribeAudio, cleanupFile } from '../utils/audio.js';
import { analyzeTranscript } from '../utils/gpt.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PubSub } from 'graphql-subscriptions';
import { withFilter } from 'graphql-subscriptions';
import { characters, Character } from '../data/characters.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions for OpenAI responses
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message: OpenAIMessage;
  finish_reason: string | null;
  index: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

// Type definitions for PubSub events
interface ChatResponseStreamPayload {
  chunk: string;
  isComplete: boolean;
  message: string;
  characterId: string;
}

interface VoiceResponseStreamPayload {
  audioChunk: string;
  isComplete: boolean;
  voiceId: string;
  text: string;
}

// Enhanced PubSub types
type PubSubEventMap = {
  CHAT_RESPONSE_STREAM: ChatResponseStreamPayload;
  VOICE_RESPONSE_STREAM: VoiceResponseStreamPayload;
};

type PubSubEventName = keyof PubSubEventMap;

// Create a type-safe wrapper around PubSub
const createTypedPubSub = () => {
  const pubsub = new PubSub();

  return {
    publish: <T extends PubSubEventName>(eventName: T, payload: PubSubEventMap[T]): void => {
      pubsub.publish(eventName, payload);
    },
    asyncIterator: <T extends PubSubEventName>(eventName: T): AsyncIterator<PubSubEventMap[T]> => {
      return (pubsub as any).asyncIterator(eventName);
    }
  };
};

const pubsub = createTypedPubSub();

interface Yapper {
  _id: string;
  name: string;
  email: string;
  password: string;
  skills: string[];
}

interface YapperArgs {
  yapperId: string;
}

interface AddYapperArgs {
  input:{
    name: string;
    email: string;
    password: string;
  }
}

interface AddSkillArgs {
  yapperId: string;
  skill: string;
}

interface RemoveSkillArgs {
  yapperId: string;
  skill: string;
}

interface Context {
  user?: Yapper;
}

interface UploadAudioInput {
  audioBase64: string;
  filename: string;
}

const resolvers = {
  Query: {
    yappers: async (): Promise<Yapper[]> => {
      return await Yapper.find();
    },
    yapper: async (_parent: any, { yapperId }: YapperArgs): Promise<Yapper | null> => {
      return await Yapper.findOne({ _id: yapperId });
    },
    me: async (_parent: any, _args: any, context: Context): Promise<Yapper | null> => {
      if (context.user) {
        return await Yapper.findOne({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
    characters: () => characters,
  },
  Mutation: {
    addYapper: async (_parent: any, { input }: AddYapperArgs): Promise<{ token: string; yapper: Yapper }> => {
      const yapper = await Yapper.create({ ...input });
      const token = signToken(yapper.name, yapper.email, yapper._id);
      return { token, yapper };
    },
    login: async (_parent: any, { identifier, password }: { identifier: string; password: string }): Promise<{ token: string; yapper: Yapper }> => {
      try {
        // Try to find user by email first
        let yapper = await Yapper.findOne({ email: identifier });
        
        // If not found by email, try to find by name
        if (!yapper) {
          yapper = await Yapper.findOne({ name: identifier });
        }

        if (!yapper) {
          throw new AuthenticationError('Invalid credentials');
        }

        const correctPw = await yapper.isCorrectPassword(password);
        if (!correctPw) {
          throw new AuthenticationError('Invalid credentials');
        }

        const token = signToken(yapper.name, yapper.email, yapper._id);
        return { token, yapper };
      } catch (error) {
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new AuthenticationError('An error occurred during login');
      }
    },
    addSkill: async (_parent: any, { yapperId, skill }: AddSkillArgs, context: Context): Promise<Yapper | null> => {
      if (context.user) {
        return await Yapper.findOneAndUpdate(
          { _id: yapperId },
          {
            $addToSet: { skills: skill },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      throw AuthenticationError;
    },
    removeYapper: async (_parent: any, _args: any, context: Context): Promise<Yapper | null> => {
      if (context.user) {
        return await Yapper.findOneAndDelete({ _id: context.user._id });
      }
      throw AuthenticationError;
    },
    removeSkill: async (_parent: any, { skill }: RemoveSkillArgs, context: Context): Promise<Yapper | null> => {
      if (context.user) {
        return await Yapper.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { skills: skill } },
          { new: true }
        );
      }
      throw AuthenticationError;
    },
    uploadAudio: async (_parent: any, { input }: { input: UploadAudioInput }): Promise<{
      transcript: string;
      confidenceScore: number;
      fillerWordCount: number;
      grammarScore: number;
      wordChoiceScore: number;
      conciseness: {
        wordCount: number;
        sentenceCount: number;
      };
      charismaScore: number;
      relevanceScore: number;
      suggestions: string[];
    }> => {
      try {
        console.log('Starting audio upload process...');
        
        // Save the audio file
        const filePath = await saveBase64ToFile(input.audioBase64, input.filename);
        console.log('Audio file saved at:', filePath);
        
        // Transcribe the audio using OpenAI Whisper
        const transcript = await transcribeAudio(filePath);
        console.log('Transcript received:', transcript);
        
        // Clean up the file
        await cleanupFile(filePath);
        console.log('Audio file cleaned up');

        // Analyze the transcript using GPT-4
        console.log('Sending transcript to GPT for analysis...');
        const analysis = await analyzeTranscript(transcript, "Analyze this speech for filler words, grammar, word choice, conciseness, charisma, and relevance.");
        console.log('GPT Analysis received:', analysis);
        
        if (!analysis) {
          throw new Error('No analysis received from GPT');
        }

        // Ensure all required fields are present
        const response = {
          ...analysis,
          relevanceScore: analysis.relevanceScore ?? 50, // Default to 50 if missing
          charismaScore: analysis.charismaScore ?? 5, // Default to 5 if missing
          confidenceScore: analysis.confidenceScore ?? 0.5, // Default to 0.5 if missing
          grammarScore: analysis.grammarScore ?? 50, // Default to 50 if missing
          wordChoiceScore: analysis.wordChoiceScore ?? 50, // Default to 50 if missing
          fillerWordCount: analysis.fillerWordCount ?? 0, // Default to 0 if missing
          suggestions: analysis.suggestions ?? [], // Default to empty array if missing
          conciseness: {
            wordCount: analysis.conciseness?.wordCount ?? 0,
            sentenceCount: analysis.conciseness?.sentenceCount ?? 0
          }
        };

        return response;
      } catch (error: any) {
        console.error('Error processing audio:', error);
        if (error.response?.data) {
          console.error('API Error details:', error.response.data);
        }
        throw new Error(`Failed to process audio: ${error.message}`);
      }
    },
    generateVoiceResponse: async (_parent: any, { voiceId, text }: { voiceId: string; text: string }) => {
      try {
        if (!voiceId || !text) {
          throw new Error('VoiceId and text are required for voice generation');
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.7,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('ElevenLabs API error:', errorData);
          throw new Error(`Failed to generate voice response: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('Received empty audio response');
        }

        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        if (!base64Audio) {
          throw new Error('Failed to convert audio to base64');
        }

        return {
          message: text,
          audioUrl: base64Audio,
          score: 0,
          feedback: '',
        };
      } catch (error: any) {
        console.error('Error generating voice response:', error);
        throw new Error(`Failed to generate voice response: ${error.message}`);
      }
    },
    analyzeFlirting: async (_parent: any, { text }: { text: string }) => {
      try {
        const prompt = `Analyze this flirting attempt and provide feedback. Score from 0-3 based on charm, confidence, and relevance. Format response as JSON with fields: score (0-3), feedback (string).

Text: "${text}"`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a flirting coach analyzing conversation attempts. Provide constructive feedback and score from 0-3."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response from GPT');
        }

        const analysis = JSON.parse(response);

        return {
          message: text,
          audioUrl: '',
          score: analysis.score,
          feedback: analysis.feedback,
        };
      } catch (error) {
        console.error('Error analyzing flirting:', error);
        throw new Error('Failed to analyze flirting attempt');
      }
    },
    convertSpeechToText: async (_parent: any, { audio }: { audio: string }) => {
      try {
        // Save the audio file temporarily
        const filePath = await saveBase64ToFile(audio, 'temp-speech.webm');
        
        // Transcribe the audio using OpenAI Whisper
        const transcript = await transcribeAudio(filePath);
        
        // Clean up the file
        await cleanupFile(filePath);

        return {
          text: transcript
        };
      } catch (error: any) {
        console.error('Error converting speech to text:', error);
        throw new Error(`Failed to convert speech to text: ${error.message}`);
      }
    },
    generateChatResponse: async (_parent: any, { message, characterId }: { message: string; characterId: string }) => {
      try {
        // Find the character
        const character = characters.find(c => c.id === characterId);
        if (!character) {
          throw new Error('Character not found');
        }

        // Create a system message that defines the character's personality and context
        const systemMessage = `You are ${character.name}, ${character.personality}. 
        You MUST respond with EXACTLY ONE sentence, no longer than 20 words.
        Keep your response natural and in character, but strictly limit it to one complete sentence.
        Your goal is to have a natural conversation while maintaining your character's personality.
        CRITICAL: You MUST ALWAYS respond in ENGLISH ONLY, regardless of your character's background or nationality.
        Even if your character is from a non-English speaking country, you MUST respond in English.
        For introductions, make them contextually relevant to the current scene but keep them concise.
        IMPORTANT: Your responses should feel natural and unforced - avoid being overly flirty or cheesy.
        When responding to the scene context, acknowledge the specific situation and make it feel like a natural continuation of that moment.
        Your responses should reflect your character's personality while staying grounded in the current situation.
        CRITICAL: Pay attention to who is doing what in the scene - don't reverse roles or actions. For example, if you're offering help with spicy food, don't thank the other person for helping you.
        Make sure your response matches the exact situation described in the context, maintaining the correct roles and actions.`;

        // Generate response using GPT-4
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 100
        }) as OpenAIResponse;

        const firstChoice = completion.choices[0];
        if (!firstChoice || !firstChoice.message || !firstChoice.message.content) {
          throw new Error("No response received from OpenAI");
        }
        
        let response = firstChoice.message.content;
        
        // Ensure response is exactly one sentence
        const sentences = response.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 1 && sentences[0]) {
          response = sentences[0].trim();
        }

        return {
          response
        };
      } catch (error: any) {
        console.error('Error generating chat response:', error);
        throw new Error(`Failed to generate chat response: ${error.message}`);
      }
    },
    streamChatResponse: async (_parent: any, { message, characterId }: { message: string; characterId: string }) => {
      try {
        const character = characters.find((c: Character) => c.id === characterId);
        if (!character) {
          throw new Error('Character not found');
        }

        const systemMessage = `You are ${character.name}, ${character.personality}. 
        You MUST respond with EXACTLY ONE sentence, no longer than 20 words.
        Keep your response natural and in character, but strictly limit it to one complete sentence.
        Your goal is to have a natural conversation while maintaining your character's personality.
        CRITICAL: You MUST ALWAYS respond in ENGLISH ONLY, regardless of your character's background or nationality.
        Even if your character is from a non-English speaking country, you MUST respond in English.
        For introductions, make them contextually relevant to the current scene but keep them concise.
        IMPORTANT: Your responses should feel natural and unforced - avoid being overly flirty or cheesy.
        When responding to the scene context, acknowledge the specific situation and make it feel like a natural continuation of that moment.
        Your responses should reflect your character's personality while staying grounded in the current situation.
        CRITICAL: Pay attention to who is doing what in the scene - don't reverse roles or actions. For example, if you're offering help with spicy food, don't thank the other person for helping you.
        Make sure your response matches the exact situation described in the context, maintaining the correct roles and actions.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 100,
          stream: true
        }) as AsyncIterable<ChatCompletionChunk>;

        let fullResponse = '';
        for await (const chunk of completion) {
          const firstChoice = chunk.choices[0];
          if (!firstChoice) continue;
          
          const content = firstChoice.delta?.content;
          if (content) {
            fullResponse += content;
            pubsub.publish('CHAT_RESPONSE_STREAM', {
              chunk: content,
              isComplete: false,
              message,
              characterId
            });
          }
        }

        // Ensure response is exactly one sentence
        const sentences = fullResponse.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 1 && sentences[0]) {
          fullResponse = sentences[0].trim();
        }

        // Publish the complete response
        pubsub.publish('CHAT_RESPONSE_STREAM', {
          chunk: fullResponse,
          isComplete: true,
          message,
          characterId
        });

        return {
          chunk: fullResponse,
          isComplete: true
        };
      } catch (error: any) {
        console.error('Error streaming chat response:', error);
        throw new Error(`Failed to stream chat response: ${error.message}`);
      }
    },
    streamVoiceResponse: async (_parent: any, { voiceId, text }: { voiceId: string; text: string }) => {
      try {
        if (!voiceId || !text) {
          throw new Error('VoiceId and text are required for voice streaming');
        }

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.7,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('ElevenLabs API error:', errorData);
          throw new Error(`Failed to generate voice response: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response reader');
        }

        let hasPublishedChunk = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!hasPublishedChunk) {
              // If we haven't published any chunks, something went wrong
              throw new Error('No audio data received from stream');
            }
            pubsub.publish('VOICE_RESPONSE_STREAM', {
              audioChunk: '',
              isComplete: true,
              voiceId,
              text
            });
            break;
          }

          if (value && value.length > 0) {
            hasPublishedChunk = true;
            const base64Audio = Buffer.from(value).toString('base64');
            pubsub.publish('VOICE_RESPONSE_STREAM', {
              audioChunk: base64Audio,
              isComplete: false,
              voiceId,
              text
            });
          }
        }

        return {
          audioChunk: '',
          isComplete: true
        };
      } catch (error: any) {
        console.error('Error streaming voice response:', error);
        throw new Error(`Failed to stream voice response: ${error.message}`);
      }
    },
    analyzeConversation: async (_, { conversation }) => {
      try {
        console.log('Received conversation for analysis:', conversation);
        
        // Check if there are any user messages
        const hasUserMessages = conversation.some(msg => msg.role === 'user');
        
        const prompt = hasUserMessages ? 
          `Hey there! I just watched your flirting session, and I'd love to share my thoughts with you. Please structure your response EXACTLY like this, with all five sections:

1. Conversation Flow and Engagement: Tell me about how your conversation flowed naturally, including specific examples of good transitions and engagement from your messages.

2. Response Quality and Appropriateness: Share your thoughts on the quality of your responses, including specific examples of well-crafted messages and their impact.

3. Areas for Improvement: Let's talk about specific areas where you could improve, using actual examples from your messages.

4. Positive Aspects to Maintain: I want to highlight specific strengths you showed in your messages that you should definitely keep using.

5. Final Thoughts: Give me a brief summary of your overall performance and one key takeaway for your next flirting session.

Conversation:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

IMPORTANT: 
- Always use 'you' and 'your' when talking about the person (never use 'the user' or third person)
- Include ALL FIVE sections exactly as numbered above
- Make sure to end with the Final Thoughts section
- Keep the tone friendly and encouraging
- Include specific examples from the messages` 
          : 
          `Hey there! I noticed you ended the session without saying anything. Let me share my thoughts with you.

HEART RATING: ❤️ (1 heart)
Since no conversation took place, the rating is 1 heart.

Please structure your response EXACTLY like this, with all five sections:

1. Conversation Flow and Engagement: Since you didn't engage in the conversation, there wasn't much flow to analyze. This is completely okay - sometimes we need time to gather our thoughts or feel comfortable before speaking up.

2. Response Quality and Appropriateness: While there weren't any responses to analyze, this gives us a great opportunity to discuss how to start conversations. Remember, it's perfectly normal to feel a bit nervous or unsure about what to say.

3. Areas for Improvement: The main area to focus on is taking that first step to engage. Even a simple greeting or question can be a great way to start. Don't worry about being perfect - the most important thing is to be yourself.

4. Positive Aspects to Maintain: Your decision to end the session shows that you're aware of your comfort level, which is actually a positive trait. It's better to be honest about your readiness than to force a conversation you're not comfortable with.

5. Final Thoughts: Remember, everyone starts somewhere! Next time, try starting with something simple like "Hi" or "How are you?" The key is to take that first step, no matter how small it might feel.

IMPORTANT: 
- Always use 'you' and 'your' when talking about the person (never use 'the user' or third person)
- Include ALL FIVE sections exactly as numbered above
- Make sure to end with the Final Thoughts section
- Keep the tone friendly and encouraging
- For empty conversations, ALWAYS start with "HEART RATING: ❤️ (1 heart)"`;

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are having a friendly chat with a friend about their flirting conversation. You MUST follow these rules:\n1. ALWAYS use 'you' and 'your' (never 'the user' or third person)\n2. ALWAYS include all five numbered sections\n3. ALWAYS end with the Final Thoughts section\n4. Keep the tone friendly and encouraging\n5. Include specific examples from their messages when available\n6. For empty conversations (no user messages), you MUST start your response with 'HEART RATING: ❤️ (1 heart)'\nExample of good feedback: 'You showed great confidence when you...' instead of 'The user showed great confidence...'"
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        });
        console.log('Received analysis from OpenAI:', response.choices[0].message.content);
        return {
          analysis: response.choices[0].message.content || "Unable to analyze conversation."
        };
      } catch (error) {
        console.error('Error analyzing conversation:', error);
        throw new Error('Failed to analyze conversation');
      }
    },
  },
  Subscription: {
    chatResponseStream: {
      subscribe: withFilter(
        (_, { message, characterId }) => {
          if (!message || !characterId) {
            throw new Error('Message and characterId are required for chat response stream');
          }
          return pubsub.asyncIterator('CHAT_RESPONSE_STREAM');
        },
        (payload: ChatResponseStreamPayload | undefined) => {
          return payload?.chunk !== null;
        }
      )
    },
    voiceResponseStream: {
      subscribe: withFilter(
        (_, { voiceId, text }) => {
          if (!voiceId || !text) {
            throw new Error('VoiceId and text are required for voice response stream');
          }
          return pubsub.asyncIterator('VOICE_RESPONSE_STREAM');
        },
        (payload: VoiceResponseStreamPayload | undefined) => {
          return payload?.audioChunk !== null;
        }
      )
    }
  }
};

export default resolvers;
