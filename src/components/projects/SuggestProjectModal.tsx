import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { addSuggestion } from '../../services/projectSuggestionService';
import './SuggestProjectModal.css';

interface SuggestProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuggestProjectModal: React.FC<SuggestProjectModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store the suggestion
      addSuggestion(email, suggestion);

      // Update UI state
      setIsSubmitting(false);
      setIsSubmitted(true);

      // Reset form after showing success message
      setTimeout(() => {
        setEmail('');
        setSuggestion('');
        setIsSubmitted(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error saving suggestion:', error);
      setIsSubmitting(false);
      // In a real app, you might want to show an error message here
    }
  };

  return (
    <div className="suggest-project-overlay">
      <motion.div
        className="suggest-project-modal"
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <button className="suggest-project-close" onClick={onClose}>
          <X size={18} />
        </button>

        <h3 className="suggest-project-title">Suggest a Project</h3>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="suggest-project-form">
            <div className="form-group">
              <label htmlFor="email">Your Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="suggestion">Project Suggestion</label>
              <textarea
                id="suggestion"
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Describe your project idea..."
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              className="suggest-project-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Suggestion'}
              {!isSubmitting && <Send size={16} />}
            </button>
          </form>
        ) : (
          <div className="suggest-project-success">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h4>Thank You!</h4>
              <p>Your project suggestion has been submitted.</p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SuggestProjectModal;
