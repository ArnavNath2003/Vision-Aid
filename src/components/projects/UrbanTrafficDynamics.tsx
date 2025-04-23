// UrbanTrafficDynamics.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Activity, Clock, Car, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UrbanTrafficDynamics.css';

interface AnalysisResult {
  vehicleCount: number;
  density: string;
  recommendedSignalTime: number;
  congestionLevel: string;
}

interface SimulationMetrics {
  totalPassed?: number;
  perLane?: Record<number, number>;
  duration?: number;
  totalCounts?: Record<string, number>;
  processedFrames?: number;
}

const UrbanTrafficDynamics: React.FC = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);


  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [simMetrics, setSimMetrics] = useState<SimulationMetrics | null>(null);
  const [simVideoUrl, setSimVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [progress, setProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // show toast for 3 seconds
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  useEffect(() => {
    let interval: any;
    if (simVideoUrl) {
      interval = setInterval(async () => {
        const res = await fetch('/api/get-simulation-metrics');
        if (res.ok) {
          const data = await res.json();
          setSimMetrics(data);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [simVideoUrl]);
  

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) {
      setFile(f);
      setResult(null);
      setSimMetrics(null);
      setSimVideoUrl(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setFile(f);
      setResult(null);
      setSimMetrics(null);
      setSimVideoUrl(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return showToast('No file selected, please select one for analysis.');
    setIsAnalyzing(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/analyze-traffic', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Analysis failed');
      const body: AnalysisResult = await res.json();
      setResult(body);
    } catch (err: any) {
      showToast(`Analysis failed: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartSimulation = async () => {
    if (!file) {
      showToast('No file selected, running default simulation.');
    }
    setIsAnalyzing(true);
    try {
      const form = new FormData();
      if (file) form.append('file', file);
      const res = await fetch('/api/start-simulation', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Simulation error');
      showToast('Simulation started successfully!');
      setSimVideoUrl(body.video_url);
      setSimMetrics(body.result);
    } catch (err: any) {
      showToast(`Simulation failed: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlayVideo = () => {
    if (simVideoUrl) {
      videoRef.current?.play();
    } else {
      showToast('No simulation video to play.');
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    setSimMetrics(null);
    setSimVideoUrl(null);
    setProgress(0);
  };

  const handleExport = () => {
    if (!result) return showToast('No analysis to export');
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="guardian-vision-container">
      <Link to="/projects" className="back-button">
        <ArrowLeft />
        <span>Back to Projects</span>
      </Link>

      {/* Toast */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      <div className="traffic-theme-switch-wrapper">
        <label className="traffic-theme-switch">
          <input
            type="checkbox"
            checked={!isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
          />
          <div className="traffic-slider">
            <div className="traffic-gooey-ball" />
            <div className="traffic-gooey-icons" />
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
        <section
          className="upload-section"
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className={`upload-area ${isDragging ? 'dragging' : ''}`}>            
            <Upload className="upload-icon" size={48} />
            <p className="upload-text">Drag & drop CCTV footage or click to browse</p>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>

          {/* Button always enabled */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
  <button className="play-button" onClick={handleStartSimulation}>
    Start Simulation
  </button>

  {/* Collapsible Analytics Box */}
  {simMetrics && (
    <div className="simulation-analytics" style={{ marginTop: '1.5rem', textAlign: 'left', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', background: isDarkMode ? '#1c1c1c' : '#f9f9f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Simulation Summary</h4>
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: isDarkMode ? '#fff' : '#333',
          }}
        >
          {showAnalytics ? '−' : '+'}
        </button>
      </div>

      {showAnalytics && (
        <div style={{ marginTop: '0.75rem' }}>
          <p><strong>Duration:</strong> {simMetrics.duration ?? '—'} sec</p>
          <p><strong>Total Vehicles Passed:</strong> {simMetrics.totalPassed ?? '—'}</p>
          <p><strong>Frames Processed:</strong> {simMetrics.processedFrames ?? '—'}</p>

          {simMetrics.totalCounts && (
            <div>
              <strong>Vehicle Breakdown:</strong>
              <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                {Object.entries(simMetrics.totalCounts).map(([type, count]) => (
                  <li key={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {simMetrics.perLane && (
            <div>
              <strong>Lane-wise Count:</strong>
              <ul style={{ listStyle: 'none', paddingLeft: '1rem' }}>
                {Object.entries(simMetrics.perLane).map(([lane, cnt]) => (
                  <li key={lane}>Lane {lane}: {cnt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )}
</div>


          {file && !isAnalyzing && !result && !simMetrics && (
            <motion.div
              className="analyze-button-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button className="analyze-button" onClick={handleAnalyze}>
                Analyze Traffic
              </button>
              <div className="file-info">
                <p className="file-name">Selected: {file.name}</p>
                <button className="clear-file-button" onClick={handleClearFile}>
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
                <div className="progress-fill" style={{ width: `${progress}%` }} />
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
                <h3>Signal Time</h3>
                <p>{result.recommendedSignalTime}s</p>
              </div>
              <div className="metric-card">
                <h3>Congestion Level</h3>
                <p>{result.congestionLevel}</p>
              </div>
            </div>
            <button className="action-button" onClick={handleExport}>
              Export Data
            </button>
          </motion.div>
        )}

{simVideoUrl && (
  <section className="simulation-results">
    <video
      ref={videoRef}
      src={simVideoUrl}
      controls
      style={{ maxWidth: '100%', margin: '1rem 0' }}
    />

    <h3 style={{ marginTop: '1rem' }}>📊 Live Updating Analytics</h3>

    <div className="metrics-grid">
      {simMetrics?.totalPassed != null && (
        <div><strong>Total Passed:</strong> {simMetrics.totalPassed}</div>
      )}
      {simMetrics?.perLane &&
        Object.entries(simMetrics.perLane).map(([lane, cnt]) => (
          <div key={lane}>
            <strong>Lane {lane}:</strong> {cnt}
          </div>
        ))}
      {simMetrics?.duration != null && (
        <div><strong>Duration (s):</strong> {simMetrics.duration}</div>
      )}
      {simMetrics?.totalCounts && (
        <>
          {Object.entries(simMetrics.totalCounts).map(([type, cnt]) => (
            <div key={type}>
              <strong>{type}:</strong> {cnt}
            </div>
          ))}
          <div>
            <strong>Frames Processed:</strong> {simMetrics.processedFrames}
          </div>
        </>
      )}
    </div>
  </section>
)}

      </div>
    </div>
  );
};

export default UrbanTrafficDynamics;