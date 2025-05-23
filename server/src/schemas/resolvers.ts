import { Yapper } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

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
  },
};

export default resolvers;
