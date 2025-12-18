import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './ProjectTracker.css';

const ProjectTracker = () => {
  const [projectCode, setProjectCode] = useState('');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const mockProject = {
    id: 'JDH-2024-001',
    name: 'Tech Solutions Website',
    client: 'Tech Solutions Ltd',
    startDate: '2024-01-15',
    endDate: '2024-02-28',
    progress: 75,
    status: 'in_progress',
    milestones: [
      { id: 1, name: 'Discovery & Planning', status: 'completed', date: '2024-01-20' },
      { id: 2, name: 'Design Mockups', status: 'completed', date: '2024-01-30' },
      { id: 3, name: 'Development', status: 'in_progress', date: '2024-02-15' },
      { id: 4, name: 'Testing & QA', status: 'pending', date: '2024-02-22' },
      { id: 5, name: 'Launch & Deployment', status: 'pending', date: '2024-02-28' }
    ],
    team: [
      { name: 'Jeff', role: 'Project Manager', avatar: '👨‍💼' },
      { name: 'Sarah', role: 'UI/UX Designer', avatar: '👩‍🎨' },
      { name: 'Mike', role: 'Frontend Developer', avatar: '👨‍💻' },
      { name: 'Grace', role: 'Backend Developer', avatar: '👩‍💻' }
    ],
    files: [
      { name: 'Design Mockups.pdf', size: '4.2 MB', uploaded: '2024-01-30' },
      { name: 'Wireframes.sketch', size: '8.7 MB', uploaded: '2024-01-25' },
      { name: 'Content.docx', size: '2.1 MB', uploaded: '2024-02-05' }
    ],
    recentUpdates: [
      { date: '2024-02-10', message: 'Homepage development completed', author: 'Mike' },
      { date: '2024-02-08', message: 'Client approved design mockups', author: 'Jeff' },
      { date: '2024-02-05', message: 'Started backend API development', author: 'Grace' }
    ]
  };

  const checkProject = () => {
    setLoading(true);
    setTimeout(() => {
      setProject(mockProject);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <section className="project-tracker-section">
      <div className="container">
        <div className="section-header">
          <h2>📊 <span className="gradient-text">Live Project Tracker</span></h2>
          <p>Track your project progress in real-time</p>
        </div>

        <div className="tracker-container">
          {/* Project Code Input */}
          <div className="tracker-input">
            <input
              type="text"
              placeholder="Enter your project code (e.g., JDH-2024-001)"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkProject()}
            />
            <button 
              className="track-btn"
              onClick={checkProject}
              disabled={loading || !projectCode}
            >
              {loading ? '🔍 Checking...' : '🚀 Track Project'}
            </button>
          </div>

          {/* Demo Project */}
          <div className="demo-notice">
            <p>Demo Project Code: <strong>JDH-2024-001</strong></p>
          </div>

          {/* Project Details */}
          {project && (
            <motion.div
              className="project-dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Project Header */}
              <div className="project-header">
                <div className="project-info">
                  <h3>{project.name}</h3>
                  <div className="project-meta">
                    <span className="project-id">#{project.id}</span>
                    <span className="project-client">Client: {project.client}</span>
                    <span className="project-dates">
                      {project.startDate} → {project.endDate}
                    </span>
                  </div>
                </div>
                <div className="project-status">
                  <div className="status-badge" style={{ 
                    background: getStatusColor(project.status) + '20',
                    color: getStatusColor(project.status)
                  }}>
                    ● {project.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-header">
                  <span>Overall Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div 
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 1 }}
                    style={{ background: getStatusColor('in_progress') }}
                  />
                </div>
              </div>

              {/* Milestones Timeline */}
              <div className="milestones-section">
                <h4>Project Milestones</h4>
                <div className="timeline">
                  {project.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="timeline-item">
                      <div className="timeline-marker" style={{ 
                        background: getStatusColor(milestone.status)
                      }}>
                        {index + 1}
                      </div>
                      <div className="timeline-content">
                        <div className="milestone-header">
                          <h5>{milestone.name}</h5>
                          <span className="milestone-date">{milestone.date}</span>
                        </div>
                        <div className="milestone-status" style={{ 
                          color: getStatusColor(milestone.status)
                        }}>
                          {milestone.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team & Files */}
              <div className="project-details-grid">
                {/* Team */}
                <div className="detail-card">
                  <h4>👥 Team Members</h4>
                  <div className="team-list">
                    {project.team.map(member => (
                      <div key={member.name} className="team-member">
                        <span className="member-avatar">{member.avatar}</span>
                        <div className="member-info">
                          <strong>{member.name}</strong>
                          <span>{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Files */}
                <div className="detail-card">
                  <h4>📁 Project Files</h4>
                  <div className="files-list">
                    {project.files.map(file => (
                      <div key={file.name} className="file-item">
                        <span className="file-icon">📄</span>
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-meta">
                            {file.size} • {file.uploaded}
                          </span>
                        </div>
                        <button className="download-btn">⬇️</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Updates */}
                <div className="detail-card">
                  <h4>🔄 Recent Updates</h4>
                  <div className="updates-list">
                    {project.recentUpdates.map(update => (
                      <div key={update.date} className="update-item">
                        <div className="update-date">{update.date}</div>
                        <div className="update-message">{update.message}</div>
                        <div className="update-author">By {update.author}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="project-actions">
                <button className="action-btn primary">
                  💬 Message Team
                </button>
                <button className="action-btn">
                  📅 Schedule Meeting
                </button>
                <button className="action-btn">
                  📤 Share Progress
                </button>
                <button className="action-btn">
                  📊 View Analytics
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectTracker;