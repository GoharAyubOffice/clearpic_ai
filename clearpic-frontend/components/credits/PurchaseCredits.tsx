import { useState } from 'react';
import { stripePromise } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const CREDIT_PACKAGES = [
  { id: 'credits-10', amount: 10, credits: 100, price: 10 },
  { id: 'credits-50', amount: 50, credits: 500, price: 45 },
  { id: 'credits-100', amount: 100, credits: 1000, price: 80 },
];

export default function PurchaseCredits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId: session?.user?.id,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {CREDIT_PACKAGES.map((pkg) => (
        <div key={pkg.id} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-2">{pkg.credits} Credits</h3>
          <p className="text-3xl font-bold text-blue-600 mb-4">${pkg.price}</p>
          <button
            onClick={() => handlePurchase(pkg.id)}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Purchase'}
          </button>
        </div>
      ))}
    </div>
  );
}
