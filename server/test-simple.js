import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

async function testGeminiConnection() {
  console.log('🧪 Testing Gemini AI Connection\n');
  
  if (!process.env.GOOGLE_API_KEY) {
    console.log('❌ GOOGLE_API_KEY not set');
    return;
  }
  
  console.log('✅ GOOGLE_API_KEY found');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('🤖 Testing simple prompt...');
    
    const result = await model.generateContent('Say "Hello World" in JSON format like this: {"message": "Hello World"}');
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Response:', text);
    console.log('✅ Gemini AI connection successful!');
    
  } catch (error) {
    console.error('❌ Gemini AI test failed:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiConnection();
