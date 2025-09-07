import React from 'react';

export default function Spinner() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-500"></div>
        <p className="mt-4 text-lg text-gray-400">Loading...</p>
    </div>
  );
}

