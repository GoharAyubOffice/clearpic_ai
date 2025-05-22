'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image first.");
      return;
    }

    console.log("Uploading file:", image);

    setLoading(true);
    const formData = new FormData();
    formData.append('file', image); // Must match FastAPI's field name

    try {
      const res = await axios.post('http://127.0.0.1:8000/remove-bg', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Something went wrong. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">ClearPic.ai</h1>

      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original Image Preview */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Original Image</h2>
            <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Original"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500 mb-4">No image selected</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Processed Image Preview */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Processed Image</h2>
            <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {result ? (
                <img
                  src={result}
                  alt="Processed"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500">Processed image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={handleUpload}
            disabled={loading || !image}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              loading || !image
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : 'Remove Background'}
          </button>

          {(image || result) && (
            <button
              onClick={handleClear}
              className="px-8 py-3 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All
            </button>
          )}
        </div>

        {result && (
          <div className="mt-6 text-center">
            <a
              href={result}
              download="clearpic.png"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Transparent Image
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
