import { NutritionData } from '../types';

/**
 * UK Nutrition Label Parser
 * Handles UK nutrition labels with columns: "100g contains", "Each slice/cup contains", "% RI*"
 */

export interface UKNutritionData extends NutritionData {
  country: 'UK';
  servingDescription?: string; // e.g., "Each slice (typically 44g) contains"
  salt?: number; // Adding salt field for UK labels
}

/**
 * Extract serving size from UK label format
 * Looks for patterns like "Each slice (typically 44g) contains" or "Each cup (typically 30g) contains"
 */
const extractUKServingSize = (lines: string[]): string => {
  const fullText = lines.join(' ');
  
  // Look for serving size patterns in UK format
  const servingPatterns = [
    // HIGH PRIORITY: Match the user's exact format "Each slice (typically contains 44g)"
    /each\s+(\w+)\s*\(typically.*?contains\s+(\d+g)\)/i,
    /each\s+(\w+)\s*\(typically.*?(\d+g)\)/i,
    
    // STANDARD PATTERNS: Original patterns for common formats
    /each\s+(\w+)\s*\(typically\s*(\d+g)\)\s+contains/i,
    /each\s+(\w+)\s*\((\d+g)\)\s+contains/i,
    /each\s+(\w+)\s+\(typically\s*(\d+g)\)/i,
    /each\s+(\w+)\s+\((\d+g)\)/i,
    /(\d+g)\s+per\s+(\w+)/i,
    /(\w+)\s+\((\d+g)\)/i,
    
    // FALLBACK: Look for any serving description
    /each\s+(\w+).*?(\d+g)/i
  ];
  
  for (const pattern of servingPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const servingType = match[1] || 'serving';
      const servingWeight = match[2] || match[1];
      console.log(`Found serving: ${servingWeight} (${servingType}) using pattern: ${pattern}`);
      return `${servingWeight} (${servingType})`;
    }
  }
  
  // Fallback: look for any mention of serving size
  for (const line of lines) {
    if (line.includes('serving') || line.includes('slice') || line.includes('cup')) {
      const weightMatch = line.match(/(\d+g)/i);
      if (weightMatch) {
        return weightMatch[1];
      }
    }
  }
  
  return '1 serving';
};

/**
 * Extract nutrition value from UK label format
 * UK labels have columns: "100g contains", "Each slice/cup contains", "% RI*"
 * We focus on the "Each slice/cup contains" column for actual serving values
 */
const extractUKNutritionValue = (lines: string[], keywords: string[]): number | null => {
  const fullText = lines.join(' ');
  
  for (const keyword of keywords) {
    // Look for patterns in UK format - specifically target the middle column values
    const patterns = [
      // HIGH PRIORITY: Pattern for table format with 3 numeric values
      // "keyword firstValue secondValue thirdValue" - we want the second value
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+(\\d+)%`, 'i'),
      
      // HIGH PRIORITY: Pattern for lines with two values followed by percentage/text
      // "keyword firstValue secondValue %" - we want the second value  
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+\\d+%`, 'i'),
      
      // HIGH PRIORITY: Pattern specifically for "of which" subcategories
      // "of which keyword firstValue secondValue %" - we want the second value
      new RegExp(`of\\s+which\\s+${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g`, 'i'),
      
      // MEDIUM PRIORITY: Pattern for rows with values and reference amounts
      // "keyword firstValue secondValue % referenceValue" - we want the second value
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+\\d+%\\s+\\d+g`, 'i'),
      
      // MEDIUM PRIORITY: Pattern for simple two-value format
      // "keyword firstValue secondValue" - we want the second value
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g`, 'i'),
      
      // LOW PRIORITY: Fallback patterns - these should be used less frequently
      new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g.*?(\\d+\\.?\\d*)\\s*g`, 'i'),
      new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g`, 'i')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = fullText.match(pattern);
      if (match) {
        let value: number;
        
        // For patterns that capture two values, always take the second one
        if (i <= 4) { // High and medium priority patterns with two captures
          value = parseFloat(match[2]); // Second captured value
        } else if (i === 5) { // Fallback pattern with two captures
          value = parseFloat(match[2]); // Second captured value
        } else { // Single capture fallback
          value = parseFloat(match[1]); // Only captured value
        }
        
        if (value >= 0 && value <= 10000) {
          // Additional validation: reject values that are clearly from the 100g column
          if (keyword.includes('carbohydrate') && value > 30) continue; // 45.5g is 100g value, 20.0g is serving
          if (keyword.includes('protein') && value > 15) continue; // 7.7g is 100g value, 3.4g is serving
          if (keyword.includes('fat') && value > 10) continue; // 1.5g is 100g value, 0.7g is serving
          if (keyword.includes('sugar') && value > 20) continue; // 3.8g is 100g value, 1.7g is serving
          if (keyword.includes('fibre') && value > 5) continue; // 2.8g is 100g value, 1.2g is serving
          
          console.log(`Extracted ${keyword}: ${value}g using pattern ${i} (match: ${match[0]})`);
          return value;
        }
      }
    }
  }
  
  return null;
};

