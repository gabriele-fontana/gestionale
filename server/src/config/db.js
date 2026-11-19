const mysql = require('mysql2/promise');
require('dotenv').config();

function connectionConfig() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: Number(url.port) || 3306,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
        };
    }
    return {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    };
}

const pool = mysql.createPool({
    ...connectionConfig(),
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
});

module.exports = pool;