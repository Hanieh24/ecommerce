require('dotenv').config();

const db = require('./config/database');

async function test() {
  try {
    const [rows] = await db.query('SELECT 1 AS test');
    console.log('Database connected!');
    console.log(rows);
  } catch (error) {
    console.error('Connection error:', error);
  }
}

test();