import { test, expect } from "@playwright/test";

test("animações reais, navegação fixa, painéis com saída e conteúdo acessível", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".hero-background")
      .evaluate((el) =>
        el.getAnimations().some((a) => a.playState === "running"),
      ),
  ).toBe(true);
  const nav = page.getByRole("navigation");
  const before = await nav.boundingBox();
  await nav.getByRole("link", { name: "Explorar" }).click();
  await expect(page.locator(".poster-card[data-cine-reveal]")).not.toHaveCount(
    0,
  );
  await expect(page.locator(".poster-card").first()).toHaveAttribute(
    "data-cine-reveal",
    "done",
  );
  const after = await nav.boundingBox();
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
  await page.locator(".poster-card").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".poster-card").last()).toHaveAttribute(
    "data-cine-reveal",
    "done",
  );
  await expect(page.locator(".poster-card").last()).toHaveCSS("opacity", "1");
  await page.goto("/movie/dune");
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Fechar painel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Avaliar", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
    "hidden",
  );
  expect(errors).toEqual([]);
});

test("redução de movimento do sistema e do app desliga animações sem ocultar conteúdo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".hero-background")
      .evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  expect(await page.locator('[data-cine-reveal="running"]').count()).toBe(0);
  await page.goto("/settings");
  await page.getByRole("switch", { name: /Reduzir movimento/ }).check();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/explore");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".poster-card").first()).toHaveCSS("opacity", "1");
  expect(await page.locator('[data-cine-reveal="running"]').count()).toBe(0);
  await page.goto("/movie/dune");
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.getByRole("dialog").evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
