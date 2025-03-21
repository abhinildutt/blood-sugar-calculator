# NutriGlucose: Blood Sugar Spike Calculator

This application helps you understand how the foods you eat might affect your blood sugar levels. By scanning or uploading an image of a nutrition label, the app extracts the nutritional information and calculates an estimated blood sugar impact over time.

## Features

- **Image Upload & Camera Capture**: Upload nutrition label images or capture them directly from your device's camera
- **OCR Technology**: Extract nutritional information from food label images
- **Manual Editing**: Correct or adjust the extracted nutrition data if needed
- **Blood Sugar Impact Calculation**: Estimate blood sugar impact based on carbohydrates, fiber, protein, and fat content
- **Visual Chart**: See how your blood sugar levels might change over time after consuming the food
- **Mobile-Friendly**: Works on phones, tablets, and desktops

## Getting Started

### Prerequisites

- Node.js 16.0 or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/nutritional-impact-calculator.git
cd nutritional-impact-calculator
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment

### Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

This will generate optimized files in the `dist` directory.

### Deployment Options

#### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. For production deployment:
```bash
vercel --prod
```

#### Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy
```

3. For production deployment:
```bash
netlify deploy --prod
```

#### GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json:
```json
{
  "homepage": "https://yourusername.github.io/nutritional-impact-calculator",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

## How It Works

1. **Upload or Capture**: Upload a nutrition label image or take a photo using your device's camera
2. **OCR Processing**: The app uses Tesseract.js to extract text from the image
3. **Data Extraction**: Nutritional information like carbs, sugars, fiber, protein, and fat is parsed from the text
4. **Calculation**: The app estimates blood sugar impact based on the nutritional content
5. **Visualization**: A chart shows how blood sugar may rise and fall over time

## Blood Sugar Impact Factors

The application estimates blood sugar impact based on:

- **Net Carbs**: Total carbohydrates minus fiber
- **Estimated Glycemic Index**: Based on sugar content and fiber
- **Glycemic Load**: A practical measure of a food's effect on blood sugar
- **Protein and Fat**: These nutrients slow down carbohydrate absorption

## Important Disclaimer

The blood sugar impact predictions provided by this app are estimates based on general nutritional principles and should not be used for medical decision-making. Individual responses to foods can vary significantly.

Always consult healthcare professionals for advice on managing your blood sugar, especially if you have diabetes or other metabolic conditions.

## Technologies Used

- React
- TypeScript
- Vite
- Tesseract.js (OCR)
- Chart.js
- Tailwind CSS
- React Router

## License

This project is licensed under the MIT License - see the LICENSE file for details.
