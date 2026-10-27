import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test.use({
  viewport: { width: 1280, height: 1000 },
  isMobile: false,
  hasTouch: false,
});

test("iPhone no computador mantém navegação, painéis, dados e escala dentro do aparelho", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const phone = page.frameLocator("iframe.phone-app");
  await expect(page.locator(".iphone")).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(1);
  await phone
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  await expect(
    phone.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  await expect(
    phone.locator('.bottom-nav [data-iconsax="home-2"]'),
  ).toBeVisible();
  await phone
    .getByRole("navigation")
    .getByRole("link", { name: "Explorar" })
    .click();
  await phone
    .getByRole("textbox", { name: "Busque um filme, pessoa ou lista" })
    .fill("Duna");
  await phone
    .getByRole("link", { name: "Duna: Parte Dois", exact: true })
    .first()
    .click();
  await phone.getByRole("button", { name: "Favoritar", exact: true }).click();
  await phone.getByRole("button", { name: "Avaliar", exact: true }).click();
  await expect(phone.getByRole("slider", { name: "Sua nota" })).toBeVisible();
  const frame = page.frames().find((f) => f !== page.mainFrame())!;
  const size = await frame.evaluate(() => ({
    width: innerWidth,
    height: innerHeight,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  expect(size).toEqual({ width: 390, height: 766, overflow: false });
  const screen = await page.locator(".iphone-screen").boundingBox();
  const panel = await phone.locator("dialog").boundingBox();
  expect(panel!.x).toBeGreaterThanOrEqual(screen!.x - 1);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(
    screen!.x + screen!.width + 1,
  );
  await phone.getByRole("button", { name: "Fechar painel" }).click();
  await page.reload();
  await expect(
    phone.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  const persisted = await page.evaluate(
    () => JSON.parse(localStorage.getItem("cine-local-v1")!).state,
  );
  expect(persisted.favorites).toContain("dune");
  await mkdir("test-results/visual", { recursive: true });
  await page.screenshot({ path: "test-results/visual/iphone-desktop.png" });
  await page.setViewportSize({ width: 480, height: 720 });
  await expect
    .poll(async () => {
      const bounds = await page.locator(".iphone").boundingBox();
      return (
        !!bounds &&
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= 480 &&
        bounds.y + bounds.height <= 720
      );
    })
    .toBe(true);
  await page.screenshot({ path: "test-results/visual/iphone-compact.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
