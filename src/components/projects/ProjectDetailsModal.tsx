import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import './ProjectDetailsModal.css';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    description: string;
    technologies: string[];
    features: string[];
    metrics?: Array<{ value: string; label: string }>;
    impact?: string;
  };
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // We're not locking scroll anymore as per user request
  // This allows users to continue scrolling the background content

  if (!isOpen) return null;

  // Project-specific content
  const getProjectContent = () => {
    switch (project.id) {
      case 'urban-traffic':
        return (
          <>
            <div className="project-modal-section">
              <h3>Project Overview</h3>
              <p>
                Urban Traffic Dynamics is an AI-powered traffic management system designed to optimize
                traffic flow in urban environments. By leveraging computer vision and machine learning,
                the system analyzes real-time traffic data to reduce congestion, minimize travel times,
                and improve overall urban mobility.
              </p>
            </div>

            <div className="project-modal-section">
              <h3>Key Features</h3>
              <ul className="project-modal-features">
                {project.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
                <li>Dynamic traffic signal optimization based on real-time traffic density</li>
                <li>Historical data analysis for predictive traffic management</li>
                <li>Integration with existing traffic infrastructure</li>
                <li>Customizable dashboards for traffic management centers</li>
              </ul>
            </div>

            <div className="project-modal-section">
              <h3>Technical Architecture</h3>
              <p>
                The system uses YOLOv8 for vehicle detection and classification, with TensorFlow
                for traffic flow prediction models. The backend processes video feeds from traffic
                cameras in real-time, while the React frontend provides intuitive visualization
                and control interfaces for traffic management personnel.
              </p>
            </div>

            <div className="project-modal-section">
              <h3>Impact & Results</h3>
              <div className="project-modal-metrics">
                {project.metrics?.map((metric, index) => (
                  <div key={index} className="project-modal-metric">
                    <div className="metric-value">{metric.value}</div>
                    <div className="metric-label">{metric.label}</div>
                  </div>
                ))}
              </div>
              <p>
                In pilot cities, Urban Traffic Dynamics has demonstrated moderate improvements
                in traffic flow, reducing average commute times by up to 18% during peak hours
                and decreasing vehicle emissions by approximately 15% due to reduced idling time.
                The system continues to be refined based on real-world performance data.
              </p>
            </div>
          </>
        );

      case 'guardian-vision':
        return (
          <>
            <div className="project-modal-section">
              <h3>Project Overview</h3>
              <p>
                Guardian Vision is an advanced facial recognition system designed to help locate
                missing persons through multi-source surveillance integration. The system processes
                video feeds from various sources including CCTV networks, drones, and webcams to
                identify potential matches with missing person records.
              </p>
            </div>

            <div className="project-modal-section">
              <h3>Key Features</h3>
              <ul className="project-modal-features">
                {project.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
                <li>Privacy-focused design with data protection measures</li>
                <li>Alert system for potential matches with confidence scoring</li>
                <li>Secure dashboard for authorized personnel</li>
                <li>Cross-platform compatibility for field operations</li>
              </ul>
            </div>

            <div className="project-modal-section">
              <h3>Technical Architecture</h3>
              <p>
                Guardian Vision employs TensorFlow.js for client-side facial recognition,
                with SSD (Single Shot MultiBox Detector) for initial face detection. The system
                uses WebRTC for real-time video processing and implements advanced data augmentation
                techniques to improve recognition accuracy across different lighting conditions,
                angles, and partial occlusions.
              </p>
            </div>

            <div className="project-modal-section">
              <h3>Impact & Results</h3>
              <div className="project-modal-metrics">
                {project.metrics?.map((metric, index) => (
                  <div key={index} className="project-modal-metric">
                    <div className="metric-value">{metric.value}</div>
                    <div className="metric-label">{metric.label}</div>
                  </div>
                ))}
              </div>
              <p>
                Guardian Vision has been deployed in limited test scenarios with law enforcement
                agencies, showing promising but mixed results. The current accuracy rate of 78%
                represents an improvement over earlier versions, but still requires human verification
                of all potential matches. The system continues to be developed with a focus on
                reducing false positives while maintaining strict privacy controls.
              </p>
            </div>
          </>
        );

      default:
        return <p>No detailed information available for this project.</p>;
    }
  };

  return (
    <div className="project-modal-overlay">
      <div className="project-modal-container" ref={modalRef}>
        <button className="project-modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="project-modal-header">
          <h2>{project.title}</h2>
          <div className="project-modal-tags">
            {project.technologies.map((tech, index) => (
              <span key={index} className="project-modal-tag">{tech}</span>
            ))}
          </div>
        </div>

        <div className="project-modal-content">
          {getProjectContent()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;
