// src/app.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import sessionsRouter from './routes/sessions.js';
import tracksRouter from './routes/tracks.js';
import votesRouter from './routes/votes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Assouplir Helmet en dev (désactiver CSP qui bloque les connexions locales)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api', sessionsRouter);
app.use('/api', tracksRouter);
app.use('/api', votesRouter);

// Route racine -> index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Servir le frontend statique
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

export default app;