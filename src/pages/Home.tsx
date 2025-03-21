import React, { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import NutritionForm from '../components/NutritionForm';
import BloodSugarChart from '../components/BloodSugarChart';
import { useScanImage } from '../hooks/useScanImage';
import { calculateBloodSugarImpact } from '../utils/bloodSugarCalculator';
import { defaultNutritionData } from '../utils/ocrProcessor';
import { NutritionData, BloodSugarImpact } from '../types';

const Home: React.FC = () => {
  const [entryMode, setEntryMode] = useState<'scan' | 'manual'>('scan');
  const [manualData, setManualData] = useState<NutritionData | null>(null);
  const [manualImpact, setManualImpact] = useState<BloodSugarImpact | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Blood Sugar Impact Calculator
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Calculate how foods might affect your blood sugar levels
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={switchToScanMode}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                entryMode === 'scan'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Scan Label
            </button>
            <button
              onClick={startManualEntry}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                entryMode === 'manual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {entryMode === 'scan' ? (
          <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Scan Food Label
            </h2>
            <p className="mb-4 text-gray-600">
              Take a photo of a nutrition facts label or upload an existing image. We'll analyze
              the carbohydrates, fiber, protein, and fat content to estimate blood sugar impact.
            </p>

            <ImageUploader onImageCaptured={scanImage} isLoading={isLoading} />

            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Processing image...</p>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                <button 
                  onClick={reset}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Manual Nutrition Entry
            </h2>
            <p className="mb-4 text-gray-600">
              Enter nutrition information manually to calculate potential blood sugar impact.
            </p>
          </div>
        )}

        {/* Show the form and results for scan mode */}
        {entryMode === 'scan' && nutritionData && (
          <>
            <NutritionForm
              nutritionData={nutritionData}
              onNutritionChange={handleNutritionChange}
              isEditable={true}
            />
            
            {/* Debug toggle button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded-md hover:bg-gray-300"
              >
                {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>
            
            {/* Debug OCR section */}
            {showDebug && rawOcrText && (
              <div className="mt-4 bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">OCR Debug Information</h2>
                <div className="border border-gray-300 rounded-md p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Raw OCR Text:</h3>
                  <pre className="text-xs overflow-auto max-h-40 bg-gray-50 p-2 rounded">
                    {rawOcrText}
                  </pre>
                </div>
                
                {/* Pattern matching debug info */}
                {debugInfo && (
                  <div className="mt-4 border border-gray-300 rounded-md p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Pattern Matching Details:</h3>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div>
                        <strong>Total Carbs ({nutritionData?.totalCarbs}g):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.carbsPattern ? 
                            <>Pattern: <code>{debugInfo.carbsPattern}</code></> : 
                            debugInfo.extractedLines?.carbs ? 
                              <>Line analysis: "{debugInfo.extractedLines.carbs}"</> : 
                              <span className="text-red-500">No pattern matched</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <strong>Sugars ({nutritionData?.sugars}g):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.sugarsPattern ? 
                            <>Pattern: <code>{debugInfo.sugarsPattern}</code></> : 
                            debugInfo.extractedLines?.sugars ? 
                              <>Line analysis: "{debugInfo.extractedLines.sugars}"</> : 
                              <span className="text-red-500">No pattern matched</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <strong>Fiber ({nutritionData?.fiber}g):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.fiberPattern ? 
                            <>Pattern: <code>{debugInfo.fiberPattern}</code></> : 
                            debugInfo.extractedLines?.fiber ? 
                              <>Line analysis: "{debugInfo.extractedLines.fiber}"</> : 
                              <span className="text-red-500">No pattern matched</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <strong>Protein ({nutritionData?.protein}g):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.proteinPattern ? 
                            <>Pattern: <code>{debugInfo.proteinPattern}</code></> : 
                            <span className="text-red-500">No pattern matched</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <strong>Fat ({nutritionData?.fat}g):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.fatPattern ? 
                            <>Pattern: <code>{debugInfo.fatPattern}</code></> : 
                            <span className="text-red-500">No pattern matched</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <strong>Calories ({nutritionData?.calories}):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.caloriesPattern ? 
                            <>Pattern: <code>{debugInfo.caloriesPattern}</code></> : 
                            <span className="text-red-500">No pattern matched</span>
                          }
                        </div>
                      </div>
                      
                      <div>
                        <strong>Serving Size ("{nutritionData?.servingSize}"):</strong>
                        <div className="ml-2 bg-gray-50 p-1 rounded break-all">
                          {debugInfo.servingSizePattern ? 
                            <>Pattern: <code>{debugInfo.servingSizePattern}</code></> : 
                            debugInfo.extractedLines?.servingSize ? 
                              <>Line analysis: "{debugInfo.extractedLines.servingSize}"</> : 
                              <span className="text-red-500">No pattern matched, using default</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>If the nutrition values aren't being detected correctly, you can:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Try taking a clearer photo with good lighting</li>
                    <li>Make sure the nutrition label is well-centered and not angled</li>
                    <li>Edit the values manually in the form above</li>
                    <li>Check the debug information to see what patterns matched or didn't match</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {entryMode === 'scan' && bloodSugarImpact && (
          <BloodSugarChart bloodSugarImpact={bloodSugarImpact} />
        )}

        {/* Show the form and results for manual mode */}
        {entryMode === 'manual' && (
          <NutritionForm
            nutritionData={manualData}
            onNutritionChange={handleNutritionChange}
            isEditable={true}
          />
        )}

        {entryMode === 'manual' && manualImpact && (
          <BloodSugarChart bloodSugarImpact={manualImpact} />
        )}

        {/* Reset button for scan mode */}
        {entryMode === 'scan' && (nutritionData || bloodSugarImpact) && (
          <div className="mt-6 text-center">
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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