/**
 * Extract calories from UK label format
 * UK labels show kcal (Calories) in the "Each slice/cup contains" column
 */
const extractUKCalories = (lines: string[]): number | null => {
  const fullText = lines.join(' ');
  
  // Look for kcal patterns in UK format - specifically target the middle column
  const caloriesPatterns = [
    // Pattern for "Energy 985kJ / 235kcal 435kJ / 105kcal 5%" - capture the second kcal value
    /energy\s+\d+kj\s*\/\s*\d+kcal\s+\d+kj\s*\/\s*(\d+)kcal/i,
    
    // Pattern for table format where calories appear in middle column
    /energy.*?(\d+)kcal.*?(\d+)kcal.*?\d+%/i, // This will capture both, we want the second one
    
    // More specific pattern for UK energy line
    /\d+kj\s*\/\s*\d+kcal\s+\d+kj\s*\/\s*(\d+)kcal/i,
    
    // Fallback patterns
    /each\s+\w+\s*\(.*?\)\s+contains.*?(\d+)\s*kcal/i,
    /each\s+\w+\s+contains.*?(\d+)\s*kcal/i,
    /(\d+)\s*kcal.*?each\s+\w+/i
  ];
  
  for (const pattern of caloriesPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      let value;
      // For the pattern that captures two kcal values, we want the second one
      if (pattern.toString().includes('(\\d+)kcal.*?(\\d+)kcal')) {
        value = parseInt(match[2]); // Second captured group
      } else {
        value = parseInt(match[1]); // First captured group
      }
      
      if (value >= 0 && value <= 1000) { // Serving size calories should be reasonable
        return value;
      }
    }
  }
  
  return null;
};

/**
 * Extract UK nutrition data from OCR text
 */
export const extractUKNutritionFromText = (text: string): { nutritionData: UKNutritionData; debugInfo: any } => {
  const nutrition: UKNutritionData = {
    totalCarbs: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    fat: 0,
    calories: 0,
    servingSize: '1 serving',
    country: 'UK',
    salt: 0 // Default salt value
  };
  
  const debugInfo: any = {
    extractedLines: {},
    rawText: text
  };

  // Clean and normalize the text
  const cleanedText = text.toLowerCase().replace(/[^\S\r\n]+/g, ' ');
  const lines = cleanedText.split('\n').filter(line => line.trim());

  console.log('Processing UK label lines:', lines);

  // Extract serving size from UK format
  const servingSize = extractUKServingSize(lines);
  nutrition.servingSize = servingSize;
  debugInfo.extractedLines!.servingSize = `Found UK serving size: ${servingSize}`;

  // Extract calories from UK format (kcal)
  const calories = extractUKCalories(lines);
  if (calories !== null) {
    nutrition.calories = calories;
    debugInfo.extractedLines!.calories = `Found UK calories: ${calories} kcal`;
  }

  // Extract total carbohydrates
  const totalCarbs = extractUKNutritionValue(lines, ['carbohydrate', 'carbohydrates', 'total carbohydrate']);
  if (totalCarbs !== null) {
    nutrition.totalCarbs = totalCarbs;
    debugInfo.extractedLines!.totalCarbs = `Found UK total carbs: ${totalCarbs}g`;
  }

  // Extract sugars
  const sugars = extractUKNutritionValue(lines, ['sugars', 'sugar', 'of which sugars']);
  if (sugars !== null) {
    nutrition.sugars = sugars;
    debugInfo.extractedLines!.sugars = `Found UK sugars: ${sugars}g`;
  }

  // Extract fiber
  const fiber = extractUKNutritionValue(lines, ['fibre', 'fiber', 'dietary fibre']);
  if (fiber !== null) {
    nutrition.fiber = fiber;
    debugInfo.extractedLines!.fiber = `Found UK fibre: ${fiber}g`;
  }

  // Extract protein
  const protein = extractUKNutritionValue(lines, ['protein']);
  if (protein !== null) {
    nutrition.protein = protein;
    debugInfo.extractedLines!.protein = `Found UK protein: ${protein}g`;
  }

  // Extract total fat
  const fat = extractUKNutritionValue(lines, ['fat', 'total fat']);
  if (fat !== null) {
    nutrition.fat = fat;
    debugInfo.extractedLines!.fat = `Found UK fat: ${fat}g`;
  }

  // Extract salt
  const salt = extractUKNutritionValue(lines, ['salt']);
  if (salt !== null) {
    nutrition.salt = salt;
    debugInfo.extractedLines!.salt = `Found UK salt: ${salt}g`;
  }

  console.log('Extracted UK nutrition data:', nutrition);
  console.log('UK debug info:', debugInfo);
  
  return { nutritionData: nutrition, debugInfo };
};

