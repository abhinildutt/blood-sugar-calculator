import { createWorker } from 'tesseract.js';

/**
 * Simple demo function to test Tesseract OCR functionality
 * @param imageUrl URL of an image to process
 * @returns The extracted text from the image
 */
export const recognizeText = async (imageUrl: string): Promise<string> => {
  console.log('Starting OCR processing...');
  
  const worker = await createWorker('eng');
  
  try {
    const result = await worker.recognize(imageUrl);
    return result.data.text;
  } finally {
    await worker.terminate();
    console.log('OCR processing complete');
  }
}; 