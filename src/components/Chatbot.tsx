import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react'; // Import necessary icons
import './Chatbot.css'; // Import the new CSS file

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [messages, setMessages] = useState([
        { text: getGreetingMessage(), sender: 'bot' }
    ]);
    const [chatMessage, setChatMessage] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isClosing, setIsClosing] = useState(false); // Add a state to handle closing animation

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

    // New useEffect for handling ESC key press
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCloseWithAnimation(); // Call the new function for closing with animation
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => {
            window.removeEventListener('keydown', handleEscKey);
        };
    }, [onClose]);


    const handleSendMessage = () => {
        if (chatMessage.trim()) {
            const newMessage = { text: chatMessage, sender: 'user' };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            setChatMessage('');
            setTimeout(() => {
                const botResponse = { text: "Thank you for your message!", sender: 'bot' };
                setMessages(prevMessages => [...prevMessages, botResponse]);
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 500);
        }
    };

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

    // Modified onClose function to handle animation
    const onCloseWithAnimation = () => {
        setIsClosing(true); // Set state to start closing animation
        setTimeout(() => {
            onClose(); // Call onClose first
            setIsClosing(false); // Reset isClosing state AFTER onClose
        }, 300); // Duration should match your fadeOut animation duration in CSS (0.3s = 300ms)
    };

    return (
        <div className={`chatbot-window ${isOpen ? 'open' : (isClosing ? 'closed' : '')}`}> {/* Apply 'closed' class when isClosing is true */}
            <div className="chatbot-header">
                <h3>AI Assistant</h3>
                <button onClick={onCloseWithAnimation}> {/* Use onCloseWithAnimation for close button */}
                    <X size={20} />
                </button>
            </div>
            <div className="chatbot-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`chatbot-message ${message.sender}`}>
                        {message.text}
                    </div>
                ))}
            </div>
            <div className="chatbot-input">
                <input
                    ref={inputRef}
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Press '/' to chat"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                        }
                    }}
                />
                <button onClick={handleSendMessage}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default Chatbot; 