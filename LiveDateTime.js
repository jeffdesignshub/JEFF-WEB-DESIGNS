import React, { useState, useEffect } from 'react';
import './LiveDateTime.css';

const LiveDateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-KE', options);
  };

  return (
    <div className="live-datetime-container">
      <div className="datetime-card">
        <div className="time-display">
          <div className="time-icon">🕒</div>
          <div className="time-text">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="time-label">Nairobi Time</div>
          </div>
        </div>
        
        <div className="date-display">
          <div className="date-icon">📅</div>
          <div className="date-text">{formatDate(currentTime)}</div>
        </div>
        
        <div className="location-display">
          <div className="location-icon">📍</div>
          <div className="location-text">Serving Kenya & Worldwide</div>
        </div>
      </div>
    </div>
  );
};

export default LiveDateTime;