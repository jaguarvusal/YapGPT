import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
// Define the schema for the Yapper document
const yapperSchema = new Schema({
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
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
    collection: 'Yappers'
});
// set up pre-save middleware to create password
yapperSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('password')) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
    next();
});
// compare the incoming password with the hashed password
yapperSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
const Yapper = model('Yapper', yapperSchema);
export default Yapper;
