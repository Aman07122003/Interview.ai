import React from 'react';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout, getCurrentUser } from '../store/slice/authSlice';
import Gemini_Generated_Image_q63u32q63u32q63u from '../assets/Gemini_Generated_Image_q63u32q63u32q63u.png';
import axiosInstance from '../../utils/axiosInstance';
import axios from 'axios';

// LogoutButton component
const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      // Dispatch the logout action which will handle everything
      await dispatch(logout()).unwrap();
      
      // Navigate to home page after successful logout
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, we should still clear local state
      // and redirect to home
      navigate('/');
    }
  };

  console.log("🚀 Home.jsx new version loaded");


  return (
    <button 
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 text-gray-200 hover:bg-red-600 hover:text-white rounded-b-xl transition-colors"
    >
      Logout
    </button>
  );
};

const Home = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const isAuthenticated = !!(user && accessToken);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    // Fetch plans from your API
    const fetchPlans = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/subscription/plans");
        console.log(response.data);
        if (response.data.success) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };

    fetchPlans();
  }, []);

  // Payment verification function
  const verifyPayment = async (paymentResponse, subscriptionId) => {
    try {
      const response = await axiosInstance.post('/api/subscriptions/verify', {
        subscriptionId,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_signature: paymentResponse.razorpay_signature
      });

      navigate('/subscription/success', {
        state: {
          subscription: response.data.subscription,
          plan: plans.find(p => p.id === response.data.subscription.planId)
        }
      });
    } catch (err) {
      console.error("Payment verification failed:", err);
      setError("Payment verification failed. Please contact support.");
      navigate('/subscription/failure', {
        state: {
          error: err.response?.data?.message || err.message,
          plan: plans.find(p => p.id === subscriptionId.split('_')[0]) // Extract plan ID from subscription ID if possible
        }
      });
    }
  };

  // Handle plan selection and subscription
  // Handle plan selection and subscription
// Handle plan selection and subscription
// Handle plan selection and subscription
// Handle plan selection and subscription
const handleSubscribe = async (plan) => {
  console.log("Plan clicked:", plan);

  setSubscriptionLoading(true);
  setError('');

  try {
    // Free plan shortcut
    if (plan.price === 0) {
      navigate('/interview');
      return;
    }

    // Call backend with correct endpoint and parameter names
    const response = await axiosInstance.post('/api/subscriptions', {
      plan: plan.id,
      amount: plan.price,
    });

    console.log("FULL Subscription response:", response);
    console.log("Response data:", response.data);

    // Check if response has the expected structure
    if (!response.data || !response.data.data) {
      throw new Error("No data received from server");
    }

    // Extract the nested data
    const responseData = response.data.data;
    console.log("Nested data:", responseData);
    
    // Check what properties we actually have
    console.log("Response data keys:", Object.keys(responseData));
    
    if (responseData.razorpayKeyId) {
      console.log("razorpayKeyId:", responseData.razorpayKeyId);
    } else {
      console.log("razorpayKeyId is missing");
    }
    
    if (responseData.subscription) {
      console.log("subscription:", responseData.subscription);
    } else {
      console.log("subscription is missing");
    }
    
    if (responseData.razorpayOrder) {
      console.log("razorpayOrder:", responseData.razorpayOrder);
    } else {
      console.log("razorpayOrder is missing");
    }

    // Check if response has the expected structure
    if (!responseData.razorpayKeyId || !responseData.subscription || !responseData.razorpayOrder) {
      throw new Error(`Invalid response from server. Expected razorpayKeyId, subscription, and razorpayOrder, got: ${JSON.stringify(responseData)}`);
    }

    // Check if Razorpay is available
    if (typeof window.Razorpay === 'undefined') {
      throw new Error("Payment gateway not loaded. Please refresh the page.");
    }

    const options = {
      key: responseData.razorpayKeyId,
      amount: responseData.razorpayOrder.amount, // Use amount from razorpayOrder (already in paise)
      currency: responseData.razorpayOrder.currency || 'INR',
      name: "Interview.ai",
      description: `${plan.name} Subscription`,
      order_id: responseData.razorpayOrder.id,
      handler: async (paymentResponse) => {
        try {
          await verifyPayment(paymentResponse, responseData.subscription.id);
        } catch (err) {
          console.error("Verification failed:", err);
          setError("Payment verification failed. Please contact support.");
        } finally {
          setSubscriptionLoading(false);
        }
      },
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: user.phone || ''
      },
      theme: {
        color: "#3399cc"
      },
      modal: {
        ondismiss: function() {
          console.log("Payment modal dismissed");
          setSubscriptionLoading(false);
          setError("Payment was cancelled");
        }
      }
    };

    console.log("Razorpay options:", options);

    const rzp = new window.Razorpay(options);
    
    // Add event listeners for debugging
    rzp.on('payment.failed', function(response) {
      console.error("Payment failed:", response.error);
      setError(`Payment failed: ${response.error.description}`);
      setSubscriptionLoading(false);
    });

    rzp.on('payment.success', function(response) {
      console.log("Payment success:", response);
    });

    // Open the Razorpay modal
    rzp.open();

  } catch (err) {
    console.error('Subscription error:', err);
    console.error('Error response:', err.response);
    
    let errorMessage = 'An error occurred while processing your subscription';
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    setSubscriptionLoading(false);
  }
};

