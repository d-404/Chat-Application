const { Pool } = require('pg');

// Creating a Postgres Connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chatapp',
    password: 'postgres',
    port: 5444,
});

module.exports = { pool };
