/* Teste de PARIDADE: motor.js x planograma.py original.
   node test/paridade.js [nSinteticos] [semente]
   Monta os cenarios (dados reais de test/fixtures_*.json + sinteticos),
   roda o Python de referencia DUAS vezes (PYTHONHASHSEED diferentes - se
   o proprio Python discordar dele mesmo, o caso depende da ordem de um
   set() e e marcado como "indeterminado no original") e compara. */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const M = require("../docs/motor.js");

const PY = process.env.PY || "/home/claude/venv2/bin/python";
const N_SINT = parseInt(process.argv[2] || "400", 10);
let semente = parseInt(process.argv[3] || "12345", 10);
function rnd() { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; }
function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function esc(l) { return l[Math.floor(rnd() * l.length)]; }

/* ---------- gondolas ---------- */
const G = {
  "130x5": [{ largura: 130, alturas: [35, 35, 35, 35, 35] }],
  "130x4": [{ largura: 130, alturas: [35, 35, 35, 35] }],
  "100x4": [{ largura: 100, alturas: [35, 35, 35, 35] }],
  "130x6": [{ largura: 130, alturas: [30, 30, 30, 30, 30, 30] }],
  "3x130x5": [0, 1, 2].map(() => ({ largura: 130, alturas: [35, 35, 35, 35, 35] })),
  "2x130x5": [0, 1].map(() => ({ largura: 130, alturas: [35, 35, 35, 35, 35] })),
  "misto": [{ largura: 130, alturas: [35, 35, 35, 35, 35] }, { largura: 100, alturas: [44, 44, 44, 43] }, { largura: 66, alturas: [44, 44, 44, 43] }],
  "cerveja": [{ largura: 130, alturas: [35, 35, 35, 35, 35] }, { largura: 130, alturas: [8, 21, 70, 41] }, { largura: 130, alturas: [35, 35, 35, 35, 35] }],
  "sabao7": [{ largura: 130, alturas: [25, 25, 25, 25, 25, 25, 25] }, { largura: 130, alturas: [29, 29, 29, 29, 29, 30] }, { largura: 130, alturas: [29, 29, 29, 29, 29, 30] }],
  "60x5": [{ largura: 60, alturas: [35, 35, 35, 35, 35] }],
  "130x5alto": [{ largura: 130, alturas: [30, 35, 40, 45, 50] }],
};

/* ---------- cenarios reais ---------- */
const cen = [];
const fx = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures_loja001.json"), "utf8"));
const cols = fx._colunas;
const porCat = {};
Object.keys(fx).filter(k => k !== "_colunas").forEach(cat => {
  porCat[cat] = fx[cat].map(a => { const r = { categoria: cat }; cols.forEach((c, i) => r[c] = a[i]); return r; });
});
Object.keys(porCat).forEach(cat => {
  Object.keys(G).forEach(g => cen.push({ id: `real:${cat}:${g}`, rows: porCat[cat], mods: G[g], col_nivel: "categoria", ordem: null }));
});
const MULTI = [["Agua Sanitária", "Alvejante"], ["Creme De Leite", "Leite Condensado"],
  ["Sabão Em Pó", "Sabão Em Barra", "Sabão Em Pasta"], ["Achocolatados", "Leite Condensado", "Creme De Leite"]];
MULTI.forEach(cats => {
  const rows = [].concat(...cats.map(c => porCat[c]));
  const ordem = M.ordemPadraoRecorte(rows, "categoria", cats.slice().sort());
  ["130x5", "3x130x5", "sabao7", "misto", "130x6"].forEach(g =>
    cen.push({ id: `multi:${cats.join("+")}:${g}`, rows, mods: G[g], col_nivel: "categoria", ordem }));
});
/* por subcategoria */
[["Energéticos", ["Energético 473ml"]], ["Energéticos", ["Energético 250ml", "Energético 2L"]],
 ["Arroz", ["Arroz Branco 5Kg", "Arroz Branco 1Kg"]], ["Detergente", ["Detergente Líquido"]]].forEach(([cat, subs]) => {
  const rows = porCat[cat].filter(r => subs.indexOf(r.subcategoria) >= 0);
  const ordem = subs.length > 1 ? M.ordemPadraoRecorte(rows, "subcategoria", subs.slice().sort()) : null;
  ["130x5", "2x130x5", "100x4"].forEach(g =>
    cen.push({ id: `sub:${subs.join("+")}:${g}`, rows, mods: G[g], col_nivel: "subcategoria", ordem }));
});

