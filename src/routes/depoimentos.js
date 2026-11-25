const router = require('express').Router();
const service = require('../services/depoimentoService');

router.get('/', async (req, res, next) => {
  try {
    res.json(await service.listarAutorizados());
  } catch (e) {
    next(e);
  }
});

module.exports = router;
