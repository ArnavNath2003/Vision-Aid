import React, { useEffect, useState, useRef } from 'react';
import './Toast.css';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3500 }) => {
  const [isFading, setIsFading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start the fade-out animation before closing
  const startFadeOut = () => {
    setIsFading(true);
    // Wait for the animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 500); // Match the animation duration in CSS
  };

  useEffect(() => {
    // Set a timer to start the fade-out animation
    timerRef.current = setTimeout(() => {
      startFadeOut();
    }, duration - 500); // Start the animation 500ms before the duration ends

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertCircle size={18} />;
      default:
        return null;
    }
  };

  return (
    <div className={`toast toast-${type} ${isFading ? 'fade-out' : ''}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={startFadeOut}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
