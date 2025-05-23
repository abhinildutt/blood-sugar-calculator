import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About GlycoScan</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
          
          <div className="prose prose-indigo max-w-none">
            <p>
              GlycoScan helps you understand how the foods you eat might affect your blood sugar levels.
              By analyzing the nutritional content of food through their nutrition labels, we provide an estimate
              of the potential blood sugar impact over time.
            </p>
            
            <h3>The Science Behind Blood Sugar Impact</h3>
            
            <p>
              Our blood sugar impact calculations are based on several key nutritional factors:
            </p>
            
            <ul>
              <li>
                <strong>Carbohydrates:</strong> The primary macronutrient affecting blood sugar. We calculate net carbs (total carbs minus fiber) 
                to better estimate the digestible carbohydrates.
              </li>
              <li>
                <strong>Glycemic Index (GI):</strong> We estimate a rough glycemic index based on the sugar content and fiber in the food. 
                Foods with higher sugar content and lower fiber typically have a higher glycemic index.
              </li>
              <li>
                <strong>Glycemic Load (GL):</strong> This is calculated by multiplying the estimated GI by the net carbs and dividing by 100. 
                It gives a more practical measure of how a specific serving size will affect blood sugar.
              </li>
              <li>
                <strong>Protein and Fat:</strong> These nutrients slow down carbohydrate digestion and absorption, which can lead to a lower 
                and more gradual blood sugar response.
              </li>
            </ul>
            
            <h3>Understanding the Results</h3>
            
            <p>
              After analyzing a nutrition label, we provide:
            </p>
            
            <ul>
              <li>
                <strong>Peak Rise:</strong> The estimated maximum increase in blood sugar above your baseline, measured in mg/dL.
              </li>
              <li>
                <strong>Return to Baseline:</strong> Approximate time (in minutes) it may take for your blood sugar to return to normal levels.
              </li>
              <li>
                <strong>Overall Impact:</strong> A qualitative assessment (Low, Moderate, or High) of the food's effect on blood sugar.
              </li>
              <li>
                <strong>Blood Sugar Curve:</strong> A visualization of how your blood sugar might change over time after consuming the food.
              </li>
            </ul>
            
            <h3>Important Disclaimer</h3>
            
            <p>
              The blood sugar impact predictions provided by this app are estimates based on general nutritional principles and should not be 
              used for medical decision-making. Individual responses to foods can vary significantly based on:
            </p>
            
            <ul>
              <li>Metabolic health and insulin sensitivity</li>
              <li>The presence of diabetes or other metabolic conditions</li>
              <li>What other foods are consumed with the measured item</li>
              <li>Physical activity before or after eating</li>
              <li>Time of day, stress levels, and other factors</li>
            </ul>
            
            <p>
              Always consult with healthcare professionals regarding managing your blood sugar and making dietary decisions, 
              especially if you have diabetes or other metabolic conditions.
            </p>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Technology</h2>
          
          <div className="prose prose-indigo max-w-none">
            <p>
              This application uses:
            </p>
            
            <ul>
              <li>Optical Character Recognition (OCR) to extract text from nutrition label images</li>
              <li>Natural language processing to interpret nutrition information</li>
              <li>Mathematical models to estimate blood sugar response based on nutritional content</li>
              <li>React and modern web technologies for a responsive user experience</li>
            </ul>
            
            <p>
              While we strive for accuracy, the OCR process may not always correctly identify all nutrition information.
              We recommend verifying the extracted data and making corrections if needed before reviewing the blood sugar impact results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 