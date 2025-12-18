import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './PerformanceDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PerformanceDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    visits: 0,
    conversion: 0,
    bounceRate: 0,
    avgSession: 0
  });

  // Simulated data
  const trafficData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Website Visitors',
        data: [320, 450, 380, 520, 610, 480, 550],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Contact Form Submissions',
        data: [12, 18, 15, 22, 28, 20, 25],
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const conversionData = {
    labels: ['Logo Design', 'Website Dev', 'Mobile App', 'Branding', 'Other'],
    datasets: [{
      label: 'Conversion Rate',
      data: [25, 18, 15, 22, 20],
      backgroundColor: [
        '#F97316', '#2563EB', '#8B5CF6', '#10B981', '#EC4899'
      ]
    }]
  };

  const performanceData = {
    labels: ['Page Load', 'First Paint', 'SEO Score', 'Mobile Score', 'Accessibility'],
    datasets: [{
      label: 'Performance Score',
      data: [92, 88, 85, 90, 82],
      backgroundColor: 'rgba(37, 99, 235, 0.8)',
      borderColor: '#2563EB',
      borderWidth: 2
    }]
  };

  const sourceData = {
    labels: ['Direct', 'Social Media', 'Google', 'Referrals', 'Email'],
    datasets: [{
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        '#F97316', '#2563EB', '#8B5CF6', '#10B981', '#EC4899'
      ]
    }]
  };

  useEffect(() => {
    // Simulate API call
    const fetchMetrics = async () => {
      setTimeout(() => {
        setMetrics({
          visits: 2450,
          conversion: 4.2,
          bounceRate: 32.5,
          avgSession: '2m 45s'
        });
      }, 1000);
    };
    fetchMetrics();
  }, [timeRange]);

  return (
    <section className="performance-dashboard">
      <div className="container">
        <div className="section-header">
          <h2>📊 <span className="gradient-text">Real-Time Performance Dashboard</span></h2>
          <p>Monitor your website performance and conversions</p>
        </div>

        {/* Time Range Selector */}
        <div className="time-selector">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              className={`time-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          {[
            { label: 'Total Visits', value: metrics.visits.toLocaleString(), change: '+12%', icon: '👥' },
            { label: 'Conversion Rate', value: `${metrics.conversion}%`, change: '+0.8%', icon: '📈' },
            { label: 'Bounce Rate', value: `${metrics.bounceRate}%`, change: '-2.1%', icon: '📉' },
            { label: 'Avg. Session', value: metrics.avgSession, change: '+15s', icon: '⏱️' },
            { label: 'Form Submissions', value: '47', change: '+23%', icon: '📝' },
            { label: 'WhatsApp Clicks', value: '89', change: '+45%', icon: '💬' }
          ].map((metric, index) => (
            <motion.div
              key={index}
              className="metric-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="metric-icon">{metric.icon}</div>
              <div className="metric-content">
                <div className="metric-value">{metric.value}</div>
                <div className="metric-label">{metric.label}</div>
                <div className={`metric-change ${metric.change.startsWith('+') ? 'positive' : 'negative'}`}>
                  {metric.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Traffic Chart */}
          <div className="chart-card">
            <h3>🚀 Traffic Overview</h3>
            <div className="chart-container">
              <Line 
                data={trafficData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' }
                  }
                }}
              />
            </div>
          </div>

          {/* Conversion Chart */}
          <div className="chart-card">
            <h3>🎯 Service Conversions</h3>
            <div className="chart-container">
              <Bar 
                data={conversionData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          {/* Performance Chart */}
          <div className="chart-card">
            <h3>⚡ Performance Scores</h3>
            <div className="chart-container">
              <Bar 
                data={performanceData} 
                options={{
                  responsive: true,
                  indexAxis: 'y',
                  plugins: {
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="chart-card">
            <h3>🌐 Traffic Sources</h3>
            <div className="chart-container">
              <Pie 
                data={sourceData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'right' }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Real-time Activity */}
        <div className="activity-section">
          <h3>🔔 Real-time Activity</h3>
          <div className="activity-list">
            {[
              { user: 'Visitor from Nairobi', action: 'Viewed logo design page', time: '2 min ago' },
              { user: 'Startup Founder', action: 'Submitted quote request', time: '5 min ago' },
              { user: 'Returning Client', action: 'Downloaded project files', time: '12 min ago' },
              { user: 'Google Search', action: '"web design Kenya" search', time: '18 min ago' },
              { user: 'Facebook Referral', action: 'Clicked on portfolio', time: '25 min ago' }
            ].map((activity, index) => (
              <motion.div
                key={index}
                className="activity-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <div className="activity-user">{activity.user}</div>
                  <div className="activity-action">{activity.action}</div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations-section">
          <h3>💡 AI Recommendations</h3>
          <div className="recommendations-grid">
            {[
              { 
                title: 'Optimize Mobile Loading', 
                description: 'Mobile load time increased by 0.5s. Optimize images.',
                priority: 'high',
                impact: '15% conversion increase'
              },
              { 
                title: 'Add Chat Widget', 
                description: '68% of visitors exit without contacting. Add live chat.',
                priority: 'medium',
                impact: '20% more leads'
              },
              { 
                title: 'Improve CTAs', 
                description: 'Primary CTA visibility low. Increase button size.',
                priority: 'low',
                impact: '8% click increase'
              }
            ].map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className={`priority-badge ${rec.priority}`}>{rec.priority.toUpperCase()}</div>
                <h4>{rec.title}</h4>
                <p>{rec.description}</p>
                <div className="recommendation-impact">
                  <span>📈 Estimated Impact:</span>
                  <strong>{rec.impact}</strong>
                </div>
                <button className="implement-btn">Implement</button>
              </div>
            ))}
          </div>
        </div>

        {/* Export & Actions */}
        <div className="dashboard-actions">
          <button className="action-btn">
            📥 Download Report
          </button>
          <button className="action-btn">
            📧 Email Report
          </button>
          <button className="action-btn">
            🔄 Refresh Data
          </button>
          <button className="action-btn primary">
            🤖 Auto-optimize
          </button>
        </div>
      </div>
    </section>
  );
};

export default PerformanceDashboard;