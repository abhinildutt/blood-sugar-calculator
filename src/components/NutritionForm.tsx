import React, { useState, useEffect } from 'react';
import { NutritionData } from '../types';
import { defaultNutritionData } from '../utils/ocrProcessor';

interface NutritionFormProps {
  nutritionData: NutritionData | null;
  onNutritionChange: (data: NutritionData) => void;
  isEditable?: boolean;
}

const NutritionForm: React.FC<NutritionFormProps> = ({
  nutritionData,
  onNutritionChange,
  isEditable = true
}) => {
  const [formData, setFormData] = useState<NutritionData>(defaultNutritionData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // This state keeps track of which fields are being edited to allow empty values temporarily
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (nutritionData) {
      setFormData(nutritionData);
      setErrors({});
      setActiveFields({});
    }
  }, [nutritionData]);

  const validateField = (name: string, value: number | string): string => {
    if (name === 'servingSize' && typeof value === 'string') {
      return value.trim() === '' ? 'Serving size is required' : '';
    }
    
    if (typeof value === 'number' && value < 0) {
      return 'Value cannot be negative';
    }
    
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For numeric fields
    if (name !== 'servingSize') {
      // Track if the field is being actively edited
      setActiveFields(prev => ({
        ...prev,
        [name]: true
      }));
      
      // For display in the form, always use the exact input value
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // For calculations and validation
      const calculationValue = value === '' ? 0 : parseFloat(value) || 0;
      const errorMessage = validateField(name, calculationValue);
      
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
      
      // Only update parent with calculation value if there are no errors AND the field is not empty
      if (!errorMessage && value !== '') {
        onNutritionChange({
          ...formData,
          [name]: calculationValue
        });
      }
    } else {
      // For text fields like servingSize, handle normally
      const errorMessage = validateField(name, value);
      
      setErrors(prev => ({
        ...prev,
        [name]: errorMessage
      }));
      
      setFormData(prev => {
        const updatedData = {
          ...prev,
          [name]: value
        };
        
        // Only update parent if there are no errors
        if (!errorMessage) {
          onNutritionChange(updatedData);
        }
        
        return updatedData;
      });
    }
  };

  // When a field loses focus, ensure numbers are properly formatted
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Skip for servingSize which is a string
    if (name === 'servingSize') return;
    
    // For empty values, set to 0 on blur
    if (value === '') {
      const updatedData = {
        ...formData,
        [name]: 0
      };
      
      setFormData(updatedData);
      
      // Also update the parent component with the zero value on blur
      onNutritionChange(updatedData);
      
      // Remove from active fields
      setActiveFields(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleReset = () => {
    setFormData(defaultNutritionData);
    setErrors({});
    setActiveFields({});
    onNutritionChange(defaultNutritionData);
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Nutrition Information</h2>
        
        {isEditable && (
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
              type="button"
            >
              Reset
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Serving Size</label>
          <input
            type="text"
            name="servingSize"
            value={formData.servingSize}
            onChange={handleChange}
            disabled={!isEditable}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
              errors.servingSize ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.servingSize && (
            <p className="mt-1 text-sm text-red-600">{errors.servingSize}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Calories</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="calories"
              min="0"
              value={formData.calories}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditable}
              className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.calories ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.calories && (
              <p className="mt-1 text-sm text-red-600">{errors.calories}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Carbs (g)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="totalCarbs"
              min="0"
              step="0.1"
              value={formData.totalCarbs}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditable}
              className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.totalCarbs ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.totalCarbs && (
              <p className="mt-1 text-sm text-red-600">{errors.totalCarbs}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Sugars (g)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="sugars"
              min="0"
              step="0.1"
              value={formData.sugars}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditable}
              className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.sugars ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.sugars && (
              <p className="mt-1 text-sm text-red-600">{errors.sugars}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Fiber (g)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="fiber"
              min="0"
              step="0.1"
              value={formData.fiber}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditable}
              className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.fiber ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.fiber && (
              <p className="mt-1 text-sm text-red-600">{errors.fiber}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Protein (g)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="protein"
              min="0"
              step="0.1"
              value={formData.protein}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditable}
              className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.protein ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.protein && (
              <p className="mt-1 text-sm text-red-600">{errors.protein}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Fat (g)</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="fat"
              min="0"
              step="0.1"
              value={formData.fat}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={!isEditable}
              className={`block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 ${
                errors.fat ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.fat && (
              <p className="mt-1 text-sm text-red-600">{errors.fat}</p>
            )}
          </div>
        </div>
      </div>
      
      {isEditable && (
        <p className="mt-4 text-sm text-gray-500">
          Tip: You can adjust the values if the automatic detection wasn't accurate.
        </p>
      )}
    </div>
  );
};

export default NutritionForm; 