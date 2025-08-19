import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../../utils/axiosInstance';

const SubscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
  }, [isAuthenticated, navigate, location.pathname]); // Add dependencies here

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = () => {
    if (!selectedPlan || !user) return;
  
    setLoading(true);
    setError('');
  
    try {
      if (selectedPlan.price === 0) {
        navigate('/interview');
        return;
      }
  
      const response = axiosInstance.post('/api/subscriptions', {
        plan: selectedPlan.id,
        currency: 'USD'
      });
  
      const data = response.data;
  
      const options = {
        key: data.razorpayKeyId,
        amount: data.subscription.amount * 100,
        currency: data.subscription.currency,
        name: "Your App Name",
        description: `${selectedPlan.name} Subscription`,
        order_id: data.razorpayOrder.id,
        handler: async (paymentResponse) => {
          try {
            await verifyPayment(paymentResponse, data.subscription.id);
          } catch (err) {
            console.error("Verification failed:", err);
            setError("Payment verification failed.");
            setLoading(false);
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: { color: "#3399cc" },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
  
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while processing your subscription');
      setLoading(false);
    }
  };

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
          plan: selectedPlan
        }
      });
  
    } catch (err) {
      navigate('/subscription/failure', {
        state: {
          error: err.response?.data?.message || err.message,
          plan: selectedPlan
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && !selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-medium text-white">Failed to load plans</h2>
          <p className="mt-2 text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-xl text-gray-400">
            Select the plan that works best for you
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-900/50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {!selectedPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 hover:border-purple-500 transition-colors cursor-pointer"
                onClick={() => handlePlanSelection(plan)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                    <p className="mt-2 text-gray-400">
                      Perfect for {plan.id === 'basic' ? 'individuals' :
                        plan.id === 'premium' ? 'small teams' : 'large organizations'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-extrabold text-purple-400">
                      ${plan.price}
                    </p>
                    <p className="text-sm text-gray-500">per {plan.duration}</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-300">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="ml-2">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className="w-full py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all duration-300">
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        ) : (
          // Selected Plan Details
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Selected Plan</h2>
              <p className="mt-2 text-gray-400">Review your selection before proceeding</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPlan.name}</h2>
                  <p className="mt-2 text-gray-400">
                    Perfect for {selectedPlan.id === 'basic' ? 'individuals' :
                      selectedPlan.id === 'premium' ? 'small teams' : 'large organizations'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-purple-400">
                    ${selectedPlan.price}
                  </p>
                  <p className="text-sm text-gray-500">per {selectedPlan.duration}</p>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-300">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="ml-2">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlan.id === 'enterprise' ? (
                <button
                  onClick={() => window.location.href = 'mailto:sales@yourcompany.com'}
                  className="w-full py-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all duration-300"
                >
                  Contact Sales Team
                </button>
              ) : (
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className={`w-full py-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all duration-300 
                    ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : selectedPlan.price === 0 ? 'Get Started Free' : 'Complete Subscription'}
                </button>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-purple-400 hover:text-purple-300 flex items-center justify-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Back to Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;