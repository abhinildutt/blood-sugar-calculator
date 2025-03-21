import { NutritionData, NutrientMetrics, BloodSugarImpact } from '../types';

/**
 * Calculates the nutrient metrics needed for blood sugar impact estimation
 */
export const calculateNutrientMetrics = (nutrition: NutritionData): NutrientMetrics => {
  // Calculate net carbs (total carbs minus fiber)
  const netCarbs = Math.max(0, nutrition.totalCarbs - nutrition.fiber);
  
  // Estimated glycemic index based on sugar content and fiber
  // This is a simplified approximation, as actual GI would require product-specific lab testing
  const sugarRatio = nutrition.sugars / (nutrition.totalCarbs || 1); // Avoid division by zero
  const fiberImpact = 1 - Math.min(0.3, nutrition.fiber / 10); // Higher fiber reduces GI
  
  // Rough GI estimation: higher sugar percentage and lower fiber leads to higher GI
  const estimatedGI = 40 + (sugarRatio * 30) + (fiberImpact * 30);
  
  // Glycemic load = (GI * net carbs) / 100
  const glycemicLoad = (estimatedGI * netCarbs) / 100;
  
  // Protein and fat slow down carb absorption
  const proteinFatRatio = (nutrition.protein + nutrition.fat) / (netCarbs || 1);
  
  return {
    netCarbs,
    glycemicLoad,
    proteinFatRatio,
    estimatedGI
  };
};

/**
 * Estimates blood sugar impact based on nutrition metrics
 */
export const estimateBloodSugarImpact = (metrics: NutrientMetrics): BloodSugarImpact => {
  // Based on glycemic load and protein/fat ratio, estimate peak blood sugar rise
  // Typical measured in mg/dL above baseline
  let peakValue = metrics.glycemicLoad * 5; // Base calculation
  
  // Protein and fat slow down absorption
  if (metrics.proteinFatRatio > 0.5) {
    peakValue *= (1 - Math.min(0.4, (metrics.proteinFatRatio - 0.5) * 0.2));
  }
  
  // Estimate time to return to baseline (in minutes)
  let timeToReturn = 45 + (metrics.glycemicLoad * 5);
  
  // Protein and fat extend the curve
  if (metrics.proteinFatRatio > 1) {
    timeToReturn *= (1 + Math.min(0.5, (metrics.proteinFatRatio - 1) * 0.1));
  }

  // Generate blood sugar curve points for charting
  const curve: Array<{ time: number; value: number }> = [];
  const peakTime = timeToReturn * 0.3; // Peak typically occurs at ~30% of the way through
  
  // Generate points for the curve
  for (let i = 0; i <= timeToReturn; i += 5) {
    if (i <= peakTime) {
      // Rising phase - roughly follows a sigmoid curve
      const ratio = i / peakTime;
      const value = peakValue * (ratio / (0.2 + 0.8 * ratio));
      curve.push({ time: i, value });
    } else {
      // Falling phase - exponential decay
      const ratio = (i - peakTime) / (timeToReturn - peakTime);
      const value = peakValue * Math.exp(-ratio * 2);
      curve.push({ time: i, value });
    }
  }
  
  // Determine overall impact category
  let overallImpact: 'Low' | 'Moderate' | 'High';
  if (metrics.glycemicLoad < 10) {
    overallImpact = 'Low';
  } else if (metrics.glycemicLoad < 20) {
    overallImpact = 'Moderate';
  } else {
    overallImpact = 'High';
  }
  
  return {
    peakValue,
    timeToReturn,
    overallImpact,
    curve
  };
};

/**
 * Main function to process nutrition data and get blood sugar impact
 */
export const calculateBloodSugarImpact = (nutrition: NutritionData): BloodSugarImpact => {
  const metrics = calculateNutrientMetrics(nutrition);
  return estimateBloodSugarImpact(metrics);
}; 