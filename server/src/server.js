import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractNutritionWithLLM, extractNutritionFallback } from './llmNutritionExtractor.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON with increased limit for image data
app.use(express.json({ limit: '50mb' }));

// Also add urlencoded parser with increased limit
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize the Google Cloud Vision client
let vision;
try {
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    console.log('Initializing Vision client with environment credentials');
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    vision = new ImageAnnotatorClient({
      credentials: credentials,
      projectId: credentials.project_id
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Initializing Vision client with credentials file path');
    vision = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
  } else {
    // Fallback to the google-credentials.json file in the project root
    const credentialsPath = path.resolve(__dirname, '../../google-credentials.json');
    console.log('Loading credentials from fallback path:', credentialsPath);
    vision = new ImageAnnotatorClient({
      keyFilename: credentialsPath
    });
  }
  console.log('Google Cloud Vision client initialized successfully');
} catch (error) {
  console.error('Error initializing Google Cloud Vision client:', error);
  console.error('Please check your Google Cloud credentials configuration');
}

app.post('/api/analyze-image', async (req, res) => {
  try {
    if (!vision) {
      throw new Error('Google Cloud Vision client not initialized');
    }

    const { imageData, country = 'US' } = req.body;
    if (!imageData) {
      throw new Error('No image data provided');
    }
    
    console.log('🖼️ Image Analysis Request:');
    console.log('========================');
    console.log('Country:', country);
    console.log('Image data length:', imageData.length);
    console.log('========================');
    
    // Remove the data:image/jpeg;base64, prefix if present
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    console.log('📊 Image Processing:');
    console.log('Buffer size:', buffer.length, 'bytes');
    console.log('First few bytes:', buffer.slice(0, 16));

    try {
      console.log('🔍 Sending to Google Cloud Vision...');
      const [result] = await vision.textDetection({
        image: {
          content: buffer
        }
      });
      
      console.log('✅ Vision API response received');

      if (!result || !result.textAnnotations || result.textAnnotations.length === 0) {
        throw new Error('No text detected in image');
      }

      const detections = result.textAnnotations;
      const extractedText = detections[0]?.description || '';
      
      console.log('📝 OCR Results:');
      console.log('========================');
      console.log('Text length:', extractedText.length);
      console.log('Full OCR text:');
      console.log(extractedText);
      console.log('========================');
      
      // Use LLM to extract nutrition information
      let nutritionData;
      let extractionMethod = 'llm';
      let confidence = 0.9;
      let reasoning = '';
      
      try {
        console.log('🤖 Starting LLM extraction...');
        console.log('LLM module loaded:', typeof extractNutritionWithLLM);
        
        if (typeof extractNutritionWithLLM !== 'function') {
          throw new Error('LLM extraction function not available');
        }
        
        const llmResult = await extractNutritionWithLLM(extractedText, country);
        nutritionData = llmResult.nutritionData;
        confidence = llmResult.confidence;
        reasoning = llmResult.reasoning;
        console.log('✅ LLM extraction successful!');
      } catch (llmError) {
        console.warn('⚠️ LLM extraction failed, falling back to manual parsing:', llmError);
        console.error('LLM error details:', {
          message: llmError.message,
          stack: llmError.stack,
          name: llmError.name
        });
        
        nutritionData = extractNutritionFallback(extractedText, country);
        extractionMethod = 'fallback';
        confidence = 0.5;
        reasoning = 'LLM extraction failed, used fallback parsing';
      }
      
      console.log('🎯 Final Results:');
      console.log('========================');
      console.log('Extraction method:', extractionMethod);
      console.log('Confidence:', confidence);
      console.log('Reasoning:', reasoning);
      console.log('Nutrition data:', nutritionData);
      console.log('========================');
      
      res.json({
        text: extractedText,
        nutrition: nutritionData,
        extractionMethod,
        confidence,
        reasoning,
        country
      });
    } catch (visionError) {
      console.error('❌ Vision API Error:', visionError);
      throw new Error(`Vision API Error: ${visionError.message}`);
    }
  } catch (error) {
    console.error('❌ Error processing image:', error);
    res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`LLM integration: ${process.env.GOOGLE_API_KEY ? 'Enabled' : 'Disabled (no API key)'}`);
}); 