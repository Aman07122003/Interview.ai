import React from 'react';
import { useNavigate } from 'react-router-dom';

const InterviewLanding = () => {
  const navigate = useNavigate();

  const handleStartInterview = () => {
    navigate('/interview/start');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-800/30 backdrop-blur-md rounded-3xl p-12 border border-gray-700/30 shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Interview Session
          </h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Get ready for your technical interview. You'll have <span className="text-purple-400 font-semibold">30 minutes</span> to answer <span className="text-purple-400 font-semibold">5 questions</span>.
          </p>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-gray-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>AI-powered feedback</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Voice & text input</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-400">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Real-time scoring</span>
            </div>
          </div>
          <button
            onClick={handleStartInterview}
            className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-purple-500/25"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewLanding;