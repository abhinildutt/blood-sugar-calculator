import { createWorker } from 'tesseract.js';
import { NutritionData } from '../types';

/**
 * Default nutrition data with zero values
 */
export const defaultNutritionData: NutritionData = {
  totalCarbs: 0,
  sugars: 0,
  fiber: 0,
  protein: 0,
  fat: 0,
  calories: 0,
  servingSize: '1 serving'
};

/**
 * Return type for OCR processing
 */
export interface OCRProcessingResult {
  rawText: string;
  nutritionData: NutritionData;
  debugInfo?: ExtractionDebugInfo;
}

/**
 * Debug information for extraction process
 */
export interface ExtractionDebugInfo {
  extractedLines?: {
    [key: string]: string;
  };
  rawText?: string;
}

/**
 * Clean up common OCR misrecognitions
 */
const cleanOCRText = (text: string): string => {
  return text
    .toLowerCase()
    // Fix common OCR misreadings
    .replace(/(\d+)(\s*)o(\s*)g/g, '$1$20$3g') // Fix "0g" being read as "og"
    .replace(/(\d+)(\s*)q(\s*)g/g, '$1$2g$3g')  // Fix "g" being read as "q"
    .replace(/[^\S\r\n]+/g, ' ')  // Normalize whitespace
    .replace(/(\d+)[.,](\d+)/g, '$1.$2'); // Normalize decimal points
};

/**
 * Extract numeric value from a line of text
 */
const extractNumericValue = (line: string): number | null => {
  // Remove percentage values
  const withoutPercentage = line.replace(/\d+%/, '');
  
  // Find numbers, including decimals
  const match = withoutPercentage.match(/(\d+\.?\d*)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
};

/**
 * Process OCR text to extract nutrition information
 */
export const extractNutritionFromText = (text: string): { nutritionData: NutritionData; debugInfo: ExtractionDebugInfo } => {
  const nutrition: NutritionData = { ...defaultNutritionData };
  const debugInfo: ExtractionDebugInfo = {
    extractedLines: {},
    rawText: text
  };

  // Clean and normalize the text
  const cleanedText = cleanOCRText(text);
  const lines = cleanedText.split('\n');

  // Process each line
  for (const line of lines) {
    // Skip empty lines and daily value percentages
    if (!line.trim() || line.includes('daily value')) continue;

    // Extract calories
    if (line.includes('calories') && !line.includes('fat')) {
      const value = extractNumericValue(line);
      if (value !== null) {
        nutrition.calories = value;
        debugInfo.extractedLines!.calories = line;
      }
    }

    // Extract total carbohydrates
    if (line.includes('total carbohydrate') || line.includes('carbohydrate total')) {
      const value = extractNumericValue(line);
      if (value !== null) {
        nutrition.totalCarbs = value;
        debugInfo.extractedLines!.totalCarbs = line;
      }
    }

    // Extract sugars
    if (line.includes('sugars') && !line.includes('added')) {
      const value = extractNumericValue(line);
      if (value !== null) {
        nutrition.sugars = value;
        debugInfo.extractedLines!.sugars = line;
      }
    }

    // Extract fiber
    if (line.includes('fiber') || line.includes('fibre')) {
      const value = extractNumericValue(line);
      if (value !== null) {
        nutrition.fiber = value;
        debugInfo.extractedLines!.fiber = line;
      }
    }

    // Extract protein
    if (line.includes('protein')) {
      const value = extractNumericValue(line);
      if (value !== null) {
        nutrition.protein = value;
        debugInfo.extractedLines!.protein = line;
      }
    }

    // Extract total fat
    if (line.includes('total fat')) {
      const value = extractNumericValue(line);
      if (value !== null) {
        nutrition.fat = value;
        debugInfo.extractedLines!.fat = line;
      }
    }

    // Extract serving size
    if (line.includes('serving size')) {
      const servingSize = line.replace(/serving size[:\s]*/i, '').trim();
      if (servingSize) {
        nutrition.servingSize = servingSize;
        debugInfo.extractedLines!.servingSize = line;
      }
    }
  }

  console.log('Extracted nutrition data:', nutrition);
  console.log('Debug info:', debugInfo);
  
  return { nutritionData: nutrition, debugInfo };
};

/**
 * Process the image with OCR and extract nutrition information
 */
export const processNutritionLabel = async (imageFile: File | string): Promise<OCRProcessingResult> => {
  const worker = await createWorker('eng');
  
  try {
    // Process the image with OCR
    const result = await worker.recognize(imageFile);
    const text = result.data.text;
    console.log('Raw OCR text:', text);
    
    // Extract nutrition data from the OCR text
    const { nutritionData, debugInfo } = extractNutritionFromText(text);
    
    return {
      rawText: text,
      nutritionData,
      debugInfo
    };
  } finally {
    // Always terminate the worker to free resources
    await worker.terminate();
  }
}; 