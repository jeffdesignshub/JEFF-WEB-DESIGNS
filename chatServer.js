const socketIo = require('socket.io');
const mysql = require('mysql2/promise');

const setupChat = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  });

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join conversation
    socket.on('join_conversation', async (data) => {
      const { conversationId, userId } = data;
      socket.join(conversationId);
      
      // Mark messages as read
      await pool.execute(
        `UPDATE chat_messages SET is_read = true 
         WHERE conversation_id = ? AND sender_id != ? AND is_read = false`,
        [conversationId, userId]
      );
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { conversationId, senderId, message, senderType } = data;
      
      try {
        // Save to database
        const [result] = await pool.execute(
          `INSERT INTO chat_messages 
           (conversation_id, sender_id, sender_type, message, timestamp) 
           VALUES (?, ?, ?, ?, NOW())`,
          [conversationId, senderId, senderType, message]
        );

        const savedMessage = {
          id: result.insertId,
          conversationId,
          senderId,
          senderType,
          message,
          timestamp: new Date()
        };

        // Broadcast to conversation room
        io.to(conversationId).emit('new_message', savedMessage);

        // Notify admin if client sent message
        if (senderType === 'client') {
          io.emit('admin_notification', {
            type: 'new_message',
            conversationId,
            message: 'New message from client'
          });
        }

      } catch (error) {
        console.error('Message save error:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, userId, isTyping } = data;
      socket.to(conversationId).emit('user_typing', {
        userId,
        isTyping
      });
    });

    // Online status
    socket.on('user_online', async (userId) => {
      await pool.execute(
        `UPDATE users SET is_online = true, last_seen = NOW() 
         WHERE id = ?`,
        [userId]
      );
      io.emit('user_status_change', { userId, status: 'online' });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupChat;