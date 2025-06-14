import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';
import { FaPlay, FaStop, FaHeart, FaRedo, FaArrowLeft, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import SplashScreen from '../components/SplashScreen.tsx';
import SessionAnalysis from '../components/SessionAnalysis.tsx';
// Add custom animation for reverse spin
const style = document.createElement('style');
style.textContent = `
  @keyframes spin-reverse {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }
  .animate-spin-reverse {
    animation: spin-reverse 3s linear infinite;
  }
  @keyframes scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .analyzing {
    position: relative;
  }
  .analyzing::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(12px);
    z-index: 10;
    border-radius: 0.5rem;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  .analyzing.active::before {
    opacity: 1;
  }
  .analyzing-progress {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    z-index: 20;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  .analyzing.active .analyzing-progress {
    opacity: 1;
  }
  .progress-bar {
    width: 100%;
    height: 12px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 9999px;
    overflow: hidden;
    position: relative;
    margin-bottom: 1rem;
  }
  .progress-bar::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, #ec4899, transparent);
    animation: scan 2s linear infinite;
  }
  .progress-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(236, 72, 153, 0.3);
  }
  .progress-text {
    color: white;
    font-size: 1.25rem;
    font-weight: bold;
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
`;
document.head.appendChild(style);
const GET_CHARACTERS = gql `
  query GetCharacters {
    characters {
      id
      name
      personality
      voiceId
      sampleLine
    }
  }
`;
const GENERATE_VOICE = gql `
  mutation GenerateVoice($voiceId: String!, $text: String!) {
    generateVoiceResponse(voiceId: $voiceId, text: $text) {
      message
      audioUrl
    }
  }
`;
const GENERATE_CHAT_RESPONSE = gql `
  mutation GenerateChatResponse($message: String!, $characterId: String!) {
    generateChatResponse(message: $message, characterId: $characterId) {
      response
    }
  }
`;
const CONVERT_SPEECH_TO_TEXT = gql `
  mutation ConvertSpeechToText($audio: String!) {
    convertSpeechToText(audio: $audio) {
      text
    }
  }
`;
const STREAM_CHAT_RESPONSE = gql `
  subscription StreamChatResponse($message: String!, $characterId: String!) {
    chatResponseStream(message: $message, characterId: $characterId) {
      chunk
      isComplete
    }
  }
`;
const STREAM_VOICE_RESPONSE = gql `
  subscription StreamVoiceResponse($voiceId: String!, $text: String!) {
    voiceResponseStream(voiceId: $voiceId, text: $text) {
      audioChunk
      isComplete
    }
  }
`;
const locationContexts = {
    '1': [
        {
            title: "Art Gallery Opening",
            description: "As you admire a contemporary piece, you notice Elodie standing beside you, her elegant silhouette perfectly framed against the artwork. She catches your eye and offers a sophisticated smile, commenting on the artist's use of color. The soft lighting and classical music create an intimate atmosphere as you begin to discuss the exhibition.",
            image: "/assets/french1.png",
            backgroundImage: "/assets/artgallery.png"
        },
        {
            title: "Café de Flore",
            description: "You're seated at a corner table when Elodie enters, her presence commanding attention. As she passes your table, she accidentally drops her book of French poetry. You quickly pick it up, and she thanks you with a charming smile, asking if you'd like to join her for a coffee and discuss the works of Baudelaire.",
            image: "/assets/french1.png",
            backgroundImage: "/assets/cafe.png"
        },
        {
            title: "Louvre Museum",
            description: "While admiring the Mona Lisa, you notice Elodie standing next to you, lost in thought. As the crowd shifts, you both find yourselves at the perfect angle to view the painting. She turns to you with an intellectual spark in her eyes and asks for your interpretation of the famous smile, beginning a fascinating conversation about art and philosophy.",
            image: "/assets/french1.png",
            backgroundImage: "/assets/louvre.png"
        }
    ],
    '2': [
        {
            title: "Flamenco Night",
            description: "The rhythm of the guitar fills the air as Camila takes the dance floor. Her passionate movements catch your eye, and during a particularly energetic spin, she accidentally bumps into you. Instead of apologizing, she grabs your hand with a fiery smile, pulling you into the dance, her energy infectious as she teaches you the basic steps.",
            image: "/assets/spanish 1.png",
            backgroundImage: "/assets/tavern.png"
        },
        {
            title: "Beachside Taco Truck",
            description: "As you're enjoying the sunset, Camila approaches the taco truck next to you. She notices you're struggling with the spicy salsa and offers you her secret remedy - a special lime and salt combination. Her laughter is as warm as the evening breeze as she shares stories about her grandmother's recipes and love for Latin music.",
            image: "/assets/spanish 1.png",
            backgroundImage: "/assets/taco.png"
        },
        {
            title: "Music Festival",
            description: "The vibrant energy of the festival surrounds you as Camila dances nearby, her movements perfectly synchronized with the Latin rhythms. During a particularly catchy song, she catches your eye and waves you over, her smile as bright as the stage lights. She offers you a pair of maracas, inviting you to join in the celebration of music and culture.",
            image: "/assets/spanish 1.png",
            backgroundImage: "/assets/festival.png"
        }
    ],
    '3': [
        {
            title: "Winter Market",
            description: "Amidst the falling snow, you notice Anya examining a handcrafted matryoshka doll. As you approach the same vendor, she turns to you with a mysterious smile, asking if you believe in the traditional Russian superstition about the dolls bringing good luck in love. Her eyes sparkle with adventure as she shares the story behind the intricate craftsmanship.",
            image: "/assets/russian1.png",
            backgroundImage: "/assets/market.png"
        },
        {
            title: "Ballet Performance",
            description: "During the intermission at the Bolshoi Theatre, you find yourself next to Anya at the refreshments counter. She notices your program and strikes up a conversation about the performance, her knowledge of ballet history and technique revealing a deep appreciation for the arts. Her mysterious aura is enhanced by the grandeur of the theatre.",
            image: "/assets/russian1.png",
            backgroundImage: "/assets/opera.png"
        },
        {
            title: "Trans-Siberian Train",
            description: "As the train winds through the vast Russian landscape, you find yourself sharing a compartment with Anya. She's reading a book of Russian poetry when the train hits a bump, causing her to drop her bookmark. You pick it up, and she thanks you with a bold smile, asking if you'd like to hear the poem she was reading, her adventurous spirit evident in her storytelling.",
            image: "/assets/russian1.png",
            backgroundImage: "/assets/train.png"
        }
    ]
};
const AnalysisProgress = () => {
    return (_jsx("div", { className: "fixed top-0 right-0 bottom-0 left-[240px] bg-black/50 backdrop-blur-xl z-50 flex items-center justify-center", children: _jsxs("div", { className: "bg-white/10 rounded-lg p-8 w-96", children: [_jsxs("div", { className: "w-full h-3 bg-black/50 rounded-full overflow-hidden relative mb-4", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-[scan_2s_linear_infinite]" }), _jsx("div", { className: "absolute inset-0 bg-pink-500/30" })] }), _jsx("p", { className: "text-white text-xl font-bold text-center drop-shadow-lg", children: "Analyzing flirting skills..." })] }) }));
};
const styles = {
    micButton: {
        position: 'relative',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: 'none',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        zIndex: 1000,
    },
    micButtonRed: {
        backgroundColor: '#ff4444',
        color: 'white',
        cursor: 'not-allowed',
    },
    micButtonBlue: {
        backgroundColor: '#2196f3',
        color: 'white',
        cursor: 'pointer',
    },
    micButtonGreen: {
        backgroundColor: '#4caf50',
        color: 'white',
        cursor: 'pointer',
    },
    micButtonHover: {
        backgroundColor: '#ff9800', // Orange on hover
    }
};
const MicrophoneButton = ({ isUserTurn, isRecording, isProcessing, onStartRecording, onStopRecording }) => {
    const [isHovered, setIsHovered] = useState(false);
    const getButtonStyle = () => {
        let style = { ...styles.micButton };
        if (!isUserTurn || isProcessing) {
            return { ...style, ...styles.micButtonRed };
        }
        if (isRecording) {
            return {
                ...style,
                ...styles.micButtonGreen,
                ...(isHovered ? styles.micButtonHover : {})
            };
        }
        return {
            ...style,
            ...styles.micButtonBlue,
            ...(isHovered ? styles.micButtonHover : {})
        };
    };
    const getTooltipContent = () => {
        if (!isUserTurn) {
            return isProcessing ? "Please wait..." : "Girl's turn";
        }
        if (isRecording) {
            return "Click to stop recording";
        }
        return "Click to flirt!";
    };
    const handleClick = () => {
        if (!isUserTurn || isProcessing)
            return;
        if (isRecording) {
            onStopRecording();
        }
        else {
            onStartRecording();
        }
    };
    return (_jsx("button", { style: getButtonStyle(), onClick: handleClick, title: getTooltipContent(), "data-tooltip-id": "mic-tooltip", onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), children: (!isUserTurn || isProcessing) ? _jsx(FaMicrophoneSlash, {}) : _jsx(FaMicrophone, {}) }));
};
const Flirt = () => {
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [currentContext, setCurrentContext] = useState(null);
    const [playingVoiceId, setPlayingVoiceId] = useState(null);
    const [isFlirting, setIsFlirting] = useState(false);
    const [timer, setTimer] = useState(60);
    const [zebraHeads, setZebraHeads] = useState(0);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [isUserTurn, setIsUserTurn] = useState(true);
    const audioRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const [currentResponse, setCurrentResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [preGeneratedResponse, setPreGeneratedResponse] = useState('');
    const [preGeneratedVoiceUrl, setPreGeneratedVoiceUrl] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const cardRef = useRef(null);
    const [errorCount, setErrorCount] = useState(0);
    const [lastErrorTime, setLastErrorTime] = useState(0);
    const ERROR_THRESHOLD = 3;
    const ERROR_COOLDOWN = 5000; // 5 seconds
    const [isListening, setIsListening] = useState(false);
    const [showProgressOverlay, setShowProgressOverlay] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [isFadingIn, setIsFadingIn] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const { loading, error, data } = useQuery(GET_CHARACTERS);
    const [generateVoice] = useMutation(GENERATE_VOICE);
    const [generateChatResponse] = useMutation(GENERATE_CHAT_RESPONSE);
    const [convertSpeechToText] = useMutation(CONVERT_SPEECH_TO_TEXT);
    useEffect(() => {
        let interval;
        if (isFlirting && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        else if (timer === 0) {
            endFlirtingSession();
        }
        return () => clearInterval(interval);
    }, [isFlirting, timer]);
    const playVoiceSample = async (character) => {
        try {
            setPlayingVoiceId(character.id);
            const { data } = await generateVoice({
                variables: {
                    voiceId: character.voiceId,
                    text: character.sampleLine,
                },
            });
            if (audioRef.current) {
                const base64 = data.generateVoiceResponse.audioUrl;
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioRef.current.src = audioUrl;
                audioRef.current.play();
            }
        }
        catch (error) {
            console.error('Error playing voice sample:', error);
        }
        finally {
            setPlayingVoiceId(null);
        }
    };
    const handleCharacterSelect = async (character) => {
        // Clear any existing pre-generated content
        setPreGeneratedResponse('');
        setPreGeneratedVoiceUrl('');
        setSelectedCharacter(character);
        // Show splash screen while generating
        setShowSplash(true);
        const context = getRandomContext(character.id);
        setCurrentContext(context);
        // Pre-generate the initial response and voice
        const prompt = `You are ${character.name}, ${character.personality}. You are at ${context.title}. The following is the scene: "${context.description}". 
Based on this specific situation, respond naturally as if you're continuing the moment described. 
Pay close attention to who is doing what in the scene - maintain the correct roles and actions.
For example, if you're offering help with spicy food, don't thank the other person for helping you.
Keep your response authentic to your character while staying grounded in the current situation.
Respond in 1-2 sentences maximum.`;
        try {
            const { data: chatData } = await generateChatResponse({
                variables: {
                    message: prompt,
                    characterId: character.id
                }
            });
            const response = chatData.generateChatResponse.response;
            setPreGeneratedResponse(response);
            const { data: voiceData } = await generateVoice({
                variables: {
                    voiceId: character.voiceId,
                    text: response,
                },
            });
            const base64 = voiceData.generateVoiceResponse.audioUrl;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            setPreGeneratedVoiceUrl(audioUrl);
        }
        catch (error) {
            console.error('Error pre-generating response:', error);
        }
        finally {
            setShowSplash(false);
        }
    };
    const rerollContext = async () => {
        if (selectedCharacter) {
            // Show splash screen while regenerating
            setShowSplash(true);
            const newContext = getRandomContext(selectedCharacter.id, currentContext?.title);
            setCurrentContext(newContext);
            // Re-generate response for new context
            const prompt = `You are ${selectedCharacter.name}, ${selectedCharacter.personality}. You are at ${newContext.title}. The following is the scene: "${newContext.description}". 
Based on this specific situation, respond naturally as if you're continuing the moment described. 
Pay close attention to who is doing what in the scene - maintain the correct roles and actions.
For example, if you're offering help with spicy food, don't thank the other person for helping you.
Keep your response authentic to your character while staying grounded in the current situation.
Respond in 1-2 sentences maximum.`;
            try {
                const { data: chatData } = await generateChatResponse({
                    variables: {
                        message: prompt,
                        characterId: selectedCharacter.id
                    }
                });
                const response = chatData.generateChatResponse.response;
                setPreGeneratedResponse(response);
                const { data: voiceData } = await generateVoice({
                    variables: {
                        voiceId: selectedCharacter.voiceId,
                        text: response,
                    },
                });
                const base64 = voiceData.generateVoiceResponse.audioUrl;
                const binary = atob(base64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setPreGeneratedVoiceUrl(audioUrl);
                // Hide splash screen after everything is ready
                setShowSplash(false);
            }
            catch (error) {
                console.error('Error pre-generating response for new context:', error);
                setShowSplash(false);
            }
        }
    };
    const startFlirtingSession = async () => {
        // If we don't have pre-generated content, generate it first
        if (!preGeneratedVoiceUrl || !preGeneratedResponse) {
            setShowSplash(true);
            if (selectedCharacter && currentContext) {
                const prompt = `You are ${selectedCharacter.name}, ${selectedCharacter.personality}. You are at ${currentContext.title}. The following is the scene: "${currentContext.description}". 
Based on this specific situation, respond naturally as if you're continuing the moment described. 
Pay close attention to who is doing what in the scene - maintain the correct roles and actions.
For example, if you're offering help with spicy food, don't thank the other person for helping you.
Keep your response authentic to your character while staying grounded in the current situation.
Respond in 1-2 sentences maximum.`;
                try {
                    const { data: chatData } = await generateChatResponse({
                        variables: {
                            message: prompt,
                            characterId: selectedCharacter.id
                        }
                    });
                    const response = chatData.generateChatResponse.response;
                    setPreGeneratedResponse(response);
                    logConversationMessage('character', response);
                    const { data: voiceData } = await generateVoice({
                        variables: {
                            voiceId: selectedCharacter.voiceId,
                            text: response,
                        },
                    });
                    const base64 = voiceData.generateVoiceResponse.audioUrl;
                    const binary = atob(base64);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setPreGeneratedVoiceUrl(audioUrl);
                }
                catch (error) {
                    console.error('Error generating response:', error);
                }
            }
            setShowSplash(false);
        }
        setIsFlirting(true);
        setTimer(60);
        setZebraHeads(0);
        setShowAnalysis(false);
        setIsUserTurn(false); // Set to false when girl starts speaking
        setIsStreaming(true);
        setIsProcessing(false); // Ensure processing is false when starting
        // Play the pre-generated voice immediately
        if (audioRef.current && preGeneratedVoiceUrl) {
            audioRef.current.src = preGeneratedVoiceUrl;
            await audioRef.current.play();
            // After the audio finishes playing, set it to user's turn
            audioRef.current.onended = () => {
                setIsUserTurn(true);
                setIsStreaming(false);
                setIsProcessing(false); // Ensure processing is false when turn switches
            };
        }
        // Set up streaming for subsequent responses
        setCurrentResponse(preGeneratedResponse);
    };
    const endFlirtingSession = async () => {
        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (audioContextRef.current) {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }
        // Stop any active streams
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        // Show progress overlay
        setShowProgressOverlay(true);
        setIsFlirting(false);
        // Simulate analysis progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 1;
            setAnalysisProgress(progress);
            if (progress >= 100) {
                clearInterval(progressInterval);
                // Hide progress and show analysis with a slight delay
                setTimeout(() => {
                    setShowProgressOverlay(false);
                    setShowAnalysis(true);
                    setIsFadingIn(true);
                }, 500); // Add a small delay for smoother transition
            }
        }, 50);
    };
    const getRandomContext = (characterId, excludeTitle) => {
        const contexts = locationContexts[characterId];
        const availableContexts = contexts.filter(context => context.title !== excludeTitle);
        return availableContexts[Math.floor(Math.random() * availableContexts.length)];
    };
    // Function to start voice activity detection
    const startVoiceDetection = async () => {
        try {
            // Get new audio stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            // Create new audio context and analyser
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            // Configure analyser
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            // Connect stream to analyser
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            // Set listening state
            setIsListening(true);
        }
        catch (error) {
            console.error('Error starting voice detection:', error);
            setIsListening(false);
        }
    };
    // Function to start recording
    const startRecording = () => {
        if (!streamRef.current || isRecording)
            return;
        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'audio/webm;codecs=opus'
        });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
                console.log('Received audio chunk of size:', event.data.size);
            }
        };
        // Request data every 1 second
        mediaRecorder.start(1000);
        setIsRecording(true);
        console.log('Started recording');
    };
    // Function to stop recording
    const stopRecording = () => {
        if (!mediaRecorderRef.current || !isRecording)
            return;
        return new Promise((resolve) => {
            mediaRecorderRef.current.onstop = () => {
                console.log('Recording stopped, chunks received:', audioChunksRef.current.length);
                resolve();
            };
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        });
    };
    // Cleanup function
    const cleanup = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current = null;
        }
        setIsListening(false);
        setIsRecording(false);
    };
    // Start voice detection when flirting session starts
    useEffect(() => {
        if (isFlirting && isUserTurn) {
            startVoiceDetection();
        }
        else {
            cleanup();
        }
        return () => {
            cleanup();
        };
    }, [isFlirting, isUserTurn]);
    // Add effect to handle girl's turn
    useEffect(() => {
        if (!isUserTurn && !isProcessing) {
            // Girl's turn - start processing
            setIsProcessing(true);
            // Only switch to user's turn if we're not streaming (i.e., intro is finished)
            if (!isStreaming) {
                setIsProcessing(false);
                setIsUserTurn(true);
            }
        }
    }, [isUserTurn, isProcessing, isStreaming]);
    // Function to play audio chunks
    const playAudioChunk = async (base64Audio) => {
        try {
            const binary = atob(base64Audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            // Wait for the audio to finish playing
            await new Promise((resolve) => {
                source.onended = resolve;
            });
        }
        catch (error) {
            console.error('Error playing audio chunk:', error);
        }
    };
    // Helper function to convert Blob to base64
    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            if (blob.size === 0) {
                reject(new Error('Cannot convert empty blob to base64'));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                if (!base64) {
                    reject(new Error('FileReader produced empty result'));
                    return;
                }
                resolve(base64.split(',')[1]);
            };
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(error);
            };
            reader.readAsDataURL(blob);
        });
    };
    // Update the chat response subscription
    const { data: chatStreamData, error: chatStreamError } = useSubscription(STREAM_CHAT_RESPONSE, {
        variables: {
            message: currentResponse,
            characterId: selectedCharacter?.id
        },
        skip: !isStreaming || !selectedCharacter || !currentResponse,
        onSubscriptionComplete: () => {
            console.log('Chat response stream complete');
            setIsStreaming(false);
        },
        onError: (error) => {
            console.error('Error in chat response stream:', error);
            // Fallback to non-streaming response
            handleNonStreamingResponse();
        }
    });
    // Update the voice response subscription
    const { data: voiceStreamData, error: voiceStreamError } = useSubscription(STREAM_VOICE_RESPONSE, {
        variables: {
            voiceId: selectedCharacter?.voiceId || '',
            text: currentResponse
        },
        skip: !selectedCharacter?.voiceId || !currentResponse,
        onSubscriptionComplete: () => {
            console.log('Voice response stream complete');
            setIsStreaming(false);
        },
        onError: (error) => {
            console.error('Error in voice response stream:', error);
            // Fallback to non-streaming voice
            handleNonStreamingVoice();
        }
    });
    const handleErrorRecovery = () => {
        const now = Date.now();
        if (now - lastErrorTime < ERROR_COOLDOWN) {
            setErrorCount(prev => prev + 1);
        }
        else {
            setErrorCount(1);
        }
        setLastErrorTime(now);
        if (errorCount >= ERROR_THRESHOLD) {
            console.log('Too many errors, resetting conversation...');
            setErrorCount(0);
            setIsUserTurn(true);
            setIsStreaming(false);
            setIsProcessing(false);
            setCurrentResponse("I'm having trouble understanding right now. Could you please try again?");
            return;
        }
        // Fallback to non-streaming response
        handleNonStreamingResponse();
    };
    const handleNonStreamingResponse = async () => {
        try {
            if (isProcessing)
                return;
            setIsProcessing(true);
            console.log('Falling back to non-streaming chat response...');
            const { data: chatData } = await generateChatResponse({
                variables: {
                    message: currentResponse,
                    characterId: selectedCharacter?.id
                }
            });
            if (chatData?.generateChatResponse?.response) {
                console.log('Received non-streaming chat response:', chatData.generateChatResponse.response);
                const response = chatData.generateChatResponse.response;
                setCurrentResponse(response);
                logConversationMessage('character', response);
                await handleNonStreamingVoice();
            }
            else {
                throw new Error('No response from chat generation');
            }
        }
        catch (error) {
            console.error('Error in non-streaming chat response:', error);
            handleErrorRecovery();
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleNonStreamingVoice = async () => {
        try {
            if (isProcessing)
                return; // Prevent multiple simultaneous requests
            setIsProcessing(true);
            console.log('Falling back to non-streaming voice generation...');
            const { data: voiceData } = await generateVoice({
                variables: {
                    voiceId: selectedCharacter?.voiceId,
                    text: currentResponse
                }
            });
            if (voiceData?.generateVoiceResponse?.audioUrl) {
                console.log('Received non-streaming voice response');
                await playVoiceResponse(voiceData.generateVoiceResponse.audioUrl);
                setIsUserTurn(true);
            }
            else {
                throw new Error('No response from voice generation');
            }
        }
        catch (error) {
            console.error('Error in non-streaming voice generation:', error);
            handleErrorRecovery();
        }
        finally {
            setIsProcessing(false);
        }
    };
    const playVoiceResponse = async (base64Voice) => {
        try {
            if (!audioRef.current)
                return;
            const binary = atob(base64Voice);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;
            console.log('Playing voice response...');
            await audioRef.current.play();
            // After the audio finishes playing, set it to user's turn
            audioRef.current.onended = () => {
                console.log('Voice response finished playing');
                setIsUserTurn(true);
                setIsStreaming(false);
                setIsProcessing(false);
            };
        }
        catch (error) {
            console.error('Error playing voice response:', error);
            handleErrorRecovery();
        }
    };
    // Update the voice response subscription effect
    useEffect(() => {
        if (voiceStreamError) {
            console.error('Voice stream error detected:', voiceStreamError);
            handleErrorRecovery();
            return;
        }
        if (voiceStreamData?.voiceResponseStream?.audioChunk) {
            const { audioChunk, isComplete } = voiceStreamData.voiceResponseStream;
            console.log('Received voice chunk from stream');
            playAudioChunk(audioChunk).then(() => {
                if (isComplete) {
                    console.log('Voice stream complete');
                    setIsUserTurn(true);
                    setIsStreaming(false);
                    setIsProcessing(false);
                    if (isFlirting) {
                        startVoiceDetection();
                    }
                }
            }).catch(error => {
                console.error('Error playing audio chunk:', error);
                handleErrorRecovery();
            });
        }
    }, [voiceStreamData, voiceStreamError]);
    // Update the chat response subscription effect
    useEffect(() => {
        if (chatStreamError) {
            console.error('Chat stream error detected:', chatStreamError);
            handleErrorRecovery();
            return;
        }
        if (chatStreamData?.chatResponseStream?.chunk) {
            const { chunk, isComplete } = chatStreamData.chatResponseStream;
            console.log('Received chat chunk:', chunk);
            setCurrentResponse(chunk);
            if (isComplete) {
                console.log('Chat stream complete');
                logConversationMessage('character', chunk);
            }
        }
    }, [chatStreamData, chatStreamError]);
    // Update the back button click handler to clear pre-generated content
    const handleBackClick = () => {
        setSelectedCharacter(null);
        setShowAnalysis(false);
        setPreGeneratedResponse('');
        setPreGeneratedVoiceUrl('');
    };
    const handleStartRecording = () => {
        if (!isUserTurn || isProcessing)
            return;
        startRecording();
    };
    const handleStopRecording = async () => {
        if (!isRecording)
            return;
        try {
            // Stop recording and wait for the final chunk
            await stopRecording();
            // Create audio blob from chunks
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('Created audio blob of size:', audioBlob.size);
            if (audioBlob.size === 0) {
                throw new Error('Recording produced empty audio blob');
            }
            // Switch to HER TURN before processing
            setIsUserTurn(false);
            setIsProcessing(true);
            // Process the audio immediately
            await handleAudioSubmission(audioBlob);
        }
        catch (error) {
            console.error('Error in recording process:', error);
            // If there's an error, give control back to the user
            setIsUserTurn(true);
            setIsProcessing(false);
        }
    };
    // Update the turn indicator text to return an array of words
    const getTurnIndicatorText = () => {
        if (!isUserTurn) {
            return isProcessing ? ["PLEASE", "WAIT"] : ["HER", "TURN"];
        }
        return isRecording ? ["YOUR", "TURN"] : ["YOUR", "TURN"];
    };
    // Update the audio submission logic
    const handleAudioSubmission = async (audioBlob) => {
        console.log('Processing audio submission');
        console.log('Audio blob size:', audioBlob.size);
        try {
            // Convert audio blob to base64
            const base64Audio = await blobToBase64(audioBlob);
            console.log('Audio converted to base64, length:', base64Audio.length);
            if (base64Audio.length === 0) {
                throw new Error('Base64 conversion produced empty string');
            }
            // Convert speech to text using Whisper
            console.log('Sending audio to Whisper for transcription...');
            const { data: speechData } = await convertSpeechToText({
                variables: {
                    audio: base64Audio
                }
            });
            const transcribedText = speechData.convertSpeechToText.text;
            console.log('Whisper transcription result:', transcribedText);
            if (!transcribedText) {
                throw new Error('Whisper returned empty transcription');
            }
            // Generate chat response using GPT
            console.log('Sending transcription to GPT for response...');
            const { data: chatData } = await generateChatResponse({
                variables: {
                    message: transcribedText,
                    characterId: selectedCharacter?.id
                }
            });
            const gptResponse = chatData.generateChatResponse.response;
            console.log('GPT response:', gptResponse);
            if (!gptResponse) {
                throw new Error('GPT returned empty response');
            }
            // Set streaming state and current response
            setIsStreaming(true);
            setCurrentResponse(gptResponse);
            // Generate voice response using ElevenLabs
            console.log('Sending GPT response to ElevenLabs for voice generation...');
            const { data: voiceData } = await generateVoice({
                variables: {
                    voiceId: selectedCharacter?.voiceId,
                    text: gptResponse
                }
            });
            const base64Voice = voiceData.generateVoiceResponse.audioUrl;
            console.log('Received voice response from ElevenLabs');
            if (!base64Voice) {
                throw new Error('ElevenLabs returned empty audio');
            }
            // Play the voice response
            if (audioRef.current) {
                const binary = atob(base64Voice);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioRef.current.src = audioUrl;
                console.log('Playing voice response...');
                await audioRef.current.play();
                // After the audio finishes playing, set it to user's turn
                audioRef.current.onended = () => {
                    console.log('Voice response finished playing');
                    setIsUserTurn(true);
                    setIsStreaming(false);
                    setIsProcessing(false);
                };
            }
        }
        catch (error) {
            console.error('Error in audio processing pipeline:', error);
            // On error, give control back to user after a delay
            setTimeout(() => {
                setIsUserTurn(true);
                setIsStreaming(false);
                setIsProcessing(false);
            }, 2000);
            throw error;
        }
    };
    // Add this function to log messages
    const logConversationMessage = (speaker, text) => {
        setConversationHistory(prev => [...prev, {
                speaker,
                text,
                timestamp: Date.now()
            }]);
        console.log(`[${speaker.toUpperCase()}] ${text}`);
    };
    // Update handleUserResponse function
    const handleUserResponse = async (transcript) => {
        if (!transcript.trim())
            return;
        logConversationMessage('user', transcript);
        setCurrentResponse(transcript);
        setIsUserTurn(false);
        setIsStreaming(true);
    };
    // Add this to save conversation history when session ends
    useEffect(() => {
        if (!isFlirting && conversationHistory.length > 0) {
            // Save conversation history to localStorage for post-session analysis
            localStorage.setItem('lastConversation', JSON.stringify(conversationHistory));
            console.log('Conversation history saved:', conversationHistory);
        }
    }, [isFlirting, conversationHistory]);
    if (loading || showSplash) {
        return _jsx(SplashScreen, { onClick: () => setShowSplash(false) });
    }
    if (error)
        return _jsxs("div", { children: ["Error: ", error.message] });
    return (_jsxs("div", { className: "min-h-screen bg-[#f3e0b7] p-8", children: [_jsxs("div", { className: "max-w-4xl mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] relative", children: [showProgressOverlay && _jsx(AnalysisProgress, {}), !selectedCharacter ? (_jsxs("div", { className: "w-full", children: [_jsx("div", { className: "w-full max-w-6xl mx-auto px-4", children: _jsxs("div", { className: "flex items-center justify-center gap-4 mb-8", children: [_jsxs("h1", { className: "text-3xl font-bold text-black text-center", children: [_jsx("span", { className: "border-b-4 border-pink-500", children: "Pick a girl" }), " to flirt with"] }), _jsx("img", { src: "/assets/love.png", alt: "Love", className: "w-12 h-16" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 w-full", children: data.characters.map((character) => (_jsx("div", { className: "bg-[#17475c] rounded-lg shadow-lg overflow-hidden flex flex-col", children: _jsxs("div", { className: "p-4 flex-grow", children: [_jsx("img", { src: character.id === '1' ? "/assets/french1.png" : character.id === '2' ? "/assets/spanish 1.png" : "/assets/russian1.png", alt: character.name, className: "w-48 h-48 object-cover mx-auto mb-4" }), _jsx("h2", { className: "text-xl font-bold text-center mb-2 text-white", children: character.name }), _jsx("p", { className: "text-white text-center mb-4", children: character.personality }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: () => playVoiceSample(character), className: "w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2", children: playingVoiceId === character.id ? (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx(FaStop, { className: "text-xl" }), "Stop Voice"] })) : (_jsxs("span", { className: "flex items-center justify-center gap-2", children: [_jsx(FaPlay, { className: "text-xl" }), "Hear Voice"] })) }), _jsxs("button", { onClick: () => handleCharacterSelect(character), className: "w-full bg-black hover:bg-gray-800 text-pink-500 font-bold py-2 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2", children: [_jsx("img", { src: "/assets/kiss.png", alt: "Kiss", className: "w-10 h-10" }), "Pick this girl"] })] })] }) }, character.id))) })] })) : showAnalysis ? (_jsx(SessionAnalysis, { onFlirtAgain: handleBackClick })) : !isFlirting ? (_jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 text-center max-w-xl mx-auto relative overflow-hidden", style: {
                            backgroundImage: `url(${currentContext?.backgroundImage})`,
                            backgroundSize: '120%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundBlendMode: 'overlay',
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            minHeight: '600px'
                        }, children: [_jsxs("button", { onClick: handleBackClick, className: "absolute top-3 left-3 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors duration-200 text-sm", children: [_jsx(FaArrowLeft, {}), " Back"] }), _jsx("div", { className: "backdrop-blur-sm bg-white/30 rounded-lg px-6 py-3 mb-4 inline-block", children: _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold uppercase", children: "You Encounter" }), _jsx("h2", { className: "text-3xl text-pink-500 font-semibold mt-1", children: selectedCharacter?.name })] }) }), currentContext && (_jsxs(_Fragment, { children: [_jsx("img", { src: currentContext.image, alt: selectedCharacter?.name, className: "w-40 h-40 object-cover mx-auto mb-4 rounded-lg" }), _jsxs("div", { className: "backdrop-blur-md bg-white/30 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h3", { className: "text-base text-black mb-1 font-bold uppercase", children: "At" }), _jsx("div", { className: "flex items-center justify-center", children: _jsxs("div", { className: "flex items-center", children: [_jsx("img", { src: "/assets/location.png", alt: "Location", className: "w-8 h-8 mr-2" }), _jsx("h2", { className: "text-2xl text-blue-700 font-semibold", children: currentContext.title })] }) })] }), _jsx("p", { className: "text-black text-sm", children: currentContext.description })] }), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsxs("button", { onClick: rerollContext, className: "bg-gray-500 text-white px-4 py-2 rounded-lg text-base font-semibold flex items-center gap-2", children: [_jsx(FaRedo, {}), " Reroll Location"] }), _jsx("button", { onClick: startFlirtingSession, className: "bg-pink-500 text-white px-6 py-2 rounded-lg text-base font-semibold", children: "Let's Go" })] })] }))] })) : (_jsxs("div", { ref: cardRef, className: `bg-white rounded-lg shadow-lg p-8 relative overflow-hidden max-w-xl w-full transition-all duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`, style: {
                            backgroundImage: `url(${currentContext?.backgroundImage})`,
                            backgroundSize: '120%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundBlendMode: 'overlay',
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            minHeight: '500px'
                        }, children: [_jsx("div", { className: "w-full bg-gray-200 rounded-full h-3 mb-6", children: _jsx("div", { className: "bg-pink-500 h-3 rounded-full transition-all duration-1000", style: { width: `${(timer / 60) * 100}%` } }) }), _jsxs("div", { className: "backdrop-blur-md bg-white/30 rounded-lg p-4 mb-4", children: [_jsxs("div", { className: "flex items-center justify-center gap-2 mb-2", children: [_jsx("img", { src: "/assets/location.png", alt: "Location", className: "w-6 h-6" }), _jsx("h2", { className: "text-xl text-blue-700 font-semibold", children: currentContext?.title })] }), _jsx("h3", { className: "text-2xl text-pink-500 font-bold text-center", children: selectedCharacter?.name })] }), _jsx("div", { className: "flex justify-center mb-4", children: _jsx("img", { src: currentContext?.image, alt: selectedCharacter?.name, className: "w-48 h-48 object-cover rounded-lg" }) }), _jsx("div", { className: "flex justify-center gap-2 mb-6", children: [...Array(3)].map((_, i) => (_jsx(FaHeart, { className: `text-3xl ${i < zebraHeads ? 'text-pink-500' : 'text-gray-300'}` }, i))) }), _jsxs("div", { className: "flex items-center justify-between w-full px-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(MicrophoneButton, { isUserTurn: isUserTurn, isRecording: isRecording, isProcessing: isProcessing, onStartRecording: handleStartRecording, onStopRecording: handleStopRecording }), _jsx("div", { className: `w-24 h-16 rounded-lg flex flex-col items-center justify-center font-bold text-white ${isUserTurn ? (isRecording ? 'bg-green-500' : 'bg-blue-500') : 'bg-red-500'}`, children: getTurnIndicatorText().map((word, index) => (_jsx("span", { className: "text-sm leading-tight", children: word }, index))) })] }), _jsx("button", { onClick: endFlirtingSession, className: "bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg text-base font-semibold transition-colors", children: "End Session" })] })] }))] }), _jsx("audio", { ref: audioRef, className: "hidden" })] }));
};
export default Flirt;
