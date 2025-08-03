// Test various carbohydrate line formats that might appear in UK labels

const testCases = [
  // Working case
  {
    name: "Standard format (working)",
    text: "Carbohydrate 45.5g 20.0g of which sugars 3.8g 1.7g"
  },
  
  // Potential problem cases
  {
    name: "Capital CARBOHYDRATE",
    text: "CARBOHYDRATE 45.5g 20.0g of which sugars 3.8g 1.7g"
  },
  
  {
    name: "Carbohydrates (plural)",
    text: "Carbohydrates 45.5g 20.0g of which sugars 3.8g 1.7g"
  },
  
  {
    name: "With colon",
    text: "Carbohydrate: 45.5g 20.0g of which sugars 3.8g 1.7g"
  },
  
  {
    name: "Extra spaces",
    text: "Carbohydrate    45.5g    20.0g    of which sugars 3.8g 1.7g"
  },
  
  {
    name: "No space before g",
    text: "Carbohydrate 45.5g20.0g of which sugars 3.8g 1.7g"
  },
  
  {
    name: "With periods in numbers",
    text: "Carbohydrate 45.5g 20.0g of which sugars 3.8g 1.7g"
  },
  
  {
    name: "Whole numbers only",
    text: "Carbohydrate 46g 20g of which sugars 4g 2g"
  },
  
  {
    name: "No 'of which' following",
    text: "Carbohydrate 45.5g 20.0g Fat 1.5g 0.7g"
  },
  
  {
    name: "With percentage after values",
    text: "Carbohydrate 45.5g 20.0g 8% of which sugars 3.8g 1.7g"
  },
  
  {
    name: "Single value only (should fail)",
    text: "Carbohydrate 20.0g of which sugars 1.7g"
  },
  
  {
    name: "OCR errors - missing spaces",
    text: "Carbohydrate45.5g20.0gofwhichsugars3.8g1.7g"
  },
  
  {
    name: "Line break in middle",
    text: "Carbohydrate 45.5g\n20.0g of which sugars 3.8g 1.7g"
  }
];

// Function to test extraction (copied from ukLabelParser.ts)
const extractUKNutritionValue = (lines, keywords) => {
  const fullText = lines.join(' ');
  
  for (const keyword of keywords) {
    console.log(`    Testing keyword: "${keyword}"`);
    
    const patterns = [
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+(\\d+)%`, 'i'),
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+\\d+%`, 'i'),
      new RegExp(`of\\s+which\\s+${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g`, 'i'),
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+\\d+%\\s+\\d+g`, 'i'),
      new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g`, 'i'),     // This should match most cases
      new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g.*?(\\d+\\.?\\d*)\\s*g`, 'i'),
      new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g`, 'i')
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = fullText.match(pattern);
      if (match) {
        let value;
        if (i <= 4) {
          value = parseFloat(match[2]); // Second captured value
        } else if (i === 5) {
          value = parseFloat(match[2]); // Second captured value
        } else {
          value = parseFloat(match[1]); // Only captured value
        }
        
        if (value >= 0 && value <= 10000) {
          if (keyword.includes('carbohydrate') && value > 30) continue;
          console.log(`    ✅ MATCH with pattern ${i}: "${match[0]}" → ${value}g`);
          return value;
        }
      }
    }
  }
  return null;
};

// Test each case
testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   Text: "${testCase.text}"`);
  
  // Process like ukLabelParser does
  const cleanedText = testCase.text.toLowerCase().replace(/[^\S\r\n]+/g, ' ');
  const lines = cleanedText.split('\n').filter(line => line.trim());
  
  const result = extractUKNutritionValue(lines, ['carbohydrate', 'carbohydrates', 'total carbohydrate']);
  
  if (result !== null) {
    console.log(`   ✅ SUCCESS: Extracted ${result}g`);
  } else {
    console.log(`   ❌ FAILED: Could not extract carbohydrate value`);
  }
}); 