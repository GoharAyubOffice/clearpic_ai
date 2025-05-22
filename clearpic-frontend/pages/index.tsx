'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiTrash2, FiImage, FiRefreshCw, FiCheck, FiMenu, FiX, FiUser, FiCreditCard, FiLogIn } from 'react-icons/fi';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      const response = await fetch(selectedImage.original);
      const blob = await response.blob();
      formData.append('file', blob, 'image.png');
      formData.append('prompt', prompt);

      const result = await axios.post('http://127.0.0.1:8000/replace-bg', formData, {
        responseType: 'blob'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
        >
          ClearPic.AI
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 shadow-xl"
          >
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-blue-400'
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
              <FiUpload className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <p className="text-lg mb-2">Drag & drop images here</p>
              <p className="text-sm text-gray-400">or click to select files</p>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearImages}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FiDownload className="inline-block mr-2" />
                Download All
              </motion.button>
            </div>
          </motion.div>

          {/* Image Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 shadow-xl"
          >
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence>
                {images.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-700">
                      <img
                        src={image.processed || image.original}
                        alt="Processed"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenImage(image)}
                          className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <FiImage className="w-5 h-5" />
                        </motion.button>
                        {!image.processed && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => processImage(image)}
                            className="p-2 bg-green-500 rounded-full hover:bg-green-600 transition-colors"
                          >
                            <FiRefreshCw className="w-5 h-5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

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
                className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
              >
                <h2 className="text-xl font-semibold mb-4">Replace Background</h2>
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-700">
                    <img
                      src={selectedImage.original}
                      alt="Selected"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the new background..."
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedImage(null)}
                      className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
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
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
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
    </div>
  );
}
