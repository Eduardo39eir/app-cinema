import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import AxeBuilder from "@axe-core/playwright";
const start = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
};
const read = async (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("cine-local-v1")!).state);

test("visita, busca, registro, perfil, reserva, QR, exportação e persistência", async ({
  page,
}) => {
  await mkdir("test-results/visual", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Explorar" })
    .click();
  await page
    .getByRole("textbox", { name: "Busque um filme, pessoa ou lista" })
    .fill("Duna");
  await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: "Duna: Parte Dois", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Quero assistir", exact: true })
    .click();
  await page.getByRole("button", { name: "Favoritar", exact: true }).click();
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await page.getByRole("slider", { name: "Sua nota" }).fill("4.5");
  await page
    .getByRole("textbox", { name: "O que ficou com você?" })
    .fill("A fotografia e o som fazem desta uma experiência inesquecível.");
  await page.getByLabel("Publicar na comunidade local").check();
  await page
    .getByRole("button", { name: "Salvar avaliação", exact: true })
    .click();
  await expect(page.getByText("Sua nota: 4,5")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Perfil" })
    .click();
  await expect(
    page.getByRole("link", { name: "1 filmes vistos" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "1 avaliações" })).toBeVisible();
  await page.reload();
  expect((await read(page)).reviews[0].rating).toBe(4.5);
  expect((await read(page)).favorites).toContain("dune");
  await page.goto("/movie/dune");
  await page.getByRole("link", { name: "Ver sessões", exact: true }).click();
  await page.locator(".date-rail button").nth(1).click();
  await page.locator(".session-time").first().click();
  await expect(
    page.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Assento A3 ocupado", exact: true }),
  ).toBeDisabled();
  for (const seat of ["A1", "A2", "A5", "A6", "A8", "B1"])
    await page
      .getByRole("button", { name: `Assento ${seat}`, exact: true })
      .click();
  await page.getByRole("button", { name: "Assento B2", exact: true }).click();
  await expect(
    page.getByText("Você pode reservar até 6 lugares."),
  ).toBeVisible();
  await expect(page.locator(".seat-row button.selected")).toHaveCount(6);
  await page.screenshot({
    path: "test-results/visual/booking-seats.png",
    fullPage: true,
  });
  for (const seat of ["A5", "A6", "A8", "B1"])
    await page
      .getByRole("button", { name: `Assento ${seat}`, exact: true })
      .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText("A1, A2", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "test-results/visual/booking-summary.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Confirmar reserva demonstrativa",
      exact: true,
    })
    .dblclick();
  await expect(
    page.getByRole("heading", { name: "Seu próximo encontro" }),
  ).toBeVisible();
  const qr = page.getByRole("img", { name: /QR demonstrativo do ingresso/ });
  await expect(qr).toBeVisible();
  expect(
    (await qr.getAttribute("src"))?.startsWith("data:image/png;base64,"),
  ).toBeTruthy();
  let state = await read(page);
  expect(state.tickets).toHaveLength(2);
  expect(new Set(state.tickets.map((t: any) => t.bookingId)).size).toBe(1);
  expect(new Set(state.tickets.map((t: any) => t.id)).size).toBe(2);
  const qrImage = PNG.sync.read(
    Buffer.from((await qr.getAttribute("src"))!.split(",")[1], "base64"),
  );
  const decoded = jsQR(
    new Uint8ClampedArray(qrImage.data),
    qrImage.width,
    qrImage.height,
  );
  expect(decoded?.data).toBe(`CINE:DEMONSTRACAO:${state.tickets[0].id}`);
  await expect(page.locator(".toast")).not.toHaveClass(/visible/);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const boxes = await page
      .locator(".ticket-details strong")
      .evaluateAll((nodes) =>
        nodes.map((n) => ({
          left: n.getBoundingClientRect().left,
          right: n.getBoundingClientRect().right,
        })),
      );
    for (let i = 0; i < boxes.length - 1; i++)
      expect(boxes[i].right).toBeLessThan(boxes[i + 1].left);
  }
  await page.screenshot({
    path: "test-results/visual/ticket.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ampliar QR", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar painel" }).click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Salvar ingresso", exact: true })
    .click();
  expect((await downloaded).suggestedFilename()).toMatch(/^CINE-.*\.png$/);
  await page.reload();
  state = await read(page);
  expect(state.tickets).toHaveLength(2);
  await expect(
    page.getByRole("img", { name: /QR demonstrativo do ingresso/ }),
  ).toBeVisible();
  await page.goto(`/booking/${state.tickets[0].sessionId}`);
  await expect(
    page.getByRole("button", { name: "Assento A1 ocupado", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("gesto horizontal, retorno à busca e suporte ao endereço de rede local", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(crypto, "randomUUID", {
      value: undefined,
      configurable: true,
    }),
  );
  await start(page);
  const track = page.locator(".carousel-track");
  await track.scrollIntoViewIfNeeded();
  const before = await track.boundingBox();
  expect(before).not.toBeNull();
  const cdp = await page.context().newCDPSession(page);
  const y = before!.y + before!.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 300, y }],
  });
  for (const x of [270, 230, 180, 130, 80]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y }],
    });
    await page.waitForTimeout(25);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".carousel-caption h3")).not.toHaveText(
    "Interestelar",
  );
  expect((await track.boundingBox())!.height).toBe(before!.height);
  await expect
    .poll(() =>
      track.evaluate((el) =>
        Math.abs(
          el.scrollLeft / el.clientWidth -
            Math.round(el.scrollLeft / el.clientWidth),
        ),
      ),
    )
    .toBeLessThan(0.01);
  const selectedTitle = await page.locator(".carousel-caption h3").innerText();
  await page.locator('.carousel-track a[tabindex="0"]').click();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator(".carousel-caption h3")).toHaveText(selectedTitle);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Explorar" })
    .click();
  await page
    .getByRole("textbox", { name: "Busque um filme, pessoa ou lista" })
    .fill("chegada");
  await page.getByRole("link", { name: "A Chegada", exact: true }).click();
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Busque um filme, pessoa ou lista" }),
  ).toHaveValue("chegada");
  expect((await read(page)).reviews).toHaveLength(1);
  await page
    .getByRole("textbox", { name: "Busque um filme, pessoa ou lista" })
    .fill("Filme que ainda não existe");
  await expect(
    page.getByRole("heading", { name: "Ainda não encontramos essa história" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca e filtros" }).click();
  await expect(page.locator(".poster-card")).toHaveCount(18);
});

test("acessibilidade das telas e painel, texto longo, notificações e preferência visual", async ({
  page,
}) => {
  await start(page);
  for (const path of [
    "/",
    "/explore",
    "/movie/dune",
    "/community",
    "/profile",
    "/settings",
  ]) {
    await page.goto(path);
    // Audit the readable resting state, after finite entrance effects settle.
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await Promise.allSettled(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished),
      );
    });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
  await page.goto("/profile");
  await page.getByRole("button", { name: "Editar perfil" }).click();
  await page
    .getByRole("textbox", { name: "Seu nome", exact: true })
    .fill("Maria Eduarda Albuquerque de Vasconcelos e Silva");
  await page
    .getByRole("textbox", { name: "Sobre você" })
    .fill(
      "Colecionando histórias extraordinárias e experiências cinematográficas inesquecíveis com pessoas queridas.",
    );
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Marcar como lidas" }).click();
  await page.getByRole("button", { name: "Todas as novidades" }).click();
  await expect(
    page.getByRole("heading", { name: "Tudo em dia por aqui" }),
  ).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("switch", { name: /Reduzir movimento/ }).check();
  await page.getByRole("button", { name: "Alto contraste" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "contrast");
  await page.goto("/movie/dune");
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});

