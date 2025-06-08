import React from 'react';
import { FaHeart } from 'react-icons/fa';

interface SessionAnalysisProps {
  onFlirtAgain: () => void;
  isLoading?: boolean;
  analysisFeedback?: string;
}

const SessionAnalysis: React.FC<SessionAnalysisProps> = ({ 
  onFlirtAgain, 
  isLoading = false,
  analysisFeedback = 'No feedback available.'
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f3e0b7]">
        <div className="bg-[#17475c] rounded-lg p-8 w-96 shadow-xl">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-6">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-pink-500/30 rounded-full"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 border-4 border-pink-500 rounded-full animate-spin border-t-transparent"></div>
              {/* Inner ring */}
              <div className="absolute inset-4 border-4 border-pink-400/20 rounded-full"></div>
              {/* Center dot */}
              <div className="absolute inset-[30%] bg-pink-500 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Analyzing Conversation</h2>
            <p className="text-gray-300 text-center">We're analyzing your flirting skills...</p>
          </div>
        </div>
      </div>
    );
  }

  // Split the feedback into sections
  const sections = analysisFeedback.split('\n\n').reduce((acc: { [key: string]: string }, section: string) => {
    // Handle numbered sections (e.g., "1. Conversation Flow and Engagement:")
    const match = section.match(/^\d+\.\s*([^:]+):\s*(.*)/s);
    if (match) {
      const [, title, content] = match;
      acc[title.trim()] = content.trim();
    } else {
      // Handle regular sections
      const [title, ...content] = section.split('\n');
      acc[title] = content.join('\n');
    }
    return acc;
  }, {});

  // Map section titles to their display names and styles
  type SectionConfig = {
    [key: string]: {
      title: string;
      color: 'blue' | 'purple' | 'yellow' | 'green';
      number: string;
    };
  };

  const sectionConfig: SectionConfig = {
    'Conversation Flow and Engagement': {
      title: 'Conversation Flow',
      color: 'blue',
      number: '1'
    },
    'Response Quality and Appropriateness': {
      title: 'Response Quality',
      color: 'purple',
      number: '2'
    },
    'Areas for Improvement': {
      title: 'Areas for Improvement',
      color: 'yellow',
      number: '3'
    },
    'Positive Aspects to Maintain': {
      title: 'Key Strengths',
      color: 'green',
      number: '4'
    }
  };

  // Calculate rating based on analysis content
  const calculateRating = () => {
    let rating = 1; // Start from 1 heart instead of 3
    
    const strengths = sections['Positive Aspects to Maintain'] || '';
    const improvements = sections['Areas for Improvement'] || '';
    const flow = sections['Conversation Flow and Engagement'] || '';
    const quality = sections['Response Quality and Appropriateness'] || '';

    // Positive indicators
    if (strengths.toLowerCase().includes('excellent') || 
        strengths.toLowerCase().includes('outstanding') ||
        strengths.toLowerCase().includes('impressive')) {
      rating += 1;
    }
    if (flow.toLowerCase().includes('natural') || 
        flow.toLowerCase().includes('smooth') ||
        flow.toLowerCase().includes('engaging')) {
      rating += 1;
    }
    if (quality.toLowerCase().includes('appropriate') && 
        !quality.toLowerCase().includes('inappropriate')) {
      rating += 1;
    }
    if (strengths.toLowerCase().includes('great') || 
        strengths.toLowerCase().includes('strong') ||
        strengths.toLowerCase().includes('exceptional')) {
      rating += 1;
    }

    // Negative indicators
    if (improvements.toLowerCase().includes('significant') || 
        improvements.toLowerCase().includes('major') ||
        improvements.toLowerCase().includes('serious')) {
      rating -= 1;
    }
    if (flow.toLowerCase().includes('awkward') || 
        flow.toLowerCase().includes('forced') ||
        flow.toLowerCase().includes('unnatural')) {
      rating -= 1;
    }

    // Ensure rating is between 1 and 5
    return Math.max(1, Math.min(5, rating));
  };

  const rating = calculateRating();

  // Render a section with its specific styling
  const renderSection = (title: string, content: string) => {
    const config = sectionConfig[title];
    if (!config) return null;

    const colorClasses: { [key: string]: string } = {
      blue: 'bg-blue-500/20 border-blue-500/30',
      purple: 'bg-purple-500/20 border-purple-500/30',
      yellow: 'bg-yellow-500/20 border-yellow-500/30',
      green: 'bg-green-500/20 border-green-500/30'
    };

    // Remove the section title and number from the content
    const cleanContent = content.replace(/^\d+\.\s*[^:]+:\s*/i, '');

    return (
      <div key={title} className={`${colorClasses[config.color]} rounded-lg p-6 border`}>
        <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white text-white font-bold">
            {config.number}
          </span>
          {config.title}
        </h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-200 leading-relaxed whitespace-pre-line">
            {cleanContent}
          </p>
        </div>
      </div>
    );
  };

  // Get any additional content that's not part of the main sections
  const additionalContent = analysisFeedback.split('\n\n')
    .filter(section => !Object.keys(sectionConfig).some(title => section.includes(title)))
    .join('\n\n');

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3e0b7]">
      <div className="bg-[#17475c] rounded-lg p-8 w-[48rem] shadow-xl transform transition-all duration-500 hover:scale-105">
        <div className="text-center mb-8">
          <h2 className="text-white text-3xl font-bold mb-2">Session Complete!</h2>
          <p className="text-gray-300 mb-4">Here's your personalized feedback</p>
          
          {/* Heart Rating System */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <p className="text-white text-xl font-semibold mb-2">Flirt Rating</p>
            <div className="flex justify-center items-center gap-2">
              {[...Array(5)].map((_, index) => (
                <FaHeart
                  key={index}
                  className={`w-8 h-8 transition-all duration-300 ${
                    index < rating ? 'text-pink-500' : 'text-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6 mb-8">
          {/* Grid container for sections 1-4 */}
          <div className="grid grid-cols-2 gap-6">
            {/* First row: Sections 1 and 2 */}
            {Object.entries(sections)
              .filter(([title]) => 
                title === 'Conversation Flow and Engagement' || 
                title === 'Response Quality and Appropriateness'
              )
              .map(([title, content]) => renderSection(title, content))}
            
            {/* Second row: Sections 3 and 4 */}
            {Object.entries(sections)
              .filter(([title]) => 
                title === 'Areas for Improvement' || 
                title === 'Positive Aspects to Maintain'
              )
              .map(([title, content]) => renderSection(title, content))}
          </div>

          {/* Full width section for Final Thoughts */}
          {additionalContent && (
            <div className="bg-pink-500/20 rounded-lg p-6 border border-pink-500/30">
              <h3 className="text-white text-xl font-semibold mb-4">
                Final Thoughts
              </h3>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-200 leading-relaxed whitespace-pre-line">
                  {additionalContent
                    .replace(/^Final Thoughts:\s*/i, '')
                    .replace(/^Hello!.*\n/i, '')
                    .replace(/^Let's dive into.*\n/i, '')
                    .replace(/^I'd love to.*\n/i, '')
                    .replace(/^Here's my.*\n/i, '')
                    .replace(/^Let me share.*\n/i, '')
                    .trim()}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onFlirtAgain}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default SessionAnalysis; 