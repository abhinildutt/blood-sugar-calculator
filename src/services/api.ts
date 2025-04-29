import { config } from '../config';

interface ImageAnalysisResponse {
  text: string;
  detections: any[];
}

interface ErrorResponse {
  error: string;
  details?: string;
  stack?: string;
}

const optimizeImage = async (imageData: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Max dimensions that still maintain good OCR quality
      const MAX_WIDTH = 1600;
      const MAX_HEIGHT = 1600;
      
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with 0.8 quality to reduce size while maintaining good quality
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
};

export const analyzeImage = async (imageData: string | File): Promise<ImageAnalysisResponse> => {
  try {
    let base64Data: string;
    
    if (typeof imageData === 'string') {
      // If it's already a base64 string, use it directly
      base64Data = imageData.includes('base64,') ? imageData : `data:image/jpeg;base64,${imageData}`;
    } else {
      // If it's a File object, convert it to base64
      base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageData);
      });
    }

    // Log the size of the image data before optimization
    console.log('Original image data size:', base64Data.length);

    // Optimize the image before sending
    const optimizedImage = await optimizeImage(base64Data);
    console.log('Optimized image data size:', optimizedImage.length);

    const response = await fetch(`${config.apiUrl}/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData: optimizedImage }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorData = responseData as ErrorResponse;
      console.error('Server error details:', errorData);
      throw new Error(errorData.details || errorData.error || 'Failed to analyze image');
    }

    return responseData as ImageAnalysisResponse;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}; 