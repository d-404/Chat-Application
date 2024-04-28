const express = require('express');
const http = require('http');
const { pool } = require('./db');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const { producer } = require('./kafka');
const crypto = require('crypto');
const { encryptMessage, decryptMessage } = require('./encryption');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Middleware
app.use(express.json());

// Secret Key Generation
function generateSecretKey(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

const secretKey = generateSecretKey(32);
console.log('Generated secret key:', secretKey);


// Create a Redis client for session management
const redisClient = redis.createClient({
    host: 'localhost',
    port: 6379,
});

// Set up session middleware with Redis store
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 3600000,
    },
}));

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
        // Set user session
        req.session.userId = user.id;
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

// Route for sending messages to Kafka
app.post('/messages', (req, res) => {
    try {
        // Extract senderId, receiverId, and messageContent from request body
        const { senderId, receiverId, messageContent } = req.body;

        // Encrypt the message
        const encryptedMessage = encryptMessage(messageContent, 'secretKey');

        // Store the encrypted message in Redis for caching
        redisClient.set(`message:${senderId}:${receiverId}`, encryptedMessage);

        // Produce the message to Kafka
        const payloads = [
            { topic: 'messages', messages: JSON.stringify({ senderId, receiverId, encryptedMessage }) }
        ];
        producer.send(payloads, (error, data) => {
            if (error) {
                console.error('Error producing message to Kafka:', error);
                res.status(500).json({ error: 'An error occurred while sending the message' });
            } else {
                console.log('Message sent to Kafka:', data);
                res.status(201).json({ message: 'Message sent successfully' });
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'An error occurred while sending the message' });
    }
});
