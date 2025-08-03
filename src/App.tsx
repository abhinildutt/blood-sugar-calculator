import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Header from './components/Header';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionProvider } from './contexts/SessionContext';
import React from 'react';

function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Header />
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </main>
            
            <footer className="bg-gray-800 dark:bg-gray-950 text-gray-300 dark:text-gray-400 py-6 transition-colors duration-300">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <p className="text-sm">
                      GlycoScan: Blood Sugar Spike Calculator
                    </p>
                    <p className="text-xs mt-1">
                      This application provides estimates and should not be used for medical decision-making.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      Built with React, TypeScript, and Tesseract.js
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;
