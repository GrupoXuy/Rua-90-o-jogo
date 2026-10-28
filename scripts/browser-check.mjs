import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const installRoot = process.env.PLAYWRIGHT_ROOT;
if (!installRoot) throw new Error("PLAYWRIGHT_ROOT não foi definido pela CI.");
const require = createRequire(path.join(installRoot, "package.json"));
const { chromium } = require("playwright");
const html = fs.readFileSync("index.html", "utf8");
const outputDir = path.resolve("artifacts/browser-review");
fs.mkdirSync(outputDir, { recursive: true });

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname === "/" || pathname === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(html);
    return;
  }
  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const address = server.address();
const url = "http://127.0.0.1:" + address.port + "/";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const failures = [];
const report = [];
const legacyArchitecture = html.includes('id="homeScreen"') && html.includes('id="garageStage"');

try {
  if (!legacyArchitecture) {
    for (const viewport of [
      { name: "desktop-1440x900", width: 1440, height: 900 },
      { name: "tablet-768x1024", width: 768, height: 1024 },
      { name: "mobile-390x844", width: 390, height: 844 }
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1
      });
      page.on("pageerror", error => failures.push(viewport.name + " JS: " + error.message));
      page.on("console", message => {
        if (message.type() === "error" && !/Failed to load resource|net::ERR_/i.test(message.text())) {
          failures.push(viewport.name + " console: " + message.text());
        }
      });
      await page.goto(url, { waitUntil: "load" });
      await page.waitForTimeout(800);
      assert.match(await page.title(), /Rua 90/i, viewport.name + ": título incorreto");
      const mount = page.locator("#root, #app, #homeScreen").first();
      assert.equal(await mount.count(), 1, viewport.name + ": ponto de montagem do jogo ausente");
      assert.equal(await mount.isVisible(), true, viewport.name + ": ponto de montagem não está visível");
      const renderedText = (await page.locator("body").innerText()).trim();
      assert.ok(renderedText.length > 0, viewport.name + ": página sem conteúdo visível");
      const interactiveControls = await page.locator("button, a[href], input, canvas").count();
      assert.ok(interactiveControls > 0, viewport.name + ": nenhum controle ou canvas encontrado");
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth
      }));
      assert.ok(dimensions.document <= dimensions.viewport + 2,
        viewport.name + ": overflow horizontal (" + dimensions.document + " > " + dimensions.viewport + ")");
      await page.screenshot({ path: path.join(outputDir, viewport.name + "-smoke.png"), fullPage: true });
      report.push({
        viewport: viewport.name,
        result: "PASS",
        architecture: "generic smoke",
        controls: interactiveControls,
        horizontalOverflow: false
      });
      await page.close();
    }
  } else {
    for (const viewport of [
    { name: "desktop-1440x900", width: 1440, height: 900 },
    { name: "tablet-768x1024", width: 768, height: 1024 },
    { name: "mobile-390x844", width: 390, height: 844 }
  ]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    page.on("pageerror", error => failures.push(viewport.name + " JS: " + error.message));
    page.on("console", message => {
      if (message.type() === "error") failures.push(viewport.name + " console: " + message.text());
    });
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(100);
    assert.equal(await page.locator("#app").getAttribute("class"), "shell home", viewport.name + ": menu inicial deve abrir separado da garagem");
    const homeBox = await page.locator("#homeScreen").boundingBox();
    assert.ok(homeBox && homeBox.width >= viewport.width - 2, viewport.name + ": menu fora do enquadramento");
    await page.screenshot({ path: path.join(outputDir, viewport.name + "-home.png") });

    await page.getByRole("button", { name: /ENTRAR NA GARAGEM/i }).click();
    await page.waitForFunction(() => document.querySelector("#app")?.classList.contains("garage"));
    assert.equal(await page.locator("#garageStage").isVisible(), true, viewport.name + ": garagem não está visível");
    await page.locator('[data-color="2"]').click();
    assert.equal((await page.locator("#paintName").textContent()).trim(), "PINTURA · AZUL", viewport.name + ": pintura não atualizou");
    const stageBox = await page.locator("#garageStage").boundingBox();
    const carBox = await page.locator("#garageCar").boundingBox();
    assert.ok(stageBox && carBox, viewport.name + ": garagem ou carro sem geometria");
    assert.ok(carBox.width > 80 && carBox.height > 80, viewport.name + ": carro demasiado pequeno");
    assert.ok(carBox.x >= stageBox.x - 3 && carBox.x + carBox.width <= stageBox.x + stageBox.width + 3, viewport.name + ": carro cortado horizontalmente na garagem");
    const svgBox = await page.locator("#garageCar").boundingBox();
    const wheelStats = await page.locator("#garageCar .wheel").evaluateAll(nodes => nodes.map(n => {
      const r = n.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    }));
    assert.ok(svgBox, viewport.name + ": SVG da garagem sem bounding box");
    assert.equal(wheelStats.length, 2, viewport.name + ": duas rodas laterais da garagem devem estar visíveis");
    for (const wheel of wheelStats) {
      assert.ok(wheel.x >= svgBox.x - 1 && wheel.x + wheel.width <= svgBox.x + svgBox.width + 1, viewport.name + ": roda fora da área visível do carro");
      assert.ok(wheel.y >= svgBox.y - 1 && wheel.y + wheel.height <= svgBox.y + svgBox.height + 1, viewport.name + ": roda cortada na área visível do carro");
    }
    const modelDetails = [];
    const raceSilhouettes = [];
    for (const index of [0, 1, 2, 3, 4]) {
      await page.locator('[data-car="' + index + '"]').click();
      modelDetails.push(await page.locator("#headlightsPath").getAttribute("d"));
      raceSilhouettes.push(await page.locator("#roadBodyPath").getAttribute("d"));
    }
    assert.equal(new Set(modelDetails).size, 5, viewport.name + ": modelos devem ter desenho de faróis próprio");
    assert.equal(new Set(raceSilhouettes).size, 5, viewport.name + ": modelos devem ter silhuetas próprias durante a corrida");
    await page.locator('[data-car="1"]').click();
    assert.equal((await page.locator("#selectedName").textContent()).trim(), "OPALA", viewport.name + ": seleção do carro não atualizou o modelo");
    assert.equal(await page.locator("#racePanel").isVisible(), false, viewport.name + ": HUD de corrida não deve aparecer na garagem");
    assert.equal(await page.locator("#hud").isVisible(), false, viewport.name + ": texto de gameplay não deve aparecer na garagem");
    await page.screenshot({ path: path.join(outputDir, viewport.name + "-garage.png") });

    await page.locator("#start").click();
    await page.waitForFunction(() => document.querySelector("#app")?.classList.contains("playing"));
    assert.equal(await page.locator("#racePanel").isVisible(), true, viewport.name + ": painel de corrida deve aparecer no gameplay");
    assert.equal(await page.locator("#hud").isVisible(), true, viewport.name + ": HUD deve aparecer no gameplay");
    await page.waitForTimeout(100);
    const road = await page.locator("#road").boundingBox();
    const carBefore = await page.locator("#hero").boundingBox();
    assert.ok(road && carBefore && road.width > 120 && road.height > 220, viewport.name + ": pista de corrida sem dimensões úteis");
    if (viewport.width <= 680) {
      const right = await page.locator("#right").boundingBox();
      assert.ok(right && right.width > 30 && right.height > 30, "mobile: controle direito não está visível");
      await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(250);
      await page.mouse.up();
    } else {
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(350);
      await page.keyboard.up("ArrowRight");
    }
    await page.waitForTimeout(80);
    assert.equal(await page.locator("#app").evaluate(el => el.classList.contains("playing")), true, viewport.name + ": corrida encerrou inesperadamente durante o teste");
    const roadAfter = await page.locator("#road").boundingBox();
    const carAfter = await page.locator("#hero").boundingBox();
    assert.ok(roadAfter && carAfter, viewport.name + ": não foi possível medir carro/pista");
    assert.ok(carAfter.x > carBefore.x + 1, viewport.name + ": comando de direção não moveu o carro");
    assert.ok(carAfter.x >= roadAfter.x + 1, viewport.name + ": carro saiu pelo lado esquerdo da pista");
    assert.ok(carAfter.x + carAfter.width <= roadAfter.x + roadAfter.width - 1, viewport.name + ": carro saiu pelo lado direito da pista");
    const gameBody = await page.locator("#hero .body-paint").boundingBox();
    const gameWheels = await page.locator("#hero .tire").evaluateAll(nodes => nodes.map(n => {
      const r = n.getBoundingClientRect();
      return { x: r.left, width: r.width };
    }));
    assert.ok(gameBody && gameWheels.length === 4, viewport.name + ": rodas de gameplay ausentes");
    for (const wheel of gameWheels) {
      assert.ok(wheel.x >= gameBody.x + 1 && wheel.x + wheel.width <= gameBody.x + gameBody.width - 1, viewport.name + ": roda ultrapassa a silhueta da carroceria em gameplay");
    }
    await page.screenshot({ path: path.join(outputDir, viewport.name + "-race.png") });
    report.push({ viewport: viewport.name, result: "PASS", garage: "in-frame", gameplay: "car within road bounds", wheels: wheelStats.length });
    await page.close();
  }
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
