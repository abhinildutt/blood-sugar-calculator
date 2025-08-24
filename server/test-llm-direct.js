import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Test OCR text from your actual image
const testText = `Nutrition Facts
Serving size
Amount per serving
Calories
Total Fat 0g
Sodium 105 mg
Total Carbohydrate 29 g
Total Sugars 26g
Includes 26 g Added Sugars
Protein 0g
1 can
110
% DV*
0%
4%
10%
53%
Niacin ...`;

async function testLLMDirectly() {
  console.log('🧪 Testing LLM Extraction Directly\n');
  
  if (!process.env.GOOGLE_API_KEY) {
    console.log('❌ GOOGLE_API_KEY not set');
    return;
  }
  
  console.log('✅ GOOGLE_API_KEY found');
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a nutrition label expert. Extract nutrition information from the following OCR text from a food label.

OCR Text:
${testText}

Country: US

Please extract the following nutrition information and return it as a valid JSON object:

For US labels, look for:
- servingSize: The serving size (e.g., "1 cup (240ml)", "1 slice (44g)")
- calories: Total calories per serving
- totalCarbs: Total carbohydrates in grams
- sugars: Total sugars in grams  
- fiber: Dietary fiber in grams
- protein: Protein in grams
- fat: Total fat in grams

Important:
1. Only return numeric values (no units like "g" or "kcal")
2. If a value is not found, use 0
3. Return ONLY the JSON object, no additional text
4. Be very careful to distinguish between per-serving and per-100g values

Expected JSON format:
{
  "servingSize": "string",
  "calories": number,
  "totalCarbs": number,
  "sugars": number,
  "fiber": number,
  "protein": number,
  "fat": number
}`;

    console.log('🤖 Sending prompt to Gemini...');
    console.log('Prompt length:', prompt.length);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Raw Response:', text);
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('🔍 Found JSON:', jsonMatch[0]);
      const nutritionData = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed nutrition data:', nutritionData);
    } else {
      console.log('❌ No JSON found in response');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testLLMDirectly();
