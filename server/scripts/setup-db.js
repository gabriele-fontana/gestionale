require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2' } : undefined,
        multipleStatements: true,
    });

    const sql = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
    await conn.query(sql);

    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tabelle create:', tables.map((t) => Object.values(t)[0]).join(', '));
    await conn.end();
}

main().catch((err) => {
    console.error('Errore:', err.message);
    process.exit(1);
});