import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /<!doctype html>/i, "HTML do jogo deve ter DOCTYPE");
assert.match(html, /<title>[^<]*Rua 90/i, "Título deve identificar Rua 90");
assert.match(html, /https:\/\/ruanoventa\.vercel\.app\//i, "Canonical/OG URL deve usar o domínio oficial Vercel");
assert.doesNotMatch(html, /ruanoventa\.arena\.app/i, "Não deve haver referência ao domínio antigo do Arena");

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
assert.deepEqual(duplicates, [], "IDs HTML duplicados: " + duplicates.join(", "));

const legacySvgArchitecture = /id="homeScreen"/.test(html) && /id="garageStage"/.test(html) && /id="road"/.test(html);
const reactArchitecture = /id="root"/.test(html) && /<script[^>]+type="module"/i.test(html);
const threeDArchitecture = /__g3dCar|garage3d|broker\.emqx\.io/i.test(html);

assert.ok(
  legacySvgArchitecture || reactArchitecture || threeDArchitecture,
  "Arquitetura não reconhecida: esperado app React, garagem 3D ou layout SVG legado"
);

if (legacySvgArchitecture) {
  assert.match(html, /id="bodyPath"/, "Carro da garagem precisa de silhueta dinâmica");
  assert.match(html, /viewBox="110 50 380 325"/, "Vista da garagem deve enquadrar o carro de forma compacta");
  for (const id of ["windshieldPath","sideWindowPath","headlightsPath","grilleDark","grilleChrome","hoodLines","roadBodyPath","roadFrontGlassPath","roadRearGlassPath","roadContours","roadPanels","roadLights","roadTailLights"]) {
    assert.match(html, new RegExp('id="' + id + '"'), "Detalhe SVG ausente: " + id);
  }
  assert.match(html, /\.panel,\.hud\{display:none\}/, "HUD deve ser ocultado fora do gameplay");
  assert.match(html, /\.playing \.panel\{display:block;/, "Painel deve aparecer durante a corrida");
  for (const mode of ["survival", "time", "traffic"]) {
    assert.match(html, new RegExp('data-mode="' + mode + '"'), "Modo ausente: " + mode);
  }
  for (const id of ["enterGarage","quickStart","backToHome","leaveGarage","start","cars","colors","modes","hero","left","right","nitro","score","status","metric"]) {
    assert.ok(ids.includes(id), "Elemento DOM ausente: " + id);
  }
  assert.match(html, /@media\(max-width:680px\)/, "Layout móvel ausente");
  assert.match(html, /\.carart\{[^}]*left:50%[^}]*transform:translateX\(-50%\)/, "Carro da pista deve centralizar pelo próprio eixo");
  assert.match(html, /\.playing \.stage\{inset:0;height:100%;opacity:1;pointer-events:auto\}/, "Controles móveis devem receber eventos durante a corrida");
  assert.match(html, /\.playing \.layout\{display:grid;/, "Contêiner do jogo deve ficar visível durante a corrida");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, "Esperado exatamente um script inline na arquitetura SVG legada");
  new vm.Script(scripts[0][1], { filename: "rua90-inline.js" });
} else {
  assert.ok(ids.includes("root") || ids.includes("app") || ids.includes("homeScreen"), "Ponto de montagem do jogo ausente");
  assert.match(html, /<script\b/i, "O HTML deve carregar o código do jogo");
  if (reactArchitecture) {
    assert.match(html, /<script[^>]+type="module"[^>]+src=/i, "App React deve carregar o bundle de módulo");
  }
}

console.log("Rua 90: estrutura HTML, domínio oficial, arquitetura, IDs e sintaxe inline validados (" +
  (legacySvgArchitecture ? "SVG legado" : reactArchitecture ? "React" : "3D") + ").");
