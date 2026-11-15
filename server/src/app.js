import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import expressMongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/index.js';
import { errorHandler, notFound } from './middleware/errors.js';
import openapi from './config/openapi.js';
import { connectDB } from '../../database/connection.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});
app.use(expressMongoSanitize());
app.get('/health', (_req, res) => res.json({ success: true, message: 'SkyKart API is running' }));
app.use('/api/v1', apiRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(notFound);
app.use(errorHandler);
export default app;
