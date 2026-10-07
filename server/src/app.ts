import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middleware/error';

const app = express();
if (env.NODE_ENV === 'production') app.set('trust proxy', 1); // correct client IPs behind a proxy (rate limiting)

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
