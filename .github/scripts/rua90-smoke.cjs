const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") pageErrors.push("console: " + message.text());
  });

  try {
    const response = await page.goto("http://127.0.0.1:4173/", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!response || !response.ok()) {
      throw new Error("O jogo não respondeu com HTTP 200.");
    }

    await page.waitForSelector("#root", { state: "attached", timeout: 10000 });
    await page.waitForFunction(() => {
      const root = document.querySelector("#root");
      return !!root && root.children.length > 0 && root.innerText.trim().length > 0;
    }, { timeout: 15000 });

    const title = await page.title();
    if (!/Rua\s*90/i.test(title)) {
      throw new Error("Título inesperado: " + title);
    }

    const buttons = await page.locator("button").count();
    if (buttons < 1) {
      throw new Error("Nenhum botão interativo foi renderizado.");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobile = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyHeight: document.body.scrollHeight,
    }));
    if (mobile.scrollWidth > mobile.width + 2) {
      throw new Error("Layout móvel com rolagem horizontal: " + JSON.stringify(mobile));
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    fs.mkdirSync(path.join(process.cwd(), "artifacts"), { recursive: true });
    await page.screenshot({
      path: path.join(process.cwd(), "artifacts", "rua90-desktop.png"),
      fullPage: true,
    });

    if (pageErrors.length) {
      throw new Error("Erros no navegador:\n" + pageErrors.join("\n"));
    }

    console.log(JSON.stringify({
      status: "PASS",
      title,
      buttons,
      mobile,
      screenshot: "artifacts/rua90-desktop.png",
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
