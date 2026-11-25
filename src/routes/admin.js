const express = require('express');
const mongoose = require('mongoose');
const Animal = require('../models/Animal');
const Depoimento = require('../models/Depoimento');

const animalFields = {
  nome: ['string', 100], raca: ['string', 100], cor: ['string', 100],
  sexo: ['enum', ['Macho', 'Fêmea']], idadeMeses: ['number'], pesoKg: ['number'],
  preco: ['number'], imagem: ['image', 2048], status: ['enum', Animal.STATUS],
};
const depoimentoFields = {
  nome: ['string', 100], legenda: ['string', 160], texto: ['string', 3000],
  estrelas: ['stars'], autorizado: ['boolean'],
};

function validate(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dados inválidos.');
  const result = {};
  for (const [key, value] of Object.entries(body)) {
    if (!Object.hasOwn(fields, key)) throw new Error(`Campo não permitido: ${key}.`);
    const [type, limit] = fields[key];
    if (['string', 'image'].includes(type)) {
      if (typeof value !== 'string' || value.length > limit) throw new Error(`Campo ${key} inválido.`);
      result[key] = value.trim();
      if (type === 'image' && value && !/^https:\/\/[^\s]+$/i.test(value) && !/^\/(?![\/\\])[^\\\s]*$/.test(value)) {
        throw new Error('A imagem precisa ser uma URL HTTPS ou caminho local iniciado por /.');
      }
    } else if (type === 'enum') {
      if (!limit.includes(value)) throw new Error(`Campo ${key} inválido.`);
      result[key] = value;
    } else if (type === 'boolean') {
      if (typeof value !== 'boolean') throw new Error(`Campo ${key} inválido.`);
      result[key] = value;
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`Campo ${key} inválido.`);
      if (type === 'stars' && (!Number.isInteger(value) || value < 1 || value > 5)) throw new Error('Estrelas deve ser um inteiro de 1 a 5.');
      result[key] = value;
    }
  }
  if (!Object.keys(result).length) throw new Error('Preencha os dados do registro.');
  return result;
}

module.exports = function adminRoutes(auth, fromNodeHeaders) {
  const router = express.Router();
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.use(async (req, res, next) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session) return res.status(401).json({ erro: 'Entre como administrador para continuar.' });
      if (session.user.email.toLowerCase() !== process.env.ADMIN_EMAIL.trim().toLowerCase()) {
        return res.status(403).json({ erro: 'Acesso permitido somente ao administrador.' });
      }
      req.admin = session.user;
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        // Header não simples + origem exata: bloqueia formulários e fetch cross-origin.
        const origin = req.get('origin');
        if (req.get('X-Admin-Request') !== '1' || (origin && origin !== new URL(process.env.BETTER_AUTH_URL).origin)) {
          return res.status(403).json({ erro: 'Origem da solicitação inválida.' });
        }
      }
      next();
    } catch (error) { next(error); }
  });
  router.get('/me', (req, res) => res.json({ nome: req.admin.name, email: req.admin.email }));

  for (const [route, Model, fields] of [['animais', Animal, animalFields], ['depoimentos', Depoimento, depoimentoFields]]) {
    router.get(`/${route}`, async (req, res, next) => {
      try { res.json(await Model.find().sort({ createdAt: -1 }).lean()); } catch (error) { next(error); }
    });
    const save = (update) => async (req, res, next) => {
      if (update && !mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ erro: 'Identificador inválido.' });
      let data;
      try { data = validate(req.body, fields); } catch (error) { return res.status(400).json({ erro: error.message }); }
      try {
        const doc = update
          ? await Model.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true })
          : await Model.create(data);
        if (!doc) return res.status(404).json({ erro: 'Registro não encontrado.' });
        res.status(update ? 200 : 201).json(doc);
      } catch (error) {
        if (error.name === 'ValidationError') return res.status(400).json({ erro: 'Confira os campos obrigatórios e seus valores.' });
        next(error);
      }
    };
    router.post(`/${route}`, save(false));
    router.patch(`/${route}/:id`, save(true));
    router.delete(`/${route}/:id`, async (req, res, next) => {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ erro: 'Identificador inválido.' });
      try {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ erro: 'Registro não encontrado.' });
        res.status(204).end();
      } catch (error) { next(error); }
    });
  }
  return router;
};
