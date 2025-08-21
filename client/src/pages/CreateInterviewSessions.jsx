import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createInterviewSession } from "../store/slice/adminAuthSlice";

const CreateInterviewSession = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { admin, isLoading, error } = useSelector((state) => state.adminAuth);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expertise: "",
    scheduledAt: "",
    questions: [],
    participants: [], // Changed from candidateName/candidateEmail to participants array
  });
  
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentParticipant, setCurrentParticipant] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});

  // Available expertise options that match backend enum
  const expertiseOptions = [
    "Technical", "Behavioural", "System Design", "Frontend", 
    "Backend", "DevOps", "AI/ML", "Data Structures & Algorithms", "Soft Skills"
  ];

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle participant input change
  const handleParticipantChange = (e) => {
    const { name, value } = e.target;
    setCurrentParticipant({ ...currentParticipant, [name]: value });
  };

  // Add participant to the list
  const handleAddParticipant = () => {
    if (currentParticipant.name.trim() && currentParticipant.email.trim()) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentParticipant.email)) {
        setErrors(prev => ({ ...prev, participantEmail: "Please enter a valid email address" }));
        return;
      }

      setFormData({
        ...formData,
        participants: [...formData.participants, currentParticipant]
      });
      setCurrentParticipant({ name: "", email: "" });
      setErrors(prev => ({ ...prev, participantEmail: "" }));
    }
  };

  // Remove participant from the list
  const handleRemoveParticipant = (index) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({ ...formData, participants: newParticipants });
  };

  // Add question to the list - just store the text
  const handleAddQuestion = () => {
    if (currentQuestion.trim()) {
      setFormData({
        ...formData,
        questions: [...formData.questions, currentQuestion.trim()]
      });
      setCurrentQuestion("");
    }
  };

  // Remove question from the list
  const handleRemoveQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.expertise.trim()) newErrors.expertise = "Expertise area is required";
    if (formData.participants.length === 0) newErrors.participants = "At least one participant is required";
    
    // Questions validation
    if (formData.questions.length === 0) {
      newErrors.questions = "At least one question is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Prepare data for submission to match backend expectations
  const prepareSubmissionData = () => {
    return {
      title: formData.title,
      description: formData.description,
      expertise: formData.expertise,
      scheduledAt: formData.scheduledAt || new Date(),
      questions: formData.questions.map(text => ({ text })),
      participants: formData.participants.map(p => p.email),
      // createdBy and status will be handled by backend
    };
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submissionData = prepareSubmissionData();
      console.log("Submitting data:", submissionData);
      await dispatch(createInterviewSession(submissionData)).unwrap();
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Failed to create interview session:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-gray-700/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Interview Session</h2>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., Frontend Developer Technical Interview"
              value={formData.title}
              onChange={handleChange}
              className={`w-full bg-gray-800/50 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.title ? "border-red-500" : "border-gray-600"
              }`}
              required
            />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Describe the interview session, objectives, or special instructions..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Participants Section */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Participants *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <input
                type="text"
                name="name"
                placeholder="Participant Name"
                value={currentParticipant.name}
                onChange={handleParticipantChange}
                className="bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex space-x-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Participant Email"
                  value={currentParticipant.email}
                  onChange={handleParticipantChange}
                  className={`flex-1 bg-gray-800/50 border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.participantEmail ? "border-red-500" : "border-gray-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            {errors.participantEmail && <p className="text-red-400 text-sm mt-1 mb-2">{errors.participantEmail}</p>}
            {errors.participants && <p className="text-red-400 text-sm mt-1 mb-2">{errors.participants}</p>}
            
            {formData.participants.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Added Participants:</h4>
                <ul className="space-y-2">
                  {formData.participants.map((participant, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-700/50 rounded-lg p-3">
                      <div>
                        <span className="text-gray-200 block">{participant.name}</span>
                        <span className="text-gray-400 text-sm">{participant.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Expertise Area *
            </label>
            <select
              name="expertise"
              value={formData.expertise}
              onChange={handleChange}
              className={`w-full bg-gray-800/50 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.expertise ? "border-red-500" : "border-gray-600"
              }`}
              required
            >
              <option value="">Select an expertise area</option>
              {expertiseOptions.map((expertise) => (
                <option key={expertise} value={expertise}>
                  {expertise}
                </option>
              ))}
            </select>
            {errors.expertise && <p className="text-red-400 text-sm mt-1">{errors.expertise}</p>}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleChange}
              className={`w-full bg-gray-800/50 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.scheduledAt ? "border-red-500" : "border-gray-600"
              }`}
            />
            {errors.scheduledAt && <p className="text-red-400 text-sm mt-1">{errors.scheduledAt}</p>}
          </div>

          {/* Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Interview Questions *
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                placeholder="Add a question..."
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Add
              </button>
            </div>
            
            {errors.questions && <p className="text-red-400 text-sm mt-1 mb-2">{errors.questions}</p>}
            
            {formData.questions.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-medium text-gray-200 mb-2">Added Questions:</h4>
                <ul className="space-y-2">
                  {formData.questions.map((question, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-700/50 rounded-lg p-3">
                      <span className="text-gray-200">{question}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Session...
              </div>
            ) : (
              "Create Interview Session"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateInterviewSession;