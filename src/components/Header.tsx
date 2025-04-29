import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  return (
    <header className="bg-indigo-600 shadow-md">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={logo}
                alt="Northwestern Logo"
                className="h-16 w-auto mr-2"
              />
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
            <span className="text-white text-2xl font-bold -ml-1">GlycoScan</span>
          </div>
          
          <nav className="flex space-x-4">
            <Link to="/" className="text-white hover:text-indigo-100 px-3 py-2 rounded-md text-sm font-medium">
              Home
            </Link>
            <Link to="/about" className="text-white hover:text-indigo-100 px-3 py-2 rounded-md text-sm font-medium">
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 