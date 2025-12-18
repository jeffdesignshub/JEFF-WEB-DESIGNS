import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TypeAnimation } from 'react-type-animation';
import './Hero.css';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Auto-sliding service texts
  const serviceSlides = [
    "Logo Design",
    "Website Development", 
    "Mobile App Creation",
    "Brand Identity",
    "Social Media Graphics",
    "E-commerce Solutions"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % serviceSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      {/* Animated Background Particles */}
      <div className="particles-container">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * 100 + 'vw',
              y: Math.random() * 100 + 'vh',
              opacity: 0.3
            }}
            animate={{
              x: [null, Math.random() * 100 + 'vw'],
              y: [null, Math.random() * 100 + 'vh'],
            }}
            transition={{
              duration: 20 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Gradient Background */}
      <div className="gradient-bg">
        <div className="gradient-1"></div>
        <div className="gradient-2"></div>
        <div className="gradient-3"></div>
      </div>

      <div className="container">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            {/* Main Headline */}
            <h1 className="hero-headline">
              We Design, Build & Grow
              <br />
              <span className="gradient-text">Your Digital Brand</span>
            </h1>

            {/* Sub-text */}
            <div className="hero-subtext">
              <TypeAnimation
                sequence={[
                  'Logos • Posters • Websites • Mobile Apps',
                  2000,
                  'Branding • Development • Marketing • Support',
                  2000,
                ]}
                speed={50}
                repeat={Infinity}
                className="typing-text"
              />
            </div>

            {/* Auto-sliding Service Display */}
            <div className="service-slider-container">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="service-slide"
              >
                <div className="service-icon">✨</div>
                <span>{serviceSlides[currentSlide]}</span>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <div className="hero-buttons">
              <motion.a
                href="#contact"
                className="btn-primary"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(249, 115, 22, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>👉 Get a Free Quote</span>
                <div className="btn-glow"></div>
              </motion.a>

              <motion.a
                href="#portfolio"
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                👁️ View Our Work
              </motion.a>
            </div>

            {/* Trust Indicators */}
            <div className="trust-indicators">
              <div className="trust-item">
                <div className="check-icon">✅</div>
                <span>100% Satisfaction</span>
              </div>
              <div className="trust-item">
                <div className="check-icon">✅</div>
                <span>Fast Delivery</span>
              </div>
              <div className="trust-item">
                <div className="check-icon">✅</div>
                <span>24/7 Support</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hero-visual"
          >
            <div className="floating-devices">
              <div className="device laptop">
                <div className="screen">
                  <div className="screen-content">
                    <div className="design-tool"></div>
                    <div className="code-editor"></div>
                  </div>
                </div>
              </div>
              <div className="device phone">
                <div className="screen">
                  <div className="app-interface"></div>
                </div>
              </div>
              <div className="device tablet">
                <div className="screen">
                  <div className="dashboard-ui"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span>Scroll to explore</span>
        <div className="arrow">↓</div>
      </motion.div>
    </section>
  );
};

export default Hero;