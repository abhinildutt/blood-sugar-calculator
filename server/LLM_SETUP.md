# LLM Integration Setup Guide

This project now uses Google Gemini AI to extract nutrition information from OCR text instead of manual regex parsing.

## Setup Requirements

### 1. Google Cloud Vision API (Already configured)
- You already have this set up for OCR text extraction
- Uses `GOOGLE_CLOUD_CREDENTIALS` environment variable

### 2. Google Gemini AI API Key
- Get your free API key from: https://makersuite.google.com/app/apikey
- Set the environment variable: `GOOGLE_API_KEY=your_key_here`

## Environment Variables

Add these to your server environment:

```bash
# Google Cloud Vision (already configured)
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}

# Google Gemini AI (new)
GOOGLE_API_KEY=your_gemini_api_key_here

# Server config
PORT=3000
NODE_ENV=development
```

## How It Works

1. **Image Upload**: User uploads a nutrition label image
2. **OCR Processing**: Google Cloud Vision extracts text from the image
3. **LLM Extraction**: Google Gemini AI analyzes the OCR text and extracts nutrition data
4. **Fallback**: If LLM fails, falls back to manual parsing
5. **Response**: Returns structured nutrition data with confidence scores

## Benefits of LLM Approach

- **More Accurate**: Better understanding of context and label formats
- **Flexible**: Handles various label layouts and OCR errors
- **Intelligent**: Distinguishes between per-serving and per-100g values
- **Confidence Scoring**: Provides reliability metrics for extracted data
- **Fallback Support**: Gracefully degrades if AI service is unavailable

## Free Tier Limits

- **Google Gemini**: 15 requests/minute, 1000 requests/day (free)
- **Google Cloud Vision**: Already configured in your project

## Testing

The system will automatically fall back to manual parsing if:
- LLM API key is not set
- LLM service is unavailable
- LLM extraction fails

This ensures your app continues to work even if the AI service has issues.
