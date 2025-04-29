// This file should be renamed to analyze-image.ts
const { VercelRequest, VercelResponse } = require('@vercel/node');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const Cors = require('cors');

const cors = Cors({
  origin: '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

const runMiddleware = (req: typeof VercelRequest, res: typeof VercelResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

let visionClient: typeof ImageAnnotatorClient;

try {
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    console.log('Initializing Vision client with environment credentials');
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    visionClient = new ImageAnnotatorClient({
      credentials: credentials,
      projectId: credentials.project_id
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Initializing Vision client with credentials file');
    visionClient = new ImageAnnotatorClient();
  } else {
    console.error('No Google Cloud credentials found in environment');
    throw new Error('Google Cloud credentials not found');
  }
} catch (error) {
  console.error('Error initializing Vision client:', error);
  // Don't throw here, we'll handle the null client in the handler
}

module.exports = async function handler(req: typeof VercelRequest, res: typeof VercelResponse) {
  try {
    await runMiddleware(req, res, cors);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!visionClient) {
      console.error('Vision client initialization error:', process.env.GOOGLE_CLOUD_CREDENTIALS ? 'Credentials found but client not initialized' : 'No credentials found');
      return res.status(500).json({ error: 'Vision client not initialized', details: 'Check server logs for more information' });
    }

    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Remove data:image/jpeg;base64, prefix if present
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');

    try {
      const [result] = await visionClient.textDetection({
        image: { content: buffer }
      });

      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        return res.status(404).json({ error: 'No text detected in image' });
      }

      const extractedText = detections[0].description;
      
      return res.status(200).json({
        text: extractedText,
        nutrition: {} // Placeholder for nutrition information
      });
    } catch (visionError) {
      console.error('Vision API error:', visionError);
      return res.status(500).json({ 
        error: 'Vision API error', 
        details: visionError.message 
      });
    }

  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ 
      error: 'Failed to process image', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 