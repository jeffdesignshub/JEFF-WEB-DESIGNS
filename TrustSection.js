import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAward, FiUsers, FiClock } from 'react-icons/fi';
import './TrustSection.css';

const TrustSection = () => {
  const stats = [
    { 
      icon: <FiAward />, 
      end: 247, 
      suffix: "+", 
      label: "Projects Completed",
      color: "#F97316"
    },
    { 
      icon: <FiUsers />, 
      end: 156, 
      suffix: "+", 
      label: "Happy Clients",
      color: "#2563EB"
    },
    { 
      icon: <FiCheckCircle />, 
      end: 589, 
      suffix: "+", 
      label: "Designs Delivered",
      color: "#10B981"
    },
    { 
      icon: <FiClock />, 
      end: 5, 
      suffix: "+ Years", 
      label: "Experience",
      color: "#8B5CF6"
    }
  ];

  return (
    <section className="trust-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <h2>
            <span className="check-icon">✔</span>
            Trusted by Businesses & Organizations in Kenya
          </h2>
          <p className="section-subtitle">
            We deliver results that help your business grow and succeed
          </p>
        </motion.div>

        {/* Animated Stats */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <div 
                className="stat-icon"
                style={{ color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="stat-number">
                <CountUp
                  end={stat.end}
                  suffix={stat.suffix}
                  duration={2.5}
                  separator=","
                />
              </div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="trust-badges">
          <motion.div 
            className="trust-badge"
            whileHover={{ scale: 1.05 }}
          >
            <div className="badge-icon">💯</div>
            <div className="badge-content">
              <h4>100% Satisfaction</h4>
              <p>Money-back guarantee</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="trust-badge"
            whileHover={{ scale: 1.05 }}
          >
            <div className="badge-icon">⚡</div>
            <div className="badge-content">
              <h4>Fast Delivery</h4>
              <p>Logos in 3 days, websites in 7</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="trust-badge"
            whileHover={{ scale: 1.05 }}
          >
            <div className="badge-icon">🛡️</div>
            <div className="badge-content">
              <h4>Secure & Reliable</h4>
              <p>SSL security, regular backups</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="trust-badge"
            whileHover={{ scale: 1.05 }}
          >
            <div className="badge-icon">🤝</div>
            <div className="badge-content">
              <h4>Dedicated Support</h4>
              <p>24/7 customer service</p>
            </div>
          </motion.div>
        </div>

        {/* Client Logos */}
        <div className="client-logos">
          <h3>Some of Our Esteemed Clients</h3>
          <div className="logos-scroll">
            {["Company A", "Startup B", "NGO C", "School D", "Church E", "Business F", "Hotel G"].map((client, i) => (
              <motion.div
                key={i}
                className="client-logo"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                {client}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;