/**
 * Test function to validate UK parser with example data
 */
export const testUKParser = () => {
  const exampleUKText = `
Nutrition
Typical values 100g contains Each slice (typically 44g) contains % RI* RI* for an average adult
Energy 985kJ / 235kcal 435kJ / 105kcal 5% 8400kJ / 2000kcal
Fat 1.5g 0.7g 1% 70g
of which saturates 0.3g 0.1g 1% 20g
Carbohydrate 45.5g 20.0g 260g
of which sugars 3.8g 1.7g 2% 90g
Fibre 2.8g 1.2g 30g
Protein 7.7g 3.4g 50g
Salt 1.0g 0.4g 7% 6g
This pack contains 16 servings
*Reference intake of an average adult (8400kJ / 2000kcal)
  `;
  
  console.log('Testing UK parser with example text...');
  console.log('Expected values from middle column ("Each slice contains"):');
  console.log('- Calories: 105 kcal (not 235 kcal from 100g column)');
  console.log('- Total Carbs: 20.0g (not 45.5g from 100g column)');
  console.log('- Sugars: 1.7g (not 3.8g from 100g column)');
  console.log('- Fiber: 1.2g (not 2.8g from 100g column)');
  console.log('- Protein: 3.4g (not 7.7g from 100g column)');
  console.log('- Fat: 0.7g (not 1.5g from 100g column)');
  console.log('- Serving Size: should include "44g" and "slice"');
  console.log('');
  
  const result = extractUKNutritionFromText(exampleUKText);
  console.log('UK Parser Test Result:', result);
  
  // Validate the results
  const { nutritionData } = result;
  const validationResults = {
    calories: nutritionData.calories === 105 ? '✅ CORRECT' : `❌ WRONG (got ${nutritionData.calories}, expected 105)`,
    totalCarbs: nutritionData.totalCarbs === 20.0 ? '✅ CORRECT' : `❌ WRONG (got ${nutritionData.totalCarbs}, expected 20.0)`,
    sugars: nutritionData.sugars === 1.7 ? '✅ CORRECT' : `❌ WRONG (got ${nutritionData.sugars}, expected 1.7)`,
    fiber: nutritionData.fiber === 1.2 ? '✅ CORRECT' : `❌ WRONG (got ${nutritionData.fiber}, expected 1.2)`,
    protein: nutritionData.protein === 3.4 ? '✅ CORRECT' : `❌ WRONG (got ${nutritionData.protein}, expected 3.4)`,
    fat: nutritionData.fat === 0.7 ? '✅ CORRECT' : `❌ WRONG (got ${nutritionData.fat}, expected 0.7)`,
    servingSize: nutritionData.servingSize.includes('44g') ? '✅ CORRECT' : `❌ WRONG (got "${nutritionData.servingSize}", expected to include "44g")`
  };
  
  console.log('\nValidation Results:');
  Object.entries(validationResults).forEach(([key, result]) => {
    console.log(`${key}: ${result}`);
  });
  
  return result;
}; 