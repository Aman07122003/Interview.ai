import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleRegister = () => {
  const navigate = useNavigate();

  const handleUserRegister = () => {
    navigate('/user-register');
  };

  const handleInterviewerRegister = () => {
    navigate('/admin-register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Interview.ai
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join Interview.ai
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Select your role to get started with AI-powered interview practice
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl px-4">
          {/* User Registration Card */}
          <div className="flex-1 bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl flex flex-col">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">👤</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Candidate</h3>
              <p className="text-gray-400">
                Practice interviews and improve your skills
              </p>
            </div>

            <div className="mb-8 flex-1">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">AI-powered interview simulations</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Personalized feedback on answers</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Track your progress over time</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Industry-specific questions</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleUserRegister}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Register as Candidate
            </button>
          </div>

          {/* Interviewer Registration Card */}
          <div className="flex-1 bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 border border-gray-700/30 shadow-xl flex flex-col">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💼</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Interviewer</h3>
              <p className="text-gray-400">
                Create interviews and evaluate candidates
              </p>
            </div>

            <div className="mb-8 flex-1">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Create custom interview questions</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Evaluate candidate responses</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Access to candidate analytics</span>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-purple-400 text-sm">✓</span>
                  </div>
                  <span className="text-gray-300">Collaborate with other interviewers</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleInterviewerRegister}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Register as Interviewer
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>© 2023 Interview.ai. All rights reserved.</p>
        <div className="flex justify-center space-x-6 mt-2">
          <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-purple-400 transition-colors">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default RoleRegister;