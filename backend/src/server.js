require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to Postgres.');
  } catch (err) {
    console.error('Could not connect to Postgres. Check DATABASE_URL in .env');
    console.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`HRMS API running on http://localhost:${PORT}`);
  });
}

start();
