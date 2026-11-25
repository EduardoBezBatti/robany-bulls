# Instalação e operação

## Requisitos e instalação

Use Git, Node.js >= 22 com npm e MongoDB acessível, local ou Atlas. A instalação local inicial usou Node.js 24. Não há build ou compilação.

```bash
git clone https://github.com/EduardoBezBatti/robany-bulls.git
cd robany-bulls
npm ci
```

Copie `.env.example` para `.env`:

```powershell
# PowerShell
Copy-Item .env.example .env
```

```bash
# Linux / macOS
cp .env.example .env
```

## Configuração

| Variável | Obrigatória | Comportamento |
| --- | --- | --- |
| `PORT` | Não | Porta HTTP; padrão 3000 |
| `MONGODB_URI` | Sim | URI da base; ausência impede inicialização |
| `WHATSAPP_NUMBER` | Não | Telefone público; API remove caracteres não numéricos |
| `ADMIN_EMAIL` | Para o painel | E-mail autorizado na administração |
| `BETTER_AUTH_SECRET` | Para o painel | Segredo aleatório de pelo menos 32 caracteres |
| `BETTER_AUTH_URL` | Para o painel | Origem da aplicação; HTTPS obrigatório em produção |

Configure as três variáveis administrativas juntas, ou use `npm run admin:create`. Sem elas, a vitrine continua disponível, mas as APIs administrativas retornam 503. Veja [Administração](ADMINISTRACAO.md).

Exemplo local:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/robany-bulls
WHATSAPP_NUMBER=
```

Preencha o telefone com DDI, DDD e número, somente dígitos. Para Atlas, use a URI do cluster, um usuário de banco autorizado e o nome da base; configure acesso de rede para a máquina do servidor. Codifique caracteres especiais da senha na URI. Nunca publique credenciais reais.

`npm ci` não instala nem inicia o MongoDB. O dotenv lê `.env` a partir do diretório de execução: rode os comandos na raiz do projeto.

## Iniciar e parar

```bash
npm start
# desenvolvimento com reinício ao alterar arquivos:
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000), ou a porta configurada. Mensagens esperadas: `MongoDB conectado.` e `Vitrine em http://localhost:3000`. O servidor só abre a porta depois de conectar ao banco. Encerre com `Ctrl+C` quando iniciado no terminal. Após editar `.env`, reinicie.

`npm run seed` é opcional e destrutivo para as duas coleções: use apenas uma base de desenvolvimento. Veja [Dados](DADOS.md).

## Ambiente local desta instalação

Na máquina da instalação inicial, o `.env` ignorado pelo Git aponta para a porta 27017. Para executar sem instalação prévia de MongoDB, foi criado um auxiliar com `mongodb-memory-server` em `%LOCALAPPDATA%\CodexTools\robany-bulls-mongo`, fora do projeto, com persistência em `data` e engine WiredTiger.

Esse auxiliar não é dependência do repositório e não é instalado por `npm ci`. Nessa mesma máquina, se estiver parado, inicie em um terminal:

```powershell
node "$env:LOCALAPPDATA\CodexTools\robany-bulls-mongo\start.cjs"
```

Execute `npm start` em outro terminal, na raiz do projeto. Não inicie outra instância se a porta já estiver em uso. Não foram criados serviços de inicialização automática. Em outra máquina, disponibilize seu próprio MongoDB.

## Implantação

Publicar no GitHub não hospeda o servidor. GitHub Pages não executa este backend Express. Use um ambiente que mantenha um processo Node.js e tenha acesso ao MongoDB.

1. Conecte o repositório à hospedagem escolhida.
2. Instale com `npm ci --omit=dev`; não há build obrigatório.
3. Configure `MONGODB_URI`, `WHATSAPP_NUMBER`, as três variáveis administrativas e a porta requerida pelo ambiente. Provisione a conta na base de produção pelo comando administrativo.
4. Use `npm start` como comando de execução.
5. Disponibilize HTTPS no serviço ou proxy e verifique página, recursos estáticos e APIs.
6. Use base de produção separada e acesso restrito. Não execute seed nela.

Não há configuração específica de hospedagem incluída. `trust proxy` não está configurado: atrás de proxy, revise IP e rate limit de acordo com a topologia. O rate limit usa memória local; instâncias diferentes não compartilham contadores. O projeto não tem health check dedicado.

## Manutenção

Faça backups antes de operações relevantes. Atualize dependências em branch, revise o lockfile e repita a validação. Confira logs para falhas de conexão e exceções, protegendo conteúdo sensível. Não há migrações automatizadas; ao reverter código, verifique compatibilidade com o banco.

## Solução de problemas

| Sintoma | Correção |
| --- | --- |
| `Defina MONGODB_URI no arquivo .env` | Confira nome do arquivo, variável e diretório de execução |
| Falha no MongoDB | Confira serviço local, URI, credenciais, DNS e acesso de rede do Atlas |
| `EADDRINUSE` | Encerre a instância anterior ou mude `PORT` |
| Catálogo vazio | Confira `animals` e status exato `Disponível` |
| Depoimentos ausentes | Confira `autorizado: true`; falha da API também oculta a seção |
| WhatsApp não abre conversa | Configure o número e reinicie; sem número os links ficam em `#contato` |
| Fotos ausentes | Confira arquivo/URL; imagens HTTP remotas podem ser bloqueadas pela CSP |
| Fonte diferente | Verifique Google Fonts; CSS tem fontes locais alternativas |
| HTTP 429 | Aguarde a janela de limite de requisições |

Se o navegador tentar buscar recursos locais por HTTPS, investigue os cabeçalhos do Helmet e configurações do navegador antes de mudar políticas de produção.
