# Movimento no Cine

Implementação de 27/10/2026, versão 1.1.0. As referências abaixo foram pesquisadas; os componentes do Cine foram escritos para a estrutura existente, com Motion para React e animações CSS. Não foram copiados pacotes de componentes inteiros ou instalados templates.

| Referência | Aplicação no Cine |
| --- | --- |
| [React Bits — Animated Content](https://reactbits.dev/animations/animated-content) e [Fade Content](https://reactbits.dev/animations/fade-content) | Conteúdo aparece com deslocamento curto e opacidade ao entrar na tela; pequenos atrasos entre cards. |
| [React Bits — Blur Text](https://reactbits.dev/text-animations/blur-text) | Saudação inicial por palavras, com desfoque leve que se resolve; títulos entram suavemente. |
| [Magic UI — Blur Fade](https://magicui.design/docs/components/blur-fade) e [Number Ticker](https://magicui.design/docs/components/number-ticker) | Revelação de seções e atualização dos números do perfil. |
| [Animata — Fluid Tabs](https://www.animata.design/docs/tabs/fluid-tabs) e [Icon Ripple](https://www.animata.design/docs/icon/icon-ripple) | Indicadores deslizantes e resposta visual dos ícones ao toque. |
| [Aceternity — Tabs](https://ui.aceternity.com/components/tabs) | Continuidade do indicador ao alternar categorias. |
| [Motion — useReducedMotion](https://motion.dev/docs/react-use-reduced-motion) | Preferência do sistema combinada com “Reduzir movimento” do Cine. |

## Cobertura

- Apresentação: pôsteres em sequência, entrada dos textos e troca de etapas.
- Início: texto com foco gradual, imagem cinematográfica com aproximação suave, entrada da descrição e ações; legenda do carrossel acompanha a troca.
- Navegação: transição de opacidade entre telas, seleção compartilhada na barra inferior e nas abas.
- Explorar e listas: pôsteres, seções e linhas revelados durante a rolagem; zoom leve em pôsteres com mouse.
- Detalhes: imagem, título, elenco, sinopse e seções.
- Comunidade e conversas: feed, mensagens e comentários; curtir/salvar respondem ao toque.
- Sessões e reservas: cinemas, mapa, seleções de assentos, resumo, confirmação e ingresso.
- Perfil, notificações e ajustes: entrada de conteúdo, contadores, campos e opções.
- Painéis: entrada e saída, fundo escurecido, fechamento por botão/Escape/Voltar mantendo foco e rolagem.

Entradas de 320–650 ms, respostas de 160–320 ms, aproximação da imagem principal em 3,6 s. Os conteúdos não ficam escondidos aguardando observação. Efeitos usam principalmente transformação e opacidade; desfoque limitado aos títulos. Rolagem e carrossel continuam nativos. Observadores e efeitos são liberados no fechamento ou na troca de preferências.

“Reduzir movimento”, tanto no sistema quanto nas configurações do app, desativa os efeitos. Textos e contadores possuem equivalentes estáveis para leitores de tela.

## Correção Android

O tema base deixou de herdar `DarkActionBar`. Temas base e de abertura desabilitam título e ActionBar; `MainActivity` instala o SplashScreen antes de criar a interface, solicita janela sem título e oculta qualquer ActionBar residual. As barras de horário e gestos do Android são preservadas. A versão 1.1.0 usa código 2 e a mesma chave do APK anterior, permitindo atualização sem desinstalação.
