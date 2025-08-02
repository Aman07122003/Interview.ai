import React, { useState, useEffect, useRef } from 'react';
import { startInterview } from '../services/api/interview';

const Interview = () => {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Mock interview questions
  const questions = [
    {
      id: 1,
      question: "Explain the difference between var, let, and const in JavaScript. When would you use each?",
      category: "JavaScript",
      difficulty: "Medium",
      timeLimit: 180
    },
    {
      id: 2,
      question: "Implement a function to reverse a string without using the built-in reverse() method.",
      category: "Algorithms",
      difficulty: "Easy",
      timeLimit: 120
    },
    {
      id: 3,
      question: "What is the difference between synchronous and asynchronous programming? Provide examples.",
      category: "Programming Concepts",
      difficulty: "Medium",
      timeLimit: 150
    },
    {
      id: 4,
      question: "Explain the concept of closures in JavaScript with a practical example.",
      category: "JavaScript",
      difficulty: "Hard",
      timeLimit: 200
    },
    {
      id: 5,
      question: "How would you optimize the performance of a React application?",
      category: "React",
      difficulty: "Medium",
      timeLimit: 180
    }
  ];

  // Mock AI feedback generator
  const generateFeedback = (answer, question) => {
    const feedbacks = [
      {
        score: 85,
        feedback: "Excellent answer! You demonstrated a strong understanding of the concept. Your explanation was clear and well-structured.",
        improvements: [
          "Consider adding more real-world examples",
          "You could mention edge cases",
          "Try to be more specific about implementation details"
        ],
        modelAnswer: "A comprehensive answer should include practical examples, edge cases, and implementation considerations. Your response covered the basics well but could be enhanced with more depth."
      },
      {
        score: 72,
        feedback: "Good response with solid fundamentals. You showed understanding of the core concepts.",
        improvements: [
          "Provide more specific examples",
          "Explain the reasoning behind your approach",
          "Consider alternative solutions"
        ],
        modelAnswer: "The key is to not only explain what something is, but why it matters and how it's used in practice. Always provide concrete examples."
      },
      {
        score: 65,
        feedback: "You're on the right track, but there's room for improvement in your explanation.",
        improvements: [
          "Study the fundamentals more thoroughly",
          "Practice with more examples",
          "Focus on understanding the underlying principles"
        ],
        modelAnswer: "This concept requires deeper understanding. Focus on the fundamentals and practice implementing it in different scenarios."
      }
    ];
    
    return feedbacks[Math.floor(Math.random() * feedbacks.length)];
  };

  // Timer effect
  useEffect(() => {
    if (interviewStarted && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
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

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setIsLoading(true);
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const feedback = generateFeedback(userAnswer, questions[currentQuestionIndex]);
      setAiFeedback(feedback);
      setShowFeedback(true);
      setIsLoading(false);
      setIsTyping(false);
    }, 2000);
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setAiFeedback(null);
    }
  };

  // Handle voice recording
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Simulate voice recording
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setUserAnswer(prev => prev + " [Voice input simulated]");
      }, 3000);
    }
  };

  // Handle interview start
  const handleStartInterview = () => {
    setInterviewStarted(true);
  };

  // Handle interview end
  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      setInterviewStarted(false);
      setCurrentQuestionIndex(0);
      setUserAnswer('');
      setShowFeedback(false);
      setAiFeedback(null);
      setTimeRemaining(30 * 60);
      navigate('/Results');
    }
  };

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!interviewStarted) {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/30 backdrop-blur-md border-b border-gray-700/30 p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Interview.ai
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2.5 rounded-xl border border-gray-600 hover:border-purple-500 transition-all duration-300 hover:bg-gray-700/50"
              title={isPaused ? "Resume Timer" : "Pause Timer"}
            >
              <span className="text-lg">{isPaused ? "▶️" : "⏸️"}</span>
            </button>
            <button
              onClick={handleEndInterview}
              className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-300 text-red-300 hover:text-red-200"
              title="End Interview"
            >
              End Interview
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row ">
        {/* Left Panel - Chat and Questions */}
        <div className="flex-1 lg:w-2/3 p-8 overflow-hidden">
          <div className="h-full flex flex-col space-y-8">
            {/* Question Display */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-xl text-sm font-medium border border-purple-500/30">
                    {questions[currentQuestionIndex].category}
                  </span>
                  <span className="px-4 py-2 bg-gray-600/20 text-gray-300 rounded-xl text-sm font-medium border border-gray-500/30">
                    {questions[currentQuestionIndex].difficulty}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-sm font-medium">Question</span>
                  <div className="text-2xl font-bold text-purple-400">
                    {currentQuestionIndex + 1} <span className="text-gray-400 text-lg">/ {questions.length}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white leading-relaxed">
                {questions[currentQuestionIndex].question}
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
                        onClick={handleVoiceRecord}
                        className={`p-4 rounded-2xl transition-all duration-300 ${
                          isRecording 
                            ? 'bg-red-600/20 border-red-500/50 animate-pulse' 
                            : 'bg-gray-700/50 hover:bg-gray-600/50 border-gray-600/50 hover:border-gray-500/50'
                        } border`}
                        title={isRecording ? "Recording..." : "Voice Input"}
                        disabled={isLoading}
                      >
                        <span className="text-xl">🎤</span>
                      </button>
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim() || isLoading}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          "Submit Answer"
                        )}
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here... You can use markdown for code blocks and formatting."
                    className="flex-1 bg-gray-900/50 border border-gray-600/50 rounded-2xl p-6 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-lg leading-relaxed"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* AI Feedback */}
            {showFeedback && aiFeedback && (
              <div className="flex-1 flex flex-col space-y-8">
                {/* AI Response */}
                <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-xl">🤖</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Feedback</h3>
                      {isTyping && (
                        <div className="flex space-x-1 mt-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-300 font-medium">Confidence Score</span>
                      <span className="text-3xl font-black text-purple-400">{aiFeedback.score}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-2xl h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-2xl transition-all duration-1000 shadow-lg"
                        style={{ width: `${aiFeedback.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <p className="text-gray-200 text-lg leading-relaxed mb-8">{aiFeedback.feedback}</p>

                  {/* Improvements */}
                  <div className="mb-8">
                    <h4 className="font-bold text-white text-lg mb-4">Areas for Improvement:</h4>
                    <ul className="space-y-3">
                      {aiFeedback.improvements.map((improvement, index) => (
                        <li key={index} className="text-gray-300 flex items-start space-x-3">
                          <span className="text-yellow-400 mt-1 text-lg">•</span>
                          <span className="leading-relaxed">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Model Answer */}
                  <div>
                    <h4 className="font-bold text-white text-lg mb-4">Model Answer:</h4>
                    <p className="text-gray-200 leading-relaxed bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50">
                      {aiFeedback.modelAnswer}
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      setAiFeedback(null);
                      setUserAnswer('');
                    }}
                    className="px-8 py-4 border border-gray-600/50 hover:border-purple-500/50 hover:bg-gray-700/30 rounded-2xl transition-all duration-300 font-medium"
                  >
                    Edit Answer
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex >= questions.length - 1}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                  >
                    {currentQuestionIndex >= questions.length - 1 ? "Finish Interview" : "Next Question"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Timer and Progress */}
        <div className="lg:w-1/3 p-8 bg-gray-800/20 backdrop-blur-md border-l border-gray-700/30">
          <div className="space-y-8">
            {/* Timer */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Session Timer</h3>
              <div className="text-center">
                <div className="text-5xl font-black text-purple-400 mb-3 font-mono">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-gray-400 font-medium">
                  {isPaused ? "Paused" : "Time Remaining"}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Progress</h3>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-300 font-medium">Questions Completed</span>
                  <span className="text-purple-400 font-bold">{currentQuestionIndex + 1}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-2xl h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-2xl transition-all duration-500 shadow-lg"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-purple-400">{Math.round(progress)}%</span>
                <div className="text-gray-400 text-sm">Complete</div>
              </div>
            </div>

            {/* Session Summary */}
            <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6">Session Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-700/30">
                  <span className="text-gray-300">Questions Answered:</span>
                  <span className="text-purple-400 font-bold">{currentQuestionIndex + 1}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-700/30">
                  <span className="text-gray-300">Average Score:</span>
                  <span className="text-purple-400 font-bold">78%</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300">Time Used:</span>
                  <span className="text-purple-400 font-bold">{formatTime(30 * 60 - timeRemaining)}</span>
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