/* ---------- cenarios sinteticos ---------- */
const MARCAS = ["Alfa", "Beta", "Gama", "Delta", "Omega", "Sol", "Lua", " ", null];
for (let n = 0; n < N_SINT; n++) {
  const nProd = ri(1, esc([6, 15, 40, 90]));
  const nSub = ri(1, 5), nCat = ri(1, 3);
  const portes = [[5, 13], [7, 16], [8, 27], [11, 31], [16, 36], [24, 35], [6, 22], [25, 9], [10, 41]];
  const rows = [];
  for (let p = 0; p < nProd; p++) {
    const pt = esc(portes);
    const semDim = rnd() < 0.06;
    const vari = () => Math.round((rnd() * 2 - 1) * 15) / 10;
    const qt = ri(1, 9000);
    const pr = Math.round((1 + rnd() * 40) * 100) / 100;
    rows.push({
      ean: "789" + String(1000000000 + n * 1000 + p), qtde: qt, venda: Math.round(qt * pr * 100) / 100,
      margem: Math.round(qt * pr * (rnd() * 0.5 - 0.05) * 100) / 100,
      descricao: "Prod " + p, marca: esc(MARCAS), categoria: "Cat" + ri(1, nCat), subcategoria: "Sub " + ri(1, nSub),
      largura_cm: semDim ? null : Math.max(0.5, Math.round((pt[0] + vari()) * 10) / 10),
      altura_cm: semDim ? null : Math.max(1, Math.round((pt[1] + vari() * 2) * 10) / 10),
      profundidade_cm: rnd() < 0.15 ? null : Math.round((2 + rnd() * 15) * 10) / 10,
    });
  }
  const nMod = esc([1, 1, 1, 2, 3]);
  const mods = [];
  for (let m = 0; m < nMod; m++) {
    const nr = ri(2, 7), larg = esc([130, 130, 100, 110, 66, 60]);
    const base = esc([25, 30, 35, 35, 40]);
    mods.push({ largura: larg, alturas: Array.from({ length: nr }, () => rnd() < 0.2 ? ri(12, 60) : base) });
  }
  let col = "categoria", ordem = null;
  const cats = [...new Set(rows.map(r => r.categoria))].sort();
  if (cats.length > 1 && rnd() < 0.7) ordem = M.ordemPadraoRecorte(rows, col, cats);
  else if (rnd() < 0.3) { col = "subcategoria"; const subs = [...new Set(rows.map(r => r.subcategoria))].sort(); if (subs.length > 1) ordem = M.ordemPadraoRecorte(rows, col, subs); }
  cen.push({ id: `sint:${n}`, rows, mods, col_nivel: col, ordem });
}

/* ---------- roda o Python (2 sementes de hash) ---------- */
function rodarPy(seed) {
  const saida = execFileSync(PY, [path.join(__dirname, "ref_runner.py")], {
    input: JSON.stringify(cen), maxBuffer: 1 << 30, env: Object.assign({}, process.env, { PYTHONHASHSEED: String(seed) }),
  });
  return JSON.parse(saida.toString());
}
const t0 = Date.now();
const pyA = rodarPy(0), pyB = rodarPy(7);
const tPy = Date.now() - t0;

/* ---------- roda o JS ---------- */
function rodarJs(c) {
  const out = { id: c.id };
  try {
    let mods = M.normalizar(c.mods);
    const r = M.alturasParaOsAltosBlocos(mods, c.rows, c.col_nivel, c.ordem);
    out.alturas = r[0]; out.txt_alt = r[1];
    if (r[0]) mods = mods.map((m, i) => ({ largura: m.largura, alturas: r[0][i] }));
    const slots = M.montarSlots(mods);
    const s = M.semearPlano(c.rows, slots, c.col_nivel, c.ordem);
    out.shelves = s[0]; out.fora = s[1]; out.slots = slots;
  } catch (err) { out.erro = String(err && err.stack || err); }
  return out;
}
const t1 = Date.now();
const js = cen.map(rodarJs);
const tJs = Date.now() - t1;

/* ---------- compara ---------- */
const canon = o => JSON.stringify(o === undefined ? null : o);
let ok = 0, indet = 0;
const falhas = [];
cen.forEach((c, i) => {
  const a = pyA[i], b = pyB[i], j = js[i];
  const campos = ["alturas", "txt_alt", "shelves", "fora", "slots"];
  const pyEstavel = campos.every(k => canon(a[k]) === canon(b[k])) && canon(a.erro) === canon(b.erro);
  const bate = campos.every(k => canon(a[k]) === canon(j[k])) && !!a.erro === !!j.erro;
  const bateB = campos.every(k => canon(b[k]) === canon(j[k])) && !!b.erro === !!j.erro;
  if (bate || bateB) ok++;
  else if (!pyEstavel) indet++;
  else falhas.push({ c, a, j, campo: campos.find(k => canon(a[k]) !== canon(j[k])) || "erro" });
});
console.log(`cenarios: ${cen.length} | iguais: ${ok} | indeterminados no proprio Python: ${indet} | DIFERENTES: ${falhas.length}`);
console.log(`tempo Python (x2): ${tPy} ms | tempo JS: ${tJs} ms`);
falhas.slice(0, 5).forEach(f => {
  console.log("\n--- " + f.c.id + " campo=" + f.campo);
  if (f.a.erro || f.j.erro) console.log("py erro:", f.a.erro, f.a.tb || "", "\njs erro:", f.j.erro);
  const A = canon(f.a[f.campo]), J = canon(f.j[f.campo]);
  let p = 0; while (p < A.length && A[p] === J[p]) p++;
  console.log("py:", A.slice(Math.max(0, p - 150), p + 200));
  console.log("js:", J.slice(Math.max(0, p - 150), p + 200));
});
if (process.env.SALVAR) fs.writeFileSync(path.join(__dirname, "falhas.json"), JSON.stringify(falhas.map(f => f.c)));
process.exit(falhas.length ? 1 : 0);
