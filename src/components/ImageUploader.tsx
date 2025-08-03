import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Country } from '../types';

interface ImageUploaderProps {
  onImageCaptured: (file: File, country: Country) => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageCaptured, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>('US');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countryOptions = [
    { value: 'US' as Country, label: 'United States', flag: '🇺🇸' },
    { value: 'UK' as Country, label: 'United Kingdom', flag: '🇬🇧' },
  ];

  const selectedOption = countryOptions.find(option => option.value === selectedCountry);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          onImageCaptured(file, selectedCountry);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          onImageCaptured(file, selectedCountry);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImageSrc(imageSrc);
        
        // Convert base64 to file
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
            onImageCaptured(file, selectedCountry);
          });
      }
    }
  }, [webcamRef, onImageCaptured, selectedCountry]);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetImage = () => {
    setImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderCountrySelector = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Country <span className="text-red-500">*</span>
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className={`
            relative w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2.5 text-left cursor-default
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            hover:border-gray-400 transition-colors duration-200
            ${isLoading ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="flex items-center">
            <span className="text-lg mr-3">{selectedOption?.flag}</span>
            <span className="block truncate text-gray-900">{selectedOption?.label}</span>
          </span>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
            {countryOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  setSelectedCountry(option.value);
                  setIsDropdownOpen(false);
                }}
                className={`
                  cursor-pointer select-none relative py-2.5 pl-3 pr-9
                  hover:bg-indigo-50 hover:text-indigo-900 transition-colors duration-150
                  ${selectedCountry === option.value ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}
                `}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{option.flag}</span>
                  <span className="font-medium block truncate">{option.label}</span>
                </div>
                {selectedCountry === option.value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        This helps us accurately parse your nutrition label format
      </p>
    </div>
  );

  const renderUploadTab = () => (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {!imageSrc ? (
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            Drag and drop an image, or <button className="text-indigo-600 hover:text-indigo-500" onClick={triggerFileInput}>browse</button>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, GIF up to 10MB
          </p>
        </div>
      ) : (
        <div className="relative w-full">
          <img src={imageSrc} alt="Preview" className="rounded-lg mx-auto max-h-64 object-contain" />
          {!isLoading && (
            <button
              onClick={resetImage}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderCameraTab = () => (
    <div className="flex flex-col items-center">
      {!imageSrc ? (
        <>
          <div className="w-full relative">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="rounded-lg w-full"
            />
          </div>
          <button
            onClick={captureImage}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            Capture Photo
          </button>
        </>
      ) : (
        <div className="relative w-full">
          <img src={imageSrc} alt="Captured" className="rounded-lg mx-auto max-h-64 object-contain" />
          {!isLoading && (
            <button
              onClick={resetImage}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-4">
      {renderCountrySelector()}
      
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-1/2 py-2 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Image
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`w-1/2 py-2 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'camera'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Use Camera
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'upload' ? renderUploadTab() : renderCameraTab()}
      </div>
    </div>
  );
};

export default ImageUploader; 