// Add this function to debug Razorpay loading
const checkRazorpay = () => {
  if (typeof window.Razorpay === 'undefined') {
    console.error("Razorpay not loaded!");
    setError("Payment system not loaded. Please refresh the page.");
    return false;
  }
  console.log("Razorpay is loaded:", window.Razorpay);
  return true;
};

// Call this before attempting payment
if (!checkRazorpay()) {
  return;
}

  // Fetch current user if we have tokens but no user
  useEffect(() => {
    if (accessToken && !user) {
      console.log('👤 Fetching current user...');
      dispatch(getCurrentUser());
    }
  }, [accessToken, user, dispatch]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            interview.ai
          </span>
        </div>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">Features</a>
          <a href="#pricing" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">Pricing</a>
          <a href="#contact" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">Contact</a>
          <a href="#about" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">About</a>
          <a href="#help" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">Help</a>
        </div>

        {/* Right side buttons */}
        {isAuthenticated && user ? (
          <div className='flex items-center gap-10'>
            
            <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src={user.avatar || "https://via.placeholder.com/40"}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50 hover:border-purple-500 transition-colors"
              />
              <p>{user.fullName}</p>
            </button>
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg z-50 py-2 border border-gray-700">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-200 hover:bg-purple-600 hover:text-white rounded-t-xl transition-colors"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Profile
                </Link>
                <LogoutButton />
              </div>
              )}
            </div>
          </div>
        ) : (
        <div className="flex items-center space-x-4">
          <a href="/login" className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105">Login</a>
          <a href="/register" className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/25">
            Register
          </a>
        </div>
        )}
      </nav>

      {/* Hero Section with Background Image */}
      <header className="min-h-screen flex flex-col items-center justify-center py-16 px-4 text-center relative" style={{
        backgroundImage: 'url(/background-gradient-dark-purple-filled-da10c0e82312d45ce588344f8c4bac15.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="animate-fade-in-up">
            <h1 className='text-5xl md:text-8xl font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse'>
              Interview.ai
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white drop-shadow-2xl">
              Smart Interview Prep App
            </h2>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-gray-200 font-medium leading-relaxed">
              Ace your next technical interview with AI-powered feedback, personalized questions, and real progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <a href= {isAuthenticated ? "/interview" : "/login"} className="group px-10 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-purple-500/50 transform">
                Get Started Free
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </a>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Laptop Video Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            See It In Action
          </h2>
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
            Watch how Interview.ai transforms your interview preparation with AI-powered feedback and personalized learning.
          </p>
          
          {/* Laptop Frame */}
          <div className="relative mx-auto max-w-4xl">
            {/* Laptop Base */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700">
              {/* Laptop Screen */}
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner border-4 border-gray-800">
                {/* Screen Bezel */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black rounded-xl pointer-events-none"></div>
                
                {/* Video Container */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <img src={Gemini_Generated_Image_q63u32q63u32q63u} alt="Interview.ai" className="w-full h-full object-cover object-center" />
                </div>
                
                {/* Screen Glare Effect */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none"></div>
              </div>
              
              {/* Laptop Hinge */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full"></div>
            </div>
            
            {/* Laptop Stand/Base */}
            <div className="mt-8 mx-auto w-48 h-2 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 rounded-full"></div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse delay-500"></div>
          </div>
          
          {/* Call to Action */}
          <div className="mt-16">
            <a href="/register" className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50">
              Start Your Free Trial
              <span className="ml-2">→</span>
            </a>
          </div>
        </div>
      </section>

{/* Features Section */}
<section id="features" className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📚</div>
              <h3 className="font-bold text-xl mb-4 text-white">Question Bank</h3>
              <p className="text-gray-300 leading-relaxed">Practice DSA, OOP, DBMS, and more by topic with curated questions.</p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🎤</div>
              <h3 className="font-bold text-xl mb-4 text-white">Voice Input</h3>
              <p className="text-gray-300 leading-relaxed">Answer by typing or speaking naturally with Whisper API integration.</p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="font-bold text-xl mb-4 text-white">AI Feedback</h3>
              <p className="text-gray-300 leading-relaxed">Get instant, actionable feedback powered by advanced GPT-4 technology.</p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📈</div>
              <h3 className="font-bold text-xl mb-4 text-white">Progress Dashboard</h3>
              <p className="text-gray-300 leading-relaxed">Track your scores, strengths, and improvement areas with detailed analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
              {[
                { step: "1", title: "Sign Up & Login", desc: "Create your account and get started" },
                { step: "2", title: "Pick a Question", desc: "Choose from our vast question bank" },
                { step: "3", title: "Answer & Submit", desc: "Provide your response via text or voice" },
                { step: "4", title: "Get AI Feedback", desc: "Receive instant, detailed feedback" },
                { step: "5", title: "Track Progress", desc: "Monitor your improvement over time" }
              ].map((item, index) => (
                <div key={index} className="relative z-10 group">
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-white">{item.title}</h3>
                    <p className="text-gray-300 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                <h3 className="font-bold text-2xl mb-4 text-white">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <span className="text-green-400 mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscriptionLoading}
                  className={`w-full py-4 rounded-full border-2 border-purple-400 hover:bg-purple-900/30 font-bold transition-all duration-300 hover:scale-105 ${
                    subscriptionLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {subscriptionLoading ? 'Processing...' : (plan.buttonText || 'Subscribe')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Why Choose Interview.ai?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-bold text-xl mb-4 text-white">Boost Your Confidence</h3>
              <p className="text-gray-300 leading-relaxed">Practice real interview questions and get instant, unbiased feedback to build your confidence.</p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold text-xl mb-4 text-white">Personalized Learning</h3>
              <p className="text-gray-300 leading-relaxed">Identify your strengths and focus on areas that need improvement with AI-driven insights.</p>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-xl mb-4 text-white">Track Your Progress</h3>
              <p className="text-gray-300 leading-relaxed">Visualize your journey and celebrate your growth over time with detailed progress tracking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Have questions? We'd love to hear from you. Our team is here to help you succeed.
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <a href="mailto:support@interview.ai" className="group flex items-center space-x-3 text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-105">
              <span className="text-2xl">📧</span>
              <span className="text-lg font-semibold">support@interview.ai</span>
            </a>
            <a href="tel:+1234567890" className="group flex items-center space-x-3 text-purple-400 hover:text-purple-300 transition-all duration-300 hover:scale-105">
              <span className="text-2xl">📞</span>
              <span className="text-lg font-semibold">+1 (234) 567-890</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 block">
                interview.ai
              </span>
              <p className="text-gray-400 mb-6 max-w-md">
                The ultimate AI-powered interview preparation platform. Ace your technical interviews with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="#about" className="block text-gray-400 hover:text-white transition-colors">About</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <div className="space-y-2">
                <a href="#privacy" className="block text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#terms" className="block text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#help" className="block text-gray-400 hover:text-white transition-colors">Help Center</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            &copy; {new Date().getFullYear()} interview.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
