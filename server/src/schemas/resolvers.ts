import { Yapper } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import { saveBase64ToFile, transcribeAudio, cleanupFile } from '../utils/audio.js';
import { analyzeTranscript } from '../utils/gpt.js';

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
  },
};

export default resolvers;
