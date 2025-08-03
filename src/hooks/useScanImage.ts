import { useState, useCallback } from 'react';
import { processNutritionLabelWithGoogleVision, OCRProcessingResult, ExtractionDebugInfo } from '../utils/googleVisionProcessor';
import { calculateBloodSugarImpact } from '../utils/bloodSugarCalculator';
import { NutritionData, BloodSugarImpact, ScanState, Country } from '../types';

interface ScanResult {
  nutritionData: NutritionData | null;
  bloodSugarImpact: BloodSugarImpact | null;
  rawOcrText: string | null;
  debugInfo: ExtractionDebugInfo | null;
}

interface UseScanImage extends ScanState, ScanResult {
  scanImage: (file: File, country: Country) => Promise<void>;
  scanImageFromUrl: (url: string, country: Country) => Promise<void>;
  reset: () => void;
}

export const useScanImage = (): UseScanImage => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [bloodSugarImpact, setBloodSugarImpact] = useState<BloodSugarImpact | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<ExtractionDebugInfo | null>(null);

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
      const result = await processNutritionLabelWithGoogleVision(file, country) as OCRProcessingResult;
      setRawOcrText(result.rawText);
      setDebugInfo(result.debugInfo || null);
      processNutrition(result.nutritionData);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process the image. Please try again with a clearer photo.');
    } finally {
      setIsLoading(false);
    }
  }, [processNutrition]);

  const scanImageFromUrl = useCallback(async (url: string, country: Country) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await processNutritionLabelWithGoogleVision(url, country) as OCRProcessingResult;
      setRawOcrText(result.rawText);
      setDebugInfo(result.debugInfo || null);
      processNutrition(result.nutritionData);
    } catch (err) {
      console.error('Error processing image URL:', err);
      setError('Failed to process the image. Please try again with a different image.');
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
    scanImage,
    scanImageFromUrl,
    reset
  };
}; 