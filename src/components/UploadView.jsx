import React, { useState, useRef } from 'react';
import { UploadCloud, FilePlus, File, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Component for uploading CSV workout data
 */
const UploadView = ({ handleFileUpload, isLoading, error, successMessage }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleFileUpload(e);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      const event = { target: { files: e.dataTransfer.files } };
      handleFileUpload(event);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Import Workout Data
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Upload your Strong app CSV export to analyze your workout history
        </p>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-md flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800 dark:text-green-300">Success</h3>
            <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
          </div>
        </div>
      )}
      
      {/* Upload area */}
      <div 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Importing your workout data...</p>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            
            <UploadCloud className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
              {selectedFile ? selectedFile.name : 'Drag & drop or click to upload'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Supported format: CSV export from Strong app
            </p>
            
            <button
              onClick={handleButtonClick}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm inline-flex items-center"
              disabled={isLoading}
            >
              <FilePlus className="h-5 w-5 mr-2" />
              {selectedFile ? 'Choose a different file' : 'Select CSV file'}
            </button>
          </>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-10 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          How to export data from Strong app
        </h3>
        <ol className="list-decimal pl-5 space-y-3 text-gray-600 dark:text-gray-300">
          <li>Open the Strong app on your iOS or Android device</li>
          <li>Tap on the <strong>Profile</strong> tab in the bottom navigation</li>
          <li>Select <strong>Settings</strong> (gear icon)</li>
          <li>Scroll down and tap <strong>Export Data</strong></li>
          <li>Choose <strong>CSV</strong> as the export format</li>
          <li>Share/save the file to your device</li>
          <li>Upload the saved CSV file here</li>
        </ol>
        
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded p-4 text-sm">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 shrink-0" />
            <div className="text-yellow-700 dark:text-yellow-300">
              <p className="font-medium">Important notes:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>All data is processed locally in your browser</li>
                <li>No data is sent to any external servers</li>
                <li>Your data will be saved in your browser's local storage</li>
                <li>Clearing your browser data will remove your saved workouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView; 