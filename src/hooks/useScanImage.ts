import { useState, useCallback } from 'react';
import { NutritionData, BloodSugarImpact, Country, LLMExtractionInfo } from '../types';
import { processNutritionLabelWithGoogleVision } from '../utils/googleVisionProcessor';
import { calculateBloodSugarImpact } from '../utils/bloodSugarCalculator';

interface ScanResult {
  nutritionData: NutritionData | null;
  bloodSugarImpact: BloodSugarImpact | null;
  rawOcrText: string | null;
  debugInfo: LLMExtractionInfo | null;
}

interface UseScanImage extends ScanState, ScanResult {
  reset: () => void;
}

export const useScanImage = (): UseScanImage => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [bloodSugarImpact, setBloodSugarImpact] = useState<BloodSugarImpact | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<LLMExtractionInfo | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setNutritionData(null);
    setBloodSugarImpact(null);
    setRawOcrText(null);
    setDebugInfo(null);
  }, []);

  const processNutrition = useCallback((data: NutritionData) => {
    setNutritionData(data);
    const impact = calculateBloodSugarImpact(data);
    setBloodSugarImpact(impact);
  }, []);

  const scanImage = useCallback(async (file: File, country: Country) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await processNutritionLabelWithGoogleVision(file, country);
      setRawOcrText(result.rawText);
      setDebugInfo(result.debugInfo);
      processNutrition(result.nutritionData);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process the image. Please try again with a clearer photo.');
    } finally {
      setIsLoading(false);
    }
  }, [processNutrition]);

  const scanImageFromUrl = useCallback(async (imageUrl: string, country: Country) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await processNutritionLabelWithGoogleVision(imageUrl, country);
      setRawOcrText(result.rawText);
      setDebugInfo(result.debugInfo);
      processNutrition(result.nutritionData);
    } catch (err) {
      console.error('Error processing image from URL:', err);
      setError('Failed to process the image from URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [processNutrition]);

  return {
    isLoading,
    error,
    nutritionData,
    bloodSugarImpact,
    rawOcrText,
    debugInfo,
    reset,
    scanImage,
    scanImageFromUrl
  };
}; 