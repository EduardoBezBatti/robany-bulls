# API HTTP

Base local: `http://localhost:3000`. Não há autenticação, paginação, filtros fornecidos pelo usuário ou endpoints de escrita. O limite para `/api` é de 120 requisições por minuto por IP.

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | `/api/config` | Configuração pública |
| GET | `/api/animais` | Array de animais disponíveis |
| GET | `/api/animais/:id` | Um animal disponível |
| GET | `/api/depoimentos` | Array de depoimentos autorizados |

## GET /api/config

```bash
curl http://localhost:3000/api/config
```

Resposta 200 sem telefone configurado:

```json
{"whatsapp":null,"negocio":"Robany Bulls Poms"}
```

`whatsapp` contém apenas os dígitos de `WHATSAPP_NUMBER`, ou `null` quando não há dígitos. `negocio` é fixo no código. Essa rota não consulta o banco, mas o processo depende da conexão inicial para atender.

## GET /api/animais

```bash
curl http://localhost:3000/api/animais
```

Exemplo ilustrativo de resposta 200:

```json
[
  {
    "_id":"507f1f77bcf86cd799439011",
    "nome":"Thor",
    "raca":"Golden",
    "cor":"dourado",
    "sexo":"Macho",
    "idadeMeses":2,
    "pesoKg":4.5,
    "preco":3500,
    "imagem":"",
    "status":"Disponível",
    "createdAt":"2026-11-24T12:00:00.000Z",
    "updatedAt":"2026-11-24T12:00:00.000Z",
    "__v":0
  }
]
```

Filtra `status: "Disponível"`, ordena por criação decrescente e retorna `[]` com 200 quando não há resultados. Preço é um número em reais; a formatação é feita no navegador.

## GET /api/animais/:id

```bash
curl http://localhost:3000/api/animais/507f1f77bcf86cd799439011
```

Use um `_id` real da listagem. Retorna 200 com um objeto no mesmo formato da listagem. Animais reservados e vendidos também ficam indisponíveis para essa consulta.

| Condição | Status | Resposta |
| --- | --- | --- |
| ID rejeitado por `mongoose.isValidObjectId` | 400 | `{"erro":"Identificador inválido."}` |
| ID inexistente ou animal indisponível | 404 | `{"erro":"Filhote não encontrado ou indisponível."}` |

## GET /api/depoimentos

```bash
curl http://localhost:3000/api/depoimentos
```

Exemplo ilustrativo de resposta 200:

```json
[
  {
    "_id":"507f191e810c19729de860ea",
    "nome":"Cliente de exemplo",
    "legenda":"História ilustrativa",
    "texto":"Depoimento demonstrativo.",
    "estrelas":5,
    "autorizado":true,
    "createdAt":"2026-11-24T12:00:00.000Z",
    "updatedAt":"2026-11-24T12:00:00.000Z",
    "__v":0
  }
]
```

Filtra `autorizado: true`, ordena por criação decrescente e retorna `[]` com 200 quando vazio.

## Erros comuns

| Status | Condição | Corpo |
| --- | --- | --- |
| 404 | Caminho ou método sem handler dentro de `/api` | `{"erro":"Rota não encontrada."}` |
| 429 | Limite excedido | Mensagem padrão do express-rate-limit, sem envelope JSON personalizado |
| 500 | Exceção encaminhada ao handler genérico | `{"erro":"Erro interno do servidor."}` |

Fora de `/api`, arquivos inexistentes seguem o 404 padrão do Express. Não há envelope único para todos os erros de middleware; o handler genérico também pode transformar erros encaminhados em 500 sem preservar seu status original.
