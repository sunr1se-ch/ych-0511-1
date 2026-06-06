/**
 * local server entry file, for local development
 */
import app, { initDatabase } from './app.js';
import { startScheduledTasks } from './tasks/scheduler.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await initDatabase();
    const server = app.listen(PORT, () => {
      console.log(`Server ready on port ${PORT}`);
      startScheduledTasks();
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
