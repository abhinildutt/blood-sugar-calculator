import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  googleCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../google-credentials.json'),
  isProduction: process.env.NODE_ENV === 'production'
};

// Validate required environment variables in production
if (config.isProduction) {
  const requiredEnvVars = ['GOOGLE_APPLICATION_CREDENTIALS', 'CORS_ORIGIN'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
} 