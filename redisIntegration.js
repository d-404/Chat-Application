const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

//Setting up Redis client
function setupRedis() {
    const redisClient = redis.createClient({
        host: 'localhost',
        port: 6333,
    });

    const sessionStore = new RedisStore({ client: redisClient });

    return { redisClient, sessionStore };
}

module.exports = setupRedis;