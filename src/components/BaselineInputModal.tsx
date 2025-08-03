import React, { useState, useEffect } from 'react';

interface BaselineInputModalProps {
  isOpen: boolean;
  onContinue: (baseline: number) => void;
}

const BaselineInputModal: React.FC<BaselineInputModalProps> = ({ isOpen, onContinue }) => {
  const [baseline, setBaseline] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [shake, setShake] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(true);
      setTimeout(() => setIsEntering(false), 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShake(true);
      setShowWarning(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baselineValue = parseFloat(baseline);
    
    if (!baseline || isNaN(baselineValue)) {
      setError('Please enter a valid blood sugar level');
      return;
    }
    
    if (baselineValue < 50 || baselineValue > 400) {
      setError('Please enter a blood sugar level between 50 and 400 mg/dL');
      return;
    }
    
    setError('');
    setIsExiting(true);
    setTimeout(() => {
      onContinue(baselineValue);
      setIsExiting(false);
    }, 300);
  };

  return (
    <>
      {/* Warning Notification */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Please enter your blood sugar level to continue</span>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out"
        onClick={handleBackdropClick}
      >
        <div 
          className={`bg-white rounded-lg max-w-md w-full transform transition-all duration-300 ease-in-out ${
            shake ? 'animate-shake border-2 border-red-500' : ''
          } ${
            isEntering ? 'scale-95 opacity-0 translate-y-4' : ''
          } ${
            isExiting ? 'scale-95 opacity-0 -translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Enter Your Current Blood Sugar Level
            </h2>
            
            <p className="text-gray-600 mb-6">
              To provide more accurate predictions, please enter your current blood sugar level. 
              This will be used as your baseline for calculating the estimated rise.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="baseline" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Blood Sugar Level (mg/dL)
                </label>
                <input
                  type="number"
                  id="baseline"
                  value={baseline}
                  onChange={(e) => {
                    setBaseline(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g., 120"
                  min="50"
                  max="400"
                  step="1"
                  disabled={isExiting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  autoFocus
                />
                {error && (
                  <p className="mt-1 text-sm text-red-600 animate-pulse">{error}</p>
                )}
              </div>
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isExiting}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </form>
            
            <div className="mt-4 text-xs text-gray-500">
              <p className="mb-2"><strong>Typical ranges:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Normal (fasting): 70-99 mg/dL</li>
                <li>Prediabetes: 100-125 mg/dL</li>
                <li>Diabetes: 126+ mg/dL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BaselineInputModal; 