import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { 
  Globe, Sun, Moon, ArrowRight, X, Send, 
  Network, Layers, Shield, Clock, Smartphone, 
  Database, Map, ChevronRight, Terminal, 
  Compass, Activity, Award, User, Bolt, Lightbulb, TrendingUp
} from 'lucide-react';
import * as THREE from 'three';
import './Projects.css';
import Chatbot from './Chatbot'; // Adjust path if necessary
import { useLocation } from 'react-router-dom';

const Projects: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  
  const chatbotImageUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png";

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current as HTMLCanvasElement,
      alpha: true,
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Set background color
    const bgColor = isDarkMode ? new THREE.Color(0x0a1128) : new THREE.Color(0xf0f8ff);
    scene.background = bgColor;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x404040 : 0xffffff, 
      isDarkMode ? 0.5 : 0.7
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 50;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: isDarkMode ? 0x4fc3f7 : 0x2962ff,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Position camera
    camera.position.z = 15;

    // Animation loop
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const time = Date.now() * 0.0005;

      // Rotate particles slowly
      particlesMesh.rotation.y = time * 0.05;
      particlesMesh.rotation.x = time * 0.025;
      
      // Create subtle wave effect
      particlesMesh.position.y = Math.sin(time) * 0.2;
      
      // Subtle camera movement
      camera.position.x = Math.sin(time * 0.2) * 0.5;
      camera.position.y = Math.cos(time * 0.2) * 0.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frame);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          // @ts-ignore: Object is possibly 'null'
          object.material.dispose();
        }
      });
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [isDarkMode]);

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

  const projects = [
    {
      id: "urban-traffic",
      title: "Urban Traffic Dynamics",
      category: "ai",
      description:
        "Revolutionizing urban mobility through AI-powered traffic optimization, reducing congestion by up to 35% in pilot cities.",
      icon: <Network className="project-icon" />,
      color: "primary",
      technologies: ["TensorFlow", "Computer Vision", "IoT Sensors", "Cloud Computing"],
      features: [
        "Real-time traffic flow optimization",
        "Predictive congestion management",
        "Smart traffic light synchronization",
        "Emergency vehicle priority routing",
      ],
      status: "active",
      impact: "Implemented in 3 major urban centers with 27% average reduction in commute times.",
      image: "/api/placeholder/600/400",
    },
    {
      id: "smart-infrastructure",
      title: "Smart Infrastructure Intelligence",
      category: "ai",
      description:
        "Pioneering proactive infrastructure management using advanced AI to detect potential failures before they occur.",
      icon: <Layers className="project-icon" />,
      color: "success",
      technologies: ["Machine Learning", "Structural Sensors", "Digital Twins", "Predictive Analytics"],
      features: [
        "Continuous structural health monitoring",
        "Predictive maintenance scheduling",
        "Resource optimization algorithms",
        "Climate impact assessments",
      ],
      status: "active",
      impact: "Prevented 12 critical infrastructure failures in 2023, saving an estimated $43M in repair costs.",
      image: "/api/placeholder/600/400",
    },
  ];
  
  // Component to render project cards
  const ProjectCard = ({ project }) => {
    return (
      <div className="project-card">
        <img src={project.image} alt={project.title} className="project-image" />
        <div className="project-content">
          <div className="project-header">
            {project.icon}
            <h3 className="project-title">{project.title}</h3>
          </div>
          <p className="project-description">{project.description}</p>
          {/* Styled Active Status Badge */}
          <span className={`status-badge ${project.status === "active" ? "active-status" : ""}`}>
            {project.status === "active" ? "🟢 Active" : "🔴 Inactive"}
          </span>
        </div>
      </div>
    );
  };
  

  const toggleProjectExpansion = (id: string) => {
    if (expandedProject === id) {
      setExpandedProject(null);
    } else {
      setExpandedProject(id);
    }
  };

  const goToPreviousProject = () => {
    setCurrentProjectIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : projects.length - 1));
  };

  const goToNextProject = () => {
    setCurrentProjectIndex((prevIndex) => (prevIndex < projects.length - 1 ? prevIndex + 1 : 0));
  };

  const currentProject = projects[currentProjectIndex];

  const ProjectBenefits = () => {
    const benefits = [
      {
        icon: <TrendingUp className="benefit-icon" />,
        title: "Traffic Flow Optimization",
        description: "Reduce congestion & improve commute times by dynamically adjusting traffic signals."
      },
      {
        icon: <Layers className="benefit-icon" />,
        title: "Proactive Infrastructure Maintenance",
        description: "Early detection of structural issues prevents failures & ensures timely repairs."
      },
      {
        icon: <Lightbulb className="benefit-icon" />,
        title: "Data-Driven Urban Planning",
        description: "Insights for informed city planning & efficient resource allocation."
      },
      {
        icon: <Bolt className="benefit-icon" />,
        title: "Scalable & Collaborative",
        description: "Solutions designed for government collaboration & easy integration."
      }
    ];

    return (
      <motion.section
        className="project-benefits-section"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="benefits-heading">Project Benefits</h2>
        <div className="benefits-container">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="benefit-card"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="benefit-icon-container">
                {benefit.icon}
              </div>
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    );
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <canvas ref={canvasRef} className="canvas-container" />
      <Header />
      
      <button
        className="chatbot-toggle"
        onClick={() => setIsChatOpen(true)}
      >
        <img src={chatbotImageUrl} alt="Chatbot" />
      </button>
      
      <Chatbot
        isOpen={isChatOpen}
        onClose={handleChatClose}
      />
      
      <main className="projects-container">
        {/* Hero Section */}
        <motion.section 
          className="projects-hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="projects-title"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            Our Innovation Portfolio
          </motion.h1>
          <motion.p 
            className="projects-subtitle"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Exploring the frontier of accessible technology solutions
          </motion.p>
        </motion.section>

        {/* Project Carousel Section */}
        <motion.section
          className="project-carousel-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="project-carousel">
            <button className="carousel-button prev" onClick={goToPreviousProject}>
              <ChevronRight size={24} />
            </button>
            <motion.div
              className={`project-card expanded carousel-card`}
              key={currentProject.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              onClick={() => toggleProjectExpansion(currentProject.id)}
            >
              <div className="project-header">
                <div className={`project-icon-container ${currentProject.color}`}>
                  {currentProject.icon}
                </div>
                <h3 className="project-title">{currentProject.title}</h3>
                <div className={`project-status ${currentProject.status}`}>
                  {currentProject.status}
                </div>
              </div>
              
              <p className="project-description">{currentProject.description}</p>
              
              {expandedProject === currentProject.id && (
                <motion.div 
                  className="project-details"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="project-image-container">
                    <img src={currentProject.image} alt={currentProject.title} className="project-image" />
                  </div>
                  
                  <div className="project-tech">
                    <h4>Technologies</h4>
                    <div className="tech-tags">
                      {currentProject.technologies.map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="project-features">
                    <h4>Key Features</h4>
                    <ul>
                      {currentProject.features.map((feature, i) => (
                        <li key={i} className="feature-item">
                          <ChevronRight size={16} className="feature-icon" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="project-impact">
                    <h4>Impact</h4>
                    <p>{currentProject.impact}</p>
                  </div>
                  
                  <button className="project-button">
                    Learn More
                  </button>
                </motion.div>
              )}
              
              {expandedProject !== currentProject.id && (
                <button className="view-details-button">
                  View Details
                </button>
              )}
            </motion.div>
            <button className="carousel-button next" onClick={goToNextProject}>
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.section>

        <ProjectBenefits />

        {/* Call To Action */}
        <motion.section 
          className="projects-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="cta-content">
            <h2 className="cta-title">Join Our Innovation Journey</h2>
            <p className="cta-description">
              Get involved with our projects or suggest new accessibility challenges we can solve together.
            </p>
            <div className="cta-buttons">
              <button className="cta-button primary">
                Become a Partner
              </button>
              <button className="cta-button secondary">
                Suggest a Project
              </button>
            </div>
          </div>
        </motion.section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
