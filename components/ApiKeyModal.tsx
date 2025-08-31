
import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (apiKey: string) => void;
  initialApiKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, initialApiKey = '' }) => {
  const [apiKey, setApiKey] = useState(initialApiKey);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-all duration-300 ease-out fade-in-up">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gemini API Key Required</h2>
        <p className="text-gray-600 mb-6">
          To power the AI features, please enter your Google Gemini API key. You can get one from Google AI Studio.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
              Your API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter your API key here"
              aria-label="Gemini API Key Input"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            Save and Continue
          </button>
        </div>
         <p className="text-xs text-gray-500 mt-4 text-center">
          Your API key is stored only in your browser's local storage and is never sent to our servers.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;