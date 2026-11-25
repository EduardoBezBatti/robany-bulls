// Popula o banco com dados demonstrativos (valores e depoimentos ilustrativos).
require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');
const Animal = require('../models/Animal');
const Depoimento = require('../models/Depoimento');

const animais = [
  { nome: 'Thor', raca: 'Golden', cor: 'dourado', sexo: 'Macho', idadeMeses: 2, pesoKg: 4.5, preco: 3500 },
  { nome: 'Mel', raca: 'Shih Tzu', cor: 'branco e caramelo', sexo: 'Fêmea', idadeMeses: 3, pesoKg: 2.1, preco: 2800 },
  { nome: 'Bóris', raca: 'Spitz', cor: 'laranja', sexo: 'Macho', idadeMeses: 2, pesoKg: 1.8, preco: 4000 },
  { nome: 'Luna', raca: 'Spitz', cor: 'creme', sexo: 'Fêmea', idadeMeses: 3, pesoKg: 1.6, preco: 4200 },
  { nome: 'Chico', raca: 'Bulldog Francês', cor: 'fulvo', sexo: 'Macho', idadeMeses: 3, pesoKg: 3.8, preco: 5500 },
  { nome: 'Nina', raca: 'Shih Tzu', cor: 'branco e preto', sexo: 'Fêmea', idadeMeses: 2, pesoKg: 1.7, preco: 2900 },
  // Não aparece na vitrine (RN01):
  { nome: 'Pipoca', raca: 'Spitz', cor: 'branco', sexo: 'Fêmea', idadeMeses: 4, pesoKg: 2.0, preco: 3800, status: 'Vendido' },
];

const depoimentos = [
  { nome: 'Mariana S.', legenda: 'Um encontro cheio de afeto', autorizado: true,
    texto: 'Desde a primeira conversa, senti muito carinho. Ter um companheiro em casa deixou nossos dias mais leves e felizes.' },
  { nome: 'Rafael e Júlia', legenda: 'Uma nova história em família', autorizado: true,
    texto: 'Pudemos tirar nossas dúvidas com calma. Foi uma escolha em família e o começo de uma história muito especial.' },
  { nome: 'Camila A.', legenda: 'Mais alegria todos os dias', autorizado: true,
    texto: 'O que mais gostei foi da atenção na conversa. Nosso pequeno trouxe brincadeiras, companhia e muito amor para casa.' },
];

(async () => {
  await connectDB();
  await Animal.deleteMany({});
  await Depoimento.deleteMany({});
  await Animal.insertMany(animais);
  await Depoimento.insertMany(depoimentos);
  console.log(`Seed concluído: ${animais.length} animais, ${depoimentos.length} depoimentos.`);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
