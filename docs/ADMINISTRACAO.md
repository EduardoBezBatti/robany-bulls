# Área administrativa

## Acesso e recursos

Acesse `/admin/` ou o link Área administrativa no rodapé da vitrine. Entre com o e-mail configurado em `ADMIN_EMAIL` e sua senha. Não há cadastro público. O painel oferece:

- Resumo de filhotes cadastrados, disponíveis e depoimentos publicados.
- Cadastro, edição e exclusão de filhotes, inclusive foto por URL e disponibilidade.
- Cadastro, edição, autorização de publicação e exclusão de depoimentos.
- Alteração da própria senha e saída da conta.

Excluir exige confirmação no painel e remove o documento definitivamente. Para retirar um filhote da vitrine sem apagar o histórico, altere seu status para `Reservado` ou `Vendido`. Para ocultar um depoimento, desmarque sua autorização. A autorização técnica deve corresponder a uma autorização real obtida pelo responsável.

## Configurar o primeiro administrador

Requer Node.js >= 22, MongoDB acessível e `.env` com `MONGODB_URI` válido. Na raiz:

```bash
npm ci
npm run admin:create
```

O comando gera o segredo da aplicação e os valores locais ausentes no `.env`, pede uma senha sem exibir seus caracteres e cria a conta no banco. O e-mail padrão é `admin@robany.local`, que funciona como identificador local; não recebe e-mails. Para usar outro e-mail, configure `ADMIN_EMAIL` antes da criação. O comando recusa sobrescrever uma conta existente.

Para gerar uma senha aleatória em vez de digitá-la:

```bash
npm run admin:create -- --generate
```

Nesse caso, o acesso fica em `.admin-acesso.local.txt`, ignorado pelo Git. Guarde a senha em local apropriado e apague o arquivo. O comando não publica senha nem segredo no repositório.

Reinicie `npm start` após configurar as variáveis. Use exatamente a origem configurada em `BETTER_AUTH_URL`: cookies de `localhost` não são compartilhados automaticamente com `127.0.0.1`.

## Variáveis

| Variável | Uso |
| --- | --- |
| `ADMIN_EMAIL` | E-mail da conta autorizada a usar a API administrativa |
| `BETTER_AUTH_SECRET` | Segredo aleatório de pelo menos 32 caracteres para autenticação |
| `BETTER_AUTH_URL` | Origem da aplicação, como `http://localhost:3000`; HTTPS obrigatório em produção |

Configure as três juntas. Sem nenhuma, a vitrine funciona e as APIs administrativas respondem 503. Com configuração parcial ou inválida, o servidor recusa iniciar. O segredo de produção deve ser diferente do local. Configure as variáveis no ambiente da hospedagem, não em arquivo público.

## Senha e recuperação

No painel, abra Alterar minha senha, informe a atual e a nova, de 12 a 128 caracteres. As outras sessões são revogadas. O arquivo de acesso gerado na criação não é atualizado por essa alteração; depois de guardar a senha inicial, remova o arquivo.

Se perder a senha, o responsável com acesso ao servidor pode executar, na base e ambiente corretos:

```bash
npm run admin:create -- --reset
# ou, para gerar outra senha aleatória:
npm run admin:create -- --reset --generate
```

O comando redefine a senha da conta correspondente a `ADMIN_EMAIL` e revoga suas sessões. Não há recuperação por e-mail ou serviço SMTP configurado. Para trocar o e-mail autorizado, provisione a conta correspondente e atualize a variável; mudar apenas a variável não cria um usuário.

## Segurança e persistência

Better Auth gerencia hash de senha com scrypt, cookies HttpOnly, verificação de origem, sessão e logout. Não é armazenado token em localStorage. Cookies são Secure em HTTPS e SameSite=Lax. A sessão tem validade de oito horas, renovada conforme atividade após o intervalo configurado de uma hora. A autorização é conferida no servidor, consultando sessão no banco e comparando o e-mail com `ADMIN_EMAIL` em cada requisição. A página HTML é pública; dados e alterações exigem autenticação e autorização.

