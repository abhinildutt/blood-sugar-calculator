import { NutritionData, Country } from '../types';
import { analyzeImage } from '../services/api';

/**
 * Process an image using Google Cloud Vision API through our backend
 * @param imageFile The image file to process
 * @returns The extracted text from the image
 */
export const processImageWithGoogleVision = async (imageFile: File | string): Promise<string> => {
  try {
    const result = await analyzeImage(imageFile);
    return result.text;
  } catch (error) {
    console.error('Error processing image with Google Vision:', error);
    throw new Error('Failed to process image with Google Vision API');
  }
};

/**
 * Process nutrition label using Google Vision API with LLM extraction
 */
export const processNutritionLabelWithGoogleVision = async (
  imageFile: File | string, 
  country: Country = 'US'
) => {
  try {
    // Process the image with Google Vision and LLM extraction
    const result = await analyzeImage(imageFile, country);
    console.log('LLM extraction result:', result);
    
    return {
      rawText: result.text,
      nutritionData: result.nutrition,
      debugInfo: {
        extractionMethod: result.extractionMethod,
        confidence: result.confidence,
        reasoning: result.reasoning,
        country: result.country
      }
    };
  } catch (error) {
    console.error('Error in nutrition label processing:', error);
    throw error;
  }
}; 