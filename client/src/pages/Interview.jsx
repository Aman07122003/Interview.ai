import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { interviewApi } from '../services/api/interviewApi';

const Interview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // State management
  const [interviewSession, setInterviewSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [resultId, setResultId] = useState(null);
  const [timeStarted, setTimeStarted] = useState(null);

  // Refs
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Load interview session data
  useEffect(() => {
    const loadInterviewSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/interview-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setInterviewSession(data.data);
        } else {
          console.error('Failed to load interview session');
        }
      } catch (error) {
        console.error('Error loading interview session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      loadInterviewSession();
    }
  }, [sessionId]);

  // Timer effect
  useEffect(() => {
    if (interviewStarted && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [interviewStarted, isPaused, timeRemaining]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate time taken for current question
  const getTimeTaken = () => {
    if (!timeStarted) return 0;
    return Math.floor((Date.now() - timeStarted) / 1000);
  };

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !resultId) return;

    setIsLoading(true);

    try {
      const currentQuestion = interviewSession.questions[currentQuestionIndex];
      const timeTaken = getTimeTaken();

      // Submit answer to backend
      const response = await interviewApi.saveAnswer(
        resultId, 
        currentQuestion._id, 
        userAnswer, 
        timeTaken
      );

      if (response.success) {
        // Show feedback (in real implementation, this would come from backend)
        const feedback = generateAIFeedback(userAnswer, currentQuestion.text);
        setAiFeedback(feedback);
        setShowFeedback(true);
      } else {
        console.error('Failed to submit answer:', response.message);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI feedback (simulated - will be replaced with actual backend evaluation)
  const generateAIFeedback = (answer, question) => {
    const feedbacks = [
      {
        score: Math.floor(Math.random() * 30) + 70,
        feedback: "Excellent answer! You demonstrated a strong understanding of the concept.",
        improvements: [
          "Consider adding more real-world examples",
          "You could mention edge cases"
        ],
        modelAnswer: "A comprehensive answer should include practical examples and edge cases."
      },
      {
        score: Math.floor(Math.random() * 30) + 60,
        feedback: "Good response with solid fundamentals.",
        improvements: [
          "Provide more specific examples",
          "Explain the reasoning behind your approach"
        ],
        modelAnswer: "The key is to not only explain what something is, but why it matters."
      }
    ];
    
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < interviewSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setAiFeedback(null);
      setTimeStarted(Date.now());
    } else {
      handleEndInterview();
    }
  };

  // Handle interview start
  const handleStartInterview = async () => {
    try {
      setIsLoading(true);
      const response = await interviewApi.startInterview(sessionId);
      
      if (response.success) {
        setInterviewStarted(true);
        setResultId(response.data.resultId);
        setTimeStarted(Date.now());
        setTimeRemaining(30 * 60);
      } else {
        console.error('Failed to start interview:', response.message);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interview end
  const handleEndInterview = async () => {
    if (interviewStarted && resultId) {
      try {
        setIsLoading(true);
        
        // Submit interview for evaluation
        const response = await interviewApi.finalizeInterview(resultId);
        
        if (response.success) {
          // Navigate to results page
          navigate(`/interview/results/${response.data.resultId}`);
        } else {
          console.error('Failed to submit interview:', response.message);
        }

      } catch (error) {
        console.error('Error ending interview:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!interviewSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading interview session...</div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gray-800/30 backdrop-blur-md rounded-3xl p-12 border border-gray-700/30 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <span className="text-3xl">🤖</span>
            </div>
            <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {interviewSession.title}
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              {interviewSession.description || 'Technical interview session'}
            </p>
            
            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-center space-x-3 text-gray-400">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Expertise:</strong> {interviewSession.expertise}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Questions:</strong> {interviewSession.questions.length}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Time Limit:</strong> 30 minutes</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span><strong>Interviewer:</strong> {interviewSession.createdBy?.fullName}</span>
              </div>
            </div>
            
            <button
              onClick={handleStartInterview}
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-purple-500/25"
            >
              {isLoading ? 'Starting...' : 'Start Interview Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = interviewSession.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/30 backdrop-blur-md border-b border-gray-700/30 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{interviewSession.title}</h1>
              <p className="text-gray-400 text-sm">{interviewSession.expertise}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2.5 rounded-xl border border-gray-600 hover:border-purple-500 transition-all duration-300 hover:bg-gray-700/50"
              title={isPaused ? "Resume Timer" : "Pause Timer"}
              disabled={isLoading}
            >
              <span className="text-lg">{isPaused ? "▶️" : "⏸️"}</span>
            </button>
            <button
              onClick={handleEndInterview}
              className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-300 text-red-300 hover:text-red-200"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'End Interview'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Left Panel - Question and Answer */}
        <div className="flex-1 lg:w-2/3 p-8 overflow-hidden">
          <div className="h-full flex flex-col space-y-8">
            {/* Question Display */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-xl text-sm font-medium border border-purple-500/30">
                  Question {currentQuestionIndex + 1}
                </span>
                <div className="text-right">
                  <span className="text-gray-400 text-sm font-medium">Progress</span>
                  <div className="text-2xl font-bold text-purple-400">
                    {currentQuestionIndex + 1} <span className="text-gray-400 text-lg">/ {interviewSession.questions.length}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white leading-relaxed">
                {currentQuestion.text}
              </h2>
            </div>

            {/* Answer Input */}
            {!showFeedback && (
              <div className="flex-1 flex flex-col">
                <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Your Answer</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`p-4 rounded-2xl transition-all duration-300 ${
                          isRecording 
                            ? 'bg-red-600/20 border-red-500/50 animate-pulse' 
                            : 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/50 hover:border-gray-500/50'
                        } border`}
                        disabled={isLoading}
                      >
                        <span className="text-xl">🎤</span>
                      </button>
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim() || isLoading}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Submitting...' : 'Submit Answer'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="flex-1 bg-gray-900/50 border border-gray-600/50 rounded-2xl p-6 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500/50 transition-all duration-300 text-lg"
                    disabled={isLoading}
                    rows={8}
                  />
                </div>
              </div>
            )}

            {/* AI Feedback */}
            {showFeedback && aiFeedback && (
              <div className="flex-1 flex flex-col space-y-8">
                <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                      <span className="text-xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">AI Feedback</h3>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-300 font-medium">Score</span>
                      <span className="text-3xl font-black text-purple-400">{aiFeedback.score}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-2xl h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-2xl transition-all duration-1000"
                        style={{ width: `${aiFeedback.score}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-gray-200 text-lg mb-8">{aiFeedback.feedback}</p>

                  <div className="mb-8">
                    <h4 className="font-bold text-white text-lg mb-4">Areas for Improvement:</h4>
                    <ul className="space-y-3">
                      {aiFeedback.improvements.map((improvement, index) => (
                        <li key={index} className="text-gray-300">
                          • {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-lg mb-4">Model Answer:</h4>
                    <p className="text-gray-200 bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50">
                      {aiFeedback.modelAnswer}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      setAiFeedback(null);
                    }}
                    className="px-8 py-4 border border-gray-600/50 hover:border-purple-500/50 rounded-2xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    Edit Answer
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold transition-all duration-300"
                    disabled={isLoading}
                  >
                    {currentQuestionIndex < interviewSession.questions.length - 1 ? "Next Question" : "Finish Interview"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Timer and Progress */}
        <div className="lg:w-1/3 p-8 bg-gray-800/20 backdrop-blur-md border-l border-gray-700/30">
          <div className="space-y-8">
            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Session Timer</h3>
              <div className="text-center">
                <div className="text-5xl font-black text-purple-400 mb-3 font-mono">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-gray-400">
                  {isPaused ? "Paused" : "Time Remaining"}
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Progress</h3>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-300">Questions Completed</span>
                  <span className="text-purple-400 font-bold">{currentQuestionIndex + 1}/{interviewSession.questions.length}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-2xl h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-2xl transition-all duration-500"
                    style={{ width: `${((currentQuestionIndex + 1) / interviewSession.questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Candidate Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Name:</span>
                  <span className="text-white">{user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Email:</span>
                  <span className="text-white">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-green-400">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;