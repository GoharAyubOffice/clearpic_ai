import { useState } from 'react';
import { stripePromise } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Unlimited background removal',
      '5 AI background generations',
      'Basic support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    features: [
      'Unlimited background removal',
      '50 AI background generations',
      'Priority support',
      'Additional credits: $0.20 per generation'
    ]
  }
];

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: session?.user?.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <div key={plan.id} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          <p className="text-3xl font-bold text-blue-600 mb-4">
            ${plan.price}/month
          </p>
          <ul className="space-y-2 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe(plan.id)}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : plan.price === 0 ? 'Current Plan' : 'Subscribe'}
          </button>
        </div>
      ))}
    </div>
  );
}
