import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Moon, Sun, Globe, Layers, Network, Zap, 
  ArrowRight, Shield, Clock, Smartphone, Database, Map,
  MessageCircle, X, Send 
} from 'lucide-react';
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram } from 'react-icons/fa';
import './VisionAidHomepage.css';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Chatbot from './Chatbot'; // Adjust path if necessary

const VisionAidHomepage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [hoveredProject, setHoveredProject] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const chatbotImageUrl = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png";

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  useEffect(() => {
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

    // Create hexagonal grid
    const createHexagon = (x: number, y: number, size: number) => {
      const shape = new THREE.Shape();
      const sides = 6;
      const radius = size;

      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }

      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshPhysicalMaterial({
        color: isDarkMode ? 0x66ccff : 0x3366ff,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        transparent: true,
        opacity: isDarkMode ? 0.15 : 0.1,
        side: THREE.DoubleSide
      });

      const hexagon = new THREE.Mesh(geometry, material);
      hexagon.position.set(x, y, 0);
      scene.add(hexagon);
      return hexagon;
    };

    // Create grid of hexagons
    const hexagons: THREE.Mesh[] = [];
    const gridSize = 8;
    const hexSize = 1;
    const spacing = hexSize * 1.8;

    for (let row = -gridSize; row <= gridSize; row++) {
      const offset = (row % 2) * (spacing / 2);
      for (let col = -gridSize; col <= gridSize; col++) {
        const x = col * spacing + offset;
        const y = row * (spacing * 0.866); // Height of hexagon * spacing
        hexagons.push(createHexagon(x, y, hexSize));
      }
    }

    // Position camera
    camera.position.z = 15;

    // Animation loop
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Animate hexagons
      hexagons.forEach((hexagon, index) => {
        const offset = index * 0.1;
        hexagon.rotation.z = Math.sin(time * 0.2 + offset) * 0.1;
        hexagon.material.opacity = 0.1 + Math.sin(time + offset) * 0.05;
      });

      // Subtle camera movement
      camera.position.x = Math.sin(time * 0.1) * 0.5;
      camera.position.y = Math.cos(time * 0.1) * 0.5;
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
          object.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, [isDarkMode]);

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

  const Header = () => (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <Globe className="logo-icon" />
          <h1 className="logo-text">VisionAid</h1>
        </div>
        <nav className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>
        <button
          className="mode-toggle"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="toggle-icon" /> : <Moon className="toggle-icon" />}
        </button>
      </div>
    </header>
  );

  const ProjectModal = ({ project }: { project: any }) => {
    if (!project) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-icon-container">
              {project.icon}
            </div>
            <h2 className="modal-title">{project.title}</h2>
          </div>
          <p className="modal-description">{project.description}</p>
          <div className="modal-actions">
            <button 
              onClick={() => setSelectedProject(null)}
              className="btn btn-primary"
            >
              Close Details
            </button>
            <button className="btn btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  };

  const projects = [
    {
      title: "Urban Traffic Dynamics",
      description: "Revolutionizing urban mobility through AI-powered traffic optimization.",
      icon: <Network className="project-icon" />,
      color: "primary"
    },
    {
      title: "Smart Infrastructure Intelligence",
      description: "Pioneering proactive infrastructure management using advanced AI.",
      icon: <Layers className="project-icon" />,
      color: "success"
    }
  ];

  const KeyFeatures = () => {
    const features = [
      {
        icon: <Shield className="feature-icon" />,
        title: "Predictive Safety",
        description: "Advanced AI-driven risk assessment and prevention strategies."
      },
      {
        icon: <Clock className="feature-icon" />,
        title: "Real-Time Monitoring",
        description: "Continuous urban infrastructure health tracking and analysis."
      },
      {
        icon: <Network className="feature-icon" />,
        title: "Smart Connectivity",
        description: "Integrated IoT solutions for seamless urban data management."
      }
    ];

    return (
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="features-section"
      >
        <div className="features-container">
          <h2 className="features-title">Key Technological Innovations</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    );
  };

  const TechnologiesSection = () => {
    const technologies = [
      { icon: <Smartphone className="w-10 h-10" />, name: "Mobile Integration" },
      { icon: <Database className="w-10 h-10" />, name: "Big Data Analytics" },
      { icon: <Map className="w-10 h-10" />, name: "Geospatial Mapping" }
    ];

    return (
      <motion.section
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true, margin: "-100px" }}
        className="technologies-section"
      >
        <div className="technologies-container">
          <h2 className="technologies-title">
            Our Core Technologies
          </h2>
          <div className="technologies-grid">
            {technologies.map((tech, index) => (
              <div key={index} className="technology-card">
                <div className="technology-icon-container">
                  {tech.icon}
                </div>
                <p className="technology-name">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
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
      <canvas ref={canvasRef} className="canvas-container" />
      <Header />
      
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
      
      <main className="main-content">
      <section>
  <motion.h1
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     transition={{ duration: 0.8 }}
     className="main-heading"
  >
    VisionAid
  </motion.h1>
  <motion.div 
    className="project-grid"
    initial={{ y: 50, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.3, duration: 0.8 }}
  >
    {projects.map((project, index) => (
      <div
        key={index}
        className="project-card"
        onClick={() => setSelectedProject(project)}
        onMouseEnter={() => setHoveredProject(project)}
        onMouseLeave={() => setHoveredProject(null)}
      >
        <div className="project-icon-container">
          {project.icon}
        </div>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
      </div>
    ))}
  </motion.div>
</section>

        {selectedProject && <ProjectModal project={selectedProject} />}

        <KeyFeatures />
        <TechnologiesSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default VisionAidHomepage;