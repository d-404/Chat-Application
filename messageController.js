const { pool } = require('./db');

async function storeMessage(senderId, receiverId, messageContent) {
    try {
        const queryText = 'INSERT INTO message_history (sender_id, receiver_id, message) VALUES ($1, $2, $3)';
        await pool.query(queryText, [senderId, receiverId, messageContent]);
        console.log('Message stored successfully');
    } catch (error) {
        console.error('Error storing message:', error);
        throw error;
    }
}

module.exports = { storeMessage };
