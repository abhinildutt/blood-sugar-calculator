// API configuration
export const config = {
  apiUrl: import.meta.env.PROD 
    ? '/api' // In production, use relative path as both client and server are on same domain
    : 'http://localhost:3000/api', // In development, use local server
  isProduction: import.meta.env.PROD
};

// Validate required environment variables in production
if (config.isProduction && !import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL not set, using default API endpoint');
} 