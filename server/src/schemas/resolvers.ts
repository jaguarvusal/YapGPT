import { Yapper } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import { saveBase64ToFile, transcribeAudio, cleanupFile } from '../utils/audio.js';
import { analyzeTranscript } from '../utils/gpt.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PubSub, withFilter } from 'graphql-subscriptions';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pubsub = new PubSub();

const characters = [
  {
    id: '1',
    name: 'Élodie',
    personality: 'Elegant and sophisticated French woman who loves intellectual discussions and art',
    voiceId: 'xNtG3W2oqJs0cJZuTyBc',
    sampleLine: "You know what I love? A good debate that makes me think. Care to challenge my perspective?"
  },
  {
    id: '2',
    name: 'Camila',
    personality: 'Passionate Spanish woman with a fiery spirit and love for music and dance',
    voiceId: 'WLjZnm4PkNmYtNCyiCq8',
    sampleLine: "Every moment is a chance to create something beautiful. What inspires you?"
  },
  {
    id: '3',
    name: 'Anya',
    personality: 'Mysterious and bold Russian woman who loves adventure and deep conversations',
    voiceId: 'GCPLhb1XrVwcoKUJYcvz',
    sampleLine: "Life's an adventure waiting to happen. Ready to make some memories?"
  }
];

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
        For introductions, make them contextually relevant to the current scene but keep them concise.`;

        // Generate response using GPT-4
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 100
        });

        let response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";
        
        // Ensure response is exactly one sentence
        const sentences = response.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 1) {
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
        const character = characters.find(c => c.id === characterId);
        if (!character) {
          throw new Error('Character not found');
        }

        const systemMessage = `You are ${character.name}, ${character.personality}. 
        You MUST respond with EXACTLY ONE sentence, no longer than 20 words.
        Keep your response natural and in character, but strictly limit it to one complete sentence.
        Your goal is to have a natural conversation while maintaining your character's personality.
        CRITICAL: You MUST ALWAYS respond in ENGLISH ONLY, regardless of your character's background or nationality.
        Even if your character is from a non-English speaking country, you MUST respond in English.
        For introductions, make them contextually relevant to the current scene but keep them concise.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 100,
          stream: true
        });

        let fullResponse = '';
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            pubsub.publish('CHAT_RESPONSE_STREAM', {
              chatResponseStream: {
                chunk: content,
                isComplete: false,
                message,
                characterId
              }
            });
          }
        }

        // Ensure response is exactly one sentence
        const sentences = fullResponse.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 1) {
          fullResponse = sentences[0].trim();
        }

        // Publish the complete response
        pubsub.publish('CHAT_RESPONSE_STREAM', {
          chatResponseStream: {
            chunk: fullResponse,
            isComplete: true,
            message,
            characterId
          }
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
              voiceResponseStream: {
                audioChunk: '',
                isComplete: true,
                voiceId,
                text
              }
            });
            break;
          }

          if (value && value.length > 0) {
            hasPublishedChunk = true;
            const base64Audio = Buffer.from(value).toString('base64');
            pubsub.publish('VOICE_RESPONSE_STREAM', {
              voiceResponseStream: {
                audioChunk: base64Audio,
                isComplete: false,
                voiceId,
                text
              }
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
    }
  },
  Subscription: {
    chatResponseStream: {
      subscribe: withFilter(
        (_, { message, characterId }) => {
          if (!message || !characterId) {
            throw new Error('Message and characterId are required for chat response stream');
          }
          return pubsub.asyncIterator(['CHAT_RESPONSE_STREAM']);
        },
        (payload, variables) => {
          // Only send updates for the matching message and characterId
          return payload.chatResponseStream && 
                 payload.chatResponseStream.chunk !== null;
        }
      )
    },
    voiceResponseStream: {
      subscribe: withFilter(
        (_, { voiceId, text }) => {
          if (!voiceId || !text) {
            throw new Error('VoiceId and text are required for voice response stream');
          }
          return pubsub.asyncIterator(['VOICE_RESPONSE_STREAM']);
        },
        (payload, variables) => {
          // Only send updates for the matching voiceId and text
          return payload.voiceResponseStream && 
                 payload.voiceResponseStream.audioChunk !== null;
        }
      )
    }
  }
};

export default resolvers;
