'use client';
import { useState, useCallback } from 'react';
import axios from 'axios';
import JSZip from 'jszip';

interface ImageResult {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  isProcessing: boolean;
}

export default function Home() {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [prompt, setPrompt] = useState<string>('');
  const [isReplacingBg, setIsReplacingBg] = useState<boolean>(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const processedFiles = await Promise.all(
        Array.from(files).map(async (file) => {
          return {
            id: Math.random().toString(36).substr(2, 9),
            originalFile: file,
            originalUrl: URL.createObjectURL(file),
            processedUrl: null,
            loading: false,
            error: null,
            isOpen: false,
            isProcessing: false
          };
        })
      );

      setImages(prev => [...prev, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processImage = async (image: ImageResult) => {
    const formData = new FormData();
    formData.append('file', image.originalFile);

    try {
      if (!image.originalFile.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const res = await axios.post('http://127.0.0.1:8000/remove-bg', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
      });

      if (res.status === 200 && res.data) {
        const blob = new Blob([res.data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, processedUrl: url, loading: false, error: null }
            : img
        ));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Upload failed', err);
      let errorMessage = 'Processing failed. Please try again.';
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
        } else if (err.response?.data) {
          try {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorData = JSON.parse(reader.result as string);
                errorMessage = errorData.detail || errorMessage;
              } catch {
                // If we can't parse the error, use default message
              }
            };
            reader.readAsText(err.response.data);
          } catch {
            // If we can't read the error data, use the status text
            errorMessage = err.response.statusText || errorMessage;
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { ...img, error: errorMessage, loading: false }
          : img
      ));
    }
  };

  const handleProcessAll = async () => {
    setUploading(true);
    try {
      await Promise.all(images.map(processImage));
    } catch (error) {
      console.error('Error processing all images:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenImage = async (image: ImageResult) => {
    try {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, isOpen: true } : img
      ));
    } catch (error) {
      console.error('Error opening image:', error);
    }
  };

  const handleReplaceBackground = async (image: ImageResult) => {
    if (!prompt.trim()) {
      alert('Please enter a prompt for the background');
      return;
    }

    try {
      setIsReplacingBg(true);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, isProcessing: true } : img
      ));

      const formData = new FormData();
      formData.append('file', image.originalFile);
      formData.append('prompt', prompt);

      const response = await axios.post('http://127.0.0.1:8000/replace-bg', formData, {
        responseType: 'blob'
      });

      const newImageUrl = URL.createObjectURL(new Blob([response.data], { type: 'image/png' }));
      
      setImages(prev => prev.map(img => 
        img.id === image.id ? {
          ...img,
          processedUrl: newImageUrl,
          isProcessing: false,
          isOpen: false
        } : img
      ));
    } catch (error) {
      console.error('Error replacing background:', error);
      setImages(prev => prev.map(img => 
        img.id === image.id ? {
          ...img,
          error: 'Failed to replace background',
          isProcessing: false
        } : img
      ));
    } finally {
      setIsReplacingBg(false);
    }
  };

  const handleClear = (id?: string) => {
    if (id) {
      setImages(prev => prev.filter(img => img.id !== id));
    } else {
      setImages([]);
    }
  };

  const downloadAll = async () => {
    const processedImages = images.filter(img => img.processedUrl);
    if (processedImages.length === 0) return;

    try {
      const zip = new JSZip();
      
      await Promise.all(
        processedImages.map(async (img) => {
          if (img.processedUrl) {
            const response = await fetch(img.processedUrl);
            const blob = await response.blob();
            zip.file(`clearpic-${img.id}.png`, blob);
          }
        })
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'clearpic-images.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Failed to create zip file. Please try downloading images individually.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8">ClearPic.ai</h1>

        {/* Upload Box */}
        <div 
          className={`w-full max-w-2xl mx-auto h-48 mb-8 rounded-xl border-2 border-dashed transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <svg 
              className="w-12 h-12 text-gray-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-lg text-gray-600 mb-2">
              Drag and drop your images here
            </span>
            <span className="text-sm text-gray-500">
              or click to browse
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {/* Action Buttons */}
        {images.length > 0 && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={handleProcessAll}
              disabled={uploading || images.every(img => img.processedUrl)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                uploading || images.every(img => img.processedUrl)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {uploading ? 'Processing...' : 'Process All Images'}
            </button>
            {images.some(img => img.processedUrl) && (
              <button
                onClick={downloadAll}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white"
              >
                Download All
              </button>
            )}
            <button
              onClick={() => handleClear()}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Preview Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.id} className="bg-white p-3 rounded-lg shadow-sm">
                {image.isOpen ? (
                  <div className="space-y-4">
                    <div className="aspect-square relative">
                      <img
                        src={image.processedUrl || image.originalUrl}
                        alt="Preview"
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter background prompt..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleReplaceBackground(image)}
                          disabled={isReplacingBg}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isReplacingBg ? 'Replacing...' : 'Replace Background'}
                        </button>
                        <button
                          onClick={() => setImages(prev => prev.map(img => 
                            img.id === image.id ? { ...img, isOpen: false } : img
                          ))}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      {/* Original Image */}
                      <div className="w-1/2 aspect-square relative">
                        <img
                          src={image.originalUrl}
                          alt="Original"
                          className="w-full h-full object-contain rounded"
                        />
                      </div>

                      {/* Processed Image */}
                      <div className="w-1/2 aspect-square relative">
                        {image.loading ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        ) : image.processedUrl ? (
                          <img
                            src={image.processedUrl}
                            alt="Processed"
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                            <span className="text-xs text-gray-500">Waiting to process</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2 flex justify-between items-center text-sm">
                      {image.processedUrl && (
                        <>
                          <button
                            onClick={() => handleOpenImage(image)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Open
                          </button>
                          <a
                            href={image.processedUrl}
                            download={`clearpic-${image.id}.png`}
                            className="text-green-600 hover:text-green-700"
                          >
                            Download
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleClear(image.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}

                {image.error && (
                  <div className="mt-1 text-xs text-red-600 text-center">
                    {image.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
