import { createWorker } from 'tesseract.js';
import { NutritionData, Country } from '../types';
import { extractUKNutritionFromText } from './ukLabelParser';

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
 * Extract numeric value from a line of text with improved pattern matching
 */
const extractNumericValue = (line: string): number | null => {
  // Remove percentage values first
  const withoutPercentage = line.replace(/\d+%/g, '');
  
  // Look for patterns like "calories 90" or "protein 5g" or "fat 2.5g"
  // This handles cases where the value is at the end of the line
  const patterns = [
    /(\d+\.?\d*)\s*g\s*$/i,  // Number followed by 'g' at end of line
    /(\d+\.?\d*)\s*mg\s*$/i, // Number followed by 'mg' at end of line
    /(\d+\.?\d*)\s*$/i,      // Just a number at end of line
    /(\d+\.?\d*)\s*g/i,      // Number followed by 'g' anywhere
    /(\d+\.?\d*)\s*mg/i,     // Number followed by 'mg' anywhere
    /(\d+\.?\d*)/i           // Any number
  ];
  
  for (const pattern of patterns) {
    const match = withoutPercentage.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      // Validate the value is reasonable for nutrition data
      if (value >= 0 && value <= 10000) {
        return value;
      }
    }
  }
  
  return null;
};

/**
 * Extract calories with special handling for nutrition label layout
 */
const extractCalories = (lines: string[]): number | null => {
  // Join all lines into one string for better pattern matching
  const fullText = lines.join(' ');
  
  // Look for calories patterns in the full text
  const caloriesPatterns = [
    /calories.*?(\d+)(?=\s*% daily value)/i,  // Value before % Daily Value (most reliable)
    /calories.*?(\d+)(?=\s*%dv)/i,            // Value before %DV
    /calories.*?(\d+)(?=\s*% daily value)/i,  // Value before %Daily Value
    /calories.*?(\d+)(?=\s*%dailyvalue)/i,    // Value before %DailyValue
    /calories.*?(\d+)(?=\s*% dv)/i,           // Value before % DV
    /calories\s+(\d+)/i,                      // Value right after calories
    /(\d+)\s+calories/i                       // Number followed by calories
  ];
  
  for (const pattern of caloriesPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const value = parseInt(match[1]);
      if (value >= 0 && value <= 10000) {
        return value;
      }
    }
  }
  
  // Fallback: look for calories in individual lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for "calories" in the line
    if (line.includes('calories') && !line.includes('fat')) {
      // First try to find the value in the same line
      const value = extractNumericValue(line);
      if (value !== null) {
        return value;
      }
      
      // If not found in same line, check the next line
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextValue = extractNumericValue(nextLine);
        if (nextValue !== null) {
          return nextValue;
        }
      }
      
      // Check the previous line
      if (i > 0) {
        const prevLine = lines[i - 1];
        const prevValue = extractNumericValue(prevLine);
        if (prevValue !== null) {
          return prevValue;
        }
      }
    }
  }
  
  return null;
};

/**
 * Extract nutrition value with improved pattern matching
 */
const extractNutritionValue = (lines: string[], keywords: string[]): number | null => {
  // Join all lines into one string for better pattern matching
  const fullText = lines.join(' ');
  
  for (const keyword of keywords) {
    // Look for patterns like "keyword 25g" or "25g keyword"
    const patterns = [
      new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g(?=\\s|$)`, 'i'),  // keyword ... number g
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)\\s*g`, 'i'),        // keyword number g
      new RegExp(`(\\d+\\.?\\d*)\\s*g\\s+${keyword}`, 'i'),        // number g keyword
      new RegExp(`${keyword}.*?(\\d+\\.?\\d*)(?=\\s*%|\\s*$|\\s*g)`, 'i'),  // keyword ... number (before % or end)
      new RegExp(`${keyword}.*?o\\s*g`, 'i')  // keyword ... Og (OCR misreading of 0g)
    ];
    
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match) {
        // Special case for "Og" (OCR misreading of 0g)
        if (pattern.toString().includes('o\\s*g')) {
          return 0;
        }
        
        const value = parseFloat(match[1]);
        if (value >= 0 && value <= 10000) {
          return value;
        }
      }
    }
  }
  
  // Fallback: look in individual lines
  for (const line of lines) {
    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        const value = extractNumericValue(line);
        if (value !== null) {
          return value;
        }
      }
    }
  }
  return null;
};

