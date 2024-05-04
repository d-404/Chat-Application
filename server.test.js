const app = require('../server');
const request = require('supertest');


// This method is to test the sign up of a new user.
describe('POST /signup', () => {
    it('this should register a new user on the app', async () => {
        const response = await request(app)
            .post('/signup')
            .send({ email: 'kevin@gmail.com', password: 'Password@1234' });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
    });
});


// This method is to test the login of an existing user.
describe('POST /login', () => {
    //  Existing user with valid credentials
    it('this should verify the credentials of an existing user and login to the app', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'john@gmail.com', password: 'NewPassword@1234' });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Login successful!');
    });

    // Incorrect Password entered for an existing user
    it('this should return 401 if incorrect password is entered for an existing user', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'john@gmail.com', password: 'NewPassword' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Password Incorrect');
    });

    // Unexisting user
    it('this should return 404 if there is no user with valid credentials', async () => {
        const response = await request(app)
            .post('/login')
            .send({ email: 'random@test.com', password: '1password1' });
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Invalid User');
    });
});


// Fetch the details of an existing user
describe('GET /users/:id', () => {
    it('this should return user details if an user login with valid credentials', async () => {
        const userId = 1;
        const response = await request(app)
            .get(`/users/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.id).toBe(userId);
    });

    // Invalid user
    it('this should return 404 if the user id is invalid', async () => {
        const invalidUserId = 9999;
        const response = await request(app)
            .get(`/users/${invalidUserId}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'User unavailable');
    });
});


// Update the details of an existing user.
describe('PUT /users/:id', () => {
    it('this should update the exixting user details if a valid user ID is entered', async () => {
        const userId = 1;
        const updatedEmail = 'john1234@yahoo.com';
        const updatedPassword = 'Password@987654';
        const response = await request(app)
            .put(`/users/${userId}`)
            .send({ email: updatedEmail, password: updatedPassword });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(updatedEmail);
    });
});


// Delete an existing user 
describe('DELETE /users/:id', () => {
    it('this should delete an user account if vaild user details are available', async () => {
        const userId = 1;
        const response = await request(app)
            .delete(`/users/${userId}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Successfully Deleted USer!');
    });

    // User with invalid details
    it('this should return 404 if vaild user details are unavailable', async () => {
        const invalidUserId = 9999;
        const response = await request(app)
            .delete(`/users/${invalidUserId}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'User not found!');
    });
});


// Send messages to Redis and Kafka
describe('POST /messages', () => {
    it('this should push a message to Kafka and also store the message in Redis cache', async () => {
        const senderId = 1;
        const receiverId = 2;
        const messageContent = 'Hello World 1234567890';
        const response = await request(app)
            .post('/messages')
            .send({ senderId, receiverId, messageContent });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Message sent successfully!');
    });
});


// Invalid Sender ID or Receiver ID
describe('POST /messages', () => {
    it('should return 400 if senderId or receiverId is missing', async () => {
        const response = await request(app)
            .post('/messages')
            .send({ messageContent: 'Hello World 1234567890' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Sender ID or Receiver ID Unavailable!');
    });

    // Empty messages
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
            .send({ senderId: 999, receiverId: 888, messageContent: 'Hello World 1234567890' });
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Recepient or Sender Unavailable!');
    });
});
