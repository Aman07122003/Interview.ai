import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import InterviewLanding from './pages/InterviewLanding';
import InterviewSession from './pages/InterviewSession';
import Dashboard from "./pages/Dashboard";
import AddQuestions from "./pages/AddQuestions";
import Admin from "./pages/Admin";
import CandidatesPage from "./pages/CandidatesPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import SubscriptionPage from "./pages/Subscription/SubscriptionPage";
import PaymentFailure from "./pages/Subscription/PaymentFailure";
import PaymentSuccess from "./pages/Subscription/PaymentSuccess";

function App() {
  

  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            style: {
              background: '#059669',
              border: '1px solid #10b981',
            },
          },
          error: {
            style: {
              background: '#dc2626',
              border: '1px solid #ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview" element={<InterviewLanding />} />
        <Route path="/interview/start" element={<InterviewSession />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-questions" element={<AddQuestions />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/subscription/payment-success" element={<PaymentSuccess />} />
        <Route path="/subscription/payment-failure" element={<PaymentFailure />} />
      </Routes>
    </Router>
  )
}

export default App;

