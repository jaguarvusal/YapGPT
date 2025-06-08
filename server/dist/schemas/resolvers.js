import { Yapper } from '../models/index.js';
import { signToken, AuthenticationError } from '../utils/auth.js';
import { saveBase64ToFile, transcribeAudio, cleanupFile } from '../utils/audio.js';
import { analyzeTranscript } from '../utils/gpt.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { PubSub } from 'graphql-subscriptions';
import { withFilter } from 'graphql-subscriptions';
import { characters } from '../data/characters.js';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Create a type-safe wrapper around PubSub
const createTypedPubSub = () => {
    const pubsub = new PubSub();
    return {
        publish: (eventName, payload) => {
            pubsub.publish(eventName, payload);
        },
        asyncIterator: (eventName) => {
            return pubsub.asyncIterator(eventName);
        }
    };
};
const pubsub = createTypedPubSub();
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
                console.log('Login attempt with:', { identifier });
                // Try to find user by email first
                let yapper = await Yapper.findOne({ email: identifier });
                console.log('Email search result:', yapper ? 'Found' : 'Not found');
                // If not found by email, try to find by name
                if (!yapper) {
                    yapper = await Yapper.findOne({ name: identifier });
                    console.log('Name search result:', yapper ? 'Found' : 'Not found');
                }
                if (!yapper) {
                    console.log('No user found with identifier:', identifier);
                    throw new AuthenticationError('Invalid credentials');
                }
                const correctPw = await yapper.isCorrectPassword(password);
                console.log('Password check result:', correctPw ? 'Correct' : 'Incorrect');
                if (!correctPw) {
                    throw new AuthenticationError('Invalid credentials');
                }
                // Ensure we have the complete user data with progress fields
                const completeYapper = await Yapper.findOne({ _id: yapper._id }).select('+activeLevel +completedLevels');
                if (!completeYapper) {
                    throw new Error('Failed to retrieve complete user data');
                }
                console.log('Login successful, user data:', {
                    id: completeYapper._id,
                    name: completeYapper.name,
                    activeLevel: completeYapper.activeLevel,
                    completedLevels: completeYapper.completedLevels
                });
                const token = signToken(completeYapper.name, completeYapper.email, completeYapper._id);
                return { token, yapper: completeYapper };
            }
            catch (error) {
                console.error('Login error:', error);
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
            }
            catch (error) {
                console.error('Error generating voice response:', error);
                throw new Error(`Failed to generate voice response: ${error.message}`);
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
                });
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
            }
            catch (error) {
                console.error('Error generating chat response:', error);
                throw new Error(`Failed to generate chat response: ${error.message}`);
            }
        },
        streamChatResponse: async (_parent, { message, characterId }) => {
            try {
                const character = characters.find((c) => c.id === characterId);
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
                });
                let fullResponse = '';
                for await (const chunk of completion) {
                    const firstChoice = chunk.choices[0];
                    if (!firstChoice)
                        continue;
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
            }
            catch (error) {
                console.error('Error streaming chat response:', error);
                throw new Error(`Failed to stream chat response: ${error.message}`);
            }
        },
        streamVoiceResponse: async (_parent, { voiceId, text }) => {
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
            }
            catch (error) {
                console.error('Error streaming voice response:', error);
                throw new Error(`Failed to stream voice response: ${error.message}`);
            }
        },
        analyzeConversation: async (_, { conversation }) => {
            try {
                console.log('Received conversation for analysis:', conversation);
                // Check if there are any user messages
                const hasUserMessages = conversation.some((msg) => msg.role === 'user');
                const prompt = hasUserMessages ?
                    `Hey there! I just watched your flirting session, and I'd love to share my thoughts with you. Please structure your response EXACTLY like this, with all five sections:

1. Conversation Flow and Engagement: Tell me about how your conversation flowed naturally, including specific examples of good transitions and engagement from your messages.

2. Response Quality and Appropriateness: Share your thoughts on the quality of your responses, including specific examples of well-crafted messages and their impact.

3. Areas for Improvement: Let's talk about specific areas where you could improve, using actual examples from your messages.

4. Positive Aspects to Maintain: I want to highlight specific strengths you showed in your messages that you should definitely keep using.

Final Thoughts: Write a short, encouraging paragraph summarizing your overall performance and one key takeaway for next time.

Conversation:
${conversation.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

IMPORTANT: 
- Always use 'you' and 'your' when talking about the person (never use 'the user' or third person)
- Include ALL FIVE sections exactly as numbered above
- Keep the tone friendly and encouraging
- Include specific examples from the messages
- DO NOT include any heart rating or scoring information in your response
- DO NOT mention hearts, ratings, or scores in any section
- Focus only on the conversation feedback and encouragement
- For the Final Thoughts section, start with just "Final Thoughts:" (no number)`
                    :
                        `Hey there! I noticed you ended the session without saying anything. Let me share my thoughts with you.

Please structure your response EXACTLY like this, with all five sections:

1. Conversation Flow and Engagement: Since you didn't engage in the conversation, there wasn't much flow to analyze. This is completely okay - sometimes we need time to gather our thoughts or feel comfortable before speaking up.

2. Response Quality and Appropriateness: While there weren't any responses to analyze, this gives us a great opportunity to discuss how to start conversations. Remember, it's perfectly normal to feel a bit nervous or unsure about what to say.

3. Areas for Improvement: The main area to focus on is taking that first step to engage. Even a simple greeting or question can be a great way to start. Don't worry about being perfect - the most important thing is to be yourself.

4. Positive Aspects to Maintain: Your decision to end the session shows that you're aware of your comfort level, which is actually a positive trait. It's better to be honest about your readiness than to force a conversation you're not comfortable with.

Final Thoughts: Write a short, encouraging paragraph about taking that first step in your next conversation.

IMPORTANT: 
- Always use 'you' and 'your' when talking about the person (never use 'the user' or third person)
- Include ALL FIVE sections exactly as numbered above
- Keep the tone friendly and encouraging
- DO NOT include any heart rating or scoring information in your response
- DO NOT mention hearts, ratings, or scores in any section
- Focus only on the conversation feedback and encouragement
- For the Final Thoughts section, start with just "Final Thoughts:" (no number)`;
                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are having a friendly chat with a friend about their flirting conversation. You MUST follow these rules:\n1. ALWAYS use 'you' and 'your' (never 'the user' or third person)\n2. ALWAYS include all five numbered sections\n3. Keep the tone friendly and encouraging\n4. Include specific examples from their messages when available\n5. DO NOT include any heart rating or scoring information\n6. DO NOT mention hearts, ratings, or scores in any section\n7. Focus only on the conversation feedback and encouragement\n8. For the Final Thoughts section, start with just 'Final Thoughts:' (no number)\nExample of good feedback: 'You showed great confidence when you...' instead of 'The user showed great confidence...'"
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
            }
            catch (error) {
                console.error('Error analyzing conversation:', error);
                throw new Error('Failed to analyze conversation');
            }
        },
        updateProgress: async (_parent, { activeLevel, completedLevels }, context) => {
            try {
                console.log('updateProgress called with:', { activeLevel, completedLevels });
                console.log('Context user:', context.user);
                if (!context.user) {
                    console.error('No user in context');
                    throw new AuthenticationError('You must be logged in to update progress');
                }
                if (typeof activeLevel !== 'number' || !Array.isArray(completedLevels)) {
                    console.error('Invalid input types:', {
                        activeLevel: typeof activeLevel,
                        completedLevels: typeof completedLevels
                    });
                    throw new Error('Invalid input types');
                }
                const updateData = {
                    activeLevel,
                    completedLevels: [...new Set(completedLevels)]
                };
                console.log('Update data:', updateData);
                // Log the current user data before update
                const currentUser = await Yapper.findById(context.user._id);
                console.log('Current user data before update:', {
                    _id: currentUser?._id,
                    activeLevel: currentUser?.activeLevel,
                    completedLevels: currentUser?.completedLevels
                });
                const updatedYapper = await Yapper.findOneAndUpdate({ _id: context.user._id }, { $set: updateData }, { new: true, runValidators: true });
                if (!updatedYapper) {
                    console.error('Failed to update progress - user not found');
                    throw new Error('Failed to update progress');
                }
                console.log('Progress updated successfully:', {
                    _id: updatedYapper._id,
                    activeLevel: updatedYapper.activeLevel,
                    completedLevels: updatedYapper.completedLevels
                });
                return updatedYapper;
            }
            catch (error) {
                console.error('Error in updateProgress:', error);
                if (error instanceof AuthenticationError) {
                    throw error;
                }
                throw new Error(`Failed to update progress: ${error.message || 'Unknown error'}`);
            }
        },
    },
    Subscription: {
        chatResponseStream: {
            subscribe: withFilter((_, { message, characterId }) => {
                if (!message || !characterId) {
                    throw new Error('Message and characterId are required for chat response stream');
                }
                return pubsub.asyncIterator('CHAT_RESPONSE_STREAM');
            }, (payload) => {
                return payload?.chunk !== null;
            })
        },
        voiceResponseStream: {
            subscribe: withFilter((_, { voiceId, text }) => {
                if (!voiceId || !text) {
                    throw new Error('VoiceId and text are required for voice response stream');
                }
                return pubsub.asyncIterator('VOICE_RESPONSE_STREAM');
            }, (payload) => {
                return payload?.audioChunk !== null;
            })
        }
    }
};
export default resolvers;
