import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { UPLOAD_AUDIO } from '../utils/mutations';
import { findLesson } from '../data/lessons';
import type { Lesson } from '../data/lessons';
import { useHearts } from '../contexts/HeartsContext';

interface LessonParams {
  unitId: string;
  levelId: string;
  [key: string]: string | undefined;
}

interface UploadAudioInput {
  audioBase64: string;
  filename: string;
}

interface AudioResponse {
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
  suggestions: string[];
}

interface RequirementStatus {
  met: boolean;
  value: number;
  target: number;
  type: 'min' | 'max';
}

const modeEmojis: Record<string, string> = {
  "Open Question": "🗣️",
  "Describe & Convince": "🎯",
  "Improv Rant": "🔥",
  "Opinion Clash": "⚔️",
  "Pretend Scenario": "🎭"
};

const Lesson: React.FC = () => {
  const { unitId, levelId } = useParams<LessonParams>();
  const navigate = useNavigate();
  const { loseHeart, hearts, timeUntilRegeneration } = useHearts();
  
  const [lessonData, setLessonData] = useState<Lesson | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'transcribing' | 'analyzing'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [feedback, setFeedback] = useState<AudioResponse | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [requirementStatuses, setRequirementStatuses] = useState<Record<string, RequirementStatus>>({});
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);
  const [showNoHeartsPopup, setShowNoHeartsPopup] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const progressIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const lessonDataRef = useRef<Lesson | null>(null);

  const [uploadAudio, { loading: uploadLoading }] = useMutation<
    { uploadAudio: AudioResponse },
    { input: UploadAudioInput }
  >(UPLOAD_AUDIO);

  // Load lesson data
  useEffect(() => {
    if (!unitId || !levelId || isNaN(Number(unitId)) || isNaN(Number(levelId))) {
      setError('Invalid lesson parameters');
      return;
    }

    const lesson = findLesson(Number(unitId), Number(levelId));
    console.log('Found lesson:', lesson);

    if (!lesson) {
      setError('Lesson not found');
      return;
    }

    setLessonData(lesson);
    lessonDataRef.current = lesson;
  }, [unitId, levelId]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startCountdown = useCallback(() => {
    if (hearts === 0) {
      setShowNoHeartsPopup(true);
      return; // Don't start if no hearts left
    }
    setStatus('countdown');
    setCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [hearts]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setStatus('recording');
      setProgress(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setStatus('transcribing');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const filename = `unit${unitId}_level${levelId}_${Date.now()}.wav`;

            try {
              setStatus('analyzing');
              console.log('Preparing to upload audio:', {
                filename,
                audioLength: base64Audio.length,
                audioPrefix: base64Audio.substring(0, 50) + '...'
              });

              const uploadVariables = {
                input: {
                  audioBase64: base64Audio,
                  filename: filename
                }
              };
              console.log('Upload variables:', uploadVariables);

              const { data } = await uploadAudio({
                variables: uploadVariables
              });

              console.log('Upload response:', data);

              if (data?.uploadAudio) {
                setTranscript(data.uploadAudio.transcript);
                setFeedback(data.uploadAudio);
                
                // Check requirements
                const statuses: Record<string, RequirementStatus> = {};
                const currentLessonData = lessonDataRef.current;
                console.log('Current lesson data during processing:', currentLessonData);
                
                if (currentLessonData?.requirements.fillerWords) {
                  statuses.fillerWords = {
                    met: data.uploadAudio.fillerWordCount <= currentLessonData.requirements.fillerWords.max,
                    value: data.uploadAudio.fillerWordCount,
                    target: currentLessonData.requirements.fillerWords.max,
                    type: 'max'
                  };
                  console.log('Filler words status:', statuses.fillerWords);
                } else {
                  console.log('No filler words requirement found in lesson data:', currentLessonData);
                }
                
                if (currentLessonData?.requirements.grammarScore) {
                  statuses.grammarScore = {
                    met: data.uploadAudio.grammarScore >= currentLessonData.requirements.grammarScore.min,
                    value: data.uploadAudio.grammarScore,
                    target: currentLessonData.requirements.grammarScore.min,
                    type: 'min'
                  };
                }
                
                if (currentLessonData?.requirements.wordChoiceScore) {
                  statuses.wordChoiceScore = {
                    met: data.uploadAudio.wordChoiceScore >= currentLessonData.requirements.wordChoiceScore.min,
                    value: data.uploadAudio.wordChoiceScore,
                    target: currentLessonData.requirements.wordChoiceScore.min,
                    type: 'min'
                  };
                }
                
                if (currentLessonData?.requirements.conciseness || currentLessonData?.requirements.concisenessScore) {
                  statuses.conciseness = {
                    met: data.uploadAudio.conciseness.wordCount <= (currentLessonData.requirements.conciseness?.maxWords || 60) &&
                         data.uploadAudio.conciseness.sentenceCount <= (currentLessonData.requirements.conciseness?.maxSentences || Infinity),
                    value: data.uploadAudio.conciseness.wordCount,
                    target: currentLessonData.requirements.conciseness?.maxWords || 0,
                    type: 'max'
                  };
                }
                
                if (currentLessonData?.requirements.charismaScore) {
                  statuses.charismaScore = {
                    met: data.uploadAudio.charismaScore >= currentLessonData.requirements.charismaScore.min,
                    value: data.uploadAudio.charismaScore,
                    target: currentLessonData.requirements.charismaScore.min,
                    type: 'min'
                  };
                }
                
                console.log('Lesson requirements:', currentLessonData?.requirements);
                setRequirementStatuses(statuses);
                console.log('All requirement statuses:', statuses);
                console.log('All requirements met:', Object.keys(statuses).length > 0 && Object.values(statuses).every(status => status.met));
              }
              
              setStatus('idle');
            } catch (uploadError) {
              console.error('Upload error:', uploadError);
              setError('Failed to upload audio');
              setStatus('idle');
            }
          };

          stream.getTracks().forEach(track => track.stop());
        } catch (err) {
          setError('Error processing audio');
          setStatus('idle');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start progress bar
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newProgress = (elapsed / (lessonData?.timeLimit || 30)) * 100;
        
        if (newProgress >= 100) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          stopRecording();
        } else {
          setProgress(newProgress);
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setStatus('idle');
      setIsRecording(false);
    }
  }, [unitId, levelId, uploadAudio, lessonData]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  }, [isRecording]);

  // Add effect to handle level advancement when requirements are met
  useEffect(() => {
    if (allRequirementsMet) {
      const currentLevel = Number(levelId);
      const activeLevel = Number(localStorage.getItem('activeLevel') || '1');
      
      // Only update active level if this is the current active level or a future level
      if (currentLevel >= activeLevel) {
        const nextLevel = currentLevel + 1;
        
        // Update localStorage with the next level
        localStorage.setItem('activeLevel', nextLevel.toString());
        
        // If we're in the browser, dispatch a custom event to notify Dashboard
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levelCompleted', {
            detail: { nextLevel }
          }));
        }
      }
    }
  }, [allRequirementsMet, levelId]);

  // Update the feedback handling to set allRequirementsMet
  useEffect(() => {
    if (feedback) {
      const requirementsMet = Object.keys(requirementStatuses).length > 0 && 
        Object.values(requirementStatuses).every(status => status.met);
      setAllRequirementsMet(requirementsMet);
      
      // Call handleSubmit when requirements are not met
      if (!requirementsMet) {
        handleSubmit();
      }
    }
  }, [feedback, requirementStatuses]);

  const handleNextLevel = () => {
    const nextLevel = Number(levelId) + 1;
    const currentUnit = Number(unitId);
    const activeLevel = Number(localStorage.getItem('activeLevel') || '1');
    
    // Reset all state before navigation
    setTranscript('');
    setFeedback(null);
    setProgress(0);
    setStatus('idle');
    setRequirementStatuses({});
    setAllRequirementsMet(false);
    
    // Check if next level exists in current unit
    const nextLesson = findLesson(currentUnit, nextLevel);
    
    if (nextLesson) {
      // If next level exists in current unit, navigate to it
      console.log('Navigating to next level:', nextLevel);
      
      // Only update active level if this is the current active level or a future level
      if (Number(levelId) >= activeLevel) {
        localStorage.setItem('activeLevel', nextLevel.toString());
        
        // Dispatch level completed event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levelCompleted', {
            detail: { nextLevel }
          }));
        }
      }
      
      navigate(`/unit/${currentUnit}/lesson/${nextLevel}`, { replace: true });
    } else if (currentUnit < 5) {
      // If no more levels in current unit but there are more units, go to first level of next unit
      const nextUnit = currentUnit + 1;
      console.log('Navigating to next unit:', nextUnit);
      
      // Only update active level if this is the current active level or a future level
      if (Number(levelId) >= activeLevel) {
        localStorage.setItem('activeLevel', '1');
        
        // Dispatch level completed event for unit transition
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('levelCompleted', {
            detail: { nextLevel: 1 }
          }));
        }
      }
      
      navigate(`/unit/${nextUnit}/lesson/1`, { replace: true });
    } else {
      // If no more levels or units, go back to dashboard
      console.log('Navigating to dashboard');
      navigate('/', { replace: true });
    }
  };

  const handleRetry = () => {
    setTranscript('');
    setFeedback(null);
    setProgress(0);
    setStatus('idle');
    setRequirementStatuses({});
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = async () => {
    // Check if any requirements are not met
    const hasFailedRequirements = Object.values(requirementStatuses).some(status => !status.met);
    if (hasFailedRequirements) {
      loseHeart();
    }

    // ... rest of the submit logic ...
  };

  if (!lessonData) {
    return (
      <div className="min-h-screen bg-[#f3e0b7] p-8">
        <div className="max-w-2xl mx-auto bg-[#f3e0b7] rounded-xl shadow-lg p-6">
          <div className="text-center">
            <p className="text-gray-300">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3e0b7] p-8">
        <div className="max-w-2xl mx-auto bg-[#f3e0b7] rounded-xl shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3e0b7] p-8">
      <div className="max-w-2xl mx-auto bg-[#e6d0a8] rounded-xl shadow-lg p-6 border-4 border-dashed border-[#17475c]">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-black">
            Unit {unitId} · Level {levelId}
          </h1>
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center text-black hover:text-gray-700 transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 text-white rounded-full text-sm font-medium ${
                Number(unitId) === 1 ? 'bg-orange-600' 
                : Number(unitId) === 2 ? 'bg-blue-800'
                : Number(unitId) === 3 ? 'bg-purple-800'
                : Number(unitId) === 4 ? 'bg-indigo-800'
                : 'bg-green-800'
              }`}>
                {modeEmojis[lessonData.mode] || ''} Mode: {lessonData.mode}
              </span>
            </div>

            <p className="text-xl text-black mb-8">{lessonData.prompt}</p>

            <div className="mb-8 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium text-[#e15831] mb-3">Requirements:</h3>
              <div className="space-y-2">
                {lessonData.requirements.fillerWords && (
                  <div className={`flex items-center justify-between ${
                    !feedback 
                      ? 'text-white' 
                      : !requirementStatuses.fillerWords?.met 
                        ? 'text-red-500' 
                        : 'text-green-500'
                  }`}>
                    <span>Filler Words</span>
                    <span>Maximum {lessonData.requirements.fillerWords.max}</span>
                  </div>
                )}
                {lessonData.requirements.grammarScore && (
                  <div className={`flex items-center justify-between ${
                    !feedback 
                      ? 'text-white' 
                      : !requirementStatuses.grammarScore?.met 
                        ? 'text-red-500' 
                        : 'text-green-500'
                  }`}>
                    <span>Grammar Score</span>
                    <span>At least {lessonData.requirements.grammarScore.min}%</span>
                  </div>
                )}
                {lessonData.requirements.wordChoiceScore && (
                  <div className={`flex items-center justify-between ${
                    !feedback 
                      ? 'text-white' 
                      : !requirementStatuses.wordChoiceScore?.met 
                        ? 'text-red-500' 
                        : 'text-green-500'
                  }`}>
                    <span>Word Choice Score</span>
                    <span>At least {lessonData.requirements.wordChoiceScore.min}%</span>
                  </div>
                )}
                {(lessonData.requirements.conciseness || lessonData.requirements.concisenessScore) && (
                  <div className={`flex items-center justify-between ${
                    !feedback 
                      ? 'text-white' 
                      : !requirementStatuses.conciseness?.met 
                        ? 'text-red-500' 
                        : 'text-green-500'
                  }`}>
                    <span>Conciseness</span>
                    <span>Maximum {lessonData.requirements.conciseness?.maxWords || 60} words</span>
                  </div>
                )}
                {lessonData.requirements.conciseness?.maxSentences && (
                  <div className={`flex items-center justify-between ${
                    !feedback 
                      ? 'text-white' 
                      : !requirementStatuses.conciseness?.met 
                        ? 'text-red-500' 
                        : 'text-green-500'
                  }`}>
                    <span>Maximum Sentences</span>
                    <span>No more than {lessonData.requirements.conciseness.maxSentences}</span>
                  </div>
                )}
                {lessonData.requirements.charismaScore && (
                  <div className={`flex items-center justify-between ${
                    !feedback 
                      ? 'text-white' 
                      : !requirementStatuses.charismaScore?.met 
                        ? 'text-red-500' 
                        : 'text-green-500'
                  }`}>
                    <span>Charisma Score</span>
                    <span>At least {lessonData.requirements.charismaScore.min} out of 10</span>
                  </div>
                )}
              </div>
            </div>

            {showNoHeartsPopup ? (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border-2 border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-4">No Hearts Left</h2>
                  <p className="text-gray-300 mb-6">You've used all your hearts. Come back when they regenerate!</p>
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">Time until regeneration:</p>
                    <p className="text-3xl font-mono text-yellow-500 mb-6">
                      {timeUntilRegeneration ? formatTime(timeUntilRegeneration) : '00:00:00'}
                    </p>
                    <button
                      onClick={() => {
                        setShowNoHeartsPopup(false);
                        handleBack();
                      }}
                      className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {status === 'countdown' && (
                  <div className="text-6xl font-bold text-white mb-8">
                    {countdown}
                  </div>
                )}

                {status === 'recording' && (
                  <div className="mb-8">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-white mt-2">Recording in progress...</p>
                    <button
                      onClick={stopRecording}
                      className="mt-4 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Stop Recording
                    </button>
                  </div>
                )}

                {(status === 'transcribing' || status === 'analyzing') && (
                  <div className="mb-8 space-y-4">
                    <div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan" />
                        <div className="absolute inset-0 bg-green-500/20" />
                      </div>
                      <p className="text-white mt-2">Transcribing your speech...</p>
                    </div>
                    <div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan" />
                        <div className="absolute inset-0 bg-purple-500/20" />
                      </div>
                      <p className="text-white mt-2">Analyzing your response...</p>
                    </div>
                  </div>
                )}

                {status === 'idle' && !feedback && (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={startCountdown}
                      disabled={isRecording || uploadLoading}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-150 uppercase tracking-wide ${
                        isRecording || uploadLoading
                          ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                          : 'bg-purple-500 hover:bg-purple-600 text-white border-b-4 border-purple-700 active:translate-y-1 active:border-b-0'
                      }`}
                    >
                      Record
                    </button>
                  </div>
                )}

                {transcript && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <h3 className="font-medium mb-2 text-white">Transcript:</h3>
                    <p className="text-gray-300">{transcript}</p>
                  </div>
                )}

                {feedback && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">Confidence Score</h3>
                          <span className={`text-2xl ${feedback.confidenceScore >= 0.8 ? 'text-green-500' : 'text-yellow-500'}`}>
                            {Math.round(feedback.confidenceScore * 100)}%
                          </span>
                        </div>
                        <p className="text-gray-300">
                          How confident the system is in understanding your speech
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">Filler Words</h3>
                          <span className={`text-2xl ${feedback.fillerWordCount <= 1 ? 'text-green-500' : 'text-red-500'}`}>
                            {feedback.fillerWordCount}
                          </span>
                        </div>
                        <p className="text-gray-300">
                          Number of filler words used in your response
                        </p>
                      </div>

                      {Number(unitId) === 4 && (
                        <div className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-white">Conciseness</h3>
                            <div className="flex flex-col items-end">
                              <span className={`text-xl ${requirementStatuses.conciseness?.met ? 'text-green-500' : 'text-red-500'}`}>
                                {feedback.conciseness.wordCount} words
                              </span>
                              <span className={`text-sm ${requirementStatuses.conciseness?.met ? 'text-green-500' : 'text-red-500'}`}>
                                {feedback.conciseness.sentenceCount} sentences
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300">
                            Keeping your response concise and to the point
                          </p>
                        </div>
                      )}

                      {Number(unitId) === 5 && (
                        <div className="p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-white">Charisma Score</h3>
                            <span className={`text-2xl ${requirementStatuses.charismaScore?.met ? 'text-green-500' : 'text-red-500'}`}>
                              {feedback?.charismaScore || 0}/10
                            </span>
                          </div>
                          <p className="text-gray-300">
                            How engaging and memorable your delivery was
                          </p>
                        </div>
                      )}

                      {Object.entries(requirementStatuses).map(([key, status]) => {
                        // Skip charisma for unit 5 as it's handled above
                        if (key === 'charismaScore' && Number(unitId) === 5) return null;
                        // Skip conciseness for unit 4 as it's handled above
                        if (key === 'conciseness' && Number(unitId) === 4) return null;
                        // Skip filler words as it's handled above
                        if (key === 'fillerWords') return null;
                        
                        return (
                          <div key={key} className="p-4 bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-white capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </h3>
                              <span className={`text-2xl ${status.met ? 'text-green-500' : 'text-red-500'}`}>
                                {key === 'grammarScore' ? `${Math.round(status.value)}%` : 
                                 key === 'wordChoiceScore' ? `${Math.round(status.value)}%` :
                                 key === 'conciseness' ? `${status.value} words` :
                                 status.met ? '✓' : '✗'}
                              </span>
                            </div>
                            <p className="text-white">
                              {status.type === 'min' ? '≥' : '≤'} {status.target}
                              <span className="text-gray-400 ml-2">
                                (Current: {typeof status.value === 'number' ? status.value.toFixed(2) : status.value})
                              </span>
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="font-medium mb-2 text-white">Suggestions for Improvement</h3>
                      <div className="space-y-4">
                        {feedback.suggestions.map((suggestion, index) => {
                          const colors = [
                            'border-purple-500 text-purple-500',
                            'border-green-500 text-green-500',
                            'border-blue-500 text-blue-500',
                            'border-orange-500 text-orange-500',
                            'border-pink-500 text-pink-500',
                            'border-yellow-500 text-yellow-500'
                          ];
                          const colorClass = colors[index % colors.length];
                          
                          return (
                            <div key={index} className="flex items-center space-x-4">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${colorClass} flex items-center justify-center`}>
                                <span className="font-medium">{index + 1}</span>
                              </div>
                              <p className="text-gray-300">{suggestion}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6">
                      {allRequirementsMet ? (
                        <div className="text-center">
                          <p className="text-green-400 mb-4">Great job! You've met all requirements!</p>
                          <button
                            onClick={handleNextLevel}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                          >
                            Next Level
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-yellow-400 mb-4">Some requirements weren't met. Try again!</p>
                          <button
                            onClick={handleRetry}
                            className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lesson; 