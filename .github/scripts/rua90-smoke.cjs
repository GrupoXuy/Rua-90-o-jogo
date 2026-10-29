const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  const trackErrors = page => page.on("pageerror", error => pageErrors.push(error.message));
  const waitForGame = async page => {
    const response = await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || !response.ok()) throw new Error("O jogo não respondeu com HTTP 200.");
    await page.waitForSelector("#root", { state: "attached", timeout: 10000 });
    await page.waitForFunction(() => {
      const root = document.querySelector("#root");
      return !!root && root.children.length > 0 && root.innerText.trim().length > 0;
    }, { timeout: 15000 });
  };
  const openModes = async page => {
    await waitForGame(page);
    await page.getByRole("button", { name: /ESCOLHER MODO/i }).click();
    await page.getByText("COMO VOCÊ QUER CORRER HOJE?", { exact: true }).waitFor({ timeout: 5000 });
  };
  const chooseMode = async (page, modeName) => {
    await page.locator(".mode-card").filter({ hasText: modeName }).click();
  };

  try {
    const page = await context.newPage();
    trackErrors(page);
    await waitForGame(page);
    const title = await page.title();
    if (!/Rua\s*90/i.test(title)) throw new Error("Título inesperado: " + title);
    const buttons = await page.locator("button").count();
    if (buttons < 1) throw new Error("Nenhum botão interativo foi renderizado.");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobile = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyHeight: document.body.scrollHeight,
    }));
    if (mobile.scrollWidth > mobile.width + 2) throw new Error("Layout móvel com rolagem horizontal: " + JSON.stringify(mobile));

    // Contra o Relógio: selecionar o modo, iniciar e confirmar que um portão
    // é efetivamente cruzado e que o bônus de tempo é anunciado.
    await page.setViewportSize({ width: 1440, height: 900 });
    await openModes(page);
    await chooseMode(page, "CONTRA O RELÓGIO");
    await page.getByRole("button", { name: /CORRER CONTRA O RELÓGIO/i }).click();
    await page.getByText(/RELÓGIO/i).first().waitFor({ timeout: 5000 });
    await page.getByText(/PORTÃO \+7 SEGUNDOS/i).waitFor({ timeout: 10000 });
    if (await page.getByText(/TEMPO ESGOTADO/i).count()) throw new Error("O modo Contra o Relógio terminou antes do bônus do portão.");

    // Duelo: duas páginas no mesmo contexto simulam duas janelas do navegador,
    // compartilhando BroadcastChannel, e validam convite, conexão e largada.
    const host = await context.newPage();
    const guest = await context.newPage();
    trackErrors(host);
    trackErrors(guest);
    await openModes(host);
    await chooseMode(host, "DUELO");
    await host.getByRole("button", { name: /ABRIR SALA DE DUELO/i }).click();
    const roomCode = (await host.locator(".room-code").innerText()).trim();
    if (!/^[A-Z]{5}$/.test(roomCode)) throw new Error("Código de convite inválido: " + roomCode);

    await openModes(guest);
    await chooseMode(guest, "DUELO");
    await guest.getByRole("button", { name: /ABRIR SALA DE DUELO/i }).click();
    await guest.locator(".code-input").fill(roomCode);
    await guest.getByRole("button", { name: /ENTRAR NA SALA/i }).click();
    await host.locator(".peer-status.on").waitFor({ timeout: 8000 });
    await guest.locator(".peer-status.on").waitFor({ timeout: 8000 });
    await host.getByRole("button", { name: /COMEÇAR O DUELO/i }).click();
    await host.locator(".hud-top").waitFor({ timeout: 10000 });
    await guest.locator(".hud-top").waitFor({ timeout: 10000 });

    fs.mkdirSync(path.join(process.cwd(), "artifacts"), { recursive: true });
    await page.screenshot({ path: path.join(process.cwd(), "artifacts", "rua90-clock.png"), fullPage: true });
    if (pageErrors.length) throw new Error("Erros JavaScript no navegador:\n" + pageErrors.join("\n"));

    console.log(JSON.stringify({
      status: "PASS",
      title,
      buttons,
      mobile,
      timeTrial: "portão detectado e bônus +7 segundos exibido",
      duel: "convite aceito, ambos conectados e largada iniciada",
      screenshot: "artifacts/rua90-clock.png",
    }, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
