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
// Add this helper function near the top of the file, after the interfaces
const toGraphQLYapper = (doc) => {
    const obj = doc.toObject();
    return {
        ...obj,
        __typename: 'Yapper',
        toObject: () => obj
    };
};
const resolvers = {
    Query: {
        yappers: async () => {
            const yappers = await Yapper.find()
                .populate({
                path: 'following',
                select: '_id name avatar activeLevel',
                model: 'Yapper'
            })
                .populate({
                path: 'followers',
                select: '_id name avatar activeLevel',
                model: 'Yapper'
            });
            return yappers.map(yapper => {
                const obj = yapper.toObject();
                return {
                    ...obj,
                    following: (obj.following || []).map((f) => ({
                        _id: f._id,
                        name: f.name,
                        avatar: f.avatar,
                        activeLevel: f.activeLevel,
                        __typename: 'Yapper'
                    })),
                    followers: (obj.followers || []).map((f) => ({
                        _id: f._id,
                        name: f.name,
                        avatar: f.avatar,
                        activeLevel: f.activeLevel,
                        __typename: 'Yapper'
                    })),
                    avatar: obj.avatar,
                    __typename: 'Yapper',
                    toObject: () => obj
                };
            });
        },
        yapper: async (_parent, { yapperId }) => {
            return await Yapper.findOne({ _id: yapperId });
        },
        me: async (_parent, _args, context) => {
            if (context.user) {
                try {
                    console.log('ME query context user:', context.user);
                    const user = await Yapper.findOne({ _id: context.user._id })
                        .select('_id name email skills activeLevel completedLevels hearts streak lastLoginDate lastLoginTime heartRegenerationTimer avatar following followers createdAt')
                        .populate({
                        path: 'following',
                        select: '_id name avatar activeLevel',
                        model: 'Yapper'
                    })
                        .populate({
                        path: 'followers',
                        select: '_id name avatar activeLevel',
                        model: 'Yapper'
                    });
                    if (!user) {
                        console.error('User not found in database');
                        throw new Error('User not found');
                    }
                    // Convert to plain object and ensure all fields are present
                    const userObj = user.toObject();
                    console.log('User object before transformation:', userObj);
                    // Ensure following and followers arrays exist and have avatar fields
                    const following = (userObj.following || []).map((f) => ({
                        _id: f._id,
                        name: f.name,
                        avatar: f.avatar,
                        activeLevel: f.activeLevel || 1,
                        __typename: 'Yapper'
                    }));
                    const followers = (userObj.followers || []).map((f) => ({
                        _id: f._id,
                        name: f.name,
                        avatar: f.avatar,
                        activeLevel: f.activeLevel || 1,
                        __typename: 'Yapper'
                    }));
                    // Create the response object with all required fields
                    const response = {
                        ...userObj,
                        following,
                        followers,
                        avatar: userObj.avatar,
                        __typename: 'Yapper'
                    };
                    console.log('ME query result:', JSON.stringify(response, null, 2));
                    return response;
                }
                catch (error) {
                    console.error('Error in me query:', error);
                    throw error;
                }
            }
            throw AuthenticationError;
        },
        characters: () => characters,
    },
    Mutation: {
        addYapper: async (_parent, { input }) => {
            // Create a date in UTC
            const now = new Date();
            const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()));
            // Create the new user with initial values
            const yapper = await Yapper.create({
                ...input,
                hearts: input.hearts ?? 5, // Use provided hearts or default to 5
                streak: 1, // Always start with streak 1 for new accounts
                heartRegenerationTimer: input.heartRegenerationTimer ?? null, // Use provided timer or default to null
                lastLoginDate: utcDate.toISOString(), // Set to current UTC date for new accounts
                lastLoginTime: utcDate.toISOString() // Set to current UTC time for new accounts
            });
            // Ensure we return the complete user data
            const completeYapper = await Yapper.findOne({ _id: yapper._id })
                .select('+activeLevel +completedLevels +hearts +streak +lastLoginDate +heartRegenerationTimer');
            if (!completeYapper) {
                throw new Error('Failed to retrieve complete user data');
            }
            // Log the created user data for debugging
            console.log('Created new user:', {
                userId: completeYapper._id,
                name: completeYapper.name,
                streak: completeYapper.streak,
                lastLoginDate: completeYapper.lastLoginDate,
                lastLoginTime: completeYapper.lastLoginTime
            });
            const token = signToken(completeYapper.name, completeYapper.email, completeYapper._id);
            return { token, yapper: toGraphQLYapper(completeYapper) };
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
                // Ensure we have the complete user data with all fields
                const completeYapper = await Yapper.findOne({ _id: yapper._id })
                    .select('+activeLevel +completedLevels +hearts +streak +lastLoginDate +heartRegenerationTimer');
                if (!completeYapper) {
                    throw new Error('Failed to retrieve complete user data');
                }
                console.log('Login successful, user data:', {
                    id: completeYapper._id,
                    name: completeYapper.name,
                    activeLevel: completeYapper.activeLevel,
                    completedLevels: completeYapper.completedLevels,
                    hearts: completeYapper.hearts,
                    streak: completeYapper.streak,
                    lastLoginDate: completeYapper.lastLoginDate,
                    heartRegenerationTimer: completeYapper.heartRegenerationTimer
                });
                const token = signToken(completeYapper.name, completeYapper.email, completeYapper._id);
                return { token, yapper: toGraphQLYapper(completeYapper) };
            }
            catch (error) {
                console.error('Login error:', error);
                if (error instanceof AuthenticationError) {
                    throw error;
                }
                throw new AuthenticationError('An error occurred during login');
            }
        },
        updateAvatar: async (_parent, { avatar }, context) => {
            if (!context.user) {
                console.error('Authentication error: No user in context');
                throw new AuthenticationError('You must be logged in to update your avatar');
            }
            try {
                console.log('Updating avatar for user:', context.user._id, 'to:', avatar);
                const updatedYapper = await Yapper.findOneAndUpdate({ _id: context.user._id }, { $set: { avatar } }, {
                    new: true,
                    runValidators: true,
                    select: '_id name email skills activeLevel completedLevels hearts streak lastLoginDate lastLoginTime heartRegenerationTimer avatar following followers createdAt'
                }).populate({
                    path: 'following',
                    select: '_id name avatar',
                    model: 'Yapper'
                }).populate({
                    path: 'followers',
                    select: '_id name avatar',
                    model: 'Yapper'
                });
                if (!updatedYapper) {
                    console.error('Failed to find and update user:', context.user._id);
                    throw new Error('Failed to update avatar');
                }
                console.log('Successfully updated avatar for user:', context.user._id);
                return updatedYapper ? toGraphQLYapper(updatedYapper) : null;
            }
            catch (error) {
                console.error('Error in updateAvatar:', error);
                throw error;
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
                // Get current user data
                const currentUser = await Yapper.findById(context.user._id);
                if (!currentUser) {
                    throw new Error('User not found');
                }
                console.log('Current user data:', {
                    currentLevel: currentUser.activeLevel,
                    newLevel: activeLevel,
                    currentCompletedLevels: currentUser.completedLevels,
                    newCompletedLevels: completedLevels
                });
                // Create array of all levels up to the new active level
                const levelsUpToActive = Array.from({ length: activeLevel - 1 }, (_, i) => i + 1);
                // Combine current completed levels with levels up to active level
                const allCompletedLevels = [...new Set([
                        ...(currentUser.completedLevels || []),
                        ...completedLevels,
                        ...levelsUpToActive
                    ])].sort((a, b) => a - b);
                const updateData = {
                    activeLevel,
                    completedLevels: allCompletedLevels
                };
                console.log('Updating with data:', updateData);
                console.log('Update query:', { _id: context.user._id });
                console.log('Update operation:', { $set: updateData });
                // Try direct update first
                const updatedYapper = await Yapper.findByIdAndUpdate(context.user._id, { $set: updateData }, { new: true, runValidators: true });
                if (!updatedYapper) {
                    console.error('Failed to update progress - user not found');
                    throw new Error('Failed to update progress');
                }
                console.log('Progress updated successfully:', {
                    _id: updatedYapper._id,
                    activeLevel: updatedYapper.activeLevel,
                    completedLevels: updatedYapper.completedLevels
                });
                // Verify the update
                const verifyUser = await Yapper.findById(context.user._id);
                console.log('Verification after update:', {
                    _id: verifyUser?._id,
                    activeLevel: verifyUser?.activeLevel,
                    completedLevels: verifyUser?.completedLevels
                });
                return updatedYapper ? toGraphQLYapper(updatedYapper) : null;
            }
            catch (error) {
                console.error('Error in updateProgress:', error);
                if (error instanceof AuthenticationError) {
                    throw error;
                }
                throw new Error(`Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        },
        updateHeartsAndStreak: async (_parent, { hearts, streak: _streak, lastLoginDate: _lastLoginDate, heartRegenerationTimer }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You must be logged in to update hearts and streak');
            }
            try {
                const currentUser = await Yapper.findById(context.user._id);
                if (!currentUser) {
                    throw new Error('User not found');
                }
                const now = new Date();
                const currentTime = now.toISOString();
                const today = now.toISOString().split('T')[0];
                const lastLogin = currentUser.lastLoginDate?.split('T')[0];
                // Calculate new streak based on last login date
                let newStreak = currentUser.streak;
                if (lastLogin && lastLogin !== today) {
                    // If last login was yesterday, increment streak
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    if (lastLogin === yesterdayStr) {
                        newStreak = currentUser.streak + 1;
                    }
                    else {
                        // If last login was more than a day ago, reset streak
                        newStreak = 1;
                    }
                }
                const updateData = {
                    hearts,
                    streak: newStreak,
                    lastLoginTime: currentTime,
                    lastLoginDate: now.toISOString(),
                    heartRegenerationTimer: null
                };
                if (hearts === 0 && heartRegenerationTimer) {
                    updateData.heartRegenerationTimer = heartRegenerationTimer;
                }
                const updatedYapper = await Yapper.findOneAndUpdate({ _id: context.user._id }, { $set: updateData }, { new: true, runValidators: true });
                return updatedYapper ? toGraphQLYapper(updatedYapper) : null;
            }
            catch (error) {
                console.error('Error in updateHeartsAndStreak:', error);
                throw error;
            }
        },
        followUser: async (_parent, { userId }, context) => {
            console.log('followUser called with:', { userId, contextUser: context.user });
            if (!context.user) {
                console.log('No user in context');
                throw new AuthenticationError('You must be logged in to follow users');
            }
            try {
                const currentUserId = context.user._id;
                console.log('Current user ID:', currentUserId);
                // Don't allow following yourself
                if (currentUserId === userId) {
                    console.log('Attempted to follow self');
                    throw new Error('You cannot follow yourself');
                }
                // Get both users
                const currentUser = await Yapper.findById(currentUserId);
                const userToFollow = await Yapper.findById(userId);
                console.log('Found users:', {
                    currentUser: currentUser ? 'Found' : 'Not found',
                    userToFollow: userToFollow ? 'Found' : 'Not found'
                });
                if (!currentUser || !userToFollow) {
                    console.log('User not found');
                    throw new Error('User not found');
                }
                // Check if already following
                const isFollowing = currentUser.following.some(id => id.toString() === userId);
                console.log('Is already following:', isFollowing);
                if (isFollowing) {
                    throw new Error('You are already following this user');
                }
                // Add to following and followers
                currentUser.following.push(userId);
                userToFollow.followers.push(currentUserId);
                console.log('Updating following/followers:', {
                    currentUserFollowing: currentUser.following,
                    userToFollowFollowers: userToFollow.followers
                });
                // Save both users
                await currentUser.save();
                await userToFollow.save();
                // Return the updated current user with populated following/followers
                const updatedUser = await Yapper.findById(currentUserId)
                    .populate('following', '_id name')
                    .populate('followers', '_id name');
                console.log('Updated user:', updatedUser);
                return updatedUser ? toGraphQLYapper(updatedUser) : null;
            }
            catch (error) {
                console.error('Error in followUser:', error);
                throw error;
            }
        },
        unfollowUser: async (_parent, { userId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You must be logged in to unfollow users');
            }
            try {
                const currentUserId = context.user._id;
                // Get both users
                const currentUser = await Yapper.findById(currentUserId);
                const userToUnfollow = await Yapper.findById(userId);
                if (!currentUser || !userToUnfollow) {
                    throw new Error('User not found');
                }
                // Check if actually following
                if (!currentUser.following.some(id => id.toString() === userId)) {
                    throw new Error('You are not following this user');
                }
                // Remove from following and followers
                currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
                userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);
                // Save both users
                await currentUser.save();
                await userToUnfollow.save();
                // Return the updated current user with populated following/followers
                return await Yapper.findById(currentUserId)
                    .populate('following', '_id name')
                    .populate('followers', '_id name')
                    .then(user => user ? toGraphQLYapper(user) : null);
            }
            catch (error) {
                console.error('Error in unfollowUser:', error);
                throw error;
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
