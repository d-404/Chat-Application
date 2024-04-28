const request = require('supertest');
const app = require('../server');

describe('POST /signup', () => {
    it('should create a new user', async () => {
        const response = await request(app)
            .post('/signup')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
    });
});

describe('POST /login', () => {
    it('should log in an existing user with correct credentials', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'password123' });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Login successful');
    });

    it('should return 404 for a non-existing user', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'nonexistent@example.com', password: 'password123' });
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 401 for incorrect password', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'incorrectpassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid password');
    });
});

describe('GET /users/:id', () => {
    it('should return user information for a valid user ID', async () => {
        const userId = 1;
        const response = await request(app)
            .get(`/users/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.id).toBe(userId);
    });

    it('should return 404 for an invalid user ID', async () => {
        const invalidUserId = 9999;
        const response = await request(app)
            .get(`/users/${invalidUserId}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'User not found');
    });
});

describe('PUT /users/:id', () => {
    it('should update user details for a valid user ID', async () => {
        const userId = 1;
        const updatedEmail = 'updated@example.com';
        const updatedPassword = 'updatedpassword123';
        const response = await request(app)
            .put(`/users/${userId}`)
            .send({ email: updatedEmail, password: updatedPassword });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(updatedEmail);
    });
});

describe('DELETE /users/:id', () => {
    it('should delete user account for a valid user ID', async () => {
        const userId = 1;
        const response = await request(app)
            .delete(`/users/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 404 for an invalid user ID', async () => {
        const invalidUserId = 9999;
        const response = await request(app)
            .delete(`/users/${invalidUserId}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'User not found');
    });
});

describe('POST /messages', () => {
    it('should send a message to Kafka and cache it in Redis', async () => {
        const senderId = 1;
        const receiverId = 2;
        const messageContent = 'Test message content';
        const response = await request(app)
            .post('/messages')
            .send({ senderId, receiverId, messageContent });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Message sent successfully');
    });
});

describe('POST /messages', () => {
    it('should return 400 if senderId or receiverId is missing', async () => {
        const response = await request(app)
            .post('/messages')
            .send({ messageContent: 'Test message content' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'senderId or receiverId is missing');
    });

    it('should return 400 if messageContent is empty', async () => {
        const response = await request(app)
            .post('/messages')
            .send({ senderId: 1, receiverId: 2, messageContent: '' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'messageContent cannot be empty');
    });

    it('should return 404 if senderId or receiverId does not exist', async () => {
        const response = await request(app)
            .post('/messages')
            .send({ senderId: 999, receiverId: 888, messageContent: 'Test message content' });
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Sender or receiver not found');
    });
});
