import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLevels } from '../api/levels';

interface MobileDashboardProps {
  hearts: number;
  streak: number;
  activeLevel: number;
  setActiveLevel: (level: number) => void;
  currentUnit: number;
  setCurrentUnit: (unit: number) => void;
}

const unitNames = [
  "Food & Drink",
  "Sports & Fitness",
  "Travel & Transportation",
  "Business & Work",
  "Health & Medicine"
];

const unitTaglines = [
  "Master the language of cuisine and refreshments",
  "Get active with sports and fitness vocabulary",
  "Navigate the world with confidence",
  "Excel in professional settings",
  "Take care of your health and well-being"
];

const lessonNames = [
  ["Basic Food Items", "Restaurant Phrases", "Cooking Terms", "Beverages", "Food Adjectives"],
  ["Sports Equipment", "Exercise Terms", "Team Sports", "Fitness Goals", "Sports Actions"],
  ["Transportation Modes", "Travel Planning", "Directions", "Accommodations", "Travel Experiences"],
  ["Office Terms", "Business Meetings", "Professional Skills", "Career Development", "Workplace Communication"],
  ["Body Parts", "Medical Terms", "Health Conditions", "Medical Procedures", "Wellness Practices"]
];

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  hearts,
  streak,
  activeLevel,
  setActiveLevel,
  currentUnit,
  setCurrentUnit
}) => {
  const navigate = useNavigate();
  const { data: levels = [] } = useQuery({
    queryKey: ['levels'],
    queryFn: getLevels
  });

  const handleStartLesson = (unit: number, level: number) => {
    navigate(`/lesson/${level}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-full bg-[#f3e0b7]">
      {/* Header Section */}
      <header className={`text-center rounded-xl p-3 shadow-lg sticky top-16 z-[40] backdrop-blur-sm bg-opacity-80 mx-3 ${
        currentUnit === 1 ? 'bg-orange-600' 
        : currentUnit === 2 ? 'bg-blue-800'
        : currentUnit === 3 ? 'bg-purple-800'
        : currentUnit === 4 ? 'bg-indigo-800'
        : 'bg-green-800'
      }`}>
        <h1 className="text-lg font-semibold mb-0.5 text-white">Unit {currentUnit} · {unitNames[currentUnit - 1]}</h1>
        <p className="text-gray-300 text-[10px] italic">"{unitTaglines[currentUnit - 1]}"</p>
      </header>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto pb-16 overscroll-contain hide-scrollbar touch-pan-y">
        {/* Level Bubbles */}
        <div className="flex flex-col items-center relative px-3" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((unit) => (
            <div key={unit} className="pt-4 pb-3 flex flex-col items-center space-y-4" data-unit-section>
              {/* Unit Header */}
              <div className="w-full flex items-center justify-center my-1">
                <div className="w-[80px] h-[1px] bg-[#17475c]"></div>
                <h2 className="px-3 text-base font-bold text-[#17475c] whitespace-nowrap">
                  {unitNames[unit - 1]}
                </h2>
                <div className="w-[80px] h-[1px] bg-[#17475c]"></div>
              </div>

              {/* Level Bubbles */}
              {levels
                .filter(level => Math.ceil(level / 5) === unit)
                .map((level) => {
                  const positionInUnit = (level - 1) % 5;
                  const direction = unit % 2 === 1 ? 1 : -1;
                  const offset = Math.sin((positionInUnit / 4) * Math.PI) * 60 * direction;
                  
                  return (
                    <div
                      key={level}
                      className={`relative w-16 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_8px_rgba(0,0,0,0.2)] hover:ring-2 active:shadow-none ${
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
                      } border-b-3 active:translate-y-0.5 active:border-b-0 ${
                        activeLevel === level ? 'after:content-[""] after:absolute after:inset-[-6px_-6px_-8px_-6px] after:rounded-full after:border-2 after:border-white/30' : ''
                      }`}
                      style={{ marginLeft: `${offset}px` }}
                      onClick={() => {
                        if (level === activeLevel) {
                          handleStartLesson(unit, level);
                        } else if (level < activeLevel) {
                          handleStartLesson(unit, level);
                        }
                      }}
                      data-bubble
                    >
                      <span className="text-xs font-medium text-white">
                        {level < activeLevel ? '✓' : `Level ${level}`}
                      </span>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 