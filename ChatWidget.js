import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(newSocket);

    // Load initial messages
    const loadMessages = async () => {
      const response = await fetch('/api/chat/messages');
      const data = await response.json();
      setMessages(data.messages);
    };

    loadMessages();

    // Listen for new messages
    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Typing indicator
    newSocket.on('user_typing', (data) => {
      setIsTyping(data.isTyping);
    });

    return () => newSocket.close();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const message = {
      conversationId: 'current',
      senderId: 'client',
      senderType: 'client',
      message: inputMessage
    };

    socket.emit('send_message', message);
    setInputMessage('');
  };

  const handleTyping = (typing) => {
    socket.emit('typing', {
      conversationId: 'current',
      userId: 'client',
      isTyping: typing
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        className="chat-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ 
          scale: isOpen ? 0.9 : 1,
          rotate: isOpen ? 180 : 0 
        }}
      >
        💬
        {!isOpen && messages.filter(m => !m.isRead).length > 0 && (
          <span className="notification-badge">
            {messages.filter(m => !m.isRead).length}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-window"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            <div className="chat-header">
              <div className="chat-title">
                <div className="status-indicator online"></div>
                <h3>JEFF DESIGNS HUB Support</h3>
                <span className="response-time">⏱️ Avg. response: 5 min</span>
              </div>
              <button className="close-chat" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.senderType === 'client' ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.message}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span>Support agent is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTyping(true);
                }}
                onBlur={() => handleTyping(false)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
              />
              <motion.button
                onClick={sendMessage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={!inputMessage.trim()}
              >
                📤
              </motion.button>
            </div>

            {/* Quick Replies */}
            <div className="quick-replies">
              <button onClick={() => setInputMessage("I need a logo design quote")}>
                💰 Get Quote
              </button>
              <button onClick={() => setInputMessage("Can I see your portfolio?")}>
                🖼️ View Portfolio
              </button>
              <button onClick={() => setInputMessage("What are your working hours?")}>
                ⏰ Working Hours
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;