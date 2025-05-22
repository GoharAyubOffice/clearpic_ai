'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiTrash2, FiImage, FiRefreshCw, FiCheck, FiMenu, FiX, FiUser, FiCreditCard, FiLogIn, FiHome, FiSettings, FiWind, FiSun, FiMoon, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
import JSZip from 'jszip';

interface Image {
  id: string;
  original: string;
  processed: string | null;
  prompt?: string;
}

export default function Home() {
  const [images, setImages] = useState<Image[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isReplacingBg, setIsReplacingBg] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isRewritingPrompt, setIsRewritingPrompt] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousemove', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseLeave);
    };
  }, [isSidebarOpen]);

  const handleFileSelect = async (files: FileList) => {
    setIsUploading(true);
    const newImages: Image[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let imageUrl: string;

      if (file.type === 'image/heic' || file.type === 'image/heif') {
        try {
          if (isClient) {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/png',
              quality: 0.8
            });
            imageUrl = URL.createObjectURL(convertedBlob as Blob);
          } else {
            continue;
          }
        } catch (error) {
          console.error('HEIC conversion failed:', error);
          continue;
        }
      } else {
        imageUrl = URL.createObjectURL(file);
      }

      newImages.push({
        id: Math.random().toString(36).substr(2, 9),
        original: imageUrl,
        processed: null
      });
    }

    setImages(prev => [...prev, ...newImages]);
    setIsUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const processImage = async (image: Image) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      const response = await fetch(image.original);
      const blob = await response.blob();
      formData.append('file', blob, 'image.png');

      const result = await axios.post('http://127.0.0.1:8000/remove-bg', formData, {
        responseType: 'blob'
      });

      const processedUrl = URL.createObjectURL(result.data);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, processed: processedUrl } : img
      ));
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenImage = (image: Image) => {
    setSelectedImage(image);
    setPrompt('');
  };

  const handleReplaceBackground = async () => {
    if (!selectedImage || !prompt) return;

    try {
      setIsReplacingBg(true);
      const formData = new FormData();
      const response = await fetch(selectedImage.processed || selectedImage.original);
      const blob = await response.blob();
      formData.append('file', blob, 'image.png');
      formData.append('prompt', prompt);

      const result = await axios.post('http://127.0.0.1:8000/replace-bg', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const processedUrl = URL.createObjectURL(result.data);
      setImages(prev => prev.map(img => 
        img.id === selectedImage.id ? { ...img, processed: processedUrl, prompt } : img
      ));
      setSelectedImage(null);
      setPrompt('');
    } catch (error) {
      console.error('Error replacing background:', error);
      alert('Failed to replace background. Please try again.');
    } finally {
      setIsReplacingBg(false);
    }
  };

  const handleClearImages = () => {
    setImages([]);
    setSelectedImage(null);
    setPrompt('');
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const processedImages = images.filter(img => img.processed);

    for (const image of processedImages) {
      const response = await fetch(image.processed!);
      const blob = await response.blob();
      zip.file(`processed_${image.id}.png`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'processed_images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processAllImages = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        images.filter(img => !img.processed).map(processImage)
      );
    } catch (error) {
      console.error('Error processing all images:', error);
      alert('Failed to process some images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = async (image: Image) => {
    if (!image.processed) return;
    
    const response = await fetch(image.processed);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearpic-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRewritePrompt = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsRewritingPrompt(true);
      const formData = new FormData();
      formData.append('prompt', prompt);
      
      const response = await axios.post('http://127.0.0.1:8000/rewrite-prompt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPrompt(response.data.rewritten_prompt);
    } catch (error) {
      console.error('Error rewriting prompt:', error);
      alert('Failed to rewrite prompt. Please try again.');
    } finally {
      setIsRewritingPrompt(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'} ${isDarkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} z-40`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
                onClick={() => window.location.href = '/auth/login'}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <FiLogIn className="inline-block mr-2" />
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/auth/signup'}
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
            ref={sidebarRef}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed inset-y-0 left-0 w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl z-50`}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Menu</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>
              <nav className="space-y-2">
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => {
                    setActivePage('home');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'home' 
                      ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') 
                      : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                  }`}
                >
                  <FiHome className="w-5 h-5 mr-3" />
                  Home
                </motion.button>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => {
                    setActivePage('profile');
                    setIsSidebarOpen(false);
                    window.location.href = '/auth/login';
                  }}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'profile' 
                      ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') 
                      : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                  }`}
                >
                  <FiUser className="w-5 h-5 mr-3" />
                  Profile
                </motion.button>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => {
                    setActivePage('pricing');
                    setIsSidebarOpen(false);
                    window.location.href = '/pricing';
                  }}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'pricing' 
                      ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') 
                      : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                  }`}
                >
                  <FiCreditCard className="w-5 h-5 mr-3" />
                  Pricing
                </motion.button>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => {
                    setActivePage('settings');
                    setIsSidebarOpen(false);
                    window.location.href = '/settings';
                  }}
                  className={`flex items-center p-3 rounded-lg transition-colors w-full ${
                    activePage === 'settings' 
                      ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') 
                      : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
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

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-8">
        <AnimatePresence mode="wait">
          {activePage === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Upload Box */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : isDarkMode 
                        ? 'border-gray-600 hover:border-blue-400' 
                        : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <FiUpload className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                  <p className={`text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Drag & drop images here</p>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>or click to select files</p>
                </div>

                {images.length > 0 && (
                  <div className="mt-6 flex justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={processAllImages}
                      disabled={isProcessing || !images.some(img => !img.processed)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isProcessing || !images.some(img => !img.processed)
                          ? (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isProcessing ? (
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <FiRefreshCw className="inline-block mr-2" />
                          Process All
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClearImages}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      <FiTrash2 className="inline-block mr-2" />
                      Clear All
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={downloadAll}
                      disabled={!images.some(img => img.processed)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        images.some(img => img.processed)
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                      }`}
                    >
                      <FiDownload className="inline-block mr-2" />
                      Download All
                    </motion.button>
                  </div>
                )}
              </motion.div>

              {/* Hero Section */}
              <div className="text-center max-w-3xl mx-auto">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
                >
                  Transform Your Images with AI
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-gray-300 mb-8"
                >
                  Remove backgrounds and create stunning compositions with our advanced AI technology
                </motion.p>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}
                >
                  <FiImage className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Background Removal</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Remove backgrounds from any image with perfect precision using our advanced AI model.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}
                >
                  <FiWind className="w-12 h-12 text-purple-400 mb-4" />
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Background Generation</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create stunning new backgrounds using AI-powered text-to-image generation.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}
                >
                  <FiRefreshCw className="w-12 h-12 text-green-400 mb-4" />
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Composition</h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Seamlessly blend subjects with new backgrounds for professional-looking results.</p>
                </motion.div>
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                >
                  <AnimatePresence>
                    {images.map((image) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative group"
                      >
                        <div className={`aspect-square rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <img
                            src={image.processed || image.original}
                            alt="Processed"
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/50' : 'bg-black/30'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2`}>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleOpenImage(image)}
                              className={`p-2 ${isDarkMode ? 'bg-blue-500 rounded-full hover:bg-blue-600' : 'bg-blue-100 rounded-full hover:bg-blue-200'} transition-colors`}
                            >
                              <FiImage className="w-5 h-5" />
                            </motion.button>
                            {!image.processed && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => processImage(image)}
                                className={`p-2 ${isDarkMode ? 'bg-green-500 rounded-full hover:bg-green-600' : 'bg-green-100 rounded-full hover:bg-green-200'} transition-colors`}
                              >
                                <FiRefreshCw className="w-5 h-5" />
                              </motion.button>
                            )}
                            {image.processed && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => downloadImage(image)}
                                className={`p-2 ${isDarkMode ? 'bg-blue-500 rounded-full hover:bg-blue-600' : 'bg-blue-100 rounded-full hover:bg-blue-200'} transition-colors`}
                              >
                                <FiDownload className="w-5 h-5" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`mt-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ClearPic.AI</h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transform your images with advanced AI technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiGithub className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiTwitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <FiLinkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2024 ClearPic.AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Background Replacement Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-lg w-full`}
            >
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Replace Background</h2>
              <div className="space-y-4">
                <div className={`aspect-video rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <img
                    src={selectedImage.processed || selectedImage.original}
                    alt="Selected"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the new background..."
                    className={`w-full px-4 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  />
                  <button
                    onClick={handleRewritePrompt}
                    disabled={!prompt.trim() || isRewritingPrompt}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Rewrite prompt with AI"
                  >
                    <FiWind className={isRewritingPrompt ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="flex justify-end space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(null)}
                    className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReplaceBackground}
                    disabled={!prompt || isReplacingBg}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      !prompt || isReplacingBg
                        ? (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isReplacingBg ? (
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <FiCheck className="inline-block mr-2" />
                        Replace
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
