import React from 'react';
import { motion } from 'framer-motion';
import './TickerScroller.css';

const TickerScroller = () => {
  const tickerMessages = [
    "🎯 Designing Ideas. Building Digital Experiences.",
    "🔥 LIMITED OFFER: Get 20% OFF on Logo Design this week!",
    "⭐ Trusted by 150+ Businesses in Kenya",
    "🚀 New: Mobile App Development Starting at KES 25,000",
    "📞 Call/WhatsApp: +254 702 782 850",
    "💡 Free Consultation Available",
    "⚡ Websites Built in 7 Days Guaranteed!",
    "🎨 Graphic Design • Websites • Mobile Apps"
  ];

  // Duplicate for seamless loop
  const doubledMessages = [...tickerMessages, ...tickerMessages];

  return (
    <div className="ticker-container">
      <div className="ticker-label">
        <span className="pulse-dot"></span>
        <span>HOT OFFERS</span>
      </div>
      
      <div className="ticker-wrapper">
        <motion.div 
          className="ticker-content"
          animate={{ x: ["0%", "-100%"] }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {doubledMessages.map((message, index) => (
            <div key={index} className="ticker-item">
              <span className="ticker-text">{message}</span>
              <span className="ticker-separator">•</span>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Countdown Timer */}
      <div className="countdown-badge">
        <span className="countdown-label">Offer Ends In:</span>
        <div className="countdown-timer">
          <span className="countdown-digit">03</span>:
          <span className="countdown-digit">15</span>:
          <span className="countdown-digit">47</span>
        </div>
      </div>
    </div>
  );
};

export default TickerScroller;