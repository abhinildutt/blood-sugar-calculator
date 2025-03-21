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
  carbsPattern?: string;
  sugarsPattern?: string;
  fiberPattern?: string;
  proteinPattern?: string;
  fatPattern?: string;
  caloriesPattern?: string;
  servingSizePattern?: string;
  extractedLines?: {
    carbs?: string;
    sugars?: string;
    fiber?: string;
    servingSize?: string;
  };
}

/**
 * Extract numeric value from a text string
 * E.g. "Total Carbohydrates 27g" -> 27
 */
const extractNumericValue = (text: string): number => {
  const match = text.match(/\b(\d+(\.\d+)?)\s*g?\b/);
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Process OCR text to extract nutrition information
 */
export const extractNutritionFromText = (text: string): { nutritionData: NutritionData; debugInfo: ExtractionDebugInfo } => {
  // Convert to lowercase and normalize whitespace
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  
  // Preprocessing: Fix common OCR misrecognitions
  // Replace common "9" after numbers that should be "g" for grams
  let processedText = normalizedText.replace(/(\d+)(\s*)(9)(\s|$)/g, '$1$2g$4');
  // Also handle cases where OCR reads "g9" or "g0" as a mistake
  processedText = processedText.replace(/(\d+)(\s*)(g9|g0)(\s|$)/g, '$1$2g$4');
  
  console.log('OCR Text before preprocessing:', normalizedText);
  console.log('OCR Text after preprocessing:', processedText);
  
  // Initialize with default values
  const nutrition: NutritionData = { ...defaultNutritionData };
  const debugInfo: ExtractionDebugInfo = {
    extractedLines: {}
  };
  
  // Extract total carbohydrates - improved pattern to match various formats
  const carbPatterns = [
    // Standard formats
    /(?:total )?carbohydrates?[^\n\d]*([\d\.]+)\s*g/i,
    /carbs?[^\n\d]*([\d\.]+)\s*g/i,
    /total carbs?(?:[^\n\d]*)([\d\.]+)/i,
    /carbohydrates?(?:[^\n\d]*)([\d\.]+)/i,
    
    // Format with colon or equals
    /(?:total )?carbohydrates?[\s]*?[:=][\s]*?([\d\.]+)/i,
    /(?:total )?carbs?[\s]*?[:=][\s]*?([\d\.]+)/i,
    
    // With "total" in various positions
    /total[\s]*carbohydrates?(?:[^\n\d]*)([\d\.]+)/i,
    /total[\s]*carbs?(?:[^\n\d]*)([\d\.]+)/i,
    
    // Common OCR misreadings
    /(?:total )?c.?arbohydrates?(?:[^\n\d]*)([\d\.]+)/i,
    /(?:total )?ca.?rbs?(?:[^\n\d]*)([\d\.]+)/i,
    
    // Handle patterns where "g" is misrecognized as "9"
    /(?:total )?carbohydrates?[^\n\d]*([\d\.]+)\s*9/i,
    /carbs?[^\n\d]*([\d\.]+)\s*9/i,
    
    // Broader patterns as last resort
    /carbs?.*?([\d\.]+)/i,
    /carbohydrate.*?([\d\.]+)/i
  ];
  
  for (const pattern of carbPatterns) {
    const carbMatches = processedText.match(pattern);
    if (carbMatches) {
      nutrition.totalCarbs = parseFloat(carbMatches[1]);
      debugInfo.carbsPattern = pattern.toString();
      console.log('Found total carbs:', nutrition.totalCarbs, 'using pattern:', pattern);
      break;
    }
  }
  
  // If we still couldn't find carbs, try looking for lines that contain carbohydrate-related terms
  if (nutrition.totalCarbs === 0) {
    const lines = processedText.split('\n');
    for (const line of lines) {
      if ((line.includes('carb') || line.includes('carbohydrate')) && !line.includes('net')) {
        const numbers = line.match(/(\d+(\.\d+)?)/g);
        if (numbers && numbers.length > 0) {
          nutrition.totalCarbs = parseFloat(numbers[0]);
          debugInfo.extractedLines!.carbs = line;
          console.log('Found carbs from line analysis:', nutrition.totalCarbs, 'in line:', line);
          break;
        }
      }
    }
  }
  
  // Extract sugars - improved pattern
  const sugarPatterns = [
    // Prioritize "Total Sugar" formats
    /total sugar[s]?[^\n\d]*([\d\.]+)\s*g/i,
    /total sugar[s]?(?:[^\n\d]*)([\d\.]+)/i,
    /total sugar[s]?[\s]*?[:=][\s]*?([\d\.]+)/i,
    
    // Add patterns for misrecognized "g" as "9"
    /total sugar[s]?[^\n\d]*([\d\.]+)\s*9/i,
    /sugar[s]?[^\n\d]*([\d\.]+)\s*9/i,
    
    // Standard formats
    /sugars?[^\n\d]*([\d\.]+)\s*g/i,
    /(?:total )?sugars?(?:[^\n\d]*)([\d\.]+)/i,
    /(?:of which )?sugars?(?:[^\n\d]*)([\d\.]+)/i,
    /sugars?(?:[^\n\d]*)([\d\.]+)/i,
    
    // More specific formats with context
    /(?:added )?sugars?[\s:]*?([\d\.]+)(?:\s*g)/i,
    /(?:incl\.|includes|including)? (?:added )?sugars?[\s:]*?([\d\.]+)(?:\s*g)?/i,
    
    // Format with colon or equals
    /sugars?[\s]*?[:=][\s]*?([\d\.]+)/i,
    
    // Common OCR misreadings
    /sugar s?(?:[^\n\d]*)([\d\.]+)/i,
    /suga rs?(?:[^\n\d]*)([\d\.]+)/i,
    /su gars?(?:[^\n\d]*)([\d\.]+)/i,
    
    // Look for sugar value with various units
    /sugars?.*?([\d\.]+)\s*(?:g|grams|9)/i,
    
    // Broader pattern as last resort
    /sugar.*?([\d\.]+)/i
  ];
  
  for (const pattern of sugarPatterns) {
    const sugarMatches = processedText.match(pattern);
    if (sugarMatches) {
      nutrition.sugars = parseFloat(sugarMatches[1]);
      debugInfo.sugarsPattern = pattern.toString();
      console.log('Found sugars:', nutrition.sugars, 'using pattern:', pattern);
      break;
    }
  }
  
  // If we still couldn't find sugar, try looking for lines that contain "sugar" and extract numbers
  if (nutrition.sugars === 0) {
    const lines = processedText.split('\n');
    for (const line of lines) {
      // Prioritize lines containing "total sugar"
      if (line.includes('total sugar')) {
        const numbers = line.match(/(\d+(\.\d+)?)/g);
        if (numbers && numbers.length > 0) {
          nutrition.sugars = parseFloat(numbers[0]);
          debugInfo.extractedLines!.sugars = line;
          console.log('Found total sugars from line analysis:', nutrition.sugars, 'in line:', line);
          break;
        }
      }
    }
    
    // If still not found, try with just "sugar"
    if (nutrition.sugars === 0) {
      for (const line of lines) {
        if (line.includes('sugar') && !line.includes('alcohol') && !line.includes('free')) {
          const numbers = line.match(/(\d+(\.\d+)?)/g);
          if (numbers && numbers.length > 0) {
            nutrition.sugars = parseFloat(numbers[0]);
            debugInfo.extractedLines!.sugars = line;
            console.log('Found sugars from line analysis:', nutrition.sugars, 'in line:', line);
            break;
          }
        }
      }
    }
  }
  
  // Extract dietary fiber - improved pattern
  const fiberPatterns = [
    // Standard formats - more precise to avoid false positives
    /(?:dietary |total )?fiber[^\n\d]*([\d\.]+)\s*g/i,
    /(?:dietary |total )?fibre[^\n\d]*([\d\.]+)\s*g/i,
    
    // More specific patterns to avoid false positives
    /(?:^|[^\w])(?:dietary |total )?fiber(?:[^\w\d]*)([\d\.]+)/i,
    /(?:^|[^\w])(?:dietary |total )?fibre(?:[^\w\d]*)([\d\.]+)/i,
    
    // Add patterns for misrecognized "g" as "9"
    /(?:dietary |total )?fiber[^\n\d]*([\d\.]+)\s*9/i,
    /(?:dietary |total )?fibre[^\n\d]*([\d\.]+)\s*9/i,
    
    // Format with colon or equals - more restrictive
    /(?:dietary |total )?fiber[\s]*?[:=][\s]*?([\d\.]+)(?:\s*g)?/i,
    /(?:dietary |total )?fibre[\s]*?[:=][\s]*?([\d\.]+)(?:\s*g)?/i
  ];
  
  let fiberFound = false;
  for (const pattern of fiberPatterns) {
    const fiberMatches = processedText.match(pattern);
    if (fiberMatches) {
      nutrition.fiber = parseFloat(fiberMatches[1]);
      debugInfo.fiberPattern = pattern.toString();
      console.log('Found fiber:', nutrition.fiber, 'using pattern:', pattern);
      fiberFound = true;
      break;
    }
  }
  
  // Only use line analysis if we have strong indicators of fiber content
  if (!fiberFound) {
    const fiberIndicators = [
      'dietary fiber', 
      'total fiber', 
      'fiber content',
      'fibre',
      'dietary fibre'
    ];
    
    // Check for phrases that indicate fiber is NOT present
    const noFiberPhrases = [
      'not a significant source of',
      'not a source of',
      'contains 0g',
      '0% daily',
      'contains no',
      'less than',
      '0 g'
    ];
    
    // Check if the text contains any indication that fiber is absent
    const textContainsNoFiberIndicator = noFiberPhrases.some(phrase => {
      const phraseIndex = processedText.indexOf(phrase);
      if (phraseIndex === -1) return false;
      
      // Look within 50 characters of the phrase for "fiber" or "fibre"
      const searchText = processedText.substring(
        phraseIndex, 
        Math.min(phraseIndex + phrase.length + 50, processedText.length)
      );
      return searchText.includes('fiber') || searchText.includes('fibre');
    });
    
    // If we find explicit indication that fiber is not present, keep it at 0
    if (textContainsNoFiberIndicator) {
      console.log('Found indication that product contains no significant fiber, keeping at 0');
      // Add debug info to show why fiber is 0
      debugInfo.extractedLines!.fiber = 'Product contains no significant fiber';
      return { nutritionData: nutrition, debugInfo };
    }
    
    let foundFiberLine = false;
    const lines = processedText.split('\n');
    
    // First pass: look for exact fiber indicators
    for (const line of lines) {
      // Skip lines containing "not a significant source" or similar phrases
      if (noFiberPhrases.some(phrase => line.includes(phrase)) && 
          (line.includes('fiber') || line.includes('fibre'))) {
        console.log('Skipping line indicating no fiber content:', line);
        continue;
      }
      
      const containsIndicator = fiberIndicators.some(indicator => 
        line.includes(indicator)
      );
      
      if (containsIndicator) {
        const numbers = line.match(/(\d+(\.\d+)?)/g);
        if (numbers && numbers.length > 0) {
          nutrition.fiber = parseFloat(numbers[0]);
          debugInfo.extractedLines!.fiber = line;
          console.log('Found fiber from line analysis with indicator:', nutrition.fiber, 'in line:', line);
          foundFiberLine = true;
          break;
        }
      }
    }
    
    // Second pass: look for the standalone word "fiber" but be more cautious
    if (!foundFiberLine) {
      const fiberLineRegex = /\b(?:fiber|fibre)\b(?![a-z])/i;
      for (const line of lines) {
        // Skip lines containing "not a significant source" or similar phrases
        if (noFiberPhrases.some(phrase => line.includes(phrase))) {
          console.log('Skipping line with "not a significant source" or similar:', line);
          continue;
        }
        
        if (fiberLineRegex.test(line) && 
            !line.includes('sugar') && 
            !line.includes('carb') && 
            !line.includes('protein')) {
          
          const numbers = line.match(/(\d+(\.\d+)?)/g);
          if (numbers && numbers.length > 0) {
            nutrition.fiber = parseFloat(numbers[0]);
            debugInfo.extractedLines!.fiber = line;
            console.log('Found fiber from line analysis with standalone word:', nutrition.fiber, 'in line:', line);
            break;
          }
        }
      }
    }
    
    // If we still don't have a clear fiber indicator, don't set a value (leave at 0)
    if (nutrition.fiber === 0) {
      console.log('No clear fiber information found in label, leaving at 0');
    }
  }
  
  // Extract protein
  const proteinPatterns = [
    /protein[^\n\d]*([\d\.]+)\s*g/i,
    /protein(?:[^\n\d]*)([\d\.]+)/i,
    // Add pattern for misrecognized "g" as "9"
    /protein[^\n\d]*([\d\.]+)\s*9/i
  ];
  
  for (const pattern of proteinPatterns) {
    const proteinMatches = processedText.match(pattern);
    if (proteinMatches) {
      nutrition.protein = parseFloat(proteinMatches[1]);
      debugInfo.proteinPattern = pattern.toString();
      console.log('Found protein:', nutrition.protein, 'using pattern:', pattern);
      break;
    }
  }
  
  // Extract total fat
  const fatPatterns = [
    /(?:total )?fat[^\n\d]*([\d\.]+)\s*g/i,
    /(?:total )?fat(?:[^\n\d]*)([\d\.]+)/i,
    // Add pattern for misrecognized "g" as "9"
    /(?:total )?fat[^\n\d]*([\d\.]+)\s*9/i
  ];
  
  for (const pattern of fatPatterns) {
    const fatMatches = processedText.match(pattern);
    if (fatMatches) {
      nutrition.fat = parseFloat(fatMatches[1]);
      debugInfo.fatPattern = pattern.toString();
      console.log('Found fat:', nutrition.fat, 'using pattern:', pattern);
      break;
    }
  }
  
  // Extract calories
  const caloriePatterns = [
    /calories?[^\n\d]*([\d\.]+)/i,
    /calories?(?:[^\n\d]*)([\d\.]+)/i,
    /energy[^\n\d]*([\d\.]+)\s*kcal/i
  ];
  
  for (const pattern of caloriePatterns) {
    const calorieMatches = processedText.match(pattern);
    if (calorieMatches) {
      nutrition.calories = parseFloat(calorieMatches[1]);
      debugInfo.caloriesPattern = pattern.toString();
      console.log('Found calories:', nutrition.calories, 'using pattern:', pattern);
      break;
    }
  }
  
  // Extract serving size - improved pattern matching
  const servingSizePatterns = [
    // Standard formats
    /serving size[^\n:]*([\w\d\s\.\,\/\(\)]+?)(?:\.|about|\(|$)/i,
    /serving size[:=\s]+([\w\d\s\.\,\/\(\)]+?)(?:\.|about|\(|$)/i,
    
    // Format with container info
    /serving size[^\n]*([\w\d\s\.\,\/\(\)]+?)\s*[\.,]\s*(?:servings|contains|about)/i,
    /serving size[^\n]*([\w\d\s\.\,\/\(\)]+?)\s*[\.,]\s*(?:servings|contains|about)/i,
    
    // Very specific pattern with common measurements
    /serving size[^\n:]*?(\d+[\s\.]*(?:g|ml|oz|cup|tbsp|tsp|piece|packet|pouch|container|bottle|can)[s]?)/i,
    
    // Very broad pattern as last resort
    /serving size.*?([^\.]{2,30})/i
  ];
  
  let servingSizeFound = false;
  for (const pattern of servingSizePatterns) {
    const servingSizeMatches = processedText.match(pattern);
    if (servingSizeMatches && servingSizeMatches[1]) {
      // Cleanup the captured serving size by removing extra spaces and problematic characters
      let servingSize = servingSizeMatches[1].trim();
      // Remove any trailing periods, commas or other punctuation marks
      servingSize = servingSize.replace(/[.,;:]$/, '').trim();
      
      nutrition.servingSize = servingSize;
      debugInfo.servingSizePattern = pattern.toString();
      console.log('Found serving size:', nutrition.servingSize, 'using pattern:', pattern);
      servingSizeFound = true;
      break;
    }
  }
  
  // If pattern matching failed, try line analysis
  if (!servingSizeFound) {
    const lines = processedText.split('\n');
    for (const line of lines) {
      if (line.includes('serving size') || line.includes('servings:') || line.match(/^serving\s/i)) {
        // Clean up the line by removing "serving size" text
        let servingSize = line.replace(/serving size[:=]?/i, '').trim();
        // If the line looks too long, try to get just the relevant part
        if (servingSize.length > 30) {
          const measurementMatch = servingSize.match(/(\d+[\s\.]*(?:g|ml|oz|cup|tbsp|tsp|piece|packet|pouch|container|bottle|can)[s]?)/i);
          if (measurementMatch) {
            servingSize = measurementMatch[1];
          } else {
            // Take the first 30 characters only if too long
            servingSize = servingSize.substring(0, 30);
          }
        }
        
        nutrition.servingSize = servingSize.trim();
        debugInfo.extractedLines!.servingSize = line;
        console.log('Found serving size from line analysis:', nutrition.servingSize, 'in line:', line);
        break;
      }
    }
  }
  
  // If we still couldn't find a serving size, look for "per" statements
  if (!servingSizeFound && nutrition.servingSize === '1 serving') {
    const perMatches = processedText.match(/per\s+(\d+\s*(?:g|ml|oz|cup|tbsp|tsp|piece|packet|pouch|container|bottle|can)[s]?)/i);
    if (perMatches) {
      nutrition.servingSize = perMatches[1].trim();
      console.log('Found serving size from "per" statement:', nutrition.servingSize);
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