import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ClipboardDocumentListIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import logo from '../assets/logo.png';

const Header: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <header className="bg-indigo-600 dark:bg-gray-900 shadow-md transition-colors duration-300">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Original Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={logo}
                alt="Northwestern Logo"
                className="h-16 w-auto mr-2"
              />
            </Link>
          </div>
          
          {/* Center - GlycoScan logo and text */}
          <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            <span className="text-white text-2xl font-bold -ml-1">GlycoScan</span>
          </div>
          
          {/* Right side - Navigation and Dark Mode Toggle */}
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <Link 
                to="/" 
                className="text-white hover:text-indigo-100 dark:hover:text-indigo-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                to="/about" 
                className="text-white hover:text-indigo-100 dark:hover:text-indigo-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                About
              </Link>
            </nav>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-indigo-700 dark:bg-gray-800 text-white hover:bg-indigo-800 dark:hover:bg-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 