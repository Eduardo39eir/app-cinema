# Cine

Aplicativo web de cinema em português, feito com React, TypeScript e Vite a partir de **Prompt_App_de_Filmes_Referencias.docx**. A interface prioriza celulares entre 320 e 430 px. No computador, aparece dentro de uma moldura interativa de iPhone, com tela de 390 × 844 e escala ajustada à janela. No celular, utiliza a tela diretamente.

A prévia também pode ser aberta em **http://localhost:5173/?preview=iphone**. Ela simula a apresentação do aparelho no navegador, com navegação, painéis e rolagem dentro da tela; não emula o sistema iOS. Os ícones da interface são da coleção gratuita [Iconsax](https://app.iconsax.io/), integrados localmente, com contorno e versões preenchidas para os estados selecionados. Fonte e licença em `ICONSAX-NOTICE.md`.

## Abrir

Com o servidor iniciado, acesse **http://localhost:5173**. Para iniciar novamente no Windows, abra **INICIAR.cmd** nesta pasta.

Para desenvolvimento, com Node.js 22.12 ou superior:

```sh
npm install
npm run dev
```

Em um celular na mesma rede, use o endereço `Network` mostrado pelo servidor. Não é necessário criar uma conta ou configurar uma chave de API.

## O que funciona

- Apresentação em três etapas, entrada como visitante, gêneros e favoritos que influenciam recomendações locais.
- Início cinematográfico, carrossel de pôsteres com rolagem por toque e navegação por botões.
- Catálogo com 18 filmes/curta, busca por título, pessoas e listas; filtros de gênero, ano, nota, tipo e sessões.
- Detalhes com sinopse, elenco, fotos locais quando disponíveis, galeria, trailer, avaliações e títulos relacionados.
- Quero assistir, assistidos, favoritos e notas de 0 a 5 em passos de 0,5; comentários, spoilers, data e edição/remoção de avaliação.
- Listas personalizadas com nome, descrição, capa, privacidade, inclusão/remoção de filmes, ordenação e visualização em grade ou lista.
- Seis perfis fictícios, feed, seguir, curtir, salvar, comentar, publicar avaliações e compartilhar listas.
- Conversas locais com envio de texto e cards de filmes. Não há presença online nem respostas simuladas.
- Edição de perfil com prévia, avatares e capas disponíveis ou upload local de imagem.
- Três cinemas, sete dias de sessões demonstrativas, calendário e seleção de até seis assentos; horários passados ficam indisponíveis.
- Resumo com preço unitário e total, confirmação sem pagamento, bloqueio de duplicação e ocupação persistente dos assentos.
- Um ingresso por assento, código compartilhado da reserva, QR válido com identificador de demonstração, ampliação, exportação PNG e alternativa TXT.
- Ingressos próximos/anteriores, notificações internas, privacidade, preferências, contraste, redução de movimento e reinício com confirmação.
- Dados persistidos em `localStorage`, imagens e fontes servidas pelo próprio projeto, tratamento de falha no armazenamento e estado de erro recuperável.
- Animações em todas as áreas: entradas durante a rolagem, títulos, abas deslizantes, transições, painéis, contadores e respostas ao toque. Respeitam “Reduzir movimento” do sistema e do app. Referências e detalhes em [MOTION.md](MOTION.md).

## Dados e integrações

Todas as reservas, avaliações, interações e mensagens são demonstrativas. Os valores e sessões não representam a programação comercial dos cinemas. Não há cobrança, ingresso válido para entrada, autenticação, sincronização entre aparelhos, streaming completo ou IA generativa.

O catálogo e as sessões estão em `src/data.ts`; os tipos em `src/types.ts`; as operações e persistência em `src/store.ts`. Futuras integrações de catálogo, conta, mensagens, reservas e IA devem substituir as fontes locais por serviços autenticados. Segredos e validação de reservas reais devem ficar no servidor.

Trailers abrem o player do YouTube com link alternativo; precisam de internet. Endereços usam links de mapas. A navegação e os demais fluxos não dependem desses serviços. Na versão web, o servidor local deve estar em execução; não foi implementado cache offline com service worker. O projeto Android incorpora o catálogo, imagens e fontes no próprio pacote e não depende do servidor do computador.

Imagens promocionais: TMDB e Wikimedia; retratos fictícios: Unsplash; fotos do elenco: Wikimedia. Fontes e URLs específicas estão em `public/assets/sources.json`. Tipografia Manrope, distribuída pelo Google Fonts. O produto não é endossado pelo TMDB. Os nomes e a identidade provisória podem ser alterados nos componentes e tokens de `src/styles.css`.

## Validação

Última execução em 27/10/2026: compilação de produção concluída e dez testes aprovados: sete dos fluxos mobile, dois das animações e um da prévia de iPhone. As verificações incluem animações efetivas, navegação fixa, revelação durante a rolagem, fechamento de painéis com restauração de foco e redução de movimento do sistema e do app. O teste da prévia verifica navegação, painéis contidos na tela, persistência, escala em janela compacta e transição para o layout mobile. Capturas finais revisadas visualmente.

```sh
npm run build
npm test
```

