import React, { useState, useEffect } from 'react';
import ImageUploader from '../components/ImageUploader';
import NutritionForm from '../components/NutritionForm';
import BloodSugarChart from '../components/BloodSugarChart';
import DisclaimerModal from '../components/DisclaimerModal';
import BaselineInputModal from '../components/BaselineInputModal';
import { useScanImage } from '../hooks/useScanImage';
import { calculateBloodSugarImpact } from '../utils/bloodSugarCalculator';
import { defaultNutritionData } from '../utils/ocrProcessor';
import { NutritionData, BloodSugarImpact } from '../types';
import { useSession } from '../contexts/SessionContext';

const Home: React.FC = () => {
  const [entryMode, setEntryMode] = useState<'scan' | 'manual'>('scan');
  const [manualData, setManualData] = useState<NutritionData | null>(null);
  const [manualImpact, setManualImpact] = useState<BloodSugarImpact | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);
  const [showBaselineInput, setShowBaselineInput] = useState<boolean>(false);
  const [showMainContent, setShowMainContent] = useState<boolean>(false);
  
  const { sessionData, setUserBaseline } = useSession();
  
  const {
    isLoading,
    error,
    nutritionData,
    bloodSugarImpact,
    rawOcrText,
    debugInfo,
    scanImage,
    reset
  } = useScanImage();

  // Check session data on component mount
  useEffect(() => {
    if (sessionData.hasCompletedOnboarding && sessionData.userBaseline) {
      // User has already completed onboarding, show main content directly
      setShowMainContent(true);
    } else {
      // User needs to complete onboarding
      setShowDisclaimer(true);
    }
  }, [sessionData]);

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    setShowBaselineInput(true);
  };

  const handleBaselineContinue = (baseline: number) => {
    setUserBaseline(baseline); // This will save to session storage
    setShowBaselineInput(false);
    // Show main content with a smooth fade-in
    setTimeout(() => {
      setShowMainContent(true);
    }, 100);
  };

  const handleNutritionChange = (updatedNutrition: NutritionData) => {
    // Calculate blood sugar impact from manual entries
    setManualData(updatedNutrition);
    const impact = calculateBloodSugarImpact(updatedNutrition);
    setManualImpact(impact);
  };
  
  // Set up manual entry mode
  const startManualEntry = () => {
    setEntryMode('manual');
    setManualData(defaultNutritionData);
    const impact = calculateBloodSugarImpact(defaultNutritionData);
    setManualImpact(impact);
  };
  
  // Switch back to scan mode and reset
  const switchToScanMode = () => {
    setEntryMode('scan');
    reset();
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Disclaimer Modal */}
      <DisclaimerModal 
        isOpen={showDisclaimer} 
        onAccept={handleDisclaimerAccept} 
      />
      
      {/* Baseline Input Modal */}
      <BaselineInputModal
        isOpen={showBaselineInput}
        onContinue={handleBaselineContinue}
      />
      
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ease-in-out ${
        showMainContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Blood Sugar Impact Calculator
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
            Calculate how foods might affect your blood sugar levels
          </p>
          {sessionData.userBaseline && (
            <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 animate-fade-in">
              Your baseline: {sessionData.userBaseline} mg/dL
            </p>
          )}
        </div>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={switchToScanMode}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-all duration-200 ease-in-out transform hover:scale-105 ${
                entryMode === 'scan'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Scan Label
            </button>
            <button
              onClick={startManualEntry}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-all duration-200 ease-in-out transform hover:scale-105 ${
                entryMode === 'manual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {entryMode === 'scan' ? (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-2xl mx-auto transition-all duration-300 ease-in-out">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Scan Food Label
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Take a photo of a nutrition facts label or upload an existing image. We'll analyze
              the carbohydrates, fiber, protein, and fat content to estimate blood sugar impact.
            </p>

            <ImageUploader onImageCaptured={scanImage} isLoading={isLoading} />

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">Processing image...</p>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded animate-fade-in">
                <p>{error}</p>
                <button 
                  onClick={reset}
                  className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors duration-200"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-2xl mx-auto transition-all duration-300 ease-in-out">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Manual Nutrition Entry
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Enter nutrition information manually to calculate potential blood sugar impact.
            </p>
          </div>
        )}

        {/* Show the form and results for scan mode */}
        {entryMode === 'scan' && nutritionData && (
          <>
            <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 max-w-2xl mx-auto animate-fade-in">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Extracted Nutrition Information
              </h2>
              
              <NutritionForm
                nutritionData={nutritionData}
                onNutritionChange={handleNutritionChange}
                isEditable={true}
              />
              
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors duration-200"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug Information
                </button>
              </div>
              
              {showDebug && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fade-in">
                  <h3 className="font-medium text-gray-800 dark:text-white mb-2">Debug Information</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong className="text-gray-800 dark:text-white">Raw OCR Text:</strong>
                      <div className="ml-2 bg-gray-50 dark:bg-gray-600 p-2 rounded break-all font-mono text-xs text-gray-800 dark:text-gray-200">
                        {rawOcrText}
                      </div>
                    </div>
                    
                    <div>
                      <strong className="text-gray-800 dark:text-white">Extracted Lines:</strong>
                      <div className="ml-2 space-y-1">
                        <div>
                          <strong className="text-gray-800 dark:text-white">Total Carbs ({nutritionData?.totalCarbs}g):</strong>
                          <div className="ml-2 bg-gray-50 dark:bg-gray-600 p-1 rounded break-all text-gray-800 dark:text-gray-200">
                            {debugInfo?.extractedLines?.totalCarbs ? 
                              <>Line analysis: "{debugInfo.extractedLines.totalCarbs}"</> : 
                              <span className="text-red-500 dark:text-red-400">No pattern matched</span>
                            }
                          </div>
                        </div>
                        
                        <div>
                          <strong className="text-gray-800 dark:text-white">Protein ({nutritionData?.protein}g):</strong>
                          <div className="ml-2 bg-gray-50 dark:bg-gray-600 p-1 rounded break-all text-gray-800 dark:text-gray-200">
                            {debugInfo?.extractedLines?.protein ? 
                              <>Line analysis: "{debugInfo.extractedLines.protein}"</> : 
                              <span className="text-red-500 dark:text-red-400">No pattern matched</span>
                            }
                          </div>
                        </div>
                        
                        <div>
                          <strong className="text-gray-800 dark:text-white">Fat ({nutritionData?.fat}g):</strong>
                          <div className="ml-2 bg-gray-50 dark:bg-gray-600 p-1 rounded break-all text-gray-800 dark:text-gray-200">
                            {debugInfo?.extractedLines?.fat ? 
                              <>Line analysis: "{debugInfo.extractedLines.fat}"</> : 
                              <span className="text-red-500 dark:text-red-400">No pattern matched</span>
                            }
                          </div>
                        </div>
                        
                        <div>
                          <strong className="text-gray-800 dark:text-white">Calories ({nutritionData?.calories}):</strong>
                          <div className="ml-2 bg-gray-50 dark:bg-gray-600 p-1 rounded break-all text-gray-800 dark:text-gray-200">
                            {debugInfo?.extractedLines?.calories ? 
                              <>Line analysis: "{debugInfo.extractedLines.calories}"</> : 
                              <span className="text-red-500 dark:text-red-400">No pattern matched</span>
                            }
                          </div>
                        </div>
                        
                        <div>
                          <strong className="text-gray-800 dark:text-white">Serving Size ("{nutritionData?.servingSize}"):</strong>
                          <div className="ml-2 bg-gray-50 dark:bg-gray-600 p-1 rounded break-all text-gray-800 dark:text-gray-200">
                            {debugInfo?.extractedLines?.servingSize ? 
                              <>Line analysis: "{debugInfo.extractedLines.servingSize}"</> : 
                              <span className="text-red-500 dark:text-red-400">No pattern matched, using default</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>If the nutrition values aren't being detected correctly, you can:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Try taking a clearer photo with good lighting</li>
                  <li>Make sure the nutrition label is well-centered and not angled</li>
                  <li>Edit the values manually in the form above</li>
                  <li>Check the debug information to see what patterns matched or didn't match</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {entryMode === 'scan' && bloodSugarImpact && (
          <div className="animate-fade-in">
            <BloodSugarChart bloodSugarImpact={bloodSugarImpact} baseline={sessionData.userBaseline} />
          </div>
        )}

        {/* Show the form and results for manual mode */}
        {entryMode === 'manual' && (
          <div className="animate-fade-in">
            <NutritionForm
              nutritionData={manualData}
              onNutritionChange={handleNutritionChange}
              isEditable={true}
            />
          </div>
        )}

        {entryMode === 'manual' && manualImpact && (
          <div className="animate-fade-in">
            <BloodSugarChart bloodSugarImpact={manualImpact} baseline={sessionData.userBaseline} />
          </div>
        )}

        {/* Reset button for scan mode */}
        {entryMode === 'scan' && (nutritionData || bloodSugarImpact) && (
          <div className="mt-6 text-center animate-fade-in">
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 