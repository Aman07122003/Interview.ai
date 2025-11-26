import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const InterviewSession = () => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [time, setTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndInterview = () => setShowEndConfirm(true);

  const confirmEndInterview = () => {
    setIsRecording(false);
    navigate('/user/dashboard');
  };

  const cancelEndInterview = () => setShowEndConfirm(false);

  const ControlButton = ({ icon, isActive, onClick, color = 'gray' }) => (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
        isActive 
          ? `bg-${color}-500 hover:bg-${color}-600 text-white` 
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      } backdrop-blur-sm border border-gray-600/50`}
    >
      {icon}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900/20"></div>

      {showEndConfirm && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 border border-gray-700/50 rounded-2xl p-8 max-w-md mx-4 backdrop-blur-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">End Interview?</h3>
              <p className="text-gray-400 mb-6">Are you sure you want to end this interview? This action cannot be undone.</p>

              <div className="flex gap-3 justify-center">
                <button onClick={cancelEndInterview} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg">
                  Cancel
                </button>
                <button onClick={confirmEndInterview} className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  End Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="relative z-10 h-screen flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/50 backdrop-blur-lg border-b border-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Recording {isRecording ? '•' : ''}</span>
            </div>

            <div className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Interview Session
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* ❗ FIXED BUTTON TAG HERE ❗ */}
            <button
              onClick={handleEndInterview}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 hover:border-red-500/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              End
            </button>

            <div className="text-2xl font-mono bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              {formatTime(time)}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Secure Connection
            </div>
          </div>
        </div>

        {/* VIDEO AREA */}
        <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">

          {/* Interviewer video */}
          <div className="flex-1 relative rounded-2xl bg-gray-900/50 border border-gray-700/50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">JS</span>
                </div>
                <p className="text-gray-400">John Smith - Interviewer</p>
                <p className="text-sm text-gray-500 mt-2">Senior Hiring Manager</p>
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-black/50 px-3 py-2 rounded-lg text-gray-300 text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              1080p • 60fps
            </div>
          </div>

          {/* User camera */}
          <div className="lg:w-96 xl:w-[500px] relative rounded-2xl bg-gray-900/50 border border-gray-700/50 overflow-hidden">

            {isVideoOn ? (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold">YC</span>
                  </div>
                  <p className="text-gray-400">Your Camera</p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Camera Off</p>
                </div>
              </div>
            )}

            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-lg text-sm text-gray-300">
              720p • 30fps
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="p-6 bg-black/50 backdrop-blur-lg border-t border-gray-800/50">
          <div className="flex justify-center gap-8">

            <ControlButton
              icon={isAudioOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
              isActive={isAudioOn}
              onClick={() => setIsAudioOn(!isAudioOn)}
              color={isAudioOn ? "green" : "red"}
            />

            <ControlButton
              icon={isVideoOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
              isActive={isVideoOn}
              onClick={() => setIsVideoOn(!isVideoOn)}
              color={isVideoOn ? "green" : "red"}
            />

            <ControlButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              }
              isActive={isScreenSharing}
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              color="blue"
            />

            <ControlButton
              icon={
                isRecording ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2}></circle>
                    <rect x="9" y="9" width="6" height="6" rx="1" strokeWidth={2}></rect>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="red" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )
              }
              isActive={isRecording}
              onClick={() => setIsRecording(!isRecording)}
              color="red"
            />

            <button 
              onClick={handleEndInterview}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transform hover:scale-105"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="px-6 py-3 bg-black/30 border-t border-gray-800/30 text-sm text-gray-400 flex justify-between">
          <div className="flex items-center gap-6">
            <span>Interview ID: INV-2024-001</span>
            <span>•</span>
            <span>AI Proctoring: Active</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Connection: Excellent</span>
            <span>•</span>
            <span>Encrypted: TLS 1.3</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InterviewSession;
