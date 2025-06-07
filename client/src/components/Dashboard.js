import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Define unit character images using new URL() approach
const unitImages = {
    chef: new URL('/assets/chef.png', import.meta.url).href,
    boxer: new URL('/assets/boxer.png', import.meta.url).href,
    driver: new URL('/assets/driver.png', import.meta.url).href,
    bodyguard: new URL('/assets/bodyguard.png', import.meta.url).href,
    wizard: new URL('/assets/wizard.png', import.meta.url).href
};
const unitNames = [
    'Filler Words',
    'Grammar',
    'Word Choice',
    'Conciseness',
    'Charisma'
];
const unitTaglines = [
    'Where clarity begins.',
    'Polish your sentences until they shine.',
    'Say more with less — and better.',
    'Every word earns its place.',
    'Be unforgettable.'
];
const lessonNames = [
    // Unit 1 - Filler Words
    ['Eliminate "Um"', 'Cut the "Like"', 'Remove "You Know"', 'Clear the "Actually"', 'Zero Filler Words'],
    // Unit 2 - Grammar
    ['Basic Structure', 'Complex Sentences', 'Perfect Tense', 'Advanced Grammar', 'Grammar Mastery'],
    // Unit 3 - Word Choice
    ['Simple & Clear', 'Rich Vocabulary', 'Precise Language', 'Powerful Words', 'Word Mastery'],
    // Unit 4 - Conciseness
    ['Brief & Clear', 'Trim Sentences', 'Essential Words', 'Concise Impact', 'Perfect Brevity'],
    // Unit 5 - Charisma
    ['Confident Start', 'Engaging Story', 'Charming Tone', 'Dynamic Delivery', 'Charisma Master']
];
const Dashboard = () => {
    const navigate = useNavigate();
    // Generate array of 25 levels (5 levels per unit)
    const levels = Array.from({ length: 25 }, (_, i) => i + 1);
    const [currentUnit, setCurrentUnit] = useState(1);
    const [activeLevel, setActiveLevel] = useState(1);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showLessonTooltip, setShowLessonTooltip] = useState(false);
    const [showLockedTooltip, setShowLockedTooltip] = useState(null);
    const [showPracticeTooltip, setShowPracticeTooltip] = useState(null);
    const [showSkipTooltip, setShowSkipTooltip] = useState(null);
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(null);
    const containerRef = useRef(null);
    // Sync with localStorage on mount
    useEffect(() => {
        const savedLevel = localStorage.getItem('activeLevel');
        if (savedLevel) {
            const level = parseInt(savedLevel, 10);
            setActiveLevel(level);
            const unit = Math.ceil(level / 5);
            setCurrentUnit(unit);
            // Set initial scroll position to the current unit
            const scrollContainer = document.getElementById('scroll-container');
            const rightSidebar = document.getElementById('right-sidebar-scroll');
            if (!scrollContainer || !rightSidebar)
                return;
            const unitSections = scrollContainer.querySelectorAll('[data-unit-section]');
            const targetSection = unitSections[unit - 1];
            if (targetSection) {
                const rect = targetSection.getBoundingClientRect();
                const containerRect = scrollContainer.getBoundingClientRect();
                // Add extra padding for all units to prevent header overlap
                const extraPadding = 100;
                scrollContainer.scrollTop = rect.top - containerRect.top + scrollContainer.scrollTop - extraPadding;
                rightSidebar.scrollTop = rect.top - containerRect.top + scrollContainer.scrollTop - extraPadding;
            }
        }
        setIsInitialized(true);
    }, []);
    // Handle scroll events only after initialization
    useEffect(() => {
        if (!isInitialized)
            return;
        const handleScroll = () => {
            const scrollContainer = document.getElementById('scroll-container');
            if (!scrollContainer)
                return;
            const unitSections = scrollContainer.querySelectorAll('[data-unit-section]');
            let newUnit = 1;
            unitSections.forEach((section, index) => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= scrollContainer.getBoundingClientRect().top + 100) {
                    newUnit = index + 1;
                }
            });
            if (newUnit !== currentUnit && newUnit >= 1 && newUnit <= 5) {
                setCurrentUnit(newUnit);
            }
        };
        const scrollContainer = document.getElementById('scroll-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [currentUnit, isInitialized]);
    // Add wheel event listener to handle scrolling regardless of mouse position
    useEffect(() => {
        const handleWheel = (event) => {
            const scrollContainer = document.getElementById('scroll-container');
            const rightSidebar = document.getElementById('right-sidebar-scroll');
            if (!scrollContainer || !rightSidebar)
                return;
            // Use a larger multiplier for faster scrolling
            const scrollAmount = event.deltaY * 1.2;
            // Scroll both containers without smooth behavior for better performance
            scrollContainer.scrollBy({
                top: scrollAmount,
                behavior: 'auto'
            });
            rightSidebar.scrollBy({
                top: scrollAmount,
                behavior: 'auto'
            });
        };
        // Add wheel event listener to the document
        document.addEventListener('wheel', handleWheel, { passive: true });
        return () => {
            document.removeEventListener('wheel', handleWheel);
        };
    }, []);
    // Remove the initial scroll to correct unit effect
    useEffect(() => {
        if (!isInitialized)
            return;
        setCurrentUnit(Math.ceil(activeLevel / 5));
    }, [isInitialized, activeLevel]);
    useEffect(() => {
        const handleLevelCompleted = (event) => {
            const { nextLevel } = event.detail;
            setActiveLevel(nextLevel);
        };
        window.addEventListener('levelCompleted', handleLevelCompleted);
        return () => {
            window.removeEventListener('levelCompleted', handleLevelCompleted);
        };
    }, []);
    // Save active level to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeLevel', activeLevel.toString());
    }, [activeLevel]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            // Check if click is on a tooltip or its content
            const isTooltipClick = target.closest('[data-tooltip-content]');
            // Check if click is on a bubble
            const isBubbleClick = target.closest('[data-bubble]');
            // Check if click is on modal
            const isModalClick = target.closest('[data-modal]');
            if (!isTooltipClick && !isBubbleClick && !isModalClick) {
                setShowLessonTooltip(false);
                setShowLockedTooltip(null);
                setShowPracticeTooltip(null);
                setShowSkipTooltip(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    useEffect(() => {
        const handleKeyboardScroll = (event) => {
            const scrollContainer = document.getElementById('scroll-container');
            if (!scrollContainer)
                return;
            const scrollAmount = 100; // Adjust this value to control scroll speed
            switch (event.key) {
                case 'ArrowDown':
                case 'PageDown':
                case ' ':
                    event.preventDefault();
                    scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                    break;
                case 'ArrowUp':
                case 'PageUp':
                    event.preventDefault();
                    scrollContainer.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
                    break;
                case 'Home':
                    event.preventDefault();
                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                case 'End':
                    event.preventDefault();
                    scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
                    break;
            }
        };
        // Add keyboard event listener to the document
        document.addEventListener('keydown', handleKeyboardScroll);
        return () => {
            document.removeEventListener('keydown', handleKeyboardScroll);
        };
    }, []);
    // Add scroll sync effect
    useEffect(() => {
        const handleScroll = () => {
            const scrollContainer = document.getElementById('scroll-container');
            const rightSidebar = document.getElementById('right-sidebar-scroll');
            if (!scrollContainer || !rightSidebar)
                return;
            // Sync right sidebar scroll with main container
            rightSidebar.scrollTop = scrollContainer.scrollTop;
        };
        const scrollContainer = document.getElementById('scroll-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);
    const handleStartLesson = (unit, level) => {
        try {
            // Close any open tooltips
            setShowLessonTooltip(false);
            setShowLockedTooltip(null);
            setShowPracticeTooltip(null);
            // Calculate the absolute level number
            const absoluteLevel = ((unit - 1) * 5) + level;
            // Navigate to the lesson page with string parameters
            const path = `/unit/${unit.toString()}/lesson/${level.toString()}`;
            console.log('Navigating to:', path, 'Absolute level:', absoluteLevel); // Debug log
            navigate(path);
        }
        catch (error) {
            console.error('Navigation error:', error);
        }
    };
    // Add skip confirmation handler
    const handleSkipConfirm = () => {
        if (showSkipConfirmation) {
            const { unit, level } = showSkipConfirmation;
            // Update localStorage to mark this level as active
            localStorage.setItem('activeLevel', level.toString());
            setActiveLevel(level);
            setShowSkipConfirmation(null);
            // Navigate to the lesson
            handleStartLesson(unit, level);
        }
    };
    // Add skip cancel handler
    const handleSkipCancel = () => {
        setShowSkipConfirmation(null);
    };
    return (_jsxs("div", { className: "flex-1 flex flex-col min-h-full bg-[#f3e0b7]", children: [_jsxs("header", { className: `text-center rounded-xl p-6 shadow-lg sticky top-4 z-[40] backdrop-blur-sm bg-opacity-80 mx-4 ${currentUnit === 1 ? 'bg-orange-600'
                    : currentUnit === 2 ? 'bg-blue-800'
                        : currentUnit === 3 ? 'bg-purple-800'
                            : currentUnit === 4 ? 'bg-indigo-800'
                                : 'bg-green-800'}`, children: [_jsxs("h1", { className: "text-2xl font-semibold mb-1 text-white", children: ["Unit ", currentUnit, " \u00B7 ", unitNames[currentUnit - 1]] }), _jsxs("p", { className: "text-gray-300 text-sm italic", children: ["\"", unitTaglines[currentUnit - 1], "\""] })] }), _jsx("main", { className: "flex-1 p-4 md:p-6", ref: containerRef, onClick: () => {
                    setShowLessonTooltip(false);
                    setShowLockedTooltip(null);
                    setShowPracticeTooltip(null);
                }, children: _jsx("div", { className: "flex flex-col items-center relative", onClick: (e) => e.stopPropagation(), children: [1, 2, 3, 4, 5].map((unit) => (_jsxs("div", { className: "pt-8 pb-4 flex flex-col items-center space-y-8", "data-unit-section": true, children: [_jsxs("div", { className: "w-[600px] flex items-center justify-center my-2", children: [_jsx("div", { className: "w-[250px] h-[3px] bg-[#17475c]" }), _jsx("h2", { className: "px-8 text-xl font-extrabold text-[#17475c] whitespace-nowrap", children: unitNames[unit - 1] }), _jsx("div", { className: "w-[250px] h-[3px] bg-[#17475c]" })] }), levels
                                .filter(level => Math.ceil(level / 5) === unit)
                                .map((level) => {
                                // Calculate position within the unit (0-4)
                                const positionInUnit = (level - 1) % 5;
                                // Calculate the offset for each bubble to create a curve
                                // For odd units: curve right, for even units: curve left
                                const direction = unit % 2 === 1 ? 1 : -1;
                                const offset = Math.sin((positionInUnit / 4) * Math.PI) * 150 * direction;
                                return (_jsx("div", { className: `relative w-24 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:ring-4 active:shadow-none ${level % 5 === 1
                                        ? (unit === 1 ? 'bg-orange-600 border-orange-700 hover:ring-orange-600/50'
                                            : unit === 2 ? 'bg-blue-800 border-blue-900 hover:ring-blue-800/50'
                                                : unit === 3 ? 'bg-purple-800 border-purple-900 hover:ring-purple-800/50'
                                                    : unit === 4 ? 'bg-indigo-800 border-indigo-900 hover:ring-indigo-800/50'
                                                        : 'bg-green-800 border-green-900 hover:ring-green-800/50')
                                        : level === activeLevel
                                            ? (unit === 1 ? 'bg-orange-600 border-orange-700 hover:ring-orange-600/50'
                                                : unit === 2 ? 'bg-blue-800 border-blue-900 hover:ring-blue-800/50'
                                                    : unit === 3 ? 'bg-purple-800 border-purple-900 hover:ring-purple-800/50'
                                                        : unit === 4 ? 'bg-indigo-800 border-indigo-900 hover:ring-indigo-800/50'
                                                            : 'bg-green-800 border-green-900 hover:ring-green-800/50')
                                            : level < activeLevel
                                                ? (unit === 1 ? 'bg-orange-600 border-orange-700 hover:ring-orange-600/50'
                                                    : unit === 2 ? 'bg-blue-800 border-blue-900 hover:ring-blue-800/50'
                                                        : unit === 3 ? 'bg-purple-800 border-purple-900 hover:ring-purple-800/50'
                                                            : unit === 4 ? 'bg-indigo-800 border-indigo-900 hover:ring-indigo-800/50'
                                                                : 'bg-green-800 border-green-900 hover:ring-green-800/50')
                                                : 'bg-gray-500 border-gray-700 hover:ring-gray-500/50'} border-b-4 ${!showLessonTooltip && !showLockedTooltip && !showPracticeTooltip ? 'active:translate-y-1 active:border-b-0' : ''} ${activeLevel === level ? 'after:content-[""] after:absolute after:inset-[-10px_-10px_-14px_-10px] after:rounded-full after:border-4 after:border-white/30' : ''}`, style: { marginLeft: `${offset}px` }, onClick: () => {
                                        if (level === activeLevel) {
                                            setShowLessonTooltip(!showLessonTooltip);
                                            setShowLockedTooltip(null);
                                            setShowPracticeTooltip(null);
                                            setShowSkipTooltip(null);
                                        }
                                        else if (level > activeLevel) {
                                            if (level % 5 === 1) {
                                                setShowSkipTooltip(showSkipTooltip === level ? null : level);
                                                setShowLockedTooltip(null);
                                            }
                                            else {
                                                setShowLockedTooltip(showLockedTooltip === level ? null : level);
                                                setShowSkipTooltip(null);
                                            }
                                            setShowLessonTooltip(false);
                                            setShowPracticeTooltip(null);
                                        }
                                        else {
                                            setShowPracticeTooltip(showPracticeTooltip === level ? null : level);
                                            setShowLessonTooltip(false);
                                            setShowLockedTooltip(null);
                                            setShowSkipTooltip(null);
                                        }
                                    }, "data-bubble": true, children: _jsxs("div", { className: "relative flex flex-col items-center", children: [level % 5 === 3 && (_jsx("div", { className: `absolute ${unit % 2 === 1 ? '-left-96' : '-right-96'} top-1/2 -translate-y-1/2 w-72 h-72 pointer-events-none`, children: _jsx("img", { src: `/assets/${unit === 1 ? 'chef' : unit === 2 ? 'boxer' : unit === 3 ? 'driver' : unit === 4 ? 'bodyguard' : 'wizard'}.png`, alt: `Unit ${unit} character`, className: "w-full h-full object-contain", style: { zIndex: 20 } }) })), activeLevel === level && !showLessonTooltip && (_jsx("div", { className: "animate-bounce-slow mb-1 z-[30] absolute -top-12", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "bg-black px-4 py-2 rounded-lg text-sm border-2 border-gray-500", children: _jsx("span", { className: `font-bold tracking-wider ${unit === 1 ? 'text-orange-500'
                                                                    : unit === 2 ? 'text-blue-400'
                                                                        : unit === 3 ? 'text-purple-400'
                                                                            : unit === 4 ? 'text-indigo-400'
                                                                                : 'text-green-400'}`, children: "START" }) }), _jsx("div", { className: "w-2.5 h-2.5 bg-black transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-500" })] }) })), activeLevel === level && showLessonTooltip && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute -inset-4 z-[30] bg-transparent", onClick: () => setShowLessonTooltip(false) }), _jsx("div", { className: "mb-1 z-[31] absolute bottom-full mb-2 pointer-events-auto", onClick: (e) => e.stopPropagation(), "data-tooltip-content": true, children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: `px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] ${unit === 1 ? 'bg-orange-600'
                                                                        : unit === 2 ? 'bg-blue-800'
                                                                            : unit === 3 ? 'bg-purple-800'
                                                                                : unit === 4 ? 'bg-indigo-800'
                                                                                    : 'bg-green-800'}`, children: [_jsx("p", { className: "text-white font-semibold text-base", children: lessonNames[unit - 1][(level - 1) % 5] }), _jsxs("p", { className: "text-white/80 text-xs mt-1.5", children: ["Lesson ", (level - 1) % 5 + 1, " of 5"] }), _jsx("button", { onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                handleStartLesson(unit, level);
                                                                            }, className: "w-full mt-2 bg-white text-gray-800 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 text-sm font-medium shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none", children: "START" })] }), _jsx("div", { className: `w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2 border-gray-600 ${unit === 1 ? 'bg-orange-600'
                                                                        : unit === 2 ? 'bg-blue-800'
                                                                            : unit === 3 ? 'bg-purple-800'
                                                                                : unit === 4 ? 'bg-indigo-800'
                                                                                    : 'bg-green-800'}` })] }) })] })), showLockedTooltip === level && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute -inset-4 z-[30] bg-transparent", onClick: () => setShowLockedTooltip(null) }), _jsx("div", { className: "mb-1 z-[31] absolute bottom-full mb-2 pointer-events-auto", onClick: (e) => e.stopPropagation(), "data-tooltip-content": true, children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] bg-gray-800", children: [_jsx("p", { className: "text-gray-300 font-semibold text-base", children: lessonNames[unit - 1][(level - 1) % 5] }), _jsx("p", { className: "text-gray-400 text-xs mt-1.5", children: "Complete all levels above to unlock this!" }), _jsx("div", { className: "w-full mt-2 bg-gray-700 text-gray-400 py-1.5 px-3 rounded-lg text-center border-b-2 border-gray-600 text-sm font-medium", children: "LOCKED" })] }), _jsx("div", { className: "w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2 border-gray-600 bg-gray-800" })] }) })] })), showPracticeTooltip === level && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute -inset-4 z-[30] bg-transparent", onClick: () => setShowPracticeTooltip(null) }), _jsx("div", { className: "mb-1 z-[31] absolute bottom-full mb-2 pointer-events-auto", onClick: (e) => e.stopPropagation(), "data-tooltip-content": true, children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: `px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] ${unit === 1 ? 'bg-orange-600'
                                                                        : unit === 2 ? 'bg-blue-800'
                                                                            : unit === 3 ? 'bg-purple-800'
                                                                                : unit === 4 ? 'bg-indigo-800'
                                                                                    : 'bg-green-800'}`, children: [_jsx("p", { className: "text-white font-semibold text-base", children: lessonNames[unit - 1][(level - 1) % 5] }), _jsxs("p", { className: "text-white/80 text-xs mt-1.5", children: ["Lesson ", (level - 1) % 5 + 1, " of 5"] }), _jsx("button", { onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                handleStartLesson(unit, level);
                                                                            }, className: "w-full mt-2 bg-white text-gray-800 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 text-sm font-medium shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none", children: "PRACTICE" })] }), _jsx("div", { className: `w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2 border-gray-600 ${unit === 1 ? 'bg-orange-600'
                                                                        : unit === 2 ? 'bg-blue-800'
                                                                            : unit === 3 ? 'bg-purple-800'
                                                                                : unit === 4 ? 'bg-indigo-800'
                                                                                    : 'bg-green-800'}` })] }) })] })), level % 5 === 1 && level !== activeLevel && level > activeLevel && (_jsx("div", { className: "animate-bounce-slow mb-1 z-[30] absolute -top-12", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "bg-black px-4 py-2 rounded-lg text-sm whitespace-nowrap border-2 border-gray-500", children: _jsx("span", { className: `font-bold tracking-wider ${unit === 1 ? 'text-orange-500'
                                                                    : unit === 2 ? 'text-blue-400'
                                                                        : unit === 3 ? 'text-purple-400'
                                                                            : unit === 4 ? 'text-indigo-400'
                                                                                : 'text-green-400'}`, children: "SKIP HERE?" }) }), _jsx("div", { className: "w-2.5 h-2.5 bg-black transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-500" })] }) })), showSkipTooltip === level && (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute -inset-4 z-[30] bg-transparent", onClick: () => setShowSkipTooltip(null) }), _jsx("div", { className: "mb-1 z-[31] absolute bottom-full mb-2 pointer-events-auto", onClick: (e) => e.stopPropagation(), "data-tooltip-content": true, children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: `px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] ${unit === 1 ? 'bg-orange-600'
                                                                        : unit === 2 ? 'bg-blue-800'
                                                                            : unit === 3 ? 'bg-purple-800'
                                                                                : unit === 4 ? 'bg-indigo-800'
                                                                                    : 'bg-green-800'}`, children: [_jsx("p", { className: "text-white font-semibold text-base", children: lessonNames[unit - 1][(level - 1) % 5] }), _jsxs("p", { className: "text-white/80 text-xs mt-1.5", children: ["Lesson ", (level - 1) % 5 + 1, " of 5"] }), _jsx("button", { onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                setShowSkipConfirmation({ unit, level });
                                                                                setShowSkipTooltip(null);
                                                                            }, className: "w-full mt-2 bg-white text-gray-800 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 text-sm font-medium shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none", children: "SKIP" })] }), _jsx("div", { className: `w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2 border-gray-600 ${unit === 1 ? 'bg-orange-600'
                                                                        : unit === 2 ? 'bg-blue-800'
                                                                            : unit === 3 ? 'bg-purple-800'
                                                                                : unit === 4 ? 'bg-indigo-800'
                                                                                    : 'bg-green-800'}` })] }) })] })), _jsx("span", { className: "text-base font-medium text-white", children: level < activeLevel ? '✓' : `Level ${level}` })] }) }, level));
                            })] }, unit))) }) }), showSkipConfirmation && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]", "data-modal": true, children: _jsxs("div", { className: "bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4", children: [_jsxs("h3", { className: "text-xl font-bold text-white mb-4", children: ["Skip to Level ", showSkipConfirmation.level, "?"] }), _jsx("p", { className: "text-gray-300 mb-6", children: "This will mark all previous levels as completed. You can still practice them later, but your progress will start from this level." }), _jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: handleSkipCancel, className: "flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-150 text-center border-b-4 border-gray-800 active:translate-y-1 active:border-b-0 font-medium shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none", children: "NEVERMIND" }), _jsx("button", { onClick: handleSkipConfirm, className: "flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-150 text-center border-b-4 border-red-800 active:translate-y-1 active:border-b-0 font-medium shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none", children: "CONFIRM" })] })] }) }))] }));
};
export default Dashboard;
