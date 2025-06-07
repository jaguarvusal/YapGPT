import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_FLIRT_FEEDBACK } from '../graphql/queries';
import { END_SESSION } from '../graphql/mutations';
import FlirtSessionAnalysis from './FlirtSessionAnalysis';

const FlirtMode = () => {
  const [sessionId, setSessionId] = useState('');
  const [showFinalAnalysis, setShowFinalAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const [endSession] = useMutation(END_SESSION);

  const { data: feedbackData } = useQuery(GET_FLIRT_FEEDBACK, {
    variables: { sessionId: sessionId },
    skip: !sessionId,
  });

  useEffect(() => {
    if (feedbackData?.getFlirtFeedback) {
      console.log('Received feedback:', feedbackData.getFlirtFeedback);
      setAnalysis(feedbackData.getFlirtFeedback);
      setShowFinalAnalysis(true);
    }
  }, [feedbackData]);

  const handleEndSession = async () => {
    console.log('handleEndSession called');
    if (sessionId) {
      try {
        await endSession({
          variables: { sessionId },
        });
        console.log('Session ended successfully');
        // The feedback will be received through the query and trigger the useEffect
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Your existing chat UI components here */}
      
      {/* End Session Button */}
      <button
        onClick={handleEndSession}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        End Session
      </button>

      {/* Analysis Modal */}
      {showFinalAnalysis && analysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FlirtSessionAnalysis 
              analysis={analysis}
              onClose={() => setShowFinalAnalysis(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FlirtMode; 