// Simple debug test for carbohydrate extraction
const testText = `Nutrition Typical values 100g Each slice (typically % RI* for an contains 44g) contains RI average adult Energy 985kJ 435kJ 8400kJ 235kcal 105kcal 5% 2000kcal Fat 1.5g 0.7g 1% 70g of which saturates 0.3g 0.1g 1% 20g Carbohydrate 45.5g 20.0g of which sugars 3.8g 1.7g 2% 909 Fibre 2.8g 1.2g Protein 7.7g 3.4g Salt 1.0g 0.4g 7% 6g This pack contains 16 servings "Reference intake of an average adult (8400kJ/2000kcal)`;

const cleanedText = testText.toLowerCase().replace(/[^\S\r\n]+/g, ' ');
console.log('Cleaned text:', cleanedText);

const lines = cleanedText.split('\n').filter(line => line.trim());
const fullText = lines.join(' ');

console.log('\nFull text:', fullText);

// Test carbohydrate extraction patterns
const keywords = ['carbohydrate', 'carbohydrates', 'total carbohydrate'];

for (const keyword of keywords) {
  console.log(`\nTesting keyword: "${keyword}"`);
  
  const patterns = [
    // HIGH PRIORITY: Pattern for table format with 3 numeric values
    new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+(\\d+)%`, 'i'),
    
    // HIGH PRIORITY: Pattern for lines with two values followed by percentage/text
    new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+\\d+%`, 'i'),
    
    // HIGH PRIORITY: Pattern specifically for "of which" subcategories
    new RegExp(`of\\s+which\\s+${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g`, 'i'),
    
    // MEDIUM PRIORITY: Pattern for rows with values and reference amounts
    new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g\\s+\\d+%\\s+\\d+g`, 'i'),
    
    // MEDIUM PRIORITY: Pattern for simple two-value format
    new RegExp(`${keyword}\\s+(\\d+\\.?\\d*)g\\s+(\\d+\\.?\\d*)g`, 'i'),
    
    // LOW PRIORITY: Fallback patterns
    new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g.*?(\\d+\\.?\\d*)\\s*g`, 'i'),
    new RegExp(`${keyword}.*?(\\d+\\.?\\d*)\\s*g`, 'i')
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    console.log(`  Pattern ${i}: ${pattern}`);
    const match = fullText.match(pattern);
    if (match) {
      console.log(`  ✅ MATCH: ${match[0]}`);
      console.log(`  Captured groups:`, match.slice(1));
      
      let value;
      if (i <= 4) { // High and medium priority patterns with two captures
        value = parseFloat(match[2]); // Second captured value
      } else if (i === 5) { // Fallback pattern with two captures
        value = parseFloat(match[2]); // Second captured value
      } else { // Single capture fallback
        value = parseFloat(match[1]); // Only captured value
      }
      
      console.log(`  Extracted value: ${value}`);
      
      if (value >= 0 && value <= 10000) {
        if (keyword.includes('carbohydrate') && value > 30) {
          console.log(`  ❌ REJECTED: Value ${value} > 30 for carbohydrate`);
          continue;
        }
        console.log(`  ✅ ACCEPTED: ${value}g`);
        break;
      } else {
        console.log(`  ❌ REJECTED: Value ${value} out of range`);
      }
    } else {
      console.log(`  ❌ No match`);
    }
  }
} 