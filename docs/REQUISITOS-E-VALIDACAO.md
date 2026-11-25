# Requisitos e validação

## Rastreabilidade

Estes identificadores refletem os comentários do código e a documentação inicial, sem substituir um documento acadêmico formal de requisitos.

| ID | Necessidade | Implementação |
| --- | --- | --- |
| RF01 | Vitrine | `/api/animais` e cards em `public/js/app.js` |
| RF02 | Detalhes | Campos nos cards e `/api/animais/:id`; sem tela individual separada |
| RF03 | Apresentação do negócio | Seção `#sobre` |
| RF04 | Depoimentos | `/api/depoimentos` e seção correspondente |
| RF05 | WhatsApp | `/api/config`, `.js-whatsapp` e mensagem por animal |
| RN01 | Somente disponíveis | Filtro no serviço, na listagem e na consulta individual |
| RN02 | Contato direto, sem pagamentos/cadastro de visitantes | Links externos; sem checkout ou cadastro |
| RNF02 | Identidade visual | Variáveis, cores e layout em `public/css/style.css` |

## Procedimentos reproduzíveis

Não há comando `npm test`, suíte automatizada, linter ou CI configurados. Execute cenários que alteram dados em uma base exclusiva de desenvolvimento.

```bash
node --check server.js
node --check public/js/app.js
npm audit
```

Para validar também todo o backend no PowerShell:

```powershell
Get-ChildItem src -Recurse -Filter *.js | ForEach-Object {
  node --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Sintaxe inválida: $($_.FullName)" }
}
```

Com o servidor ativo:

```powershell
$base = 'http://localhost:3000'
Invoke-RestMethod "$base/api/config"
$animais = Invoke-RestMethod "$base/api/animais"
Invoke-RestMethod "$base/api/depoimentos"
if ($animais.Count -gt 0) {
  Invoke-RestMethod "$base/api/animais/$($animais[0]._id)"
}
```

Para conferir erros, use `curl` (ou `curl.exe` no Windows PowerShell):

```bash
curl -i http://localhost:3000/api/animais/id-invalido
curl -i http://localhost:3000/api/animais/000000000000000000000000
curl -i http://localhost:3000/api/rota-inexistente
```

## Matriz manual

| Cenário | Resultado esperado |
| --- | --- |
| Abrir `/` | HTTP 200; HTML, CSS e JS carregados |
| Configuração sem telefone | `whatsapp: null`; links mantêm `#contato` |
| Telefone configurado e servidor reiniciado | Links `wa.me` com mensagem codificada |
| Dados do seed em base exclusiva | Seis disponíveis; vendido oculto |
| Buscar ID disponível | HTTP 200 e mesmo identificador |
| Buscar ID inválido | HTTP 400 |
| Buscar ID válido inexistente | HTTP 404 |
| Reservar ou vender animal | Sai da listagem; consulta individual retorna 404 |
| Depoimento não autorizado | Não aparece na API |
| Sem disponíveis | Mensagem de catálogo vazio |
| Sem depoimentos autorizados | Seção ocultada |
| Foto quebrada no card | Ícone substitui imagem |
| API de animais falha | Mensagem de erro de carregamento |
| Rota inexistente em `/api` | HTTP 404 JSON |
| Exceder limite em ambiente isolado | HTTP 429 |
| Viewport estreito | Cards reorganizados e menu funcional |
| Navegação por teclado | Avaliar foco, ordem dos links e operação do menu |
| Iniciar sem URI | Erro e término antes de abrir porta |

Não execute teste de limite em serviço compartilhado. Os cenários visuais, de falha e acessibilidade exigem validação própria; não foram certificados por esta documentação.

## Registro da publicação inicial

A instalação inicial concluiu sem vulnerabilidades reportadas pelo npm naquele momento. MongoDB local conectou; seed inseriu sete animais e três depoimentos. A página e as três APIs de listagem/configuração responderam HTTP 200.

Na preparação para publicação também foram conferidos sintaxe dos arquivos JavaScript, recursos estáticos e respostas de sucesso e erro dos endpoints. O resultado de auditorias de dependências varia com o tempo. Não houve teste de hospedagem em produção, carga ou auditoria formal de segurança/acessibilidade.

## Limitações

- Sem login, painel, API de escrita, upload, busca ou paginação.
- Sem checkout, reservas online ou notificações implementadas.
- Sem migrações, backup integrado, health check dedicado ou monitoramento.
- Rate limit por processo; implantação com proxy requer revisão.
- Alterações diretas no banco não usam automaticamente validações Mongoose.
- Conteúdo demonstrativo e telefone devem ser revisados para operação real.
- O manifesto declara MIT, mas não há licença com titular identificado fornecida no projeto.
