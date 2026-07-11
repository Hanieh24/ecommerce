require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const db = require('../config/database');

async function setupDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    const statements = schema
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await db.query(statement);
    }

    const [columns] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'product'
            AND COLUMN_NAME = 'deletedAt'`
    );

    if (columns.length === 0) {
        await db.query('ALTER TABLE product ADD COLUMN deletedAt DATETIME NULL');
    }

    await db.end();
    console.log('Database schema created successfully');
}

setupDatabase().catch(async (error) => {
    console.error('Database setup failed:', error);
    await db.end();
    process.exit(1);
});
