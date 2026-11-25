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
app.use(express.json());
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120 }));

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
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Vitrine em http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('Falha ao conectar no MongoDB:', e.message);
    process.exit(1);
  });
