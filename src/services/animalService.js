const Animal = require('../models/Animal');

// RN01 - somente animais com status "Disponível" aparecem na vitrine
async function listarDisponiveis() {
  return Animal.find({ status: 'Disponível' }).sort({ createdAt: -1 }).lean();
}

async function buscarDisponivel(id) {
  return Animal.findOne({ _id: id, status: 'Disponível' }).lean();
}

module.exports = { listarDisponiveis, buscarDisponivel };
