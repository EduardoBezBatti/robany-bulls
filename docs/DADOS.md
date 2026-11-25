# Dados e administração

O banco é definido na URI de conexão. Os models criam as coleções `animals` e `depoimentos`, com `_id` ObjectId, `createdAt`, `updatedAt` e versionamento `__v` do Mongoose.

O [painel administrativo](ADMINISTRACAO.md) permite gerenciar os registros com autenticação e validação no servidor. Compass, Atlas e mongosh continuam disponíveis ao responsável pelo banco. As coleções privadas de autenticação são separadas do catálogo e não devem ser publicadas.

## Animal

| Campo | Tipo | Regra no Mongoose |
| --- | --- | --- |
| `nome` | String | Obrigatório; trim |
| `raca` | String | Obrigatório; trim |
| `cor` | String | Obrigatório; trim |
| `sexo` | String | Obrigatório; `Macho` ou `Fêmea` |
| `idadeMeses` | Number | Obrigatório; mínimo 0 |
| `pesoKg` | Number | Obrigatório; mínimo 0 |
| `preco` | Number | Obrigatório; mínimo 0; em reais |
| `imagem` | String | Padrão vazio; URL de foto |
| `status` | String | `Disponível`, `Reservado` ou `Vendido`; padrão `Disponível`; indexado |

Não há validação de inteiro para idade ou de formato da URL da foto. O preço é exibido sem casas decimais no frontend, mas o banco armazena o número informado.

## Depoimento

| Campo | Tipo | Regra no Mongoose |
| --- | --- | --- |
| `nome` | String | Obrigatório; trim |
| `legenda` | String | Padrão vazio; trim |
| `texto` | String | Obrigatório; trim |
| `estrelas` | Number | Padrão 5; intervalo de 1 a 5 |
| `autorizado` | Boolean | Padrão `false`; indexado |

O schema não exige inteiro para estrelas; cadastre valores inteiros para corresponder à apresentação visual.

## Gerenciar registros

Alterações diretas no MongoDB não passam automaticamente pelas validações do Mongoose. Preserve tipos, campos obrigatórios, grafia dos enums e datas. Não inclua dados privados nas coleções públicas: a API não faz projeção explícita dos campos.

Exemplo para mongosh em uma base de desenvolvimento:

```javascript
use('robany-bulls');
db.animals.insertOne({
  nome: 'Filhote de exemplo', raca: 'Spitz', cor: 'creme', sexo: 'Fêmea',
  idadeMeses: 3, pesoKg: 1.6, preco: 4200, imagem: '', status: 'Disponível',
  createdAt: new Date(), updatedAt: new Date()
});
```

Para reservar, substitua o ID de exemplo por um real:

```javascript
db.animals.updateOne(
  { _id: ObjectId('507f1f77bcf86cd799439011') },
  { $set: { status: 'Reservado', updatedAt: new Date() } }
);
```

`Reservado` e `Vendido` retiram o animal tanto da listagem quanto da consulta individual. Voltar a `Disponível` o republica.

Exemplo de depoimento não publicado:

```javascript
db.depoimentos.insertOne({
  nome: 'Cliente de exemplo', legenda: '', texto: 'Texto ilustrativo.',
  estrelas: 5, autorizado: false, createdAt: new Date(), updatedAt: new Date()
});
```

Após obter e registrar autorização real fora da aplicação, altere o registro correspondente para `autorizado: true`. Para retirar sua exibição, volte a `false`. Recarregue a página após alterações; não é necessário reiniciar o servidor.

## Imagens

`imagem` pode conter URL HTTPS pública ou caminho da própria origem, como `/img/filhote.jpg`. Nesse caso, crie `public/img` e acrescente arquivos autorizados. A capa usa `public/img/hero.jpg`; a seção sobre usa `public/img/sobre.jpg`. Sem eles, permanecem gradientes e ícones, com possíveis 404 no navegador. Imagens dos cards têm fallback em caso de erro.

## Seed e backup

`npm run seed` apaga todos os registros de ambas as coleções antes de inserir sete animais e três depoimentos ilustrativos. Seis animais ficam disponíveis e um vendido. Os três depoimentos têm flag técnica de autorização para demonstração.

O seed não é transacional: uma falha intermediária pode deixar dados parciais. Não execute em uma base com informações que deseja preservar. Faça backup com os recursos da sua infraestrutura antes de alterações relevantes; não há backup, restauração ou migração integrados ao projeto.
