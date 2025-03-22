import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaLightbulb, FaHandHoldingHeart, FaEye, FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Globe, Sun, Moon, ArrowRight } from 'lucide-react';
import './About.css';
import Chatbot from './Chatbot';
import { useLocation } from 'react-router-dom';

const About: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  const chatbotImageUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png";

  // Animation variants for smoother transitions
  const fadeInUp = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  useEffect(() => {
    const handleSlashKey = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== inputRef.current) {
        event.preventDefault();
        if (!isChatOpen) {
          setIsChatOpen(true);
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
  }, [isChatOpen]);

  const Header = () => {
      const location = useLocation(); // Get current route path
    
      return (
        <header className="header">
          <div className="header-container">
            <div className="logo-container">
              <Globe className="logo-icon" />
              <h1 className="logo-text">VisionAid</h1>
            </div>
            <nav className="nav-menu">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
              <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}>Projects</Link>
              <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About</Link>
              <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
            </nav>
            <button className="mode-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="toggle-icon" /> : <Moon className="toggle-icon" />}
            </button>
          </div>
        </header>
      );
    };
  

  const Footer = () => (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">VisionAid</h3>
          <p>Transforming urban infrastructure through intelligent technology.</p>
          <div className="social-icons">
            <a href="#" className="social-icon"><FaGithub /></a>
            <a href="#" className="social-icon"><FaLinkedin /></a>
            <a href="#" className="social-icon"><FaTwitter /></a>
            <a href="#" className="social-icon"><FaInstagram /></a>
          </div>
        </div>
        <div className="footer-section">
          <h4 className="footer-title">Quick Links</h4>
          <div className="footer-links">
            <Link to="/" className="footer-link">Home</Link>
            <Link to="/projects" className="footer-link">Projects</Link>
            <Link to="/about" className="footer-link">About</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
        <div className="footer-section">
          <h4 className="footer-title">Contact</h4>
          <p>Email: info@visionaid.tech</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
        <div className="footer-section">
          <h4 className="footer-title">Newsletter</h4>
          <div className="newsletter-form">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="newsletter-input"
            />
            <button className="newsletter-button">
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © 2024 VisionAid. All Rights Reserved.
      </div>
    </footer>
  );

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <div className="about-container">
        <Header />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button
            className="mode-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun className="toggle-icon" /> : <Moon className="toggle-icon" />}
          </button>

          <button
            className="chatbot-toggle"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <img src={chatbotImageUrl} alt="Chatbot" />
          </button>
          
          <Chatbot
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </motion.div>

        {/* Hero Section - Optimized animation */}
        <motion.section 
          className="about-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.h1 
            className="about-title"
            {...fadeInUp}
          >
            Our Vision for Accessibility
          </motion.h1>
          <motion.p 
            className="about-subtitle"
            {...fadeInUp}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Empowering visually impaired individuals through innovative technology
          </motion.p>
        </motion.section>

        {/* Mission Section - Optimized animation */}
        <motion.section 
          className="mission-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        >
          <motion.div 
            className="mission-content"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <FaEye className="mission-icon" />
            <h2>Our Mission</h2>
            <p>
              We strive to revolutionize urban mobility and public safety by leveraging AI-powered camera systems for efficient traffic management and missing person identification. Our goal is to create smarter, safer cities through innovation and responsible technology.
            </p>
          </motion.div>
        </motion.section>

        {/* Values Section - Optimized animation */}
        <motion.section 
          className="values-section"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <h2 className="values-title">Our Core Values</h2>
          <div className="values-grid">
            <motion.div 
              className="value-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <FaUsers className="value-icon" />
              <h3>Inclusivity</h3>
              <p>Creating technology that serves everyone, regardless of their visual abilities</p>
            </motion.div>

            <motion.div 
              className="value-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <FaLightbulb className="value-icon" />
              <h3>Innovation</h3>
              <p>Continuously pushing boundaries to develop cutting-edge accessibility solutions</p>
            </motion.div>

            <motion.div 
              className="value-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <FaHandHoldingHeart className="value-icon" />
              <h3>Empowerment</h3>
              <p>Enabling independence and confidence through our technology</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Timeline Section */}
        <section className="timeline-section">
          <motion.h2 
            className="timeline-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Journey
          </motion.h2>
          <div className="timeline">
            <motion.div 
              className="timeline-item"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
            >
              <motion.div 
                className="timeline-content"
                whileHover={{ 
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  borderColor: "var(--color-primary)",
                  borderWidth: "2px",
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <h3>Project Inception</h3>
                <p>Started with a vision to make digital content accessible to all</p>
                <div className="timeline-dot"></div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="timeline-item"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
            >
              <motion.div 
                className="timeline-content"
                whileHover={{ 
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  borderColor: "var(--color-primary)",
                  borderWidth: "2px",
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <h3>Research & Development</h3>
                <p>Extensive research and testing of innovative accessibility solutions</p>
                <div className="timeline-dot"></div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="timeline-item"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
            >
              <motion.div 
                className="timeline-content"
                whileHover={{ 
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  borderColor: "var(--color-primary)",
                  borderWidth: "2px",
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <h3>Implementation</h3>
                <p>Developing and refining our accessibility tools</p>
                <div className="timeline-dot"></div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="timeline-item"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
            >
              <motion.div 
                className="timeline-content"
                whileHover={{ 
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                  borderColor: "var(--color-primary)",
                  borderWidth: "2px",
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <h3>Future Vision</h3>
                <p>Expanding our reach and impact in digital accessibility</p>
                <div className="timeline-dot"></div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <h2 className="team-title">Meet Our Team</h2>
          <div className="team-grid">
            <motion.div 
              className="team-member"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="member-avatar"></div>
              <h3>Dr. Sarah Chen</h3>
              <p>Lead Researcher</p>
            </motion.div>

            <motion.div 
              className="team-member"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="member-avatar"></div>
              <h3>Alex Rodriguez</h3>
              <p>AI Specialist</p>
            </motion.div>

            <motion.div 
              className="team-member"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="member-avatar"></div>
              <h3>Maya Patel</h3>
              <p>Accessibility Expert</p>
            </motion.div>
            <motion.div 
              className="team-member"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="member-avatar"></div>
              <h3>Alex Rodriguez</h3>
              <p>AI Specialist</p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default About; 
