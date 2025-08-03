import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { BloodSugarImpact } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BloodSugarChartProps {
  bloodSugarImpact: BloodSugarImpact | null;
  baseline?: number; // Add baseline parameter
}

const BloodSugarChart: React.FC<BloodSugarChartProps> = ({ bloodSugarImpact, baseline }) => {
  if (!bloodSugarImpact) {
    return (
      <div className="mt-6 bg-white shadow-md rounded-lg p-6">
        <p className="text-gray-500 text-center">No blood sugar impact data available</p>
      </div>
    );
  }

  const { curve, overallImpact, peakValue, timeToReturn } = bloodSugarImpact;
  
  // Get color based on impact level
  const getImpactColor = (impact: 'Low' | 'Moderate' | 'High') => {
    switch (impact) {
      case 'Low':
        return 'rgba(34, 197, 94, 0.8)'; // Green
      case 'Moderate':
        return 'rgba(245, 158, 11, 0.8)'; // Yellow
      case 'High':
        return 'rgba(239, 68, 68, 0.8)'; // Red
      default:
        return 'rgba(59, 130, 246, 0.8)'; // Blue
    }
  };

  const borderColor = getImpactColor(overallImpact);
  const backgroundColor = borderColor.replace('0.8', '0.2');

  // Calculate absolute values if baseline is provided
  const chartData = {
    labels: curve.map(point => `${point.time} min`),
    datasets: [
      {
        label: baseline ? 'Blood Sugar Level' : 'Blood Sugar Rise',
        data: baseline 
          ? curve.map(point => baseline + point.value) // Absolute values
          : curve.map(point => point.value), // Relative values
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 5,
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (baseline) {
              return `Blood Sugar: ${context.raw.toFixed(1)} mg/dL`;
            } else {
              return `Blood Sugar: +${context.raw.toFixed(1)} mg/dL`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: baseline ? false : true,
        title: {
          display: true,
          text: baseline 
            ? 'Blood Sugar Level (mg/dL)' 
            : 'Blood Sugar Rise (mg/dL above baseline)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time After Consumption (minutes)'
        }
      }
    }
  };

  // Color mapping for impact levels
  const impactColors = {
    Low: 'text-green-600',
    Moderate: 'text-yellow-600',
    High: 'text-red-600'
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Blood Sugar Impact</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Peak Rise</p>
          <p className="text-2xl font-bold">+{peakValue.toFixed(1)} mg/dL</p>
          {baseline && (
            <p className="text-sm text-gray-500">
              Peak: {(baseline + peakValue).toFixed(1)} mg/dL
            </p>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Return to Baseline</p>
          <p className="text-2xl font-bold">{timeToReturn.toFixed(0)} min</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Overall Impact</p>
          <p className={`text-2xl font-bold ${impactColors[overallImpact]}`}>
            {overallImpact}
          </p>
        </div>
      </div>
      
      {baseline && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Baseline:</strong> {baseline} mg/dL | 
            <strong> Estimated Peak:</strong> {(baseline + peakValue).toFixed(1)} mg/dL
          </p>
        </div>
      )}
      
      <div className="h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium mb-2">What This Means:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>This chart shows how your blood sugar might rise and fall after consuming this food.</li>
          {baseline && (
            <li>Your baseline blood sugar level of {baseline} mg/dL is used as the starting point.</li>
          )}
          <li>Foods with a higher carbohydrate content, especially simple sugars, typically cause a higher peak.</li>
          <li>Protein, fat, and fiber can help slow down the absorption of carbohydrates, resulting in a lower peak.</li>
          <li>These are estimates based on the nutritional content and may vary based on individual factors.</li>
        </ul>
      </div>
    </div>
  );
};

export default BloodSugarChart; 