test("comunidade, spoilers, comentário, mensagem e edição persistente de perfil", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Comunidade" })
    .click();
  await page
    .getByRole("button", { name: "Curtir publicação de Ana Martins" })
    .first()
    .click();
  expect((await read(page)).posts[0].likes).toBe(25);
  await page
    .getByRole("button", { name: "Salvar publicação", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Comentar publicação de Ana Martins" })
    .first()
    .click();
  await page
    .getByRole("textbox", { name: "Seu comentário" })
    .fill("Quero rever este filme no fim de semana.");
  await page
    .getByRole("button", { name: "Publicar comentário", exact: true })
    .click();
  await expect(
    page.getByText("Quero rever este filme no fim de semana.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar painel" }).click();
  await page
    .getByRole("button", { name: /Essa conversa tem spoilers/ })
    .click();
  await expect(page.getByText(/A forma como Bella decide/)).toBeVisible();
  await page.getByRole("link", { name: "Conversas", exact: true }).click();
  await page.getByRole("link", { name: /Clube da última sessão/ }).click();
  await page
    .getByRole("textbox", { name: "Sua mensagem" })
    .fill("Vamos conversar sobre Duna?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page.getByText("Vamos conversar sobre Duna?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Compartilhar filme", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Interestelar 2014", exact: true })
    .click();
  await expect(page.locator(".message.mine")).toHaveCount(2);
  await page.goto("/profile");
  await page
    .getByRole("button", { name: "Editar perfil", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Seu nome", exact: true })
    .fill("Mariana Albuquerque");
  await page
    .getByRole("textbox", { name: "Sobre você", exact: true })
    .fill("Histórias que ficam depois dos créditos.");
  await page.getByRole("button", { name: "Usar avatar Bia Oliveira" }).click();
  await page
    .getByRole("button", { name: "Usar capa de Duna: Parte Dois" })
    .click();
  await page
    .getByRole("button", { name: "Salvar perfil", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mariana Albuquerque" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mariana Albuquerque" }),
  ).toBeVisible();
  const state = await read(page);
  expect(state.chats[0].messages.at(-1).movieId).toBe("interstellar");
  expect(state.profile.avatar).toBe("/assets/avatar3.jpg");
  expect(state.posts[0].saved).toBe(true);
});

test("listas, filtros, editar e remover nota, privacidade e reinício com confirmação", async ({
  page,
}) => {
  await start(page);
  await page.goto("/profile?tab=lists");
  await page.getByRole("button", { name: "Criar lista", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Nome da lista" })
    .fill("Noites de cinema");
  await page
    .getByRole("textbox", { name: "Uma breve descrição" })
    .fill("Ficção científica e boas conversas.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Criar lista", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar filmes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Interestelar 2014", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Duna: Parte Dois 2024", exact: true })
    .click();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(page.locator(".collection-movie")).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Ordenar filmes" })
    .selectOption("title");
  await page.getByRole("button", { name: "Mostrar em lista" }).click();
  await expect(page.locator(".movie-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Compartilhar lista" }).click();
  expect((await read(page)).posts[0].listId).toBe(
    (await read(page)).lists.at(-1).id,
  );
  await page.goto("/explore");
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Tipo de conteúdo", exact: true })
    .selectOption("Curta");
  await page.getByRole("button", { name: "Mostrar 1 filme" }).click();
  await expect(page.locator(".poster-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "O Avião de Papel" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page.locator(".poster-card")).toHaveCount(18);
  await page.goto("/movie/dune");
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await page.getByRole("slider", { name: "Sua nota" }).fill("0");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await expect(page.getByText("Sua nota: 0,0")).toBeVisible();
  await page.getByRole("button", { name: "Editar nota" }).click();
  await page.getByRole("slider", { name: "Sua nota" }).fill("3.5");
  await page.getByRole("button", { name: "Salvar avaliação" }).click();
  await page.getByRole("button", { name: "Editar nota" }).click();
  await page.getByRole("button", { name: "Remover avaliação" }).click();
  await page.getByRole("button", { name: "Confirmar remoção" }).click();
  expect((await read(page)).reviews).toHaveLength(0);
  expect((await read(page)).watched).toContain("dune");
  await page.goto("/settings");
  await page.getByRole("switch", { name: /Perfil privado/ }).check();
  await page.goto("/community");
  await expect(
    page.locator(".post-author").filter({ hasText: "VOCÊ" }),
  ).toHaveCount(0);
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "Reiniciar dados de demonstração" })
    .click();
  await page.getByRole("button", { name: "Manter meus dados" }).click();
  expect((await read(page)).lists.length).toBe(3);
  await page
    .getByRole("button", { name: "Reiniciar dados de demonstração" })
    .click();
  await page
    .getByRole("button", { name: "Sim, reiniciar todos os dados" })
    .click();
  await expect(
    page.getByRole("button", { name: "Entrar como visitante" }),
  ).toBeVisible();
});

test("onboarding usa preferências para recomendar, busca por pessoa e listas", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Encontre sua próxima história" })
    .click();
  await page.getByRole("button", { name: "Romance", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Favoritar Vidas Passadas", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Entrar no Cine", exact: true })
    .click();
  expect((await read(page)).preferences.genres).toEqual(["Romance"]);
  await expect(
    page.locator(".poster-rail").first().locator(".poster-card").first(),
  ).toContainText("Vidas Passadas");
  await page.goto("/explore?tab=people&q=Christopher");
  await expect(
    page.getByText("Christopher Nolan", { exact: true }),
  ).toBeVisible();
  await page.goto("/explore?tab=lists&q=mundo");
  await expect(
    page.getByRole("heading", { name: "Além do nosso mundo" }),
  ).toBeVisible();
});

test("layouts de 320 a 430, imagens locais, telas e acessibilidade básica", async ({
  page,
}) => {
  await mkdir("test-results/visual", { recursive: true });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/visual/01-onboarding.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      "/",
      "/explore",
      "/movie/dune",
      "/community",
      "/tickets",
      "/profile",
      "/settings",
      "/sessions/dune",
      "/list/watchlist",
      "/notifications",
    ]) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1").first()).toBeVisible();
      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      expect(size.scroll, `${path} overflow at ${width}`).toBeLessThanOrEqual(
        size.viewport,
      );
      if (width === 390)
        await page.screenshot({
          path: `test-results/visual/${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`,
          fullPage: true,
        });
    }
  }
  await page.goto("/explore");
  await page.locator(".poster-card").last().scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {})),
    );
  });
  const broken = await page
    .locator("img")
    .evaluateAll((imgs) =>
      imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
    );
  expect(broken).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/movie/dune");
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
