import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { logger, createHttpLogger } from './logger/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(createHttpLogger(logger));

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.json({ message: 'Job Concurrency Manager API' });
});

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}.`);
});
