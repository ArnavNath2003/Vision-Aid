import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateResponse } from '../services/openRouterService';
import './Chatbot.css';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: getGreetingMessage(), sender: 'bot' }
  ]);
  const [chatMessage, setChatMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSlashKey = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        if (!isOpen) {
          onClose(); // If closed, still call onClose to handle state in parent
        }
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleSlashKey);
    return () => {
      window.removeEventListener('keydown', handleSlashKey);
    };
  }, [isOpen, onClose]);

  // Enhanced close animation handling
  const onCloseWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match this with CSS animation duration
  };

  // Updated ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onCloseWithAnimation();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleSendMessage = async () => {
    if (chatMessage.trim() && !isProcessing) {
      const userMessage: ChatMessage = { text: chatMessage, sender: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setChatMessage('');
      setIsProcessing(true);

      try {
        const messageHistory: OpenRouterMessage[] = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

        const response = await generateResponse([
          ...messageHistory,
          { role: 'user' as const, content: chatMessage }
        ]);

        const navigationMatch = response.match(/navigate:\/(\w+)/);
        if (navigationMatch) {
          const route = navigationMatch[1];
          const displayMessage = response.replace(/navigate:\/\w+/, '').trim();
          setMessages(prev => [...prev, { text: displayMessage, sender: 'bot' }]);
          setTimeout(() => {
            navigate(`/${route === 'home' ? '' : route}`);
          }, 1000);
        } else {
          setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, {
          text: "I apologize, but I'm having trouble connecting right now. Please try again.",
          sender: 'bot'
        }]);
      } finally {
        setIsProcessing(false);
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function getGreetingMessage() {
    const currentHour = new Date().getHours();
    let greeting = "Good evening!";

    if (currentHour >= 5 && currentHour < 12) {
      greeting = "Good morning!";
    } else if (currentHour >= 12 && currentHour < 18) {
      greeting = "Good afternoon!";
    }
    return greeting + " How can I help you today?";
  }

  return (
    <div className={`chatbot-window ${isOpen ? 'open' : (isClosing ? 'closed' : '')}`}>
      <div className="chatbot-header">
        <h3>AI Assistant</h3>
        <button onClick={onCloseWithAnimation}>
          <X size={20} />
        </button>
      </div>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`chatbot-message ${message.sender} ${isProcessing && index === messages.length - 1 ? 'processing' : ''}`}>
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input">
        <input
          ref={inputRef}
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder={isProcessing ? "Processing..." : "Press '/' to chat"}
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isProcessing) {
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage} disabled={isProcessing}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default Chatbot; 
