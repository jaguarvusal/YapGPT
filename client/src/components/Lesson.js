import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { UPLOAD_AUDIO } from '../utils/mutations';
import { findLesson } from '../data/lessons';
import { useHearts } from '../contexts/HeartsContext.jsx';
const modeEmojis = {
    "Open Question": "🗣️",
    "Describe & Convince": "🎯",
    "Improv Rant": "🔥",
    "Opinion Clash": "⚔️",
    "Pretend Scenario": "🎭"
};
const Lesson = () => {
    const { unitId, levelId } = useParams();
    const navigate = useNavigate();
    const { loseHeart, hearts, timeUntilRegeneration } = useHearts();
    const [lessonData, setLessonData] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle');
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const [progress, setProgress] = useState(0);
    const [requirementStatuses, setRequirementStatuses] = useState({});
    const [allRequirementsMet, setAllRequirementsMet] = useState(false);
    const [showNoHeartsPopup, setShowNoHeartsPopup] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const progressIntervalRef = useRef();
    const countdownIntervalRef = useRef();
    const lessonDataRef = useRef(null);
    const [uploadAudio, { loading: uploadLoading }] = useMutation(UPLOAD_AUDIO);
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
            if (progressIntervalRef.current)
                clearInterval(progressIntervalRef.current);
            if (countdownIntervalRef.current)
                clearInterval(countdownIntervalRef.current);
        };
    }, []);
    const formatTime = (ms) => {
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
                    if (countdownIntervalRef.current)
                        clearInterval(countdownIntervalRef.current);
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
                        const base64Audio = reader.result;
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
                            const { data, errors } = await uploadAudio({
                                variables: uploadVariables
                            });
                            console.log('Upload response:', data);
                            if (errors) {
                                console.error('GraphQL Errors:', errors);
                                throw new Error(errors[0].message);
                            }
                            if (!data?.uploadAudio) {
                                throw new Error('No response data received from server');
                            }
                            setTranscript(data.uploadAudio.transcript);
                            setFeedback(data.uploadAudio);
                            // Check requirements
                            const statuses = {};
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
                            }
                            else {
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
                            if (currentLessonData?.requirements.relevanceScore) {
                                statuses.relevanceScore = {
                                    met: data.uploadAudio.relevanceScore >= currentLessonData.requirements.relevanceScore.min,
                                    value: data.uploadAudio.relevanceScore,
                                    target: currentLessonData.requirements.relevanceScore.min,
                                    type: 'min'
                                };
                            }
                            console.log('Lesson requirements:', currentLessonData?.requirements);
                            setRequirementStatuses(statuses);
                            console.log('All requirement statuses:', statuses);
                            console.log('All requirements met:', Object.keys(statuses).length > 0 && Object.values(statuses).every(status => status.met));
                            setStatus('idle');
                        }
                        catch (uploadError) {
                            console.error('Upload error:', uploadError);
                            setError(uploadError.message || 'Failed to upload audio');
                            setStatus('idle');
                        }
                    };
                    stream.getTracks().forEach(track => track.stop());
                }
                catch (err) {
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
                    if (progressIntervalRef.current)
                        clearInterval(progressIntervalRef.current);
                    stopRecording();
                }
                else {
                    setProgress(newProgress);
                }
            }, 100);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to access microphone');
            setStatus('idle');
            setIsRecording(false);
        }
    }, [unitId, levelId, uploadAudio, lessonData]);
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (progressIntervalRef.current)
                clearInterval(progressIntervalRef.current);
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
        }
        else if (currentUnit < 5) {
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
        }
        else {
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
        return (_jsx("div", { className: "min-h-screen bg-[#f3e0b7] p-8", children: _jsx("div", { className: "max-w-2xl mx-auto bg-[#f3e0b7] rounded-xl shadow-lg p-6", children: _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-gray-300", children: "Loading lesson..." }) }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-[#f3e0b7] p-8", children: _jsx("div", { className: "max-w-2xl mx-auto bg-[#f3e0b7] rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-xl font-bold text-red-600 mb-4", children: "Error" }), _jsx("p", { className: "text-gray-300 mb-4", children: error }), _jsx("button", { onClick: handleBack, className: "px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors", children: "Return to Dashboard" })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-[#f3e0b7] p-8", children: _jsxs("div", { className: "max-w-2xl mx-auto bg-[#e6d0a8] rounded-xl shadow-lg p-6 border-4 border-dashed border-[#17475c]", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("h1", { className: "text-2xl font-bold text-black", children: ["Unit ", unitId, " \u00B7 Level ", levelId] }), _jsx("button", { onClick: handleBack, className: "w-10 h-10 flex items-center justify-center text-black hover:text-gray-700 transition-colors text-2xl", children: "\u2715" })] }), _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-4", children: _jsxs("span", { className: `inline-block px-3 py-1 text-white rounded-full text-sm font-medium ${Number(unitId) === 1 ? 'bg-orange-600'
                                        : Number(unitId) === 2 ? 'bg-blue-800'
                                            : Number(unitId) === 3 ? 'bg-purple-800'
                                                : Number(unitId) === 4 ? 'bg-indigo-800'
                                                    : 'bg-green-800'}`, children: [modeEmojis[lessonData.mode] || '', " Mode: ", lessonData.mode] }) }), _jsx("p", { className: "text-xl text-black mb-8", children: lessonData.prompt }), _jsxs("div", { className: "mb-8 p-4 bg-gray-700 rounded-lg", children: [_jsx("h3", { className: "font-medium text-[#e15831] mb-3", children: "Requirements:" }), _jsxs("div", { className: "space-y-2", children: [lessonData.requirements.fillerWords && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.fillerWords?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Filler Words" }), _jsxs("span", { children: ["Maximum ", lessonData.requirements.fillerWords.max] })] })), lessonData.requirements.grammarScore && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.grammarScore?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Grammar Score" }), _jsxs("span", { children: ["At least ", lessonData.requirements.grammarScore.min, "%"] })] })), lessonData.requirements.wordChoiceScore && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.wordChoiceScore?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Word Choice Score" }), _jsxs("span", { children: ["At least ", lessonData.requirements.wordChoiceScore.min, "%"] })] })), (lessonData.requirements.conciseness || lessonData.requirements.concisenessScore) && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.conciseness?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Conciseness" }), _jsxs("span", { children: ["Maximum ", lessonData.requirements.conciseness?.maxWords || 60, " words"] })] })), lessonData.requirements.conciseness?.maxSentences && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.conciseness?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Maximum Sentences" }), _jsxs("span", { children: ["No more than ", lessonData.requirements.conciseness.maxSentences] })] })), lessonData.requirements.charismaScore && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.charismaScore?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Charisma Score" }), _jsxs("span", { children: ["At least ", lessonData.requirements.charismaScore.min, " out of 10"] })] })), lessonData.requirements.relevanceScore && (_jsxs("div", { className: `flex items-center justify-between ${!feedback
                                                    ? 'text-white'
                                                    : !requirementStatuses.relevanceScore?.met
                                                        ? 'text-red-500'
                                                        : 'text-green-500'}`, children: [_jsx("span", { children: "Relevance Score" }), _jsxs("span", { children: ["At least ", lessonData.requirements.relevanceScore.min, "%"] })] }))] })] }), showNoHeartsPopup ? (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border-2 border-gray-700", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "No Hearts Left" }), _jsx("p", { className: "text-gray-300 mb-6", children: "You've used all your hearts. Come back when they regenerate!" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-gray-400 mb-2", children: "Time until regeneration:" }), _jsx("p", { className: "text-3xl font-mono text-yellow-500 mb-6", children: timeUntilRegeneration ? formatTime(timeUntilRegeneration) : '00:00:00' }), _jsx("button", { onClick: () => {
                                                        setShowNoHeartsPopup(false);
                                                        handleBack();
                                                    }, className: "px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors", children: "Return to Dashboard" })] })] }) })) : (_jsxs(_Fragment, { children: [status === 'countdown' && (_jsx("div", { className: "text-6xl font-bold text-white mb-8", children: countdown })), status === 'recording' && (_jsxs("div", { className: "mb-8", children: [_jsx("div", { className: "h-2 bg-gray-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500 transition-all duration-100", style: { width: `${progress}%` } }) }), _jsx("p", { className: "text-white mt-2", children: "Recording in progress..." }), _jsx("button", { onClick: stopRecording, className: "mt-4 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors", children: "Stop Recording" })] })), (status === 'transcribing' || status === 'analyzing') && (_jsxs("div", { className: "mb-8 space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "h-2 bg-gray-700 rounded-full overflow-hidden relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan" }), _jsx("div", { className: "absolute inset-0 bg-green-500/20" })] }), _jsx("p", { className: "text-white mt-2", children: "Transcribing your speech..." })] }), _jsxs("div", { children: [_jsxs("div", { className: "h-2 bg-gray-700 rounded-full overflow-hidden relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan" }), _jsx("div", { className: "absolute inset-0 bg-purple-500/20" })] }), _jsx("p", { className: "text-white mt-2", children: "Analyzing your response..." })] })] })), status === 'idle' && !feedback && (_jsx("div", { className: "flex justify-center space-x-4", children: _jsx("button", { onClick: startCountdown, disabled: isRecording || uploadLoading, className: `px-6 py-3 rounded-lg font-medium transition-all duration-150 uppercase tracking-wide ${isRecording || uploadLoading
                                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                : 'bg-purple-500 hover:bg-purple-600 text-white border-b-4 border-purple-700 active:translate-y-1 active:border-b-0'}`, children: "Record" }) })), transcript && (_jsxs("div", { className: "mt-4 p-4 bg-gray-700 rounded-lg", children: [_jsx("h3", { className: "font-medium mb-2 text-white", children: "Transcript:" }), _jsx("p", { className: "text-gray-300", children: transcript })] })), feedback && (_jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-orange-500 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium text-white", children: "Filler Words" }), _jsx("span", { className: `text-2xl ${feedback.fillerWordCount <= 1 ? 'text-green-600' : 'text-red-800'}`, children: feedback.fillerWordCount })] }), _jsx("p", { className: "text-gray-300", children: "Number of filler words used in your response" })] }), Number(unitId) === 4 && (_jsxs("div", { className: "p-4 bg-purple-500 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium text-white", children: "Conciseness" }), _jsxs("div", { className: "flex flex-col items-end", children: [_jsxs("span", { className: `text-xl ${requirementStatuses.conciseness?.met ? 'text-green-400' : 'text-red-800'}`, children: [feedback.conciseness.wordCount, " words"] }), _jsxs("span", { className: `text-sm ${requirementStatuses.conciseness?.met ? 'text-green-400' : 'text-red-800'}`, children: [feedback.conciseness.sentenceCount, " sentences"] })] })] }), _jsx("p", { className: "text-gray-300", children: "Keeping your response concise and to the point" })] })), Number(unitId) === 5 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 bg-red-500 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium text-white", children: "Relevance Score" }), _jsxs("span", { className: `text-2xl ${requirementStatuses.relevanceScore?.met ? 'text-green-400' : 'text-red-800'}`, children: [feedback?.relevanceScore || 0, "%"] })] }), _jsx("p", { className: "text-gray-300", children: "How well your response matches the prompt's intent" })] }), _jsxs("div", { className: "p-4 bg-yellow-500 rounded-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium text-white", children: "Charisma Score" }), _jsxs("span", { className: `text-2xl ${requirementStatuses.charismaScore?.met ? 'text-green-400' : 'text-red-800'}`, children: [feedback?.charismaScore || 0, "/10"] })] }), _jsx("p", { className: "text-gray-300", children: "Your ability to engage and captivate the audience" })] })] })), Object.entries(requirementStatuses).map(([key, status]) => {
                                                        // Skip relevance for unit 5 as it's handled above
                                                        if (key === 'relevanceScore' && Number(unitId) === 5)
                                                            return null;
                                                        // Skip conciseness for unit 4 as it's handled above
                                                        if (key === 'conciseness' && Number(unitId) === 4)
                                                            return null;
                                                        // Skip filler words as it's handled above
                                                        if (key === 'fillerWords')
                                                            return null;
                                                        // Skip charisma score for unit 5 as it's handled above
                                                        if (key === 'charismaScore' && Number(unitId) === 5)
                                                            return null;
                                                        return (_jsxs("div", { className: `p-4 ${key === 'grammarScore' ? 'bg-blue-500' :
                                                                key === 'wordChoiceScore' ? 'bg-green-500' :
                                                                    key === 'conciseness' ? 'bg-purple-500' :
                                                                        key === 'relevanceScore' ? 'bg-red-500' :
                                                                            'bg-gray-700'} rounded-lg`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium text-white capitalize", children: key.replace(/([A-Z])/g, ' $1').trim() }), _jsx("span", { className: `text-2xl ${status.met ? 'text-green-400' : 'text-red-800'}`, children: key === 'grammarScore' ? `${Math.round(status.value)}%` :
                                                                                key === 'wordChoiceScore' ? `${Math.round(status.value)}%` :
                                                                                    key === 'relevanceScore' ? `${Math.round(status.value)}%` :
                                                                                        key === 'conciseness' ? `${status.value} words` :
                                                                                            status.met ? '✓' : '✗' })] }), _jsxs("p", { className: "text-white", children: [status.type === 'min' ? '≥' : '≤', " ", status.target, _jsxs("span", { className: "text-gray-300 ml-2", children: ["(Current: ", typeof status.value === 'number' ? status.value.toFixed(2) : status.value, ")"] })] })] }, key));
                                                    })] }), _jsxs("div", { className: "p-4 bg-gray-700 rounded-lg", children: [_jsx("h3", { className: "font-medium mb-2 text-white", children: "Suggestions for Improvement" }), _jsx("div", { className: "space-y-4", children: feedback.suggestions.map((suggestion, index) => {
                                                            const colors = [
                                                                'border-purple-500 text-purple-500',
                                                                'border-green-500 text-green-500',
                                                                'border-blue-500 text-blue-500',
                                                                'border-orange-500 text-orange-500',
                                                                'border-pink-500 text-pink-500',
                                                                'border-yellow-500 text-yellow-500'
                                                            ];
                                                            const colorClass = colors[index % colors.length];
                                                            return (_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: `flex-shrink-0 w-8 h-8 rounded-full border-2 ${colorClass} flex items-center justify-center`, children: _jsx("span", { className: "font-medium", children: index + 1 }) }), _jsx("p", { className: "text-gray-300", children: suggestion })] }, index));
                                                        }) })] }), _jsx("div", { className: "mt-6", children: allRequirementsMet ? (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-green-800 mb-4", children: "Great job! You've met all requirements!" }), _jsx("button", { onClick: handleNextLevel, className: "px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors", children: "Next Level" })] })) : (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-yellow-800 mb-4", children: "Some requirements weren't met. Try again!" }), _jsx("button", { onClick: handleRetry, className: "px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors", children: "Retry" })] })) })] }))] }))] }))] }) })] }) }));
};
export default Lesson;
