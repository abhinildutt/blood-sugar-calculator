import { extractNutritionWithLLM, extractNutritionFallback } from './dist/src/llmNutritionExtractor.js';
import dotenv from 'dotenv';

dotenv.config();

// Test OCR text from a UK nutrition label
const testUKText = `
Nutrition
Typical values 100g contains Each slice (typically 44g) contains % RI* RI* for an average adult
Energy 985kJ / 235kcal 435kJ / 105kcal 5% 8400kJ / 2000kcal
Fat 1.5g 0.7g 1% 70g
of which saturates 0.3g 0.1g 1% 20g
Carbohydrate 45.5g 20.0g 260g
of which sugars 3.8g 1.7g 2% 90g
Fibre 2.8g 1.2g 30g
Protein 7.7g 3.4g 50g
Salt 1.0g 0.4g 7% 6g
This pack contains 16 servings
*Reference intake of an average adult (8400kJ / 2000kcal)
`;

// Test OCR text from a US nutrition label
const testUSText = `
Nutrition Facts
Serving Size 1 cup (240ml)
Servings Per Container 8

Amount Per Serving
Calories 90
Calories from Fat 0

% Daily Value*
Total Fat 0g 0%
Saturated Fat 0g 0%
Trans Fat 0g
Cholesterol 0mg 0%
Sodium 10mg 0%
Total Carbohydrate 22g 7%
Dietary Fiber 2g 8%
Sugars 19g
Protein 1g

Vitamin A 0% • Vitamin C 0%
Calcium 2% • Iron 0%
`;

async function testLLMExtraction() {
  console.log('🧪 Testing LLM Nutrition Extraction\n');
  
  if (!process.env.GOOGLE_API_KEY) {
    console.log('❌ GOOGLE_API_KEY not set. LLM extraction will not work.');
    console.log('   Get your free API key from: https://makersuite.google.com/app/apikey\n');
    return;
  }
  
  console.log('✅ GOOGLE_API_KEY found. Testing LLM extraction...\n');
  
  try {
    // Test UK label
    console.log('🇬🇧 Testing UK Label Extraction:');
    console.log('Expected values from middle column:');
    console.log('- Calories: 105 kcal');
    console.log('- Total Carbs: 20.0g');
    console.log('- Sugars: 1.7g');
    console.log('- Fiber: 1.2g');
    console.log('- Protein: 3.4g');
    console.log('- Fat: 0.7g\n');
    
    const ukResult = await extractNutritionWithLLM(testUKText, 'UK');
    console.log('UK Result:', JSON.stringify(ukResult, null, 2));
    
    // Test US label
    console.log('\n🇺🇸 Testing US Label Extraction:');
    console.log('Expected values:');
    console.log('- Calories: 90');
    console.log('- Total Carbs: 22g');
    console.log('- Sugars: 19g');
    console.log('- Fiber: 2g');
    console.log('- Protein: 1g');
    console.log('- Fat: 0g\n');
    
    const usResult = await extractNutritionWithLLM(testUSText, 'US');
    console.log('US Result:', JSON.stringify(usResult, null, 2));
    
    console.log('\n✅ LLM extraction test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ LLM extraction test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Make sure your GOOGLE_API_KEY is valid and has access to Gemini API');
    }
  }
}

// Run the test
testLLMExtraction().catch(console.error);
