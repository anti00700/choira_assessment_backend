const mongoose = require('mongoose');
const config = require('./config/env');
const app = require('./app');
const { pool, connectMySQL } = require('./config/mysql');
const { connectMongo } = require('./config/mongo');

async function start() {
  try {
    await connectMySQL();
    await connectMongo();
  } catch (err) {
    console.error('Failed to connect to a database:', err.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await Promise.allSettled([pool.end(), mongoose.connection.close()]);
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

start();
