import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AICalculator.css';

const AICalculator = () => {
  const [projectType, setProjectType] = useState('');
  const [features, setFeatures] = useState([]);
  const [timeline, setTimeline] = useState('standard');
  const [budget, setBudget] = useState(null);

  const projectTypes = [
    { id: 'logo', name: 'Logo Design', base: 5000, icon: '🎨' },
    { id: 'website', name: 'Website', base: 15000, icon: '🌐' },
    { id: 'ecommerce', name: 'E-commerce', base: 30000, icon: '🛒' },
    { id: 'mobile', name: 'Mobile App', base: 25000, icon: '📱' },
    { id: 'branding', name: 'Full Branding', base: 20000, icon: '✨' }
  ];

  const featureOptions = {
    logo: ['Multiple Concepts', 'Brand Guidelines', 'Social Media Kit', 'Stationery Design', '3D Logo'],
    website: ['Responsive Design', 'SEO Optimization', 'Admin Panel', 'Contact Forms', 'Blog System', 'Multi-language'],
    ecommerce: ['Product Catalog', 'Payment Gateway', 'Inventory Management', 'Order Tracking', 'Customer Reviews'],
    mobile: ['iOS & Android', 'Push Notifications', 'Offline Mode', 'Social Login', 'In-app Purchases']
  };

  const calculateEstimate = () => {
    const base = projectTypes.find(p => p.id === projectType)?.base || 0;
    let total = base;
    
    // Add features cost
    features.forEach(feature => {
      total += base * 0.1; // Each feature adds 10% of base
    });
    
    // Timeline adjustment
    if (timeline === 'urgent') total *= 1.5;
    if (timeline === 'relaxed') total *= 0.9;
    
    setBudget(Math.round(total));
  };

  return (
    <section className="ai-calculator-section">
      <div className="container">
        <div className="section-header">
          <h2>💰 <span className="gradient-text">AI Project Calculator</span></h2>
          <p>Get instant pricing estimates for your project</p>
        </div>

        <div className="calculator-wrapper">
          {/* Step 1: Project Type */}
          <div className="calculator-step">
            <h3>1. What do you need?</h3>
            <div className="project-types">
              {projectTypes.map(type => (
                <motion.button
                  key={type.id}
                  className={`type-card ${projectType === type.id ? 'selected' : ''}`}
                  onClick={() => setProjectType(type.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-name">{type.name}</span>
                  <span className="type-base">From KES {type.base.toLocaleString()}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Step 2: Features */}
          <AnimatePresence>
            {projectType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="calculator-step"
              >
                <h3>2. Select Features</h3>
                <div className="features-grid">
                  {featureOptions[projectType]?.map((feature, index) => (
                    <motion.div
                      key={index}
                      className={`feature-card ${features.includes(feature) ? 'selected' : ''}`}
                      onClick={() => {
                        setFeatures(prev => 
                          prev.includes(feature) 
                            ? prev.filter(f => f !== feature)
                            : [...prev, feature]
                        );
                      }}
                      whileHover={{ scale: 1.02 }}
                      layout
                    >
                      <div className="feature-check">
                        {features.includes(feature) ? '✓' : '+'}
                      </div>
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Timeline */}
          <AnimatePresence>
            {projectType && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="calculator-step"
              >
                <h3>3. Timeline Preference</h3>
                <div className="timeline-options">
                  {['Urgent (1-2 weeks)', 'Standard (3-4 weeks)', 'Relaxed (1-2 months)'].map((option, i) => {
                    const type = ['urgent', 'standard', 'relaxed'][i];
                    return (
                      <motion.button
                        key={type}
                        className={`timeline-btn ${timeline === type ? 'selected' : ''}`}
                        onClick={() => setTimeline(type)}
                        whileHover={{ scale: 1.05 }}
                      >
                        {option}
                        {type === 'urgent' && <span className="urgent-badge">+50%</span>}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {budget && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="calculator-result"
              >
                <div className="result-card">
                  <h3>💰 Estimated Cost</h3>
                  <div className="estimated-price">
                    KES <span className="price-number">{budget.toLocaleString()}</span>
                  </div>
                  <div className="breakdown">
                    <p>Includes:</p>
                    <ul>
                      <li>Professional design & development</li>
                      <li>All selected features</li>
                      <li>{timeline === 'urgent' ? 'Priority support' : 'Standard support'}</li>
                      <li>3 months maintenance</li>
                    </ul>
                  </div>
                  <div className="result-actions">
                    <motion.a
                      href="#contact"
                      className="btn-primary"
                      whileHover={{ scale: 1.05 }}
                    >
                      📞 Discuss This Quote
                    </motion.a>
                    <button 
                      className="btn-secondary"
                      onClick={() => window.print()}
                    >
                      🖨️ Print Estimate
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Calculate Button */}
          {projectType && !budget && (
            <motion.button
              className="calculate-btn"
              onClick={calculateEstimate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🧮 Calculate My Project Cost
            </motion.button>
          )}

          {/* Reset Button */}
          {budget && (
            <button 
              className="reset-btn"
              onClick={() => {
                setProjectType('');
                setFeatures([]);
                setTimeline('standard');
                setBudget(null);
              }}
            >
              ↻ Start New Calculation
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default AICalculator;