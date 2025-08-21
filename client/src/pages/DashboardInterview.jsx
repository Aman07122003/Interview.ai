import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const DashboardInterview = () => {
  const [sessions, setSessions] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});
  const navigate = useNavigate();

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await axiosInstance.get("http://localhost:3000/api/admin/interview-sessions");
        setSessions(data.data.sessions || []);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
  }, []);

  // Countdown timers
  useEffect(() => {
    if (sessions.length === 0) return;

    const interval = setInterval(() => {
      const updated = {};
      sessions.forEach((session) => {
        const eventTime = new Date(session.scheduledAt).getTime();
        const now = new Date().getTime();
        const diff = eventTime - now;

        if (diff > 0) {
          updated[session._id] = {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          };
        } else {
          updated[session._id] = null;
        }
      });
      setTimeLeft(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessions]);

  // Handle "Start Interview"
  const handleStartInterview = async () => {
    try {
      navigate('/interview');
    } catch (error) {
      console.error("Error starting interview:", error);
    }
  };

  if (sessions.length === 0) {
    return <p className="text-gray-400">No upcoming interviews</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <button
          key={session._id}
          onClick={() => handleStartInterview(session._id)}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg text-white text-left hover:border-purple-500 transition"
        >
          <h2 className="text-lg font-bold mb-1">{session.title}</h2>
          <p className="text-sm text-gray-400 mb-3">{session.description}</p>

          {/* Interviewer */}
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={session.createdBy.avatar}
              alt={session.createdBy.fullName}
              className="w-10 h-10 rounded-full object-cover border border-gray-600"
            />
            <div>
              <p className="font-medium">{session.createdBy.fullName}</p>
              <p className="text-xs text-gray-400">Interviewer</p>
            </div>
          </div>

          {/* Participants */}
          <div className="mb-3">
            <p className="text-xs text-gray-400">Participants:</p>
            {session.participants.map((p) => (
              <p key={p._id} className="text-sm">{p.fullName} ({p.email})</p>
            ))}
          </div>

          {/* Countdown */}
          {timeLeft[session._id] ? (
            <div className="flex justify-between text-center bg-gray-800 rounded-xl p-3">
              <div>
                <p className="text-xl font-bold">{timeLeft[session._id].days}</p>
                <span className="text-xs text-gray-400">Days</span>
              </div>
              <div>
                <p className="text-xl font-bold">{timeLeft[session._id].hours}</p>
                <span className="text-xs text-gray-400">Hours</span>
              </div>
              <div>
                <p className="text-xl font-bold">{timeLeft[session._id].minutes}</p>
                <span className="text-xs text-gray-400">Minutes</span>
              </div>
              <div>
                <p className="text-xl font-bold">{timeLeft[session._id].seconds}</p>
                <span className="text-xs text-gray-400">Seconds</span>
              </div>
            </div>
          ) : (
            <p className="text-green-400 text-sm">Click to start interview</p>
          )}
        </button>
      ))}
    </div>
  );
};

export default DashboardInterview;
