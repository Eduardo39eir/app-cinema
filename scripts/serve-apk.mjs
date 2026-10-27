import http from "node:http";
import { createReadStream } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import QRCode from "qrcode";

const root = fileURLToPath(new URL("../downloads/", import.meta.url));
const port = 8787;
const host = process.argv[2];
if (!host || !/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
  throw Error("Informe o IP local do computador.");
const { version } = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const filename = `Cine-${version}.apk`;
const apkPath = resolve(root, filename);
const info = await stat(apkPath);
const url = `http://${host}:${port}/${filename}`;
const qr = await QRCode.toBuffer(url, {
  width: 320,
  margin: 4,
  errorCorrectionLevel: "M",
});
const size = (info.size / 1024 / 1024).toFixed(1).replace(".", ",");
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baixar Cine para Android</title><style>
*{box-sizing:border-box}body{margin:0;background:#08090b;color:#f5f3f1;font-family:system-ui,sans-serif;min-height:100dvh;display:grid;place-items:center;padding:28px}main{max-width:460px;width:100%;text-align:center}.brand{font-size:40px;font-weight:800;letter-spacing:-3px}.brand span{color:#ff4d52}h1{font-size:28px;letter-spacing:-.8px;margin:24px 0 10px}p{font-size:15px;line-height:1.6;color:#afb1bb}.qr{width:min(264px,100%);border-radius:22px;margin:16px auto;display:block}a.button{display:block;background:#cf303c;border-radius:16px;color:white;padding:17px;text-decoration:none;font-weight:700;margin:20px 0 12px}.meta{font-size:12px;color:#afb1bb}ol{text-align:left;padding:20px 20px 20px 40px;background:#15171c;border:1px solid #ffffff0d;border-radius:20px;font-size:14px;line-height:1.7}li+li{margin-top:10px}.address{font-size:12px;overflow-wrap:anywhere;color:#ff8286}.note{font-size:12px;margin-top:24px}
</style><main><div class="brand">cine<span>•</span></div><h1>O Cine vai com você.</h1><p>Instale o aplicativo no seu Android.<br>Leia o QR com a câmera do celular.</p><img class="qr" src="/qr.png" alt="QR para baixar o APK do Cine"><a class="button" href="/${filename}" download>Baixar Cine para Android</a><div class="meta">Versão ${version} · ${size} MB · Android 7 ou superior</div><ol><li>Conecte o celular à mesma rede do computador e mantenha esta página disponível no PC.</li><li>Baixe o arquivo e toque em <strong>Abrir</strong> e depois em <strong>Instalar</strong>.</li><li>Se o Android solicitar, permita a instalação por este navegador para instalar o APK.</li></ol><div class="address">${url}</div><p class="note">O app abre sem depender do PC após a instalação. Trailers e mapas precisam de internet. Reservas e interações continuam demonstrativas.</p><p class="note">Se a rede bloquear o download, transfira o APK do computador para o celular por cabo USB.</p></main></html>`;

http
  .createServer(async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405).end();
      return;
    }
    const path = new URL(req.url, "http://localhost").pathname;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (path === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(req.method === "HEAD" ? undefined : html);
    } else if (path === "/qr.png") {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": qr.length,
      });
      res.end(req.method === "HEAD" ? undefined : qr);
    } else if (path === `/${filename}`) {
      res.writeHead(200, {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": info.size,
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
      if (req.method === "HEAD") res.end();
      else
        createReadStream(apkPath)
          .on("error", () => res.destroy())
          .pipe(res);
    } else {
      res.writeHead(404).end("Arquivo não encontrado");
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`Cine APK: http://${host}:${port}`),
  );
