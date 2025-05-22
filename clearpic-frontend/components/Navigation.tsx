'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogIn, FiHome, FiSettings, FiCreditCard } from 'react-icons/fi';
import { useRouter } from 'next/router';

export default function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const router = useRouter();

  const handleNavigation = (path: string, page: string) => {
    setActivePage(page);
    setIsSidebarOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 z-40`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-700"
              >
                <FiMenu className="w-6 h-6" />
              </motion.button>
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
              >
                ClearPic.AI
              </motion.h1>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <FiLogIn className="inline-block mr-2" />
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/auth/signup')}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
              >
                <FiUser className="inline-block mr-2" />
                Sign Up
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 w-64 bg-gray-800 shadow-xl z-50"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Menu</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>
              <nav className="space-y-2">
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigation('/', 'home')}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'home' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <FiHome className="w-5 h-5 mr-3" />
                  Home
                </motion.button>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigation('/auth/login', 'profile')}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'profile' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <FiUser className="w-5 h-5 mr-3" />
                  Profile
                </motion.button>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigation('/pricing', 'pricing')}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'pricing' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <FiCreditCard className="w-5 h-5 mr-3" />
                  Pricing
                </motion.button>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => handleNavigation('/settings', 'settings')}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'settings' ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                >
                  <FiSettings className="w-5 h-5 mr-3" />
                  Settings
                </motion.button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 