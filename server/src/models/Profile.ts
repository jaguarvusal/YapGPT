import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define an interface for the Yapper document
interface IYapper extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  skills: string[];
  activeLevel: number;
  completedLevels: number[];
  isCorrectPassword(password: string): Promise<boolean>;
}

// Define the schema for the Yapper document
const yapperSchema = new Schema<IYapper>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Must match an email address!'],
    },
    password: {
      type: String,
      required: true,
      minlength: 5,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    activeLevel: {
      type: Number,
      default: 1,
    },
    completedLevels: [{
      type: Number,
    }],
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
    collection: 'Yappers'
  }
);

// set up pre-save middleware to create password
yapperSchema.pre<IYapper>('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

// compare the incoming password with the hashed password
yapperSchema.methods.isCorrectPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const Yapper = model<IYapper>('Yapper', yapperSchema);

export default Yapper;
