import React, { useState } from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAccept }) => {
  const [shake, setShake] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShake(true);
      setShowWarning(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  const handleAccept = () => {
    setIsExiting(true);
    setTimeout(() => {
      onAccept();
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
            <span className="font-medium">Please read and accept the disclaimer to continue</span>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-all duration-300 ease-in-out"
        onClick={handleBackdropClick}
      >
        <div 
          className={`bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out ${
            shake ? 'animate-shake border-2 border-red-500' : ''
          } ${
            isExiting ? 'scale-95 opacity-0 -translate-y-4' : 'scale-100 opacity-100 translate-y-0'
          }`}
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Important Disclaimer
            </h2>
            
            <div className="prose prose-sm text-gray-700 mb-6">
              <p className="mb-4">
                The blood sugar impact predictions provided by this app are estimates based on general nutritional principles and should not be used for medical decision-making. Individual responses to foods can vary significantly based on:
              </p>
              
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Metabolic health and insulin sensitivity</li>
                <li>The presence of diabetes or other metabolic conditions</li>
                <li>What other foods are consumed with the measured item</li>
                <li>Physical activity before or after eating</li>
                <li>Time of day, stress levels, and other factors</li>
              </ul>
              
              <p className="font-medium">
                Always consult with healthcare professionals regarding managing your blood sugar and making dietary decisions, especially if you have diabetes or other metabolic conditions.
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleAccept}
                disabled={isExiting}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I Understand and Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DisclaimerModal; 