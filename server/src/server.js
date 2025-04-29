import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
// Increase the limit for JSON payloads to 50MB
app.use(express.json({ limit: '50mb' }));
// Also add urlencoded parser with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize the Google Cloud Vision client
let vision;
try {
  const credentialsPath = path.resolve(__dirname, '../../google-credentials.json');
  console.log('Loading credentials from:', credentialsPath);
  
  vision = new ImageAnnotatorClient({
    keyFilename: credentialsPath
  });
  console.log('Google Cloud Vision client initialized successfully');
} catch (error) {
  console.error('Error initializing Google Cloud Vision client:', error);
}

app.post('/api/analyze-image', async (req, res) => {
  try {
    if (!vision) {
      throw new Error('Google Cloud Vision client not initialized');
    }

    const { imageData } = req.body;
    if (!imageData) {
      throw new Error('No image data provided');
    }
    
    console.log('Received image data length:', imageData.length);
    
    // Remove the data:image/jpeg;base64, prefix if present
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    console.log('Converted to buffer, size:', buffer.length);

    // Log the first few bytes of the buffer to verify it's a valid image
    console.log('First few bytes:', buffer.slice(0, 16));

    try {
      const [result] = await vision.textDetection({
        image: {
          content: buffer
        }
      });
      
      console.log('Vision API response:', JSON.stringify(result, null, 2));

      if (!result || !result.textAnnotations || result.textAnnotations.length === 0) {
        throw new Error('No text detected in image');
      }

      const detections = result.textAnnotations;
      
      res.json({
        text: detections[0]?.description || '',
        detections: detections.slice(1)
      });
    } catch (visionError) {
      console.error('Vision API Error:', visionError);
      throw new Error(`Vision API Error: ${visionError.message}`);
    }
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 