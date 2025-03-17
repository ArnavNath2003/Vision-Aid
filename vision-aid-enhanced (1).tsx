import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Moon, Sun, Globe, Layers, Network, Zap } from 'lucide-react';

const VisionAidHomepage = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const canvasRef = useRef(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);

  useEffect(() => {
    // Three.js scene setup with more complex visualization
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true,
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // More dynamic background and lighting
    scene.background = isDarkMode 
      ? new THREE.Color(0x0a1128)  // Deep navy blue for dark mode
      : new THREE.Color(0xf0f8ff); // Light azure for light mode

    // Advanced lighting setup
    const ambientLight = new THREE.AmbientLight(
      isDarkMode ? 0x101030 : 0xffffff, 
      isDarkMode ? 0.4 : 0.6
    );
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(
      isDarkMode ? 0x3030ff : 0xffffff, 
      isDarkMode ? 0.8 : 1,
      100
    );
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create more intricate urban network visualization
    const createNetworkNode = (color, size, x, y, z) => {
      const geometry = new THREE.IcosahedronGeometry(size, 2);
      const material = new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: isDarkMode ? 0.5 : 0.2,
        shininess: 100
      });
      
      const node = new THREE.Mesh(geometry, material);
      node.position.set(x, y, z);
      scene.add(node);
      return node;
    };

    // Create interconnected network of nodes
    const networkNodes = [
      createNetworkNode(0x3182ce, 0.5, -3, 0, -5),
      createNetworkNode(0x48bb78, 0.4, -1, 1, -5),
      createNetworkNode(0x718096, 0.6, 1, -1, -5),
      createNetworkNode(0xe53e3e, 0.5, 3, 0, -5)
    ];

    // Create connection lines between nodes
    const createConnectionLine = (start, end, color) => {
      const material = new THREE.LineBasicMaterial({ 
        color: color, 
        transparent: true,
        opacity: isDarkMode ? 0.7 : 0.4
      });
      const points = [start.position, end.position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      return line;
    };

    // Connect nodes with dynamic lines
    const connections = [
      createConnectionLine(networkNodes[0], networkNodes[1], 0x3182ce),
      createConnectionLine(networkNodes[1], networkNodes[2], 0x48bb78),
      createConnectionLine(networkNodes[2], networkNodes[3], 0x718096),
      createConnectionLine(networkNodes[3], networkNodes[0], 0xe53e3e)
    ];

    camera.position.z = 5;

    // Animation loop with more dynamic movement
    const animate = () => {
      requestAnimationFrame(animate);
      
      networkNodes.forEach((node, index) => {
        node.rotation.x += 0.003 * (index + 1);
        node.rotation.y += 0.002 * (index + 1);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Responsive handling
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [isDarkMode]);

  const projects = [
    {
      title: "Urban Traffic Dynamics",
      description: "Revolutionizing urban mobility through AI-powered traffic optimization. Our system leverages real-time data analytics, predictive modeling, and adaptive signal control to transform city transportation infrastructure.",
      icon: <Network className="w-8 h-8" />,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
    {
      title: "Smart Infrastructure Intelligence",
      description: "Pioneering proactive infrastructure management using advanced AI, drone surveillance, and predictive maintenance technologies. Ensuring urban resilience through continuous, intelligent monitoring.",
      icon: <Layers className="w-8 h-8" />,
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600"
    }
  ];

  const ProjectModal = ({ project }) => {
    if (!project) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className={`
          relative transform transition-all duration-300 ease-in-out
          ${hoveredProject ? 'scale-105' : 'scale-100'}
          bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-10 max-w-2xl w-full
          border-4 ${project.color} border-opacity-50
        `}>
          <div className="flex items-center space-x-6 mb-6">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${project.color} text-white shadow-lg
            `}>
              {project.icon}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              {project.title}
            </h2>
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            {project.description}
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => setSelectedProject(null)}
              className={`
                px-6 py-3 rounded-lg text-white font-semibold
                ${project.color} ${project.hoverColor}
                transition-all duration-300 ease-in-out
                transform hover:scale-105 hover:shadow-lg
              `}
            >
              Close Details
            </button>
            <button 
              className={`
                px-6 py-3 rounded-lg text-white font-semibold
                bg-gray-700 hover:bg-gray-800
                transition-all duration-300 ease-in-out
                transform hover:scale-105 hover:shadow-lg
              `}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`
      min-h-screen relative overflow-hidden
      transition-colors duration-500
      ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white' 
        : 'bg-gradient-to-br from-blue-100 to-white text-gray-900'
      }
    `}>
      {/* Mode Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`
          absolute top-6 right-6 z-50 
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
      
      <div className="relative z-10 container mx-auto px-4 py-16">
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

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {projects.map((project, index) => (
            <div 
              key={index}
              onClick={() => setSelectedProject(project)}
              onMouseEnter={() => setHoveredProject(project)}
              onMouseLeave={() => setHoveredProject(null)}
              className={`
                group cursor-pointer 
                bg-white/10 backdrop-blur-lg 
                border border-white/20 
                rounded-2xl p-8 
                transform transition-all duration-500
                ${selectedProject === project ? 'ring-4 ring-blue-500' : ''}
                ${hoveredProject === project ? 'scale-105 shadow-2xl' : 'hover:scale-105'}
              `}
            >
              <div className="flex items-center space-x-6 mb-6">
                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  ${project.color} text-white
                  transition-all duration-300
                  group-hover:rotate-6 group-hover:scale-110
                `}>
                  {project.icon}
                </div>
                <h2 className="text-3xl font-bold">
                  {project.title}
                </h2>
              </div>
              <p className="text-lg opacity-80">
                {project.description.split(' ').slice(0, 20).join(' ')}...
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          hoveredProject={hoveredProject}
        />
      )}
    </div>
  );
};

export default VisionAidHomepage;
