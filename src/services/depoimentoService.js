const Depoimento = require('../models/Depoimento');

// Somente depoimentos autorizados são exibidos
async function listarAutorizados() {
  return Depoimento.find({ autorizado: true }).sort({ createdAt: -1 }).lean();
}

module.exports = { listarAutorizados };
