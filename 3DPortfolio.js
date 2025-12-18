import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Box } from '@react-three/drei';
import { motion } from 'framer-motion';
import './3DPortfolio.css';

const ProjectCube = ({ position, rotationSpeed, project, onClick }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position}
      onClick={onClick}
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color={project.color}
        emissive={project.color}
        emissiveIntensity={0.2}
        roughness={0.1}
        metalness={0.9}
      />
    </mesh>
  );
};

const ThreeDPortfolio = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  
  const projects = [
    { id: 1, title: 'Logo Design', color: '#F97316', category: 'design' },
    { id: 2, title: 'E-commerce', color: '#2563EB', category: 'development' },
    { id: 3, title: 'Mobile App', color: '#8B5CF6', category: 'development' },
    { id: 4, title: 'Branding', color: '#10B981', category: 'design' },
    { id: 5, title: 'Website', color: '#EC4899', category: 'development' },
    { id: 6, title: 'Poster Design', color: '#F59E0B', category: 'design' }
  ];

  return (
    <section className="portfolio-3d-section">
      <div className="container">
        <div className="section-header">
          <h2>🎮 <span className="gradient-text">Interactive 3D Portfolio</span></h2>
          <p>Click and drag to explore our projects in 3D</p>
        </div>

        <div className="portfolio-3d-container">
          {/* 3D Canvas */}
          <div className="canvas-wrapper">
            <Canvas>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <PerspectiveCamera makeDefault position={[0, 0, 10]} />
              <OrbitControls enableZoom={true} />
              
              {/* Project Cubes */}
              {projects.map((project, index) => {
                const angle = (index / projects.length) * Math.PI * 2;
                const radius = 5;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                
                return (
                  <ProjectCube
                    key={project.id}
                    position={[x, 0, z]}
                    rotationSpeed={0.005}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                  />
                );
              })}
            </Canvas>
          </div>

          {/* Controls */}
          <div className="portfolio-controls">
            <div className="control-buttons">
              <button className="control-btn">
                🔄 Auto-rotate
              </button>
              <button className="control-btn">
                🔍 Zoom In/Out
              </button>
              <button className="control-btn">
                🎯 Reset View
              </button>
            </div>

            {/* Project Info */}
            {selectedProject && (
              <motion.div
                className="project-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3>{selectedProject.title}</h3>
                <div className="project-stats">
                  <div className="stat">
                    <span className="stat-label">Category</span>
                    <span className="stat-value">{selectedProject.category}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Completion</span>
                    <span className="stat-value">100%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Client Rating</span>
                    <span className="stat-value">★★★★★</span>
                  </div>
                </div>
                <button className="view-project-btn">
                  👁️ View Full Project
                </button>
              </motion.div>
            )}

            {/* Category Filter */}
            <div className="category-filter">
              {['All', 'Design', 'Development', 'Mobile', 'Branding'].map(cat => (
                <button key={cat} className="category-btn">
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2D Grid View Toggle */}
        <div className="view-toggle">
          <button className="view-option active">🎮 3D View</button>
          <button className="view-option">🖼️ Grid View</button>
          <button className="view-option">📱 Mobile View</button>
        </div>
      </div>
    </section>
  );
};

export default ThreeDPortfolio;