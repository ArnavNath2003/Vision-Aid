import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Moon, Sun, Globe, Layers, Network, Zap, 
  ArrowRight, Shield, Clock, Smartphone, Database, Map 
} from 'lucide-react';

const VisionAidHomepage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const canvasRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  import { useLocation } from 'react-router-dom';

  // (Previous useEffect and Three.js code remains the same)

  // Additional components
  const Header = () => (
    <header className={`
      fixed top-0 left-0 right-0 z-50 
      ${isDarkMode 
        ? 'bg-gray-900/50 backdrop-blur-md' 
        : 'bg-white/70 backdrop-blur-md'
      } shadow-sm
    `}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Globe className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            VisionAid
          </h1>
        </div>
        <nav className="flex space-x-6">
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
            Home
          </a>
          <a href="#projects" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
            Projects
          </a>
          <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
            About
          </a>
          <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );

  const KeyFeatures = () => {
    const features = [
      {
        icon: <Shield className="w-10 h-10 text-green-500" />,
        title: "Predictive Safety",
        description: "Advanced AI-driven risk assessment and prevention strategies."
      },
      {
        icon: <Clock className="w-10 h-10 text-blue-500" />,
        title: "Real-Time Monitoring",
        description: "Continuous urban infrastructure health tracking and analysis."
      },
      {
        icon: <Network className="w-10 h-10 text-purple-500" />,
        title: "Smart Connectivity",
        description: "Integrated IoT solutions for seamless urban data management."
      }
    ];

    return (
      <section id="features" className="py-16 container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Key Technological Innovations
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`
                bg-white/10 backdrop-blur-lg 
                border border-white/20 
                rounded-2xl p-8 text-center
                transform transition-all duration-300
                hover:scale-105 hover:shadow-2xl
              `}
            >
              <div className="flex justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const TechnologiesSection = () => {
    const technologies = [
      { icon: <Smartphone className="w-10 h-10" />, name: "Mobile Integration" },
      { icon: <Database className="w-10 h-10" />, name: "Big Data Analytics" },
      { icon: <Map className="w-10 h-10" />, name: "Geospatial Mapping" }
    ];

    return (
      <section className="py-16 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Our Core Technologies
          </h2>
          <div className="flex justify-center space-x-12">
            {technologies.map((tech, index) => (
              <div 
                key={index} 
                className="text-center transform transition-all hover:scale-110"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center">
                  {tech.icon}
                </div>
                <p className="text-xl font-semibold">{tech.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const Footer = () => (
    <footer className={`
      py-12 
      ${isDarkMode 
        ? 'bg-gray-900 text-gray-300' 
        : 'bg-gray-100 text-gray-800'
      }
    `}>
      <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-2xl font-bold mb-4">VisionAid</h3>
          <p>Transforming urban infrastructure through intelligent technology.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-blue-500">Home</a></li>
            <li><a href="#projects" className="hover:text-blue-500">Projects</a></li>
            <li><a href="#about" className="hover:text-blue-500">About</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Contact</h4>
          <p>Email: info@visionaid.tech</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
        <div>
          <h4 className="font-semibold mb-4">Newsletter</h4>
          <div className="flex">
            <input 
              type="email" 
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-l-lg"
            />
            <button className="bg-blue-500 text-white px-4 rounded-r-lg">
              <ArrowRight />
            </button>
          </div>
        </div>
      </div>
      <div className="text-center mt-8 border-t border-gray-700 pt-4">
        © 2024 VisionAid. All Rights Reserved.
      </div>
    </footer>
  );

  return (
    <div className={`
      min-h-screen relative overflow-hidden
      ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white' 
        : 'bg-gradient-to-br from-blue-100 to-white text-gray-900'
      }
    `}>
      {/* Mode Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`
          fixed top-6 right-6 z-50 
          w-12 h-12 rounded-full 
          flex items-center justify-center
          transition-all duration-300
          ${isDarkMode 
            ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }
          transform hover:scale-110 shadow-lg
        `}
      >
        {isDarkMode ? <Sun /> : <Moon />}
      </button>

      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 z-0 opacity-40" 
      />
      
      {/* Header */}
      <Header />

      {/* Main Content with Top Padding */}
      <div className="relative z-10 pt-24 container mx-auto px-4 py-16">
        {/* Previous homepage content */}
        <div className="text-center mb-16">
          <h1 className={`
            text-7xl font-extrabold mb-4 
            ${isDarkMode 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600' 
              : 'text-gray-900'
            }
          `}>
            VisionAid
          </h1>
          <p className="text-3xl max-w-3xl mx-auto opacity-80">
            Intelligent Urban Infrastructure Reimagined
          </p>
        </div>

        {/* Projects Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Previous project cards code */}
        </div>
      </div>

      {/* Additional Sections */}
      <KeyFeatures />
      <TechnologiesSection />

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          hoveredProject={hoveredProject}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default VisionAidHomepage;
