import React, { useState } from 'react';
import { Dumbbell, Moon, Sun, Menu, X, User, Settings, LogOut } from 'lucide-react';
import { APP_VERSION } from '../config';

/**
 * Header component that appears at the top of the application
 * Contains app branding, theme toggle, and user menu
 */
const Header = ({ toggleDarkMode, isDarkMode, currentView, setCurrentView }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md z-20 relative">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and brand */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2 text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Dumbbell className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold leading-none">PowerGains</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">v{APP_VERSION.number}</p>
              </div>
            </button>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`font-medium transition-colors ${
                currentView === 'dashboard' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`font-medium transition-colors ${
                currentView === 'analytics' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setCurrentView('workouts')}
              className={`font-medium transition-colors ${
                currentView === 'workouts' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Workouts
            </button>
            <button
              onClick={() => setCurrentView('planner')}
              className={`font-medium transition-colors ${
                currentView === 'planner' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Planner
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={`font-medium transition-colors ${
                currentView === 'upload' 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Import
            </button>
          </nav>
          
          {/* Right section: dark mode toggle and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            {/* Settings button */}
            <button
              onClick={() => setCurrentView('settings')}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none ${
                currentView === 'settings' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
              aria-label="Open menu"
            >
              {menuOpen ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg border-t dark:border-gray-700 absolute w-full z-50">
          <nav className="container mx-auto px-4 py-3 space-y-1">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded ${
                currentView === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentView('analytics');
                setMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded ${
                currentView === 'analytics'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                setCurrentView('workouts');
                setMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded ${
                currentView === 'workouts'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Workouts
            </button>
            <button
              onClick={() => {
                setCurrentView('planner');
                setMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded ${
                currentView === 'planner'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Planner
            </button>
            <button
              onClick={() => {
                setCurrentView('upload');
                setMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded ${
                currentView === 'upload'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Import
            </button>
            <button
              onClick={() => {
                setCurrentView('settings');
                setMenuOpen(false);
              }}
              className={`block w-full text-left py-2 px-3 rounded ${
                currentView === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header; 