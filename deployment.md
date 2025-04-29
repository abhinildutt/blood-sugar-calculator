# Deployment Guide

## Server Deployment

1. Choose a server platform (Heroku, DigitalOcean, Railway, etc.)
2. Set up the following environment variables on your server platform:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
   PORT=8000
   CORS_ORIGIN=https://your-client-domain.com
   ```
3. Upload your Google Cloud credentials JSON file to the server platform
4. Deploy the server code

### Server Platform-Specific Instructions

#### Heroku
```bash
# Install Heroku CLI
brew install heroku/brew/heroku

# Login to Heroku
heroku login

# Create a new Heroku app
heroku create glycoscan-server

# Set environment variables
heroku config:set GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
heroku config:set CORS_ORIGIN=https://your-client-domain.com

# Add Google credentials buildpack
heroku buildpacks:add https://github.com/gerywahyunugraha/heroku-google-application-credentials-buildpack

# Set the Google credentials as an environment variable
heroku config:set GOOGLE_CREDENTIALS=$(cat path/to/your/google-credentials.json)

# Deploy
git push heroku main
```

## Client Deployment

1. Set up environment variables in Vercel:
   - Go to your project settings
   - Add the following environment variables:
     ```
     VITE_API_URL=https://your-server-domain.com
     ```

2. Deploy to Vercel:
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

3. After the first deployment, set up automatic deployments:
   - Connect your GitHub repository
   - Enable automatic deployments for main branch

## Important Notes

1. Make sure CORS is properly configured on the server to accept requests from your client domain
2. Never commit sensitive credentials to version control
3. Keep your Google Cloud credentials secure and restricted
4. Monitor your server logs for any issues
5. Set up proper error tracking and monitoring

## Local Development vs Production

The main differences between local and production environments:

1. API URLs:
   - Local: `http://localhost:8000`
   - Production: `https://your-server-domain.com`

2. CORS settings:
   - Local: `http://localhost:5173`
   - Production: `https://your-client-domain.com`

3. Credentials:
   - Local: Local file system
   - Production: Environment variables

## Troubleshooting

1. If you encounter CORS errors:
   - Verify the CORS_ORIGIN environment variable on the server
   - Check that your client is making requests to the correct server URL
   - Ensure your server's security groups/firewall allows incoming requests

2. If Google Cloud operations fail:
   - Verify the Google credentials are properly set up
   - Check the server logs for specific error messages
   - Ensure the service account has the necessary permissions 