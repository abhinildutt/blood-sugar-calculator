import { VercelRequest, VercelResponse } from '@vercel/node';
import vision from '@google-cloud/vision';
import cors from 'cors';

// Initialize CORS middleware
const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

// Helper to wrap CORS middleware
const runMiddleware = (req: VercelRequest, res: VercelResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Initialize Vision client
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  await runMiddleware(req, res, corsMiddleware);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Remove the data:image/jpeg;base64 prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Process the image with Google Cloud Vision
    const [result] = await client.textDetection({
      image: {
        content: base64Image
      }
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return res.status(400).json({ error: 'No text detected in image' });
    }

    // Extract the full text
    const extractedText = detections[0].description;

    // Process the text to extract nutrition information
    // This is a placeholder - implement your nutrition extraction logic here
    const nutritionInfo = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      // Add other nutrition fields
    };

    return res.status(200).json({
      success: true,
      data: nutritionInfo,
      rawText: extractedText
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 