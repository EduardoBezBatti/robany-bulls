# Robany Bulls Poms — Vitrine Virtual

Vitrine de filhotes desenvolvida como projeto de extensão da Univali, na disciplina de Programação Web. Apresenta os animais disponíveis, informações do negócio e depoimentos autorizados, com contato direto pelo WhatsApp.

O site não processa pagamentos nem oferece cadastro de visitantes. O conteúdo inicial é demonstrativo: preços, animais, história e depoimentos precisam ser revisados antes do uso comercial.

## Funcionalidades

- Catálogo com nome, raça, cor, sexo, idade, peso e preço dos filhotes disponíveis.
- Consulta individual de animais pela API.
- Apresentação do negócio e depoimentos autorizados.
- Contato por WhatsApp com mensagem específica por animal.
- Layout responsivo, menu mobile, placeholders e tratamento de catálogo vazio.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML5, CSS3 e JavaScript sem framework |
| Servidor | Node.js e Express 4 |
| Banco | MongoDB local ou Atlas, com Mongoose 8 |
| Configuração | dotenv |
| Proteções HTTP | Helmet e express-rate-limit |

As versões resolvidas estão em `package-lock.json`.

## Início rápido

Requisitos: Git, Node.js com npm e MongoDB acessível. O manifesto exige Node.js >= 18; use uma versão LTS ainda suportada. A instalação local inicial foi executada com Node.js 24.

```bash
git clone https://github.com/EduardoBezBatti/robany-bulls.git
cd robany-bulls
npm ci
```

Crie a configuração:

```powershell
# Windows / PowerShell
Copy-Item .env.example .env
```

```bash
# Linux / macOS
cp .env.example .env
```

Edite `.env` com conexão válida:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/robany-bulls
WHATSAPP_NUMBER=
```

O MongoDB deve estar ativo antes da aplicação. Para Atlas, substitua a URI pela conexão do seu cluster. Preencha o telefone com DDI, DDD e número, apenas dígitos.

```bash
npm start
```

Acesse [http://localhost:3000](http://localhost:3000). O servidor só abre a porta após conectar ao banco.

Para demonstração, execute `npm run seed` em uma base exclusiva de desenvolvimento. **Esse comando apaga todos os animais e depoimentos da base configurada antes de inserir os exemplos.**

## Comandos

| Comando | Uso |
| --- | --- |
| `npm ci` | Instala versões do lockfile |
| `npm install` | Instala dependências e pode atualizar o lockfile |
| `npm start` | Executa `node server.js` |
| `npm run dev` | Executa com reinício por mudanças, via `node --watch` |
| `npm run seed` | Substitui as duas coleções por dados demonstrativos |

Não há etapa de build, suíte automatizada ou linter configurados.

## Documentação completa

1. [Instalação e operação](docs/OPERACAO.md): configuração, execução, implantação, manutenção e problemas comuns.
2. [Arquitetura](docs/ARQUITETURA.md): estrutura, fluxos, interface e proteções.
3. [API HTTP](docs/API.md): endpoints, exemplos e erros.
4. [Dados e administração](docs/DADOS.md): schemas, regras e gestão pelo MongoDB.
5. [Requisitos e validação](docs/REQUISITOS-E-VALIDACAO.md): rastreabilidade, verificações e limitações.
6. [Contribuição](CONTRIBUTING.md): fluxo de desenvolvimento e revisão.

## Personalização

Edite `public/index.html` para textos e `public/css/style.css` para cores e layout. As cores principais ficam em `:root`. Fotos opcionais: `public/img/hero.jpg` e `public/img/sobre.jpg`; crie a pasta se necessário. Fotos dos animais vêm do campo `imagem` no banco. Use somente imagens autorizadas.

## Segurança e privacidade

Não publique `.env`, dependências instaladas ou arquivos de banco. O telefone é público via `/api/config`. Depoimentos são exibidos apenas com `autorizado: true`; mantenha autorização real fora da aplicação. O projeto não comprova, por si só, conformidade com a LGPD. Fontes externas, imagens remotas e WhatsApp envolvem terceiros.

## Licença

O manifesto declara MIT. Não foi fornecido arquivo de licença com identificação do titular; confirme os dados antes de acrescentar um texto de licença em nome de terceiros.
