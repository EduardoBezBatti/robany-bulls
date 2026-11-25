const router = require('express').Router();
const mongoose = require('mongoose');
const service = require('../services/animalService');

router.get('/', async (req, res, next) => {
  try {
    res.json(await service.listarDisponiveis());
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ erro: 'Identificador inválido.' });
    }
    const animal = await service.buscarDisponivel(req.params.id);
    if (!animal) return res.status(404).json({ erro: 'Filhote não encontrado ou indisponível.' });
    res.json(animal);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
