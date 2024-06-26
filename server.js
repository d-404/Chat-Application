const express = require('express');
const http = require('http');
const session = require('express-session');

const { kafkaProducer } = require('./kafkaIntegration');
const setupRedis = require('./redisSetup');
const { pool } = require('./databaseConnection');

const bcrypt = require('bcryptjs');
const { encryptMessage } = require('./messageEncryption');
const crypto = require('crypto');
const WebSocket = require('ws');

const RedisServer = require('connect-redis')(session);

const server = http.createServer(app);
const app = express();
app.use(express.json());

const { redisServer } = setupRedis();
const wss = new WebSocket('ws://localhost:9090');

const PORT = process.env.PORT || 9090;

// Set up WebSocket server
setupWebSocketServer(server);
// Store connected clients
const clients = new Set();

server.listen(PORT, () => {
    console.log(`Server started : http://localhost:${PORT}`);
});

// Handle new WebSocket connections
wss.on('connection', (wss) => {
    console.log('Client connected');
    clients.add(wss);

    // Handle disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(wss);
    });
});

// Display notification or update user status
wss.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'online') {
        console.log(`User ${message.user} is online`);
    }
};

// Function to send a notification to all connected clients
function notifyClients(message) {
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Secret Key Generation
function generateKey(size) {
    return crypto.randomBytes(Math.floor(size / 2))
        .toString('hex')
        .slice(0, size);
}
const secret_KEY = generateKey(15);
console.log(`Secret Key generated is : ` + secret_KEY);

// Storing in Redis
app.use(session({
    store: new RedisServer({ client: redisServer }),
    secret: 'secret_KEY',
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 720000,
    },
}));

// Registration of an user
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashPwd = await bcrypt.hash(password, 12);
        const query = 'INSERT INTO peoples (email, password) VALUES ($1, $2)';
        const { registered } = await pool.query(query, [email, hashPwd]);
        const people = registered[0];
        res.status(201).json({ people });
    } catch (error) {
        console.error('!!Registration of user failed!!', error);
        res.status(500).json({ error: error.message });
    }
});

// Existing user login with valid credentials
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const query = 'SELECT * FROM peoples WHERE email = $1';
        const { loggedIn } = await pool.query(query, [email]);
        const people = loggedIn[0];
        if (!people) {
            return res.status(404).json({ error: 'Invalid User!!' });
        }
        const validPwd = await bcrypt.compare(password, people.password);
        if (!validPwd) {
            return res.status(401).json({ error: 'Password Incorrect!!' });
        }
        req.session.userId = people.id;
        res.json({ message: 'User successfully logged in..' });
    } catch (error) {
        console.error('!!Error in login!! :', error);
        res.status(500).json({ error: error.message });
    }
});

// Getting the details of a vaild user
app.get('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const query = 'SELECT * FROM peoples WHERE id = $1';
        const { fetched } = await pool.query(query, [userId]);
        const people = fetched[0];
        if (!people) {
            return res.status(404).json({ error: '!!Invalid user!!' });
        }
        res.json({ people });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deleting an existing user
app.delete('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const query = 'DELETE FROM peoples WHERE id = $1';
        await pool.query(query, [userId]);
        res.json({ message: 'User deleted successfully..!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update the details of an existing user
app.put('/user/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, password } = req.body;
        const hashPwd = await bcrypt.hash(password, 12);
        const query = 'UPDATE peoples SET email = $1, password = $2 WHERE id = $3';
        const { updated } = await pool.query(query, [email, hashPwd, userId]);
        const people = updated[0];
        res.json({ people });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/sendmessage', (req, res) => {
    try {
        // Encrypt the message
        const encryptedMsgToSend = encryptMessage(messageContent, 'secret_KEY');

        // Extract sender_ID, receiver_ID, and messageContent from request body
        const { sender_ID, receiver_ID, messageContent } = req.body;

        // Store the encrypted message in Redis for caching
        redisServer.set(`message:${sender_ID}:${receiver_ID}`, encryptedMsgToSend);

        // Push the message to Kafka
        const payload = [
            { topic: 'mesage-topic', message: JSON.stringify({ sender_ID, receiver_ID, encryptedMsgToSend }) }
        ];
        // Handle any errors
        kafkaProducer.send(payload, (error) => {
            if (error) {
                res.status(500).json({ error: '!..Error occurred during sending message to Kafka..!' });
            } else {
                // Notify clients that the sender is online
                notifyClients({ type: 'online', user: sender_ID });
                res.status(201).json({ message: 'Message sent to Kafka successfully!' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: '!..Error occurred during sending message to Kafka..!' });
    }
});
