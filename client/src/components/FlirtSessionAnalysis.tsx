import React from 'react';

interface FlirtSessionAnalysisProps {
  analysis: string;
  onClose: () => void;
}

const FlirtSessionAnalysis: React.FC<FlirtSessionAnalysisProps> = ({ analysis, onClose }) => {
  console.log('FlirtSessionAnalysis received analysis:', analysis);

  // Define the sections we expect
  const sections = [
    {
      title: 'Conversation Flow and Engagement',
      emoji: '🎭',
      color: 'bg-blue-50',
      content: ''
    },
    {
      title: 'Response Quality and Appropriateness',
      emoji: '💫',
      color: 'bg-green-50',
      content: ''
    },
    {
      title: 'Areas for Improvement',
      emoji: '📝',
      color: 'bg-yellow-50',
      content: ''
    },
    {
      title: 'Positive Aspects to Maintain',
      emoji: '✨',
      color: 'bg-purple-50',
      content: ''
    }
  ];

  // Extract content for each section
  sections.forEach(section => {
    const regex = new RegExp(`${section.title}:\\s*([^\\n]+(?:\\n[^\\n]+)*?)(?=\\n\\n|$)`);
    const match = analysis.match(regex);
    if (match && match[1]) {
      section.content = match[1].trim();
    }
  });

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Flirt Session Analysis</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className={`${section.color} rounded-lg p-4 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
              {section.emoji} {section.title}
            </h3>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
              {section.content || 'No feedback available for this section.'}
            </p>
          </div>
        ))}
      </div>

      {/* Display any remaining content that doesn't fit into sections */}
      {analysis.split('\n\n').some(part => !sections.some(section => part.includes(section.title))) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Additional Feedback</h3>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">
            {analysis.split('\n\n')
              .filter(part => !sections.some(section => part.includes(section.title)))
              .join('\n\n')}
          </p>
        </div>
      )}
    </div>
  );
};

export default FlirtSessionAnalysis; 