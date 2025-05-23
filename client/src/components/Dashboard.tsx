import React, { useState, useEffect, useRef } from 'react';

const Dashboard: React.FC = () => {
  // Generate array of 10 levels
  const levels = Array.from({ length: 25 }, (_, i) => i + 1);
  const [currentUnit, setCurrentUnit] = useState(1);
  const [activeLevel, setActiveLevel] = useState(4);
  const [showLessonTooltip, setShowLessonTooltip] = useState(false);
  const [showLockedTooltip, setShowLockedTooltip] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is on a tooltip or its content
      const isTooltipClick = target.closest('[data-tooltip-content]');
      // Check if click is on a bubble
      const isBubbleClick = target.closest('[data-bubble]');
      
      if (!isTooltipClick && !isBubbleClick) {
        setShowLessonTooltip(false);
        setShowLockedTooltip(null);
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

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.getElementById('scroll-container');
      if (!scrollContainer) return;
      
      // Get all unit sections
      const unitSections = scrollContainer.querySelectorAll('[data-unit-section]');
      
      // Find which unit should be active based on visibility
      let newUnit = 1;
      unitSections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        // If the section's top is above the container's top, it's the current unit
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
  }, [currentUnit]);

  // Add wheel event listener to handle scrolling regardless of mouse position
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const scrollContainer = document.getElementById('scroll-container');
      const rightSidebar = document.getElementById('right-sidebar-scroll');
      if (!scrollContainer || !rightSidebar) return;

      // Reduce scroll speed by multiplying deltaY by 0.5
      const scrollAmount = event.deltaY * 0.5;
      
      // Scroll both containers
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

  return (
    <div className="flex-1 flex flex-col min-h-full">
      {/* Header Section */}
      <header className={`text-center rounded-xl p-6 shadow-lg sticky top-4 z-[2000] backdrop-blur-sm bg-opacity-80 mx-4 ${
        currentUnit === 1 ? 'bg-orange-600' 
        : currentUnit === 2 ? 'bg-blue-800'
        : currentUnit === 3 ? 'bg-purple-800'
        : currentUnit === 4 ? 'bg-indigo-800'
        : 'bg-green-800'
      }`}>
        <h1 className="text-2xl font-semibold mb-1 text-white">Section 1 · Unit {currentUnit}</h1>
        <p className="text-gray-300 text-sm">Filler Words</p>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 p-4 md:p-6" ref={containerRef} onClick={() => {
        setShowLessonTooltip(false);
        setShowLockedTooltip(null);
      }}>
        {/* Level Bubbles */}
        <div className="flex flex-col items-center relative" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((unit) => (
            <div key={unit} className="py-20 flex flex-col items-center space-y-8" data-unit-section>
              {levels
                .filter(level => Math.ceil(level / 5) === unit)
                .map((level) => {
                  // Calculate position within the unit (0-4)
                  const positionInUnit = (level - 1) % 5;
                  // Calculate the offset for each bubble to create a curve
                  // For odd units: curve right, for even units: curve left
                  const direction = unit % 2 === 1 ? 1 : -1;
                  const offset = Math.sin((positionInUnit / 4) * Math.PI) * 150 * direction;
                  
                  return (
                    <div
                      key={level}
                      className={`relative w-24 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:ring-4 active:shadow-none ${
                        level % 5 === 1
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
                      } border-b-4 ${!showLessonTooltip && !showLockedTooltip ? 'active:translate-y-1 active:border-b-0' : ''} ${
                        activeLevel === level ? 'after:content-[""] after:absolute after:inset-[-10px_-10px_-14px_-10px] after:rounded-full after:border-4 after:border-white/30' : ''
                      }`}
                      style={{ marginLeft: `${offset}px` }}
                      onClick={() => {
                        if (level === activeLevel) {
                          setShowLessonTooltip(!showLessonTooltip);
                          setShowLockedTooltip(null);
                        } else if (level > activeLevel) {
                          setShowLockedTooltip(showLockedTooltip === level ? null : level);
                          setShowLessonTooltip(false);
                        } else {
                          setActiveLevel(level);
                          setShowLessonTooltip(false);
                          setShowLockedTooltip(null);
                        }
                      }}
                      data-bubble
                    >
                      <div className="relative flex flex-col items-center">
                        {activeLevel === level && !showLessonTooltip && (
                          <div className="animate-bounce-slow mb-1 z-50 absolute -top-12">
                            <div className="relative">
                              <div className="bg-black text-white px-4 py-2 rounded-lg text-sm border-2 border-gray-500">
                                START
                              </div>
                              <div className="w-2.5 h-2.5 bg-black transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-500"></div>
                            </div>
                          </div>
                        )}
                        {activeLevel === level && showLessonTooltip && (
                          <>
                            <div className="absolute -inset-4 z-[1000] bg-transparent" onClick={() => setShowLessonTooltip(false)}></div>
                            <div className="mb-1 z-[1001] absolute bottom-full mb-2 pointer-events-auto" onClick={(e) => e.stopPropagation()} data-tooltip-content>
                              <div className="relative">
                                <div className={`px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] ${
                                  unit === 1 ? 'bg-orange-600' 
                                  : unit === 2 ? 'bg-blue-800'
                                  : unit === 3 ? 'bg-purple-800'
                                  : unit === 4 ? 'bg-indigo-800'
                                  : 'bg-green-800'
                                }`}>
                                  <p className="text-white font-semibold text-base">Filler Words</p>
                                  <p className="text-white/80 text-xs mt-1.5">Lesson {level % 5 || 5} of 5</p>
                                  <button className="w-full mt-2 bg-white text-gray-800 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-all duration-150 text-center border-b-4 border-gray-300 active:translate-y-1 active:border-b-0 text-sm font-medium shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none">
                                    START
                                  </button>
                                </div>
                                <div className={`w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2 border-gray-600 ${
                                  unit === 1 ? 'bg-orange-600' 
                                  : unit === 2 ? 'bg-blue-800'
                                  : unit === 3 ? 'bg-purple-800'
                                  : unit === 4 ? 'bg-indigo-800'
                                  : 'bg-green-800'
                                }`}></div>
                              </div>
                            </div>
                          </>
                        )}
                        {showLockedTooltip === level && (
                          <>
                            <div className="absolute -inset-4 z-[1000] bg-transparent" onClick={() => setShowLockedTooltip(null)}></div>
                            <div className="mb-1 z-[1001] absolute bottom-full mb-2 pointer-events-auto" onClick={(e) => e.stopPropagation()} data-tooltip-content>
                              <div className="relative">
                                <div className="px-4 py-3 rounded-lg text-sm border-2 border-gray-600 min-w-[220px] bg-gray-800">
                                  <p className="text-gray-300 font-semibold text-base">Filler Words</p>
                                  <p className="text-gray-400 text-xs mt-1.5">Complete all levels above to unlock this!</p>
                                  <div className="w-full mt-2 bg-gray-700 text-gray-400 py-1.5 px-3 rounded-lg text-center border-b-2 border-gray-600 text-sm font-medium">
                                    LOCKED
                                  </div>
                                </div>
                                <div className="w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2 border-gray-600 bg-gray-800"></div>
                              </div>
                            </div>
                          </>
                        )}
                        {level % 5 === 1 && level !== activeLevel && level > activeLevel && (
                          <div className="animate-bounce-slow mb-1 z-50 absolute -top-12">
                            <div className="relative">
                              <div className="bg-black text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap border-2 border-gray-500">
                                SKIP HERE?
                              </div>
                              <div className="w-2.5 h-2.5 bg-black transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-500"></div>
                            </div>
                          </div>
                        )}
                        <span className="text-base font-medium text-white">
                          {level < activeLevel ? '✓' : `Level ${level}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 