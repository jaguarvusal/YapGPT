import React, { useState, useEffect, useRef } from 'react';

const Dashboard: React.FC = () => {
  // Generate array of 10 levels
  const levels = Array.from({ length: 25 }, (_, i) => i + 1);
  const [currentUnit, setCurrentUnit] = useState(1);
  const [activeLevel, setActiveLevel] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      // Get all unit sections
      const unitSections = container.querySelectorAll('[data-unit-section]');
      
      // Find which unit should be active based on visibility
      let newUnit = 1;
      unitSections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        // If the section's top is above the container's top, it's the current unit
        if (rect.top <= container.getBoundingClientRect().top + 100) {
          newUnit = index + 1;
        }
      });
      
      if (newUnit !== currentUnit && newUnit >= 1 && newUnit <= 5) {
        setCurrentUnit(newUnit);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentUnit]);

  return (
    <div className="flex-1 h-full flex flex-col">
      {/* Header Section */}
      <header className={`text-center rounded-xl p-6 shadow-lg sticky top-4 z-50 backdrop-blur-sm bg-opacity-80 mx-4 ${
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
      <main className="flex-1 p-4 md:p-6 overflow-y-auto hide-scrollbar" ref={containerRef}>
        {/* Level Bubbles */}
        <div className="flex flex-col items-center relative">
          {[1, 2, 3, 4, 5].map((unit) => (
            <div key={unit} className="py-12 flex flex-col items-center space-y-8" data-unit-section>
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
                      } border-b-4 active:translate-y-1 active:border-b-0 ${
                        activeLevel === level ? 'after:content-[""] after:absolute after:inset-[-10px_-10px_-14px_-10px] after:rounded-full after:border-4 after:border-white/30' : ''
                      }`}
                      style={{ marginLeft: `${offset}px` }}
                      onClick={() => setActiveLevel(level)}
                    >
                      <div className="relative flex flex-col items-center">
                        {activeLevel === level && (
                          <div className="animate-bounce mb-1">
                            <div className="relative">
                              <div className="bg-black text-white px-2 py-1 rounded-lg text-xs">
                                START
                              </div>
                              <div className="w-2 h-2 bg-black transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                            </div>
                          </div>
                        )}
                        {level % 5 === 1 && level !== activeLevel && level > activeLevel && (
                          <div className="animate-bounce mb-1">
                            <div className="relative">
                              <div className="bg-black text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap">
                                JUMP HERE?
                              </div>
                              <div className="w-2 h-2 bg-black transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
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