const express = require('express');
const http = require('http');
const { pool } = require('./db');
const bcrypt = require('bcryptjs');
const { storeMessage } = require('./messageController');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Middleware
app.use(express.json());

// Signup route
app.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const queryText = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *';
        const { rows } = await pool.query(queryText, [email, hashedPassword]);
        const user = rows[0];
        res.status(201).json({ user });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const queryText = 'SELECT * FROM users WHERE email = $1';
        const { rows } = await pool.query(queryText, [email]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fetch User Information
app.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const queryText = 'SELECT * FROM users WHERE id = $1';
        const { rows } = await pool.query(queryText, [userId]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update User Details
app.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const queryText = 'UPDATE users SET email = $1, password = $2 WHERE id = $3 RETURNING *';
        const { rows } = await pool.query(queryText, [email, hashedPassword, userId]);
        const user = rows[0];
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete User Account
app.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const queryText = 'DELETE FROM users WHERE id = $1';
        await pool.query(queryText, [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route for sending messages
app.post('/messages', async (req, res) => {
    try {
        const { senderId, receiverId, messageContent } = req.body;
        await storeMessage(senderId, receiverId, messageContent);
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'An error occurred while sending the message' });
    }
});