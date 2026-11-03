# Versão web no GitHub Pages

A compilação para Pages usa o caminho `/app-cinema/` e rotas com `#`, permitindo abrir um filme por link e atualizar a página sem depender de redirecionamentos do servidor.

```sh
npm ci
npm run build:pages
npm run test:pages
```

O resultado fica em `dist-pages/`, separado de `dist/`, usado na compilação normal e no Android. O teste serve somente essa pasta, sem fallback de rotas, e confere imagens, navegação, atualização de página, painéis, reserva, QR, persistência e prévia de iPhone.

## Publicação

Publique o conteúdo de `dist-pages/` na raiz da branch `gh-pages` e selecione essa branch em **Settings → Pages → Deploy from a branch**, com a pasta `/ (root)`. Preserve o arquivo `.nojekyll` incluído na compilação.

O endereço previsto é `https://eduardo39eir.github.io/app-cinema/`. Exemplo de link interno: `https://eduardo39eir.github.io/app-cinema/#/movie/dune`.

O GitHub Pages precisa estar habilitado no repositório. A disponibilidade para repositórios privados depende do plano da conta; a preparação dos arquivos, por si só, não ativa a hospedagem.

O site usa dados locais ao navegador e não envia avaliações, reservas ou perfis para um servidor. Trailers e mapas acessam serviços externos.
