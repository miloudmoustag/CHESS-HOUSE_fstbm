import 'dotenv/config';
import express from 'express';
import path from 'path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import configHandler from './api/config';
import registerHandler from './api/register';
import applyHandler from './api/apply';
import contactHandler from './api/contact';
import coachHandler from './api/coach';
import standingsHandler from './api/standings';
import adminHandler from './api/admin';
import passportHandler from './api/passport';
import keepaliveHandler from './api/keepalive';

const app = express();
app.use(express.json({ limit: '256kb' }));

function adapt(fn: (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown) {
  return async (req: express.Request, res: express.Response) => {
    await fn(req as unknown as VercelRequest, res as unknown as VercelResponse);
  };
}

app.all('/api/config', adapt(configHandler));
app.all('/api/register', adapt(registerHandler));
app.all('/api/apply', adapt(applyHandler));
app.all('/api/contact', adapt(contactHandler));
app.all('/api/coach', adapt(coachHandler));
app.all('/api/standings', adapt(standingsHandler));
app.all('/api/admin', adapt(adminHandler));
app.all('/api/passport', adapt(passportHandler));
app.all('/api/keepalive', adapt(keepaliveHandler));

async function start() {
  const port = Number(process.env.PORT) || 3000;
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Chess House Club server listening on http://localhost:${port}`);
  });
}

start();
