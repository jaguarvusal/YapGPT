import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { FaPlay, FaStop, FaHeart } from 'react-icons/fa';
import frenchImage from '../assets 2/french1.png';
import spanishImage from '../assets 2/spanish 1.png';
import russianImage from '../assets 2/russian1.png';
import kissImage from '../assets 2/kiss.png';
import loveImage from '../assets 2/love.png';

const GET_CHARACTERS = gql`
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

const GENERATE_VOICE = gql`
  mutation GenerateVoice($voiceId: String!, $text: String!) {
    generateVoiceResponse(voiceId: $voiceId, text: $text) {
      message
      audioUrl
    }
  }
`;

const ANALYZE_FLIRTING = gql`
  mutation AnalyzeFlirting($text: String!) {
    analyzeFlirting(text: $text) {
      score
      feedback
    }
  }
`;

interface Character {
  id: string;
  name: string;
  personality: string;
  voiceId: string;
  sampleLine: string;
}

const Flirt: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isFlirting, setIsFlirting] = useState(false);
  const [timer, setTimer] = useState(60);
  const [zebraHeads, setZebraHeads] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [userInput, setUserInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { loading, error, data } = useQuery(GET_CHARACTERS);
  const [generateVoice] = useMutation(GENERATE_VOICE);
  const [analyzeFlirting] = useMutation(ANALYZE_FLIRTING);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFlirting && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      endFlirtingSession();
    }
    return () => clearInterval(interval);
  }, [isFlirting, timer]);

  const playVoiceSample = async (character: Character) => {
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
    } catch (error) {
      console.error('Error playing voice sample:', error);
    } finally {
      setPlayingVoiceId(null);
    }
  };

  const startFlirtingSession = () => {
    setIsFlirting(true);
    setTimer(60);
    setZebraHeads(0);
    setShowAnalysis(false);
    setFeedback('');
  };

  const endFlirtingSession = async () => {
    setIsFlirting(false);
    const { data } = await analyzeFlirting({
      variables: {
        text: userInput,
      },
    });
    setZebraHeads(data.analyzeFlirting.score);
    setFeedback(data.analyzeFlirting.feedback);
    setShowAnalysis(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-[#f3e0b7] p-8">
      <div className="max-w-4xl mx-auto flex items-center min-h-[calc(100vh-4rem)]">
        {!selectedCharacter ? (
          <div className="w-full">
            <div className="w-full max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-black text-center">Pick a girl to flirt with</h1>
                <img src={loveImage} alt="Love" className="w-12 h-16" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {data.characters.map((character: Character) => (
                <div
                  key={character.id}
                  className="bg-[#17475c] rounded-lg shadow-lg overflow-hidden flex flex-col"
                >
                  <div className="p-4 flex-grow">
                    <img
                      src={character.id === '1' ? frenchImage : character.id === '2' ? spanishImage : russianImage} 
                      alt={character.name}
                      className="w-48 h-48 object-cover mx-auto mb-4"
                    />
                    <h2 className="text-xl font-bold text-center mb-2 text-white">{character.name}</h2>
                    <p className="text-white text-center mb-4">{character.personality}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => playVoiceSample(character)}
                        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
                      >
                        {playingVoiceId === character.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <FaStop className="text-xl" />
                            Stop Voice
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <FaPlay className="text-xl" />
                            Hear Voice
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedCharacter(character)}
                        className="w-full bg-black hover:bg-gray-800 text-pink-500 font-bold py-2 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2"
                      >
                        <img src={kissImage} alt="Kiss" className="w-10 h-10" />
                        Pick this girl
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : !isFlirting ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Flirt Mode</h1>
            <p className="text-gray-600 mb-6">
              You're about to start a 1-minute voice conversation with {selectedCharacter.name}
            </p>
            <button
              onClick={startFlirtingSession}
              className="bg-pink-500 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Start Flirting
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                {[...Array(3)].map((_, i) => (
                  <FaHeart
                    key={i}
                    className={`text-2xl ${
                      i < zebraHeads ? 'text-pink-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-2xl font-bold">{timer}s</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(timer / 60) * 100}%` }}
              />
            </div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 p-4 border rounded-lg mb-4"
            />
            <button
              onClick={endFlirtingSession}
              className="bg-red-500 text-white px-6 py-2 rounded"
            >
              End Session
            </button>
          </div>
        )}

        {showAnalysis && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Session Analysis</h2>
            <div className="flex items-center mb-4">
              <span className="text-lg mr-2">Score:</span>
              {[...Array(3)].map((_, i) => (
                <FaHeart
                  key={i}
                  className={`text-2xl ${
                    i < zebraHeads ? 'text-pink-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-700">{feedback}</p>
            <button
              onClick={() => {
                setSelectedCharacter(null);
                setShowAnalysis(false);
              }}
              className="mt-6 bg-blue-500 text-white px-6 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default Flirt; 