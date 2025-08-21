import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { startInterviewSession } from '../store/slice/interviewSlice';

const InterviewStart = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentSession, loading, error } = useSelector((state) => state.interview);
  
  const [interviewData, setInterviewData] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Load interview session details
  useEffect(() => {
    const fetchInterviewSession = async () => {
      try {
        const response = await fetch(`/api/interview-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInterviewData(data.data);
        } else {
          console.error('Failed to fetch interview session');
        }
      } catch (error) {
        console.error('Error fetching interview session:', error);
      }
    };

    if (sessionId) {
      fetchInterviewSession();
    }
  }, [sessionId]);

  // Handle starting the interview
  const handleStartInterview = async () => {
    setIsStarting(true);
    try {
      const result = await dispatch(startInterviewSession(sessionId)).unwrap();
      
      if (result) {
        // Navigate to the interview questions page
        navigate(`/interview/${sessionId}/question/0`, { 
          state: { 
            interviewSession: interviewData,
            resultId: result._id 
          } 
        });
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
    } finally {
      setIsStarting(false);
    }
  };

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading interview session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-2xl">
        <div className="text-center">
          {/* Header */}
          <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">📋</span>
          </div>
          
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {interviewData.title}
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            {interviewData.description || 'Technical interview session'}
          </p>

          {/* Session Details */}
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-700/30">
            <h2 className="text-xl font-bold text-white mb-4">Session Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-purple-400">👤</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Interviewer</p>
                  <p className="text-white font-medium">
                    {interviewData.createdBy?.fullName || 'Admin'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-blue-400">📊</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expertise</p>
                  <p className="text-white font-medium">{interviewData.expertise}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-green-400">❓</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Questions</p>
                  <p className="text-white font-medium">
                    {interviewData.questions?.length || 0} questions
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-yellow-400">⏱️</span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Estimated Time</p>
                  <p className="text-white font-medium">
                    {Math.round((interviewData.questions?.length || 0) * 3)} minutes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-700/30">
            <h2 className="text-xl font-bold text-white mb-4">Instructions</h2>
            <ul className="text-left space-y-3 text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="text-green-400 mt-1">•</span>
                <span>Answer all questions to the best of your ability</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-400 mt-1">•</span>
                <span>You cannot go back to previous questions once answered</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-400 mt-1">•</span>
                <span>Your answers will be evaluated by our AI system</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-400 mt-1">•</span>
                <span>Take your time - quality matters more than speed</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 mb-6">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartInterview}
            disabled={isStarting || loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-purple-500/25"
          >
            {isStarting || loading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Starting Interview...</span>
              </div>
            ) : (
              'Start Interview Now'
            )}
          </button>

          {/* Additional Info */}
          <p className="text-gray-400 text-sm mt-6">
            By starting this interview, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewStart;