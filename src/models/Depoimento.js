const mongoose = require('mongoose');

const depoimentoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    legenda: { type: String, default: '', trim: true },
    texto: { type: String, required: true, trim: true },
    estrelas: { type: Number, default: 5, min: 1, max: 5 },
    // LGPD: só aparece na vitrine com autorização do cliente
    autorizado: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Depoimento', depoimentoSchema);
