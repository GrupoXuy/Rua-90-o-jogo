import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /<!doctype html>/i, "HTML do jogo deve ter DOCTYPE");
assert.match(html, /id="homeScreen"/, "menu inicial separado deve existir");
assert.match(html, /id="garageStage"/, "garagem deve existir");
assert.match(html, /id="road"/, "pista deve existir");
assert.match(html, /id="bodyPath"/, "carro da garagem precisa de silhueta dinâmica");
for (const mode of ["survival", "time", "traffic"]) {
  assert.match(html, new RegExp('data-mode="' + mode + '"'), "Modo ausente: " + mode);
}
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, "Esperado exatamente um script inline");
new vm.Script(scripts[0][1], { filename: "rua90-inline.js" });
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
assert.deepEqual(duplicates, [], "IDs HTML duplicados: " + duplicates.join(", "));
for (const id of ["enterGarage","quickStart","backToHome","leaveGarage","start","cars","colors","modes","hero","left","right","nitro","score","status","metric"]) {
  assert.ok(ids.includes(id), "Elemento DOM ausente: " + id);
}
assert.match(html, /@media\(max-width:680px\)/, "Layout móvel ausente");
assert.match(html, /\.carart\{[^}]*left:50%[^}]*transform:translateX\(-50%\)/, "Carro da pista deve centralizar pelo próprio eixo");
assert.match(html, /\.playing \.stage\{inset:0;height:100%;opacity:1;pointer-events:auto\}/, "Controles móveis devem receber eventos durante a corrida");
console.log("Rua 90: estrutura HTML, IDs, responsividade e sintaxe JavaScript validados.");
