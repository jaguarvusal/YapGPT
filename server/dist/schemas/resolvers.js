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
const resolvers = {
    Query: {
        yappers: async () => {
            return await Yapper.find();
        },
        yapper: async (_parent, { yapperId }) => {
            return await Yapper.findOne({ _id: yapperId });
        },
        me: async (_parent, _args, context) => {
            if (context.user) {
                return await Yapper.findOne({ _id: context.user._id });
            }
            throw AuthenticationError;
        },
        characters: () => characters,
    },
    Mutation: {
        addYapper: async (_parent, { input }) => {
            const yapper = await Yapper.create({ ...input });
            const token = signToken(yapper.name, yapper.email, yapper._id);
            return { token, yapper };
        },
        login: async (_parent, { identifier, password }) => {
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
            }
            catch (error) {
                if (error instanceof AuthenticationError) {
                    throw error;
                }
                throw new AuthenticationError('An error occurred during login');
            }
        },
        addSkill: async (_parent, { yapperId, skill }, context) => {
            if (context.user) {
                return await Yapper.findOneAndUpdate({ _id: yapperId }, {
                    $addToSet: { skills: skill },
                }, {
                    new: true,
                    runValidators: true,
                });
            }
            throw AuthenticationError;
        },
        removeYapper: async (_parent, _args, context) => {
            if (context.user) {
                return await Yapper.findOneAndDelete({ _id: context.user._id });
            }
            throw AuthenticationError;
        },
        removeSkill: async (_parent, { skill }, context) => {
            if (context.user) {
                return await Yapper.findOneAndUpdate({ _id: context.user._id }, { $pull: { skills: skill } }, { new: true });
            }
            throw AuthenticationError;
        },
        uploadAudio: async (_parent, { input }) => {
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
            }
            catch (error) {
                console.error('Error processing audio:', error);
                if (error.response?.data) {
                    console.error('API Error details:', error.response.data);
                }
                throw new Error(`Failed to process audio: ${error.message}`);
            }
        },
        generateVoiceResponse: async (_parent, { voiceId, text }) => {
            try {
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
                    throw new Error('Failed to generate voice response');
                }
                const arrayBuffer = await response.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString('base64');
                return {
                    message: text,
                    audioUrl: base64Audio,
                    score: 0,
                    feedback: '',
                };
            }
            catch (error) {
                console.error('Error generating voice response:', error);
                throw new Error('Failed to generate voice response');
            }
        },
        analyzeFlirting: async (_parent, { text }) => {
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
            }
            catch (error) {
                console.error('Error analyzing flirting:', error);
                throw new Error('Failed to analyze flirting attempt');
            }
        },
        convertSpeechToText: async (_parent, { audio }) => {
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
            }
            catch (error) {
                console.error('Error converting speech to text:', error);
                throw new Error(`Failed to convert speech to text: ${error.message}`);
            }
        },
        generateChatResponse: async (_parent, { message, characterId }) => {
            try {
                // Find the character
                const character = characters.find(c => c.id === characterId);
                if (!character) {
                    throw new Error('Character not found');
                }
                // Create a system message that defines the character's personality and context
                const systemMessage = `You are ${character.name}, ${character.personality}. 
        Respond naturally and in character. Keep responses concise and engaging. 
        Your goal is to have a natural conversation while maintaining your character's personality.`;
                // Generate response using GPT-4
                const completion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                });
                const response = completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";
                return {
                    response
                };
            }
            catch (error) {
                console.error('Error generating chat response:', error);
                throw new Error(`Failed to generate chat response: ${error.message}`);
            }
        },
        streamChatResponse: async (_parent, { message, characterId }) => {
            try {
                const character = characters.find(c => c.id === characterId);
                if (!character) {
                    throw new Error('Character not found');
                }
                const systemMessage = `You are ${character.name}, ${character.personality}. 
        Respond naturally and in character. Keep responses concise and engaging. 
        Your goal is to have a natural conversation while maintaining your character's personality.`;
                const completion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 150,
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
                                isComplete: false
                            }
                        });
                    }
                }
                pubsub.publish('CHAT_RESPONSE_STREAM', {
                    chatResponseStream: {
                        chunk: '',
                        isComplete: true
                    }
                });
                return {
                    chunk: fullResponse,
                    isComplete: true
                };
            }
            catch (error) {
                console.error('Error streaming chat response:', error);
                throw new Error(`Failed to stream chat response: ${error.message}`);
            }
        },
        streamVoiceResponse: async (_parent, { voiceId, text }) => {
            try {
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
                    throw new Error('Failed to generate voice response');
                }
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error('Failed to get response reader');
                }
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        pubsub.publish('VOICE_RESPONSE_STREAM', {
                            voiceResponseStream: {
                                audioChunk: '',
                                isComplete: true
                            }
                        });
                        break;
                    }
                    const base64Chunk = Buffer.from(value).toString('base64');
                    pubsub.publish('VOICE_RESPONSE_STREAM', {
                        voiceResponseStream: {
                            audioChunk: base64Chunk,
                            isComplete: false
                        }
                    });
                }
                return {
                    audioChunk: '',
                    isComplete: true
                };
            }
            catch (error) {
                console.error('Error streaming voice response:', error);
                throw new Error(`Failed to stream voice response: ${error.message}`);
            }
        }
    },
    Subscription: {
        chatResponseStream: {
            subscribe: withFilter(() => pubsub.asyncIterator(['CHAT_RESPONSE_STREAM']), () => true // You can add filtering logic here if needed
            )
        },
        voiceResponseStream: {
            subscribe: withFilter(() => pubsub.asyncIterator(['VOICE_RESPONSE_STREAM']), () => true // You can add filtering logic here if needed
            )
        }
    }
};
export default resolvers;
