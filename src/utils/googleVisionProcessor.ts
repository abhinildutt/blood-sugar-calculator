import { NutritionData } from '../types';
import { extractNutritionFromText } from './ocrProcessor';
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
 * Process nutrition label using Google Vision API
 */
export const processNutritionLabelWithGoogleVision = async (imageFile: File | string) => {
  try {
    // Process the image with Google Vision
    const text = await processImageWithGoogleVision(imageFile);
    console.log('Raw OCR text from Google Vision:', text);
    
    // Extract nutrition data from the OCR text using our existing parser
    const { nutritionData, debugInfo } = extractNutritionFromText(text);
    
    return {
      rawText: text,
      nutritionData,
      debugInfo
    };
  } catch (error) {
    console.error('Error in nutrition label processing:', error);
    throw error;
  }
}; 