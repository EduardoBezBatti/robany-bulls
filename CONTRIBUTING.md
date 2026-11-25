# Como contribuir

Siga o [README](README.md) e use uma base MongoDB exclusiva para desenvolvimento.

```bash
git switch -c minha-alteracao
npm ci
npm run dev
```

## Orientações

- Preserve a separação entre rotas, serviços, models e interface.
- Use português na interface e preserve os valores dos enums.
- Use `textContent` para apresentar textos do banco no navegador.
- Atualize documentação ao alterar variáveis, endpoints, campos ou regras.
- Inclua `package.json` e `package-lock.json` juntos quando mudar dependências.
- Não versione `.env`, dependências instaladas, logs, bancos, backups ou imagens sem autorização.

Execute os procedimentos relevantes de [validação](docs/REQUISITOS-E-VALIDACAO.md). Para interface, confira desktop, celular e teclado. Ainda não existe suíte automatizada.

```bash
git diff --check
git status
git add caminho/do/arquivo
git commit -m "Descreve a alteração"
git push -u origin minha-alteracao
```

Abra um pull request com problema, mudança e verificações realizadas. Confira o diff antes do envio. Se publicar credenciais acidentalmente, revogue e substitua os segredos; apagar o arquivo em um commit posterior não os invalida.
