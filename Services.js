import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiLayers, FiGlobe, FiSmartphone, 
  FiShoppingBag, FiTrendingUp, FiFilm 
} from 'react-icons/fi';
import './Services.css';

const Services = () => {
  const [hoveredService, setHoveredService] = useState(null);

  const services = [
    {
      id: 1,
      icon: <FiLayers />,
      title: "Logo & Brand Identity",
      description: "Professional logos that make your brand memorable and instantly recognizable.",
      features: ["Modern Logo Design", "Brand Guidelines", "Business Cards", "Social Media Kit"],
      startingPrice: "KES 5,000",
      color: "#F97316",
      popular: true
    },
    {
      id: 2,
      icon: <FiGlobe />,
      title: "Website Development",
      description: "Modern, fast-loading websites that convert visitors into customers.",
      features: ["Responsive Design", "SEO Optimized", "E-commerce", "CMS Integration"],
      startingPrice: "KES 15,000",
      color: "#2563EB",
      popular: false
    },
    {
      id: 3,
      icon: <FiSmartphone />,
      title: "Mobile App Creation",
      description: "User-friendly mobile apps for Android and iOS that engage your audience.",
      features: ["Native Apps", "Cross-platform", "UI/UX Design", "App Store Deployment"],
      startingPrice: "KES 25,000",
      color: "#8B5CF6",
      popular: true
    },
    {
      id: 4,
      icon: <FiShoppingBag />,
      title: "E-commerce Solutions",
      description: "Complete online stores with secure payment and inventory management.",
      features: ["Product Catalog", "Payment Gateway", "Order Management", "Analytics"],
      startingPrice: "KES 30,000",
      color: "#10B981",
      popular: false
    },
    {
      id: 5,
      icon: <FiTrendingUp />,
      title: "Digital Marketing",
      description: "Boost your online presence with targeted marketing campaigns.",
      features: ["Social Media", "Google Ads", "Email Marketing", "SEO Services"],
      startingPrice: "KES 8,000/mo",
      color: "#EC4899",
      popular: false
    },
    {
      id: 6,
      icon: <FiFilm />,
      title: "Print & Publication",
      description: "Eye-catching print materials that make your business stand out.",
      features: ["Flyers & Posters", "Brochures", "Business Cards", "Banners"],
      startingPrice: "KES 3,000",
      color: "#F59E0B",
      popular: false
    }
  ];

  return (
    <section className="services-section" id="services">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-header"
        >
          <h2>Services That <span className="gradient-text">Grow Your Business</span></h2>
          <p className="section-subtitle">
            Professional solutions designed to help you succeed online
          </p>
        </motion.div>

        {/* Service Filter Tabs */}
        <div className="service-tabs">
          {['All', 'Design', 'Development', 'Marketing', 'Print'].map((tab) => (
            <button key={tab} className="tab-btn">
              {tab}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="services-grid">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              className={`service-card ${service.popular ? 'popular' : ''}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -15,
                boxShadow: `0 25px 50px -12px ${service.color}40`
              }}
              onMouseEnter={() => setHoveredService(service.id)}
              onMouseLeave={() => setHoveredService(null)}
            >
              {service.popular && (
                <div className="popular-badge" style={{ background: service.color }}>
                  Most Popular
                </div>
              )}
              
              <div className="card-header">
                <div 
                  className="service-icon"
                  style={{ 
                    background: `${service.color}20`,
                    borderColor: service.color 
                  }}
                >
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
              </div>
              
              <p className="service-description">{service.description}</p>
              
              <div className="service-features">
                {service.features.map((feature, i) => (
                  <span key={i} className="feature-tag">
                    ✓ {feature}
                  </span>
                ))}
              </div>
              
              <div className="service-footer">
                <div className="starting-price">
                  <span className="price-label">Starting from</span>
                  <span className="price-amount">{service.startingPrice}</span>
                </div>
                
                <motion.a
                  href={`/order/${service.id}`}
                  className="order-btn"
                  style={{ background: service.color }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Order Now
                </motion.a>
              </div>
              
              {/* Hover Effect */}
              {hoveredService === service.id && (
                <motion.div
                  className="card-hover-effect"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ 
                    background: `radial-gradient(circle at center, ${service.color}15, transparent 70%)`
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          className="services-cta"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3>Need a Custom Solution?</h3>
          <p>Tell us about your project and we'll create a tailored package just for you</p>
          <motion.a
            href="#contact"
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📞 Request Custom Quote
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;