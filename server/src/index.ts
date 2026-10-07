import { env } from './config/env';
import { connectDB } from './config/db';
import app from './app';

connectDB()
  .then(() => app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`)))
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
