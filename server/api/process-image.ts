import { VercelRequest, VercelResponse } from '@vercel/node';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import Cors from 'cors';

const cors = Cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

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

let visionClient: ImageAnnotatorClient;

try {
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    // For production environment where credentials are set as environment variable
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    visionClient = new ImageAnnotatorClient({
      credentials: credentials
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // For local development where credentials file path is set
    visionClient = new ImageAnnotatorClient();
  } else {
    throw new Error('Google Cloud credentials not found');
  }
} catch (error) {
  console.error('Error initializing Vision client:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await runMiddleware(req, res, cors);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!visionClient) {
      return res.status(500).json({ error: 'Vision client not initialized' });
    }

    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');

    const [result] = await visionClient.textDetection({
      image: { content: buffer }
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return res.status(404).json({ error: 'No text detected in image' });
    }

    const extractedText = detections[0].description;
    
    // Here you would process the extracted text to get nutrition information
    // For now, returning the raw text
    return res.status(200).json({
      text: extractedText,
      nutrition: {} // Placeholder for nutrition information
    });

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ error: 'Failed to process image' });
  }
} 