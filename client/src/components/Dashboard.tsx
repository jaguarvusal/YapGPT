import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_YAPPERS, QUERY_ME } from '../utils/queries';
import { UPDATE_PROGRESS } from '../utils/mutations';
import Auth from '../utils/auth';
import { useStreak } from '../contexts/StreakContext';
import { useHearts } from '../contexts/HeartsContext';
import { createPortal } from 'react-dom';
import MobileTopBar from './MobileTopBar';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Generate array of 25 levels (5 levels per unit)
  const levels = Array.from({ length: 25 }, (_, i) => i + 1);
  const [currentUnit, setCurrentUnit] = useState(1);
  const [activeLevel, setActiveLevel] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLessonTooltip, setShowLessonTooltip] = useState(false);
  const [showLockedTooltip, setShowLockedTooltip] = useState<number | null>(null);
  const [showPracticeTooltip, setShowPracticeTooltip] = useState<number | null>(null);
  const [showSkipTooltip, setShowSkipTooltip] = useState<number | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState<{unit: number, level: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Query for logged in user's data
  const { data: userData } = useQuery(QUERY_ME);
  
  // Add mutation hook
  const [updateProgressMutation] = useMutation(UPDATE_PROGRESS);

  // Streak context
  const { streak } = useStreak();
  const { hearts } = useHearts();

  // Add portal root ref
  const portalRoot = useRef<HTMLElement | null>(null);

  // Sync with localStorage and database on mount
  useEffect(() => {
    if (userData?.me) {
      // If user is logged in, use database progress
      const dbActiveLevel = userData.me.activeLevel;
      const dbCompletedLevels = userData.me.completedLevels;
      
      console.log('Syncing with database progress:', {
        activeLevel: dbActiveLevel,
        completedLevels: dbCompletedLevels
      });
      
      // Update localStorage with database progress
      localStorage.setItem('activeLevel', dbActiveLevel.toString());
      localStorage.setItem('completedLevels', JSON.stringify(dbCompletedLevels));
      
      // Update state with database progress
      setActiveLevel(dbActiveLevel);
      setCurrentUnit(Math.ceil(dbActiveLevel / 5));
    } else {
      // If not logged in, use localStorage progress
      const savedLevel = localStorage.getItem('activeLevel');
      if (savedLevel) {
        const level = parseInt(savedLevel, 10);
        setActiveLevel(level);
        const unit = Math.ceil(level / 5);
        setCurrentUnit(unit);
      }
    }

    // Set initial scroll position to the current unit
    const scrollContainer = document.getElementById('scroll-container');
    const rightSidebar = document.getElementById('right-sidebar-scroll');
    if (!scrollContainer || !rightSidebar) return;

    const unitSections = scrollContainer.querySelectorAll('[data-unit-section]');
    const targetSection = unitSections[currentUnit - 1];
    if (targetSection) {
      const rect = targetSection.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      // Add extra padding for all units to prevent header overlap
      const extraPadding = isMobile ? 150 : 100;
      scrollContainer.scrollTop = rect.top - containerRect.top + scrollContainer.scrollTop - extraPadding;
      rightSidebar.scrollTop = rect.top - containerRect.top + scrollContainer.scrollTop - extraPadding;
    }
    
    setIsInitialized(true);
  }, [userData, currentUnit, isMobile]);

  // Handle scroll events only after initialization
  useEffect(() => {
    if (!isInitialized) return;

    const handleScroll = () => {
      const scrollContainer = document.getElementById('scroll-container');
      if (!scrollContainer) return;
      
      const unitSections = scrollContainer.querySelectorAll('[data-unit-section]');
      let newUnit = 1;
      
      unitSections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= scrollContainer.getBoundingClientRect().top + (isMobile ? 150 : 100)) {
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
  }, [currentUnit, isInitialized, isMobile]);

  // Add wheel event listener to handle scrolling regardless of mouse position
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const scrollContainer = document.getElementById('scroll-container');
      const rightSidebar = document.getElementById('right-sidebar-scroll');
      if (!scrollContainer || !rightSidebar) return;

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
    if (!isInitialized) return;
    setCurrentUnit(Math.ceil(activeLevel / 5));
  }, [isInitialized, activeLevel]);

  useEffect(() => {
    const handleLevelCompleted = (event: CustomEvent) => {
      const { nextLevel } = event.detail;
      setActiveLevel(nextLevel);
    };

    window.addEventListener('levelCompleted', handleLevelCompleted as EventListener);
    return () => {
      window.removeEventListener('levelCompleted', handleLevelCompleted as EventListener);
    };
  }, []);

  // Save active level to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeLevel', activeLevel.toString());
  }, [activeLevel]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
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
    const handleKeyboardScroll = (event: KeyboardEvent) => {
      const scrollContainer = document.getElementById('scroll-container');
      if (!scrollContainer) return;

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
      if (!scrollContainer || !rightSidebar) return;

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Create portal root if it doesn't exist
    if (!document.getElementById('modal-portal')) {
      const div = document.createElement('div');
      div.id = 'modal-portal';
      document.body.appendChild(div);
    }
    portalRoot.current = document.getElementById('modal-portal');

    return () => {
      // Cleanup portal root on unmount
      if (portalRoot.current && portalRoot.current.parentNode) {
        portalRoot.current.parentNode.removeChild(portalRoot.current);
      }
    };
  }, []);

  const handleStartLesson = (unit: number, level: number) => {
    try {
      // Validate unit and level
      if (unit < 1 || unit > 5 || level < 1 || level > 5) {
        console.error('Invalid unit or level:', { unit, level });
        return;
      }

      // Close any open tooltips
      setShowLessonTooltip(false);
      setShowLockedTooltip(null);
      setShowPracticeTooltip(null);
      
      // Navigate to the lesson page with string parameters
      const path = `/unit/${unit.toString()}/lesson/${level.toString()}`;
      console.log('Navigating to:', path);
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Add skip confirmation handler
  const handleSkipConfirm = async (unit: number, level: number) => {
    if (!showSkipConfirmation) return;
    
    console.log('Starting skip process:', { unit, level });
    
    // If user is logged in, sync with database first
    if (Auth.loggedIn()) {
      console.log('User is logged in, preparing database update');
      try {
        // Get current completed levels from localStorage
        const currentCompletedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[]');
        console.log('Current completed levels:', currentCompletedLevels);
        
        // Only mark levels as completed up to the current level
        const newCompletedLevels = Array.from({ length: level - 1 }, (_, i) => i + 1);
        console.log('New completed levels:', newCompletedLevels);
        
        console.log('Calling updateProgress mutation with:', {
          activeLevel: level,
          completedLevels: newCompletedLevels
        });
        
        // Update progress in database using the mutation hook
        const { data, errors } = await updateProgressMutation({
          variables: {
            activeLevel: level,
            completedLevels: newCompletedLevels
          }
        });
        
        if (errors) {
          console.error('GraphQL errors:', errors);
          throw new Error(errors[0].message);
        }
        
        if (data?.updateProgress) {
          console.log('Successfully saved progress to server:', {
            activeLevel: data.updateProgress.activeLevel,
            completedLevels: data.updateProgress.completedLevels
          });
          
          // Update localStorage with confirmed server values
          localStorage.setItem('activeLevel', data.updateProgress.activeLevel.toString());
          localStorage.setItem('completedLevels', JSON.stringify(data.updateProgress.completedLevels));
          setActiveLevel(data.updateProgress.activeLevel);
        } else {
          console.error('Server returned no data after updateProgress mutation');
          throw new Error('No data returned from server');
        }
      } catch (error) {
        console.error('Error updating progress:', error);
        // If there's an error, still update local state but show error message
        alert('There was an error saving your progress. Please try again later.');
      }
    } else {
      console.log('User not logged in, updating localStorage only');
      // If not logged in, just update localStorage
      const newCompletedLevels = Array.from({ length: level - 1 }, (_, i) => i + 1);
      
      localStorage.setItem('activeLevel', level.toString());
      localStorage.setItem('completedLevels', JSON.stringify(newCompletedLevels));
      setActiveLevel(level);
    }
    
    setShowSkipConfirmation(null);
    console.log('Navigating to:', `/unit/${unit}/lesson/${level}`);
    navigate(`/unit/${unit}/lesson/${level}`);
  };

  // Add skip cancel handler
  const handleSkipCancel = () => {
    console.log('Skip cancelled');
    setShowSkipConfirmation(null);
  };

  // Add effect to handle modal visibility
  useEffect(() => {
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContent = document.getElementById('modal-content');
    
    if (showSkipConfirmation) {
      if (modalBackdrop && modalContent) {
        modalBackdrop.style.display = 'block';
        modalContent.style.display = 'flex';
        modalContent.innerHTML = `
          <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 relative">
            <h3 class="text-xl font-bold text-white mb-4">Skip to Level ${showSkipConfirmation.level}?</h3>
            <p class="text-gray-300 mb-6">
              This will mark all previous levels as completed. You can still practice them later, but your progress will be saved.
            </p>
            <div className="flex gap-3">
              <button
                id="cancel-skip"
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-skip"
                class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        `;

        // Add event listeners
        const cancelButton = document.getElementById('cancel-skip');
        const confirmButton = document.getElementById('confirm-skip');

        if (cancelButton) {
          cancelButton.addEventListener('click', handleSkipCancel);
        }
        if (confirmButton) {
          confirmButton.addEventListener('click', () => handleSkipConfirm(showSkipConfirmation.unit, showSkipConfirmation.level));
        }
      }
    } else {
      if (modalBackdrop && modalContent) {
        modalBackdrop.style.display = 'none';
        modalContent.style.display = 'none';
        modalContent.innerHTML = '';
      }
    }

    return () => {
      if (modalBackdrop && modalContent) {
        modalBackdrop.style.display = 'none';
        modalContent.style.display = 'none';
        modalContent.innerHTML = '';
      }
    };
  }, [showSkipConfirmation]);

  return (
    <div className="flex-1 flex flex-col min-h-full bg-[#f3e0b7] overflow-x-hidden">
      {/* Header Section */}
      <header className={`text-center rounded-xl p-4 md:p-6 shadow-lg sticky top-12 md:top-4 z-[40] backdrop-blur-sm bg-opacity-80 mx-2 md:mx-4 mb-4 md:mb-8 mt-12 md:mt-0 ${
        currentUnit === 1 ? 'bg-orange-600' 
        : currentUnit === 2 ? 'bg-blue-800'
        : currentUnit === 3 ? 'bg-purple-800'
        : currentUnit === 4 ? 'bg-indigo-800'
        : 'bg-green-800'
      }`}>
        <h1 className="text-xl md:text-2xl font-semibold mb-1 text-white">Unit {currentUnit} · {unitNames[currentUnit - 1]}</h1>
        <p className="text-gray-300 text-sm italic">"{unitTaglines[currentUnit - 1]}"</p>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-x-hidden w-full px-0 max-w-[100vw] mt-12 md:mt-0" ref={containerRef} onClick={() => {
        setShowLessonTooltip(false);
        setShowLockedTooltip(null);
        setShowPracticeTooltip(null);
      }}>
        {/* Level Bubbles */}
        <div className={`flex flex-col items-center relative w-full max-w-[100vw] mx-auto ${isMobile ? 'px-2' : ''}`} onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((unit) => (
            <div key={unit} className="w-full pt-8 md:pt-8 pb-0.5 md:pb-4 flex flex-col items-center space-y-1 md:space-y-8" data-unit-section>
              {/* Unit Header with Decorative Lines */}
              <div className="w-full max-w-[140px] md:max-w-[600px] flex items-center justify-center my-0.5 md:my-2">
                <div className="w-[15%] md:w-[30%] h-[1px] md:h-[3px] bg-[#17475c]"></div>
                <h2 className="px-1 md:px-8 text-xs md:text-xl font-extrabold text-[#17475c] whitespace-nowrap">
                  {unitNames[unit - 1]}
                </h2>
                <div className="w-[15%] md:w-[30%] h-[1px] md:h-[3px] bg-[#17475c]"></div>
              </div>
              {isMobile ? (
                // Mobile-specific layout
                <div className="flex flex-col items-center space-y-1 w-full">
                  {levels
                    .filter(level => Math.ceil(level / 5) === unit)
                    .map((level) => {
                      const positionInUnit = (level - 1) % 5;
                      const direction = unit % 2 === 1 ? 1 : -1;
                      const offset = Math.sin((positionInUnit / 4) * Math.PI) * 15 * direction;
                      
                      return (
                        <div
                          key={level}
                          className={`relative w-12 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_0_4px_rgba(0,0,0,0.2)] hover:shadow-[0_0_2px_rgba(0,0,0,0.1)] hover:ring-1 active:shadow-none 
                        ${level <= activeLevel 
                          ? (unit === 1 ? 'bg-orange-600 border-orange-700 hover:ring-orange-600/50'
                            : unit === 2 ? 'bg-blue-800 border-blue-900 hover:ring-blue-800/50'
                            : unit === 3 ? 'bg-purple-800 border-purple-900 hover:ring-purple-800/50'
                            : unit === 4 ? 'bg-indigo-800 border-indigo-900 hover:ring-indigo-800/50'
                            : 'bg-green-800 border-green-900 hover:ring-green-800/50')
                          : 'bg-gray-500 border-gray-700 hover:ring-gray-500/50'} border-b-2 ${!showLessonTooltip && !showLockedTooltip && !showPracticeTooltip ? 'active:translate-y-1 active:border-b-0' : ''} ${activeLevel === level ? 'after:content-[""] after:absolute after:inset-[-6px_-6px_-8px_-6px] after:rounded-full after:border-2 after:border-white/30' : ''}`}
                        style={{ marginLeft: `${offset}px` }}
                        onClick={() => {
                          if (level === activeLevel) {
                            setShowLessonTooltip(!showLessonTooltip);
                            setShowLockedTooltip(null);
                            setShowPracticeTooltip(null);
                            setShowSkipTooltip(null);
                          } else if (level > activeLevel) {
                            if (level % 5 === 1) {
                              setShowSkipTooltip(showSkipTooltip === level ? null : level);
                              setShowLockedTooltip(null);
                            } else {
                              setShowLockedTooltip(showLockedTooltip === level ? null : level);
                              setShowSkipTooltip(null);
                            }
                            setShowLessonTooltip(false);
                            setShowPracticeTooltip(null);
                          } else {
                            setShowPracticeTooltip(showPracticeTooltip === level ? null : level);
                            setShowLessonTooltip(false);
                            setShowLockedTooltip(null);
                            setShowSkipTooltip(null);
                          }
                        }}
                        data-bubble
                      >
                        <div className="relative flex flex-col items-center">
                          {level % 5 === 3 && (
                            <div className="absolute -top-6 w-8 h-8 left-1/2 -translate-x-1/2 pointer-events-none">
                              <img 
                                src={`/assets/${unit === 1 ? 'chef' : unit === 2 ? 'boxer' : unit === 3 ? 'driver' : unit === 4 ? 'bodyguard' : 'wizard'}.png`}
                                alt={`Unit ${unit} character`}
                                className="w-full h-full object-contain"
                                style={{ zIndex: 20 }}
                              />
                            </div>
                          )}
                          <span className="text-[4px] font-medium text-white">
                            {level < activeLevel ? '✓' : `Level ${level}`}
                          </span>
                        </div>
                        {showSkipTooltip === level && (
                          <>
                            <div className="absolute -inset-4 z-[100] bg-transparent" onClick={() => setShowSkipTooltip(null)}></div>
                            <div className="mb-1 z-[101] absolute bottom-full mb-2 pointer-events-auto" onClick={(e) => e.stopPropagation()} data-tooltip-content>
                              <div className="relative">
                                <div className={`px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] ${
                                  unit === 1 ? 'bg-orange-600' 
                                  : unit === 2 ? 'bg-blue-800'
                                  : unit === 3 ? 'bg-purple-800'
                                  : unit === 4 ? 'bg-indigo-800'
                                  : 'bg-green-800'
                                }`}>
                                  <p className="text-white font-semibold text-base">{lessonNames[unit - 1][(level - 1) % 5]}</p>
                                  <p className="text-white/80 text-xs mt-1.5">Lesson {(level - 1) % 5 + 1} of 5</p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowSkipConfirmation({ unit, level });
                                      setShowSkipTooltip(null);
                                    }}
                                    className="w-full mt-2 bg-white text-gray-800 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 text-sm font-medium shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none"
                                  >
                                    SKIP
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Desktop layout remains the same
                levels
                  .filter(level => Math.ceil(level / 5) === unit)
                  .map((level) => {
                    const positionInUnit = (level - 1) % 5;
                    const direction = unit % 2 === 1 ? 1 : -1;
                    const offset = Math.sin((positionInUnit / 4) * Math.PI) * 50 * direction;
                    
                    return (
                      <div
                        key={level}
                        className={`relative w-24 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:ring-4 active:shadow-none 
                          ${level % 5 === 1
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
                                : 'bg-gray-500 border-gray-700 hover:ring-gray-500/50'
                          } border-b-4 ${!showLessonTooltip && !showLockedTooltip && !showPracticeTooltip ? 'active:translate-y-1 active:border-b-0' : ''} 
                          ${activeLevel === level ? 'after:content-[""] after:absolute after:inset-[-10px_-10px_-14px_-10px] after:rounded-full after:border-4 after:border-white/30' : ''}`}
                        style={{ marginLeft: `${offset}px` }}
                        onClick={() => {
                          if (level === activeLevel) {
                            setShowLessonTooltip(!showLessonTooltip);
                            setShowLockedTooltip(null);
                            setShowPracticeTooltip(null);
                            setShowSkipTooltip(null);
                          } else if (level > activeLevel) {
                            if (level % 5 === 1) {
                              setShowSkipTooltip(showSkipTooltip === level ? null : level);
                              setShowLockedTooltip(null);
                            } else {
                              setShowLockedTooltip(showLockedTooltip === level ? null : level);
                              setShowSkipTooltip(null);
                            }
                            setShowLessonTooltip(false);
                            setShowPracticeTooltip(null);
                          } else {
                            setShowPracticeTooltip(showPracticeTooltip === level ? null : level);
                            setShowLessonTooltip(false);
                            setShowLockedTooltip(null);
                            setShowSkipTooltip(null);
                          }
                        }}
                        data-bubble
                      >
                        <div className="relative flex flex-col items-center">
                          {level % 5 === 3 && (
                            <div className="absolute -top-2 w-[1.5rem] h-[1.5rem] left-1/2 -translate-x-1/2 pointer-events-none">
                              <img 
                                src={`/assets/${unit === 1 ? 'chef' : unit === 2 ? 'boxer' : unit === 3 ? 'driver' : unit === 4 ? 'bodyguard' : 'wizard'}.png`}
                                alt={`Unit ${unit} character`}
                                className="w-full h-full object-contain"
                                style={{ zIndex: 20 }}
                              />
                            </div>
                          )}
                          <span className="text-[4px] font-medium text-white">
                            {level < activeLevel ? '✓' : `Level ${level}`}
                          </span>
                        </div>
                        {showSkipTooltip === level && (
                          <>
                            <div className="absolute -inset-4 z-[100] bg-transparent" onClick={() => setShowSkipTooltip(null)}></div>
                            <div className="mb-1 z-[101] absolute bottom-full mb-2 pointer-events-auto" onClick={(e) => e.stopPropagation()} data-tooltip-content>
                              <div className="relative">
                                <div className={`px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] ${
                                  unit === 1 ? 'bg-orange-600' 
                                  : unit === 2 ? 'bg-blue-800'
                                  : unit === 3 ? 'bg-purple-800'
                                  : unit === 4 ? 'bg-indigo-800'
                                  : 'bg-green-800'
                                }`}>
                                  <p className="text-white font-semibold text-base">{lessonNames[unit - 1][(level - 1) % 5]}</p>
                                  <p className="text-white/80 text-xs mt-1.5">Lesson {(level - 1) % 5 + 1} of 5</p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowSkipConfirmation({ unit, level });
                                      setShowSkipTooltip(null);
                                    }}
                                    className="w-full mt-2 bg-white text-gray-800 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 text-sm font-medium shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none"
                                  >
                                    SKIP
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          ))}
        </div>
      </main>
      
      {showSkipConfirmation && portalRoot.current && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center" 
          style={{ 
            zIndex: 99999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'auto'
          }}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 relative"
            style={{ zIndex: 100000 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Skip to Level {showSkipConfirmation.level}?</h3>
            <p className="text-gray-300 mb-6">
              This will mark all previous levels as completed. You can still practice them later, but your progress will be saved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSkipCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSkipConfirm(showSkipConfirmation.unit, showSkipConfirmation.level)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;