/**
 * Process OCR text to extract nutrition information for US labels
 */
const extractUSNutritionFromText = (text: string): { nutritionData: NutritionData; debugInfo: ExtractionDebugInfo } => {
  const nutrition: NutritionData = { ...defaultNutritionData };
  const debugInfo: ExtractionDebugInfo = {
    extractedLines: {},
    rawText: text
  };

  // Clean and normalize the text
  const cleanedText = cleanOCRText(text);
  const lines = cleanedText.split('\n').filter(line => line.trim());

  console.log('Processing US label lines:', lines);
  console.log('Full cleaned text:', cleanedText);

  // Extract calories with special handling
  const calories = extractCalories(lines);
  if (calories !== null) {
    nutrition.calories = calories;
    debugInfo.extractedLines!.calories = `Found calories: ${calories}`;
  }

  // Extract total carbohydrates
  const totalCarbs = extractNutritionValue(lines, ['total carbohydrate', 'carbohydrate total', 'total carbs']);
  if (totalCarbs !== null) {
    nutrition.totalCarbs = totalCarbs;
    debugInfo.extractedLines!.totalCarbs = `Found total carbs: ${totalCarbs}`;
  }

  // Extract sugars
  const sugars = extractNutritionValue(lines, ['sugars', 'sugar']);
  if (sugars !== null) {
    nutrition.sugars = sugars;
    debugInfo.extractedLines!.sugars = `Found sugars: ${sugars}`;
  }

  // Extract fiber
  const fiber = extractNutritionValue(lines, ['fiber', 'fibre', 'dietary fiber']);
  if (fiber !== null) {
    nutrition.fiber = fiber;
    debugInfo.extractedLines!.fiber = `Found fiber: ${fiber}`;
  }

  // Extract protein
  const protein = extractNutritionValue(lines, ['protein']);
  if (protein !== null) {
    nutrition.protein = protein;
    debugInfo.extractedLines!.protein = `Found protein: ${protein}`;
  }

  // Extract total fat
  const fat = extractNutritionValue(lines, ['total fat', 'fat total']);
  if (fat !== null) {
    nutrition.fat = fat;
    debugInfo.extractedLines!.fat = `Found fat: ${fat}`;
  }

  // Extract serving size
  for (const line of lines) {
    if (line.includes('serving size')) {
      const servingSize = line.replace(/serving size[:\s]*/i, '').trim();
      if (servingSize) {
        nutrition.servingSize = servingSize;
        debugInfo.extractedLines!.servingSize = line;
      }
    }
  }

  console.log('Extracted US nutrition data:', nutrition);
  console.log('Debug info:', debugInfo);
  
  return { nutritionData: nutrition, debugInfo };
};

/**
 * Process OCR text to extract nutrition information based on country
 */
export const extractNutritionFromText = (text: string, country: Country = 'US'): { nutritionData: NutritionData; debugInfo: ExtractionDebugInfo } => {
  switch (country) {
    case 'UK':
      const ukResult = extractUKNutritionFromText(text);
      return {
        nutritionData: ukResult.nutritionData,
        debugInfo: ukResult.debugInfo
      };
    case 'US':
    case 'EU':
    case 'CA':
    default:
      return extractUSNutritionFromText(text);
  }
};

/**
 * Test function to validate the parser with specific OCR text
 */
export const testParserWithText = (text: string, country: Country = 'US') => {
  console.log('Testing parser with text:', text);
  console.log('Country:', country);
  const result = extractNutritionFromText(text, country);
  console.log('Parser result:', result);
  return result;
};

/**
 * Process the image with OCR and extract nutrition information
 */
export const processNutritionLabel = async (imageFile: File | string, country: Country = 'US'): Promise<OCRProcessingResult> => {
  const worker = await createWorker('eng');
  
  try {
    // Process the image with OCR
    const result = await worker.recognize(imageFile);
    const text = result.data.text;
    console.log('Raw OCR text:', text);
    console.log('Processing for country:', country);
    
    // Extract nutrition data from the OCR text based on country
    const { nutritionData, debugInfo } = extractNutritionFromText(text, country);
    
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