Os testes usam Playwright e o Microsoft Edge instalado. Em outro ambiente, instale um navegador compatível e ajuste `channel` em `playwright.config.ts`.

Os cenários cobrem descoberta, avaliações, listas, comunidade, conversas, perfil, reserva, idempotência, lugares ocupados, exportação, leitura efetiva do QR, persistência, estados vazios, filtros, privacidade, preferências, gesto horizontal e telas nas larguras 320, 360, 390 e 430 px. As capturas de revisão ficam em `test-results/visual/` após a suíte completa.

A revisão da interface acontece no navegador com emulação de toque. Teclado virtual, áreas seguras, botão Voltar e compartilhamento nativo ainda precisam de conferência em aparelho Android físico. Não foi realizada publicação em loja ou hospedagem externa, nem gerado IPA para iOS.

## Android

APK de release gerado e assinado em 27/10/2026: `downloads/Cine-1.1.0.apk` (7.592.161 bytes). Compilação Android e verificação de assinatura APK v2 concluídas, com o mesmo certificado da versão 1.0.0. O pacote contém 91 arquivos de catálogo, imagens e fontes, além do código web e nativo. Nenhum aparelho Android estava conectado para teste de instalação.

A versão 1.1.0 adiciona as animações e corrige o tema Android que permitia uma barra de título nativa com “Cine”. Temas e inicialização agora desabilitam a ActionBar. Instale sobre a versão anterior para preservar os dados locais; não é necessário desinstalar.

Abra `BAIXAR_NO_CELULAR.cmd` para iniciar a página de download e seu QR na rede local.

O projeto Android usa Capacitor 8, identificador `br.com.cine.app`, versão 1.1.0 (código 2), Android 7/API 24 ou superior e target API 36. A versão nativa não exibe a moldura de iPhone. O botão Voltar fecha painéis ou retorna à tela anterior; na tela inicial, minimiza o aplicativo. A exportação de ingressos abre o compartilhamento do Android, com arquivos PNG/TXT gerados no cache privado. Os dados locais do navegador e da instalação Android são independentes.

Para compilar novamente neste computador, execute `GERAR_APK.cmd`. O processo compila a versão web, sincroniza os arquivos, gera o APK de release, verifica sua assinatura e copia o resultado para `downloads/Cine-<versão>.apk`, acompanhado do SHA-256. O nome acompanha a versão do `package.json`.

As ferramentas de Android, o JDK 21 e os caches estão em `.android-tools/`, sem alterações permanentes no Java do sistema. A chave e as propriedades de assinatura ficam em `.android-signing/`, fora do controle de versão. Preserve essa pasta em backup privado: a mesma chave é necessária para atualizações sobre a instalação existente. Não a compartilhe com o APK.

Para oferecer o arquivo na rede local, use `node scripts/serve-apk.mjs IP_DO_COMPUTADOR`. A página na porta 8787 mostra instruções e um QR. Este servidor disponibiliza somente a página, o QR e o APK; não expõe arquivos do projeto. Celular e computador precisam estar na mesma rede, com conexão permitida entre eles. Alternativamente, transfira o APK por cabo USB.

Referências: [Capacitor Android](https://capacitorjs.com/docs/android), [System Bars](https://capacitorjs.com/docs/apis/system-bars), [App](https://capacitorjs.com/docs/apis/app), [Filesystem](https://capacitorjs.com/docs/apis/filesystem) e [Share](https://capacitorjs.com/docs/apis/share).

## Referências e guias consultados

As nove imagens incorporadas ao Word foram examinadas antes da implementação: atmosfera e perfil (01), organização do catálogo e avaliações (02), carrossel (03), apresentação e recomendações (04), ingresso (05), sessões e assentos (06), conversas (07), feed (08) e agenda (09).

- [Emil Kowalski — emil-design-eng](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md): hierarquia, feedback, componentes e transições.
- [apple-design](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md): continuidade, legibilidade e navegação.
- [mobile-native](https://github.com/emilkowalski/skills/blob/main/skills/mobile-native/SKILL.md): viewport dinâmico, áreas seguras, alvos de toque e rolagem nativa.
- [review-animations](https://github.com/emilkowalski/skills/blob/main/skills/review-animations/SKILL.md): transições de 120–240 ms, propriedades explícitas, redução de movimento e hover condicionado ao dispositivo.
- [break-ui](https://github.com/emilkowalski/skills/blob/main/skills/break-ui/SKILL.md): critérios para textos longos, campos vazios, contagens e largura mínima.
- [Expo — expo-overview](https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-overview/SKILL.md): consultado para avaliar a alternativa nativa. Esta entrega usa a alternativa web prevista no documento, sem módulos Expo.
- [Appllama — appllama-app-design-skill](https://github.com/Appllama/appllama-skills/blob/main/skills/appllama-app-design-skill/SKILL.md): decomposição das referências, identidade única e revisão visual dos fluxos. Nenhum serviço Appllama foi conectado.

As recomendações foram aplicadas conforme a plataforma web e as prioridades do documento. Documentação adicional: [Vite](https://vite.dev/guide/), [React Router](https://reactrouter.com/start/declarative/routing), [node-qrcode](https://github.com/soldair/node-qrcode).
