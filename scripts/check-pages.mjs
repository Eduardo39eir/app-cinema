import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { chromium, expect } from "@playwright/test";

// Serve only the built Pages directory, with real 404s and no SPA fallback.
const root = resolve("dist-pages");
const prefix = "/app-cinema/";
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (!pathname.startsWith(prefix)) throw Error("Outside Pages path");
    const file = resolve(root, pathname.slice(prefix.length) || "index.html");
    if (!file.startsWith(root + "/") && !file.startsWith(root + "\\"))
      throw Error("Outside build");
    if (!(await stat(file)).isFile()) throw Error("Not a file");
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = origin + prefix;
let browser;
try {
  browser = await chromium.launch({ channel: "msedge" });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().startsWith(origin) && r.status() >= 400)
      errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Explorar" })
    .click();
  await expect(page).toHaveURL(/\/app-cinema\/#\/explore$/);
  await page
    .getByRole("textbox", { name: "Busque um filme, pessoa ou lista" })
    .fill("Duna");
  await page
    .getByRole("link", { name: "Duna: Parte Dois", exact: true })
    .first()
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Duna: Parte Dois", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".detail-poster")).toHaveAttribute(
    "src",
    "/app-cinema/assets/dune.jpg",
  );
  const detailUrl = page.url();
  await page.locator(".skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(detailUrl);
  await expect(page.locator("#main-content")).toBeFocused();
  await page.getByRole("button", { name: "Avaliar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Ver sessões", exact: true }).click();
  await page.locator(".date-rail button").nth(1).click();
  await page.locator(".session-time").first().click();
  await page.getByRole("button", { name: "Assento A1", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Confirmar reserva demonstrativa",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("img", { name: /QR demonstrativo do ingresso/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("img", { name: /QR demonstrativo do ingresso/ }),
  ).toBeVisible();
  const manifest = await (await fetch(url + "manifest.webmanifest")).json();
  expect(new URL(manifest.start_url, url).pathname).toBe(prefix);
  expect(new URL(manifest.icons[0].src, url).pathname).toBe(
    prefix + "icon.svg",
  );
  await expect(page.locator(".image-fallback")).toHaveCount(0);
  expect(errors).toEqual([]);
  const desktop = await browser.newPage({
    viewport: { width: 1280, height: 1000 },
  });
  await desktop.goto(url + "?preview=iphone");
  const phone = desktop.frameLocator("iframe.phone-app");
  await expect(desktop.locator(".iphone")).toBeVisible();
  await phone
    .getByRole("button", { name: "Entrar como visitante", exact: true })
    .click();
  await expect(
    phone.getByRole("heading", { name: "O que vamos ver hoje?" }),
  ).toBeVisible();
  await desktop.goto(url + "?preview=iphone#/movie/dune");
  await expect(
    phone.getByRole("heading", { name: "Duna: Parte Dois", exact: true }),
  ).toBeVisible();
  await expect(phone.locator(".detail-poster")).toHaveAttribute(
    "src",
    "/app-cinema/assets/dune.jpg",
  );
  await desktop.reload();
  await expect(
    phone.getByRole("heading", { name: "Duna: Parte Dois", exact: true }),
  ).toBeVisible();
  console.log(
    "Pages OK: caminhos, imagens, links diretos, atualização, painel, reserva, QR, persistência e prévia de iPhone.",
  );
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
