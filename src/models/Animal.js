const mongoose = require('mongoose');

const STATUS = ['Disponível', 'Reservado', 'Vendido'];

const animalSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    raca: { type: String, required: true, trim: true },
    cor: { type: String, required: true, trim: true },
    sexo: { type: String, required: true, enum: ['Macho', 'Fêmea'] },
    idadeMeses: { type: Number, required: true, min: 0 },
    pesoKg: { type: Number, required: true, min: 0 },
    preco: { type: Number, required: true, min: 0 },
    imagem: { type: String, default: '' }, // URL da foto (somente com autorização)
    status: { type: String, enum: STATUS, default: 'Disponível', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Animal', animalSchema);
module.exports.STATUS = STATUS;
