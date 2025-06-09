import mongoose from 'mongoose';
import Yapper from '../models/Profile.js';
import * as dotenv from 'dotenv';
dotenv.config();
const updateDefaultAvatars = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yapgpt');
        console.log('Connected to MongoDB');
        // Find all users with avatar1.png and update them to null
        const result = await Yapper.updateMany({ avatar: 'avatar1.png' }, { $set: { avatar: null } });
        console.log(`Updated ${result.modifiedCount} users`);
        console.log('Successfully updated default avatars');
    }
    catch (error) {
        console.error('Error updating default avatars:', error);
    }
    finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
};
// Run the update
updateDefaultAvatars();
