// Nutritional information extracted from food label
export interface NutritionData {
  totalCarbs: number;
  sugars: number;
  fiber: number;
  protein: number;
  fat: number;
  calories: number;
  servingSize: string;
}

// Processed nutrition metrics for blood sugar calculation
export interface NutrientMetrics {
  netCarbs: number;
  glycemicLoad: number;
  proteinFatRatio: number;
  estimatedGI: number;
}

// Result of blood sugar impact calculation
export interface BloodSugarImpact {
  peakValue: number;
  timeToReturn: number;
  overallImpact: 'Low' | 'Moderate' | 'High';
  curve: Array<{ time: number; value: number }>; // For charting
}

// Common state for nutrition scanning
export interface ScanState {
  isLoading: boolean;
  error: string | null;
} 