Há limite de cinco tentativas de login por minuto por IP, persistido no MongoDB, além do limite geral da API. Operações de escrita administrativas exigem `X-Admin-Request: 1` e rejeitam uma origem diferente da configurada. CORS não está habilitado. Validações restringem campos e tipos, rejeitam operadores MongoDB e limitam texto. Imagens aceitam HTTPS ou caminhos locais iniciados por uma única `/`; não há upload.

O handler sobrescreve `X-Robany-Client-IP` com `req.ip` antes de entregá-lo ao Better Auth, impedindo que o cliente escolha esse valor. Como `trust proxy` não está configurado, conexões atrás de proxy compartilham o IP desse proxy até que a topologia seja configurada de forma restrita.

O adaptador usa as coleções `user`, `account`, `session`, `verification` e `rateLimit` conforme necessário. Senhas com hash e tokens de sessão são dados privados; nunca os exponha por endpoints públicos. As coleções de catálogo continuam separadas. O seed não apaga contas nem sessões, mas ainda apaga todos os filhotes e depoimentos.

O adaptador cria índices automaticamente. Foi configurado sem transações para suportar MongoDB standalone; uma falha intermediária no provisionamento pode exigir inspeção das coleções antes de repetir o comando. Produção requer HTTPS e revisão da configuração de rede/proxy; não confie em cabeçalhos encaminhados de clientes arbitrários. Não foram implementados MFA, trilha de auditoria, upload de fotos ou múltiplos níveis de administrador.

## API protegida

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/api/admin/me` | Nome e e-mail do administrador autenticado |
| GET | `/api/admin/animais` | Todos os animais, inclusive reservados/vendidos |
| POST | `/api/admin/animais` | Cria animal; 201 |
| PATCH | `/api/admin/animais/:id` | Atualiza campos permitidos; 200 |
| DELETE | `/api/admin/animais/:id` | Exclui; 204 |
| GET | `/api/admin/depoimentos` | Todos os depoimentos |
| POST | `/api/admin/depoimentos` | Cria depoimento; 201 |
| PATCH | `/api/admin/depoimentos/:id` | Atualiza campos permitidos; 200 |
| DELETE | `/api/admin/depoimentos/:id` | Exclui; 204 |

Corpos JSON usam os campos descritos em [Dados](DADOS.md). Não envie `_id`, timestamps, `__v` ou campos adicionais. Erros: 400 para dados/ID inválidos, 401 sem sessão, 403 para usuário sem autorização ou origem inválida, 404 para registro inexistente, 413 para JSON acima de 32 KB e 503 para administração não configurada. Respostas administrativas usam `Cache-Control: no-store`.

Endpoints de autenticação usados pelo painel: `POST /api/auth/sign-in/email` (`email`, `password`), `GET /api/auth/get-session`, `POST /api/auth/sign-out` e `POST /api/auth/change-password` (`currentPassword`, `newPassword`, `revokeOtherSessions`). `GET /api/auth/ok` permite verificar o handler. As respostas de autenticação seguem o formato do Better Auth, que usa `message`/`code` nos erros; o cadastro público está desativado.

## Validação

```bash
npm test
```

A suíte exige MongoDB acessível e cria uma base temporária `robany_test_<identificador aleatório>`, encerrando o servidor auxiliar e removendo apenas essa base no final. Testa login incorreto/correto, cadastro bloqueado, permissão por e-mail, cookies, CSRF nas escritas, validação de dados, operações no catálogo e depoimentos, reflexo público, senha, revogação, logout e rate limit. Não executa seed na base da aplicação.

Referências: [integração Express](https://better-auth.com/docs/integrations/express), [adaptador MongoDB](https://better-auth.com/docs/adapters/mongo), [e-mail e senha](https://better-auth.com/docs/authentication/email-password).
