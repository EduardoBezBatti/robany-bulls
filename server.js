require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./src/config/db');
const animaisRoutes = require('./src/routes/animais');
const depoimentosRoutes = require('./src/routes/depoimentos');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120 }));

let authHandler;
let adminHandler;
app.use('/api/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  // Sobrescreve qualquer valor enviado pelo cliente com o IP resolvido pelo Express.
  req.headers['x-robany-client-ip'] = req.ip;
  if (!authHandler) return res.status(503).json({ erro: 'Acesso administrativo não configurado.' });
  next();
});
// O Better Auth precisa receber o stream original, antes do parser JSON.
app.all('/api/auth/*', (req, res, next) => Promise.resolve(authHandler(req, res)).catch(next));
app.use(express.json({ limit: '32kb' }));
app.use('/api/admin', (req, res, next) => {
  if (!adminHandler) return res.status(503).json({ erro: 'Acesso administrativo não configurado.' });
  return adminHandler(req, res, next);
});

// Configuração pública (número do WhatsApp vem de variável de ambiente)
app.get('/api/config', (req, res) => {
  const numero = (process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  res.json({ whatsapp: numero || null, negocio: 'Robany Bulls Poms' });
});
app.use('/api/animais', animaisRoutes);
app.use('/api/depoimentos', depoimentosRoutes);
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.use(express.static(path.join(__dirname, 'public')));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Solicitação muito grande.' });
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

connectDB()
  .then(async () => {
    if (process.env.BETTER_AUTH_SECRET || process.env.ADMIN_EMAIL || process.env.BETTER_AUTH_URL) {
      const { createAuth, ensureAuthIndexes } = await import('./src/config/auth.mjs');
      const { toNodeHandler, fromNodeHeaders } = await import('better-auth/node');
      const auth = createAuth();
      await ensureAuthIndexes(auth);
      authHandler = toNodeHandler(auth);
      adminHandler = require('./src/routes/admin')(auth, fromNodeHeaders);
    } else {
      console.log('Para configurar o administrador: npm run admin:create');
    }
    app.listen(PORT, () => console.log(`Vitrine em http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('Falha ao iniciar a aplicação:', e.message);
    process.exit(1);
  });
