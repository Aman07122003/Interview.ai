import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchInterviews } from "../store/slice/interviewSlice";

const DashboardInterview = () => {
  const [timeLeft, setTimeLeft] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { interviews = [], loading, error } = useSelector((state) => state.interview);

  useEffect(() => {
    dispatch(fetchInterviews());
  }, [dispatch]);

  // Countdown timers
  useEffect(() => {
    if (!interviews || interviews.length === 0) return;
    
    const interval = setInterval(() => {
      const updated = {};
      interviews.forEach((session) => {
        const eventTime = new Date(session.scheduledAt).getTime();
        const now = Date.now();
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
  }, [interviews]);

  const handleStartInterview = (session) => {
    navigate(`/interview/${session._id}`, { state: { session } });
  };

  if (loading) return <p className="text-gray-400">Loading interviews...</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;
  if (!interviews || interviews.length === 0) {
    return <p className="text-gray-400">No upcoming interviews</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {interviews.map((session) => (
        <button
          key={session._id}
          onClick={() => handleStartInterview(session)}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg text-white text-left hover:border-purple-500 transition"
        >
          <h2 className="text-lg font-bold mb-1">{session.title || "Interview"}</h2>
          <p className="text-sm text-gray-400 mb-3">
            {session.description || "No description"}
          </p>

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
