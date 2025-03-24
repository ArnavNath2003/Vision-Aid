import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Activity, Clock, Car, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UrbanTrafficDynamics.css';

interface AnalysisResult {
  vehicleCount: number;
  density: string;
  recommendedSignalTime: number;
  congestionLevel: string;
}

const UrbanTrafficDynamics: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/'))) {
      setFile(droppedFile);
      setResult(null); // Reset previous results
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Reset previous results
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Here you'll add your actual model/analysis logic
      // Example structure:
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/analyze-traffic', {
      //   method: 'POST',
      //   body: formData
      // });
      // const result = await response.json();
      // setResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Add error handling here
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className={`project-page ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Link to="/projects" className="back-button">
        <ArrowLeft />
        <span>Back to Projects</span>
      </Link>

      <div className="theme-switch-wrapper">
        <label className="theme-switch">
          <input
            type="checkbox"
            checked={!isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
          />
          <div className="slider">
            <div className="gooey-container">
              <div className="gooey-ball"></div>
              <div className="gooey-icons">
                <svg className="sun" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                  <path d="M12 5V3M12 21v-2M5 12H3m18 0h-2M6.4 6.4L5 5m12.6 12.6l1.4 1.4M6.4 17.6L5 19m12.6-12.6L19 5" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <svg className="moon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" 
                    fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </label>
      </div>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="project-header"
      >
        <h1>Urban Traffic Dynamics</h1>
        <p className="project-description">
          AI-powered traffic optimization system for smart cities
        </p>
      </motion.header>

      <div className="content-container">
        <section className="upload-section">
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="upload-icon" size={48} />
            <p className="upload-text">Drag and drop CCTV footage or click to browse</p>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>

          {file && !isAnalyzing && !result && (
            <motion.div 
              className="analyze-button-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button 
                className="analyze-button"
                onClick={handleAnalyze}
              >
                Analyze Traffic
              </button>
              <div className="file-info">
                <p className="file-name">Selected: {file.name}</p>
                <button 
                  className="clear-file-button"
                  onClick={handleClearFile}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </section>

        {isAnalyzing && (
          <section className="analysis-section">
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          </section>
        )}

        {result && (
          <motion.div 
            className="results-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2>Analysis Results</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <Car className="metric-icon" />
                <h3>Vehicle Count</h3>
                <p>{result.vehicleCount}</p>
              </div>
              <div className="metric-card">
                <Activity className="metric-icon" />
                <h3>Traffic Density</h3>
                <p>{result.density}</p>
              </div>
              <div className="metric-card">
                <Clock className="metric-icon" />
                <h3>Recommended Signal Time</h3>
                <p>{result.recommendedSignalTime}s</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UrbanTrafficDynamics;

