import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini AI
let genAI;

try {
  if (process.env.GOOGLE_API_KEY) {
    console.log('🔑 GOOGLE_API_KEY found in environment');
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  } else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    // Use the same credentials as Vision API if available
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    if (credentials.api_key) {
      console.log('🔑 GOOGLE_API_KEY found in Google Cloud credentials');
      genAI = new GoogleGenerativeAI(credentials.api_key);
    } else {
      console.warn('No API key found in Google Cloud credentials, falling back to manual parsing');
    }
  } else {
    console.warn('❌ No GOOGLE_API_KEY found in environment variables');
    console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
  }
} catch (error) {
  console.error('Error initializing Gemini AI:', error);
}

/**
 * Extract nutrition information using Google Gemini AI
 */
export const extractNutritionWithLLM = async (ocrText, country = 'US') => {
  if (!genAI) {
    throw new Error('Gemini AI not initialized. Please set GOOGLE_API_KEY environment variable.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a nutrition label expert. Extract nutrition information from the following OCR text from a food label.

OCR Text:
${ocrText}

Country: ${country}

Please extract the following nutrition information and return it as a valid JSON object:

For US labels, look for:
- servingSize: The serving size (e.g., "1 cup (240ml)", "1 slice (44g)")
- calories: Total calories per serving
- totalCarbs: Total carbohydrates in grams
- sugars: Total sugars in grams  
- fiber: Dietary fiber in grams
- protein: Protein in grams
- fat: Total fat in grams

For UK labels, look for the "Each slice/cup contains" column values (not the 100g column):
- servingSize: The serving description (e.g., "44g (slice)")
- calories: Calories per serving (kcal)
- totalCarbs: Carbohydrates per serving in grams
- sugars: Sugars per serving in grams
- fiber: Fibre per serving in grams
- protein: Protein per serving in grams
- fat: Fat per serving in grams

Important:
1. For UK labels, use the middle column values, not the 100g column
2. Only return numeric values (no units like "g" or "kcal")
3. If a value is not found, use 0
4. Return ONLY the JSON object, no additional text
5. Be very careful to distinguish between per-serving and per-100g values

Expected JSON format:
{
  "servingSize": "string",
  "calories": number,
  "totalCarbs": number,
  "sugars": number,
  "fiber": number,
  "protein": number,
  "fat": number
}
`;

  console.log('🤖 LLM Request Details:');
  console.log('========================');
  console.log('Model: gemini-1.5-flash');
  console.log('Country:', country);
  console.log('OCR Text Length:', ocrText.length);
  console.log('OCR Text Preview:', ocrText.substring(0, 200) + '...');
  console.log('Prompt Length:', prompt.length);
  console.log('========================');

  try {
    console.log('🚀 Sending request to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 LLM Response Details:');
    console.log('========================');
    console.log('Response Length:', text.length);
    console.log('Raw Response:', text);
    console.log('========================');
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No valid JSON found in LLM response');
      console.error('Response text:', text);
      console.error('Trying to find JSON-like content...');
      
      // Try to find any content that looks like JSON
      const possibleJson = text.match(/\{[^}]*\}/);
      if (possibleJson) {
        console.error('Found partial JSON-like content:', possibleJson[0]);
      }
      
      throw new Error('No valid JSON found in LLM response');
    }
    
    console.log('🔍 Extracted JSON:', jsonMatch[0]);
    
    let nutritionData;
    try {
      nutritionData = JSON.parse(jsonMatch[0]);
      console.log('📊 Parsed Nutrition Data:', nutritionData);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.error('JSON string that failed to parse:', jsonMatch[0]);
      throw new Error(`JSON parsing failed: ${parseError.message}`);
    }
    
    // Validate the extracted data
    const validatedData = {
      servingSize: nutritionData.servingSize || '1 serving',
      calories: Math.max(0, nutritionData.calories || 0),
      totalCarbs: Math.max(0, nutritionData.totalCarbs || 0),
      sugars: Math.max(0, nutritionData.sugars || 0),
      fiber: Math.max(0, nutritionData.fiber || 0),
      protein: Math.max(0, nutritionData.protein || 0),
      fat: Math.max(0, nutritionData.fat || 0),
      country
    };
    
    console.log('✅ Final Validated Data:', validatedData);
    
    return {
      nutritionData: validatedData,
      confidence: 0.9, // High confidence for LLM extraction
      reasoning: `Extracted using Gemini AI. Original OCR text: ${ocrText.substring(0, 200)}...`
    };
    
  } catch (error) {
    console.error('❌ Error extracting nutrition with LLM:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check if it's an API key issue
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      console.error('🔑 This looks like an API key/authentication issue');
      console.error('Please check your GOOGLE_API_KEY environment variable');
    }
    
    // Check if it's a model access issue
    if (error.message.includes('model') || error.message.includes('access')) {
      console.error('🤖 This looks like a model access issue');
      console.error('Please check if you have access to gemini-1.5-flash model');
    }
    
    throw new Error(`LLM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fallback to manual parsing if LLM fails
 */
export const extractNutritionFallback = (ocrText, country = 'US') => {
  console.log('🔄 Using fallback manual parsing...');
  console.log('OCR Text for fallback:', ocrText);
  
  try {
    // Basic manual parsing as fallback
    const lines = ocrText.toLowerCase().split('\n');
    const nutrition = {
      servingSize: '1 serving',
      calories: 0,
      totalCarbs: 0,
      sugars: 0,
      fiber: 0,
      protein: 0,
      fat: 0,
      country
    };
    
    // Extract serving size
    for (const line of lines) {
      if (line.includes('serving size') || line.includes('serving')) {
        const match = line.match(/(\d+.*?)(?=\s|$)/i);
        if (match) {
          nutrition.servingSize = match[1].trim();
          console.log('📏 Found serving size:', nutrition.servingSize);
        }
      }
    }
    
    // Extract calories
    for (const line of lines) {
      if (line.includes('calories')) {
        const match = line.match(/(\d+)/);
        if (match) {
          nutrition.calories = parseInt(match[1]);
          console.log('🔥 Found calories:', nutrition.calories);
        }
      }
    }
    
    // Extract total carbs
    for (const line of lines) {
      if (line.includes('total carbohydrate') || line.includes('total carbohydrate') || line.includes('carbohydrate')) {
        const match = line.match(/(\d+)/);
        if (match) {
          nutrition.totalCarbs = parseInt(match[1]);
          console.log('🍞 Found total carbs:', nutrition.totalCarbs);
        }
      }
    }
    
    // Extract sugars
    for (const line of lines) {
      if (line.includes('sugars') || line.includes('sugar')) {
        const match = line.match(/(\d+)/);
        if (match) {
          nutrition.sugars = parseInt(match[1]);
          console.log('🍯 Found sugars:', nutrition.sugars);
        }
      }
    }
    
    // Extract fiber
    for (const line of lines) {
      if (line.includes('fiber') || line.includes('fibre') || line.includes('dietary fiber')) {
        const match = line.match(/(\d+)/);
        if (match) {
          nutrition.fiber = parseInt(match[1]);
          console.log('🌾 Found fiber:', nutrition.fiber);
        }
      }
    }
    
    // Extract protein
    for (const line of lines) {
      if (line.includes('protein')) {
        const match = line.match(/(\d+)/);
        if (match) {
          nutrition.protein = parseInt(match[1]);
          console.log('🥩 Found protein:', nutrition.protein);
        }
      }
    }
    
    // Extract fat
    for (const line of lines) {
      if (line.includes('total fat') || line.includes('fat')) {
        const match = line.match(/(\d+)/);
        if (match) {
          nutrition.fat = parseInt(match[1]);
          console.log('🧈 Found fat:', nutrition.fat);
        }
      }
    }
    
    console.log('✅ Fallback parsing completed:', nutrition);
    return nutrition;
    
  } catch (error) {
    console.error('❌ Error in fallback parsing:', error);
    // Return default values if parsing fails
    return {
      servingSize: '1 serving',
      calories: 0,
      totalCarbs: 0,
      sugars: 0,
      fiber: 0,
      protein: 0,
      fat: 0,
      country
    };
  }
};
