import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const SubscriptionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = {
    basic: {
      id: 'basic',
      name: 'Basic Plan',
      price: 0,
      features: [
        'Access to basic content',
        'Limited downloads',
        'Email support',
        '1 user account'
      ],
      duration: 'month'
    },
    premium: {
      id: 'premium',
      name: 'Premium Plan',
      price: 19,
      features: [
        'Full content access',
        'Unlimited downloads',
        'Priority support',
        'Up to 3 user accounts',
        'Advanced analytics'
      ],
      duration: 'month'
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 199,
      features: [
        'All premium features',
        'Dedicated account manager',
        'Custom integrations',
        'Unlimited user accounts',
        'API access'
      ],
      duration: 'month'
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const planId = location.state?.planId || new URLSearchParams(location.search).get('planId');
    if (planId && plans[planId]) {
      setSelectedPlan(plans[planId]);
    } else {
      navigate('/');
    }
  }, [location, navigate, isAuthenticated]);

  const handleSubscribe = async () => {
    if (!selectedPlan || !user) return;

    setLoading(true);
    setError('');

    try {
      if (selectedPlan.id === 'basic') {
        navigate('/interview');
        return;
      }

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          currency: 'USD',
          user: user._id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create subscription');
      }

      const options = {
        key: data.razorpayKeyId,
        amount: data.subscription.amount * 100,
        currency: data.subscription.currency,
        name: "Your App Name",
        description: `${selectedPlan.name} Subscription`,
        order_id: data.razorpayOrder.id,
        handler: async function (response) {
          await verifyPayment(response, data.subscription.id);
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
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'An error occurred while processing your subscription');
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse, subscriptionId) => {
    try {
      const response = await fetch('/api/subscriptions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          subscriptionId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment verification failed');
      }

      navigate('/subscription/success', {
        state: {
          subscription: data.subscription,
          plan: selectedPlan
        }
      });

    } catch (err) {
      navigate('/subscription/failure', {
        state: {
          error: err.message,
          plan: selectedPlan
        }
      });
    }
  };

  if (!selectedPlan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Complete Your Subscription
          </h1>
          <p className="mt-3 text-xl text-gray-400">
            You're subscribing to: {selectedPlan.name}
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

        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50">
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
              ) : selectedPlan.id === 'basic' ? 'Get Started Free' : 'Complete Subscription'}
            </button>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-purple-400 hover:text-purple-300 flex items-center justify-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Plans
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
