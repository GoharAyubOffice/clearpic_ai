'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiCreditCard, FiZap, FiImage, FiRefreshCw } from 'react-icons/fi';
import Navigation from '../components/Navigation';

interface PricingTier {
  name: string;
  price: number;
  credits: number;
  features: string[];
  modelAccess: {
    [key: string]: {
      name: string;
      cost: number;
      description: string;
    };
  };
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    credits: 0,
    features: [
      'Unlimited background removal',
      'Standard quality processing',
      'Basic support',
      '720p output resolution',
      'No credit card required',
    ],
    modelAccess: {
      'rembg': {
        name: 'Rembg',
        cost: 0,
        description: 'Basic background removal'
      }
    }
  },
  {
    name: 'Pro',
    price: 9.99,
    credits: 50,
    features: [
      '50 credits per month',
      'Advanced background removal',
      'High quality processing',
      'Priority support',
      '4K output resolution',
      'Custom background generation',
      'Batch processing',
      'API access'
    ],
    modelAccess: {
      'rembg': {
        name: 'Rembg',
        cost: 0,
        description: 'Basic background removal'
      },
      'segment-anything': {
        name: 'Segment Anything',
        cost: 2,
        description: 'Advanced segmentation'
      },
      'stable-diffusion': {
        name: 'Stable Diffusion',
        cost: 3,
        description: 'AI background generation'
      }
    }
  }
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const calculatePrice = (price: number) => {
    if (isAnnual) {
      return (price * 10).toFixed(2); // 2 months free for annual
    }
    return price.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navigation />
      
      {/* Header */}
      <header className="container mx-auto px-4 py-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 mb-8"
        >
          Choose the plan that's right for you
        </motion.p>
        
        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center space-x-4 mb-12"
        >
          <span className={`${!isAnnual ? 'text-blue-400' : 'text-gray-400'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`${isAnnual ? 'text-blue-400' : 'text-gray-400'}`}>
            Annual <span className="text-green-400">(Save 20%)</span>
          </span>
        </motion.div>
      </header>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index }}
              className={`rounded-2xl p-6 ${
                tier.name === 'Pro' 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gray-800'
              }`}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">{tier.name}</h2>
                <div className="text-4xl font-bold mb-2">
                  ${calculatePrice(tier.price)}
                  <span className="text-lg font-normal text-gray-300">/month</span>
                </div>
                {tier.credits > 0 && (
                  <p className="text-gray-300">{tier.credits} credits included</p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <FiCheck className="w-5 h-5 text-green-400 mr-3" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Model Access Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Model Access</h3>
                <div className="space-y-2">
                  {Object.entries(tier.modelAccess).map(([key, model]) => (
                    <div key={key} className="flex items-center justify-between bg-black/20 rounded-lg p-2">
                      <div>
                        <h4 className="font-medium">{model.name}</h4>
                        <p className="text-sm text-gray-300">{model.description}</p>
                      </div>
                      <span className="text-sm">{model.cost === 0 ? 'Free' : `${model.cost} credits`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTier(tier.name)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  tier.name === 'Pro'
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {tier.name === 'Free' ? 'Get Started' : 'Upgrade to Pro'}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-3xl mx-auto mt-12 text-center"
        >
          <h3 className="text-2xl font-bold mb-6">How Credits Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-800 rounded-xl">
              <FiImage className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Background Removal</h4>
              <p className="text-gray-400">Free</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl">
              <FiRefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Background Replacement</h4>
              <p className="text-gray-400">2 credits per image</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-xl">
              <FiZap className="w-8 h-8 text-green-400 mx-auto mb-4" />
              <h4 className="font-semibold mb-2">AI Generation</h4>
              <p className="text-gray-400">3 credits per image</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 