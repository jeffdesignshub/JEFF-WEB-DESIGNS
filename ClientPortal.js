import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiDownload, FiEye, FiShare2, FiLock, FiCheck } from 'react-icons/fi';
import './ClientPortal.css';

const ClientPortal = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const projects = [
    { 
      id: 1, 
      name: 'Tech Solutions Website', 
      status: 'in_progress',
      progress: 75,
      lastUpdate: '2 hours ago',
      files: 12,
      team: 3
    },
    { 
      id: 2, 
      name: 'Logo Redesign', 
      status: 'review',
      progress: 90,
      lastUpdate: '1 day ago',
      files: 8,
      team: 2
    },
    { 
      id: 3, 
      name: 'Mobile App MVP', 
      status: 'planning',
      progress: 30,
      lastUpdate: '3 days ago',
      files: 5,
      team: 4
    }
  ];

  const files = [
    { id: 1, name: 'Design Mockups.pdf', size: '4.2 MB', type: 'pdf', uploaded: '2024-01-30', status: 'approved' },
    { id: 2, name: 'Wireframes.sketch', size: '8.7 MB', type: 'sketch', uploaded: '2024-01-25', status: 'pending' },
    { id: 3, name: 'Content Document.docx', size: '2.1 MB', type: 'doc', uploaded: '2024-02-05', status: 'review' },
    { id: 4, name: 'Brand Guidelines.pdf', size: '5.5 MB', type: 'pdf', uploaded: '2024-02-01', status: 'approved' },
    { id: 5, name: 'Development Timeline.xlsx', size: '1.8 MB', type: 'excel', uploaded: '2024-02-10', status: 'approved' }
  ];

  const messages = [
    { id: 1, sender: 'Jeff (Designer)', message: 'Please review the latest mockups', time: '2 hours ago', unread: true },
    { id: 2, sender: 'Sarah (Project Manager)', message: 'Meeting scheduled for tomorrow', time: '1 day ago', unread: false },
    { id: 3, sender: 'Mike (Developer)', message: 'API documentation updated', time: '2 days ago', unread: true }
  ];

  const handleFileUpload = async (files) => {
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      setUploading(false);
      alert('Files uploaded successfully!');
    }, 2000);
  };

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  return (
    <section className="client-portal-section">
      <div className="container">
        <div className="section-header">
          <h2>🔐 <span className="gradient-text">Client Portal</span></h2>
          <p>Secure access to your projects, files, and communications</p>
        </div>

        <div className="portal-container">
          {/* Sidebar */}
          <div className="portal-sidebar">
            <div className="user-profile">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <h4>Client Name</h4>
                <span className="user-email">client@example.com</span>
              </div>
            </div>

            <nav className="portal-nav">
              {['projects', 'files', 'messages', 'invoices', 'settings'].map(tab => (
                <button
                  key={tab}
                  className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'projects' && '📁 Projects'}
                  {tab === 'files' && '📄 Files'}
                  {tab === 'messages' && '💬 Messages'}
                  {tab === 'invoices' && '💰 Invoices'}
                  {tab === 'settings' && '⚙️ Settings'}
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="portal-stats">
              <div className="stat-item">
                <span className="stat-value">3</span>
                <span className="stat-label">Active Projects</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">12</span>
                <span className="stat-label">Unread Messages</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">2</span>
                <span className="stat-label">Pending Approvals</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="portal-content">
            <AnimatePresence mode="wait">
              {activeTab === 'projects' && (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="tab-content"
                >
                  <div className="content-header">
                    <h3>📁 My Projects</h3>
                    <button className="new-project-btn">
                      + New Project
                    </button>
                  </div>

                  <div className="projects-grid">
                    {projects.map(project => (
                      <div key={project.id} className="project-card">
                        <div className="project-header">
                          <h4>{project.name}</h4>
                          <span className={`project-status ${project.status}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="project-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="progress-text">{project.progress}%</span>
                        </div>

                        <div className="project-meta">
                          <div className="meta-item">
                            <span className="meta-label">Last Update</span>
                            <span className="meta-value">{project.lastUpdate}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Files</span>
                            <span className="meta-value">{project.files}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Team</span>
                            <span className="meta-value">{project.team}</span>
                          </div>
                        </div>

                        <div className="project-actions">
                          <button className="action-btn">
                            <FiEye /> View
                          </button>
                          <button className="action-btn">
                            <FiShare2 /> Share
                          </button>
                          <button className="action-btn primary">
                            Continue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'files' && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="tab-content"
                >
                  <div className="content-header">
                    <h3>📄 Project Files</h3>
                    <div className="file-actions">
                      <label className="upload-btn">
                        <FiUpload />
                        <input 
                          type="file" 
                          multiple 
                          onChange={(e) => handleFileUpload(e.target.files)}
                          style={{ display: 'none' }}
                        />
                        {uploading ? 'Uploading...' : 'Upload Files'}
                      </label>
                      {selectedFiles.length > 0 && (
                        <button className="download-btn">
                          <FiDownload /> Download ({selectedFiles.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="files-table">
                    <div className="table-header">
                      <div className="table-col select">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFiles(files.map(f => f.id));
                            } else {
                              setSelectedFiles([]);
                            }
                          }}
                        />
                      </div>
                      <div className="table-col name">File Name</div>
                      <div className="table-col type">Type</div>
                      <div className="table-col size">Size</div>
                      <div className="table-col date">Uploaded</div>
                      <div className="table-col status">Status</div>
                      <div className="table-col actions">Actions</div>
                    </div>

                    <div className="table-body">
                      {files.map(file => (
                        <div key={file.id} className="table-row">
                          <div className="table-col select">
                            <input 
                              type="checkbox" 
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => handleFileSelect(file.id)}
                            />
                          </div>
                          <div className="table-col name">
                            <span className="file-icon">
                              {file.type === 'pdf' && '📄'}
                              {file.type === 'doc' && '📝'}
                              {file.type === 'excel' && '📊'}
                              {file.type === 'sketch' && '🎨'}
                            </span>
                            {file.name}
                          </div>
                          <div className="table-col type">{file.type.toUpperCase()}</div>
                          <div className="table-col size">{file.size}</div>
                          <div className="table-col date">{file.uploaded}</div>
                          <div className="table-col status">
                            <span className={`status-badge ${file.status}`}>
                              {file.status}
                            </span>
                          </div>
                          <div className="table-col actions">
                            <button className="icon-btn" title="Preview">
                              <FiEye />
                            </button>
                            <button className="icon-btn" title="Download">
                              <FiDownload />
                            </button>
                            <button className="icon-btn" title="Share">
                              <FiShare2 />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="tab-content"
                >
                  <div className="content-header">
                    <h3>💬 Messages</h3>
                    <button className="new-message-btn">
                      + New Message
                    </button>
                  </div>

                  <div className="messages-container">
                    <div className="messages-list">
                      {messages.map(msg => (
                        <div key={msg.id} className={`message-preview ${msg.unread ? 'unread' : ''}`}>
                          <div className="message-sender">{msg.sender}</div>
                          <div className="message-content">{msg.message}</div>
                          <div className="message-time">{msg.time}</div>
                        </div>
                      ))}
                    </div>

                    <div className="message-composer">
                      <textarea 
                        placeholder="Type your message..."
                        rows="4"
                      />
                      <div className="composer-actions">
                        <button className="attach-btn">📎 Attach Files</button>
                        <button className="send-btn">📤 Send Message</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Badge */}
            <div className="security-badge">
              <FiLock />
              <span>End-to-end encrypted • ISO 27001 certified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientPortal;