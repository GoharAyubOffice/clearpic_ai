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

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">ClearPic.ai</h1>

      <div className="w-full max-w-md">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select an image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Processing...' : 'Remove Background'}
        </button>
      </div>

      {result && (
        <div className="mt-8 text-center">
          <p className="mb-4 text-gray-700 font-semibold">Result:</p>
          <img src={result} alt="Result" className="max-w-md rounded shadow-lg mx-auto" />
          <a
            href={result}
            download="clearpic.png"
            className="mt-4 inline-block text-blue-600 underline"
          >
            Download Transparent Image
          </a>
        </div>
      )}
    </main>
  );
}
