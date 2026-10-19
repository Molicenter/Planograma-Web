// ============================================================
// Planograma · Molicenter — app web
// Mesma lógica do planograma.py (Streamlit v7.42); o motor está em
// motor.js e o canvas em gondola.js. Lê e grava nas MESMAS tabelas do
// Streamlit pelas funções plano_web_* do Supabase.
// ============================================================
const CFG = window.CONFIG;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const M = window.Motor;

// ---------- constantes (iguais ao planograma.py) ----------
const GONDOLA_PADRAO = "Módulo 1,30m x 5 prateleiras";
const LOJAS_ATIVAS = [1, 2, 3, 4, 5, 6, 7, 8];
const ESCALA = 5;
const MAX_LISTA_SEL = 80;
const PAPEIS = { "A4 retrato": ["A4 portrait", 733, 1062], "A3 retrato": ["A3 portrait", 1062, 1527] };
const NIVEIS = { Categoria: "categoria", SubCategoria: "subcategoria" };

// ---------- utilidades ----------
const semAcento = (t) => String(t ?? "").normalize("NFKD").replace(/\p{Mn}/gu, "").toLowerCase().split(/\s+/).filter(Boolean).join(" ");
const cmpTxt = (a, b) => (a < b ? -1 : a > b ? 1 : 0);   // mesma ordem do sorted() do Python
const fmtCm = (v) => M._num.fmtG(v);
const nomeLoja = (l) => `Loja ${l}`;
function toast(msg, tipo = "") {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast " + tipo; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), tipo === "erro" ? 7000 : 3800);
}
function carregando(sim) { $("#carregando").hidden = !sim; }
function lerLocal(k) { try { return localStorage.getItem(k); } catch { return null; } }
function gravarLocal(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }
function dataHora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}
const IC = {
  plano: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 9v6M15 15v6"/></svg>',
  base: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
  usuarios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
  salvar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  desfazer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
  resetar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 2.6-6.4M3 4v5h5"/></svg>',
  atualizar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5"/></svg>',
  imprimir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  cadastro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5v14M7 5v14M11 5v14M14 5v14M18 5v14M21 5v14"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>',
  mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
};

// ---------- Supabase ----------
const MENSAGENS = {
  SENHA_INCORRETA: "Usuário ou senha incorretos. Tente de novo.",
  MUITAS_TENTATIVAS: "Muitas tentativas erradas. Espere 10 minutos e tente de novo.",
  USUARIO_INVALIDO: "Escolha um usuário da lista.",
  SESSAO_INVALIDA: "Sua sessão expirou. Entre de novo.",
  SEM_PERMISSAO: "Seu login não tem permissão para isso.",
  USUARIO_EXISTE: "Já existe um usuário com esse nome.",
  ULTIMO_ADMIN: "Precisa sobrar pelo menos um Administrador ativo.",
  NAO_DESATIVA_A_SI: "Você não pode desativar o seu próprio login.",
  SENHA_CURTA: "A senha precisa de pelo menos 4 caracteres.",
  NOME_VAZIO: "O nome não pode ficar em branco.",
  PERFIL_INVALIDO: "Escolha o perfil.",
  ARQUIVO_VAZIO: "O arquivo não tem linhas.",
  EAN_VAZIO: "Produto sem EAN.",
  "Could not find the function": "O banco ainda não tem as funções do app web (falta rodar o SQL 01).",
};
function traduzir(msg) { const m = String(msg); for (const k in MENSAGENS) if (m.includes(k)) return MENSAGENS[k]; return m; }
async function rpc(fn, args = {}) {
  let resp;
  try {
    resp = await fetch(`${CFG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: { apikey: CFG.SUPABASE_KEY, "Content-Type": "application/json" }, body: JSON.stringify(args),
    });
  } catch { throw new Error("Sem conexão com a internet. Tente de novo."); }
  const texto = await resp.text();
  let corpo = null;
  try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = texto; }
  if (!resp.ok) {
    const msg = (corpo && (corpo.message || corpo.hint)) || `Erro ${resp.status}`;
    if (String(msg).includes("SESSAO_INVALIDA")) { sair(true); throw new Error(MENSAGENS.SESSAO_INVALIDA); }
    throw new Error(traduzir(msg));
  }
  return corpo;
}

// ============================================================
// SESSÃO / LOGIN
// ============================================================
const CHAVE_SESSAO = "plano_web_sessao";
let sessao = (() => { try { return JSON.parse(lerLocal(CHAVE_SESSAO)) || null; } catch { return null; } })();
const ehAdmin = () => sessao?.perfil === "admin";

async function telaLogin() {
  $("#app").hidden = true; $("#tela-login").hidden = false;
  $("#versao-login").textContent = "versão " + CFG.VERSAO;
  const sel = $("#login-usuario");
  sel.innerHTML = '<option value="">Carregando…</option>';
  try {
    const lista = await rpc("plano_web_lista_usuarios");
    const ultimo = lerLocal("plano_web_ultimo_usuario");
    sel.innerHTML = '<option value="">Selecione…</option>' + lista.map((u) => `<option${u === ultimo ? " selected" : ""}>${esc(u)}</option>`).join("");
  } catch (e) { sel.innerHTML = '<option value="">—</option>'; erroLogin(e.message); }
  (sel.value ? $("#login-senha") : sel).focus();
}
function erroLogin(msg) { const el = $("#login-erro"); el.textContent = msg; el.hidden = !msg; }
$("#form-login").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const usuario = $("#login-usuario").value, senha = $("#login-senha").value;
  if (!usuario) return erroLogin(MENSAGENS.USUARIO_INVALIDO);
  erroLogin("");
  const btn = $("#btn-entrar"); btn.disabled = true; btn.textContent = "Entrando…";
  try {
    sessao = await rpc("plano_web_login", { p_usuario: usuario, p_senha: senha });
    gravarLocal(CHAVE_SESSAO, JSON.stringify(sessao)); gravarLocal("plano_web_ultimo_usuario", usuario);
    $("#login-senha").value = "";
    iniciarApp();
  } catch (e) { erroLogin(e.message); }
  finally { btn.disabled = false; btn.textContent = "Entrar no Sistema"; }
});
async function sair(silencioso) {
  const tok = sessao?.token;
  sessao = null; E.inicio = null; E.plan = null; E.planKey = null; E.cache = {};
  gravarLocal(CHAVE_SESSAO, null);
  fecharGaveta(); fecharJanela();
  if (tok && !silencioso) rpc("plano_web_sair", { p_token: tok }).catch(() => {});
  telaLogin();
}
$("#btn-sair").addEventListener("click", () => {
  if (sujo() && !confirm("Há alterações não salvas na gôndola. Sair mesmo assim?")) return;
  sair(false);
});

// ============================================================
// ESTADO
// ============================================================
const E = {
  inicio: null,                       // {gondolas, opcoes, base}
  loja: lerLocal("plano_web_loja") || null,
  nivel: "Categoria",
  sel: { categoria: new Set(), subcategoria: new Set() },
  busca: { categoria: "", subcategoria: "" },
  gNome: null, nMod: 1,
  modsEst: {},                        // gNome -> [{largura, nreg, alturas}] (até 8 módulos)
  zoomManual: null, ajusteTela: false,
  ordens: {},                         // "col|escolhas" -> ordem de cima pra baixo
  cache: {},                          // recortes já baixados
  plan: null, planKey: null, prodInfo: {}, resumo: [], origem: "automatico", baseStats: null,
  planBase: null, hist: [],
  autoAltFeito: new Set(), autoAltUltimo: null,
  carregandoPlano: false, abaPainel: lerLocal("plano_web_aba") || "recorte",
};
const sujo = () => !!(E.plan && E.planBase && estadoPlan() !== E.planBase);
const estadoPlan = () => JSON.stringify([E.plan.shelves, E.plan.fora]);
window.addEventListener("beforeunload", (e) => { if (sujo()) { e.preventDefault(); e.returnValue = ""; } });

const PAGINAS = ["plano", "cadastro", "base", "usuarios"];
function pagina() { const h = location.hash.replace(/^#\/?/, ""); return PAGINAS.includes(h) ? h : "plano"; }
window.addEventListener("hashchange", () => { if (sessao) render(); });

async function iniciarApp() {
  $("#tela-login").hidden = true; $("#app").hidden = false;
  $("#conta-nome").textContent = sessao.usuario;
  $("#conta-perfil").textContent = ehAdmin() ? "Administrador · edita medidas e usuários" : "Usuário";
  if (!ehAdmin() && pagina() !== "plano") location.hash = "#/plano";
  await carregarInicio();
}
async function carregarInicio() {
  carregando(true);
  try {
    E.inicio = await rpc("plano_web_inicio", { p_token: sessao.token });
    if (E.inicio.perfil && E.inicio.perfil !== sessao.perfil) { sessao.perfil = E.inicio.perfil; gravarLocal(CHAVE_SESSAO, JSON.stringify(sessao)); }
    prepararInicio();
    render();
  } catch (e) {
    toast(e.message, "erro");
    $("#conteudo").innerHTML = `<div class="cartao"><p class="erro">${esc(e.message)}</p><p><button class="btn" id="tentar">Tentar de novo</button></p></div>`;
    $("#tentar").onclick = carregarInicio;
  } finally { carregando(false); }
}
function prepararInicio() {
  const op = E.inicio.opcoes || [];
  const todas = [...new Set(op.map((o) => o[0]))].sort(cmpTxt);
  const ativas = todas.filter((l) => LOJAS_ATIVAS.includes(parseInt(String(l).trim(), 10)));
  E.lojas = ativas.length ? ativas : todas;
  if (!E.lojas.includes(E.loja)) E.loja = E.lojas[0] || null;
  const nomes = (E.inicio.gondolas || []).map((g) => g.nome);
  const alvo = semAcento(GONDOLA_PADRAO);
  const padrao = nomes.find((n) => semAcento(n) === alvo);
  E.gondolasOrd = padrao ? [padrao, ...nomes.filter((n) => n !== padrao)] : nomes;
  if (!E.gNome || !nomes.includes(E.gNome)) E.gNome = E.gondolasOrd[0] || null;
}

function montarNav() {
  const pg = pagina();
  const itens = [["plano", "Planograma", IC.plano]];
  if (ehAdmin()) itens.push(["cadastro", "Fila do cadastro", IC.cadastro], ["base", "Base de ativos", IC.base], ["usuarios", "Usuários", IC.usuarios]);
  $("#nav").innerHTML = '<div class="nav-rotulo">Gestão de categoria</div>' +
    itens.map(([id, nome, ic]) => `<button type="button" data-pg="${id}" class="${pg === id ? "ativo" : ""}">${ic}<span>${nome}</span></button>`).join("");
}
$("#nav").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-pg]"); if (!b) return;
  if (pagina() === "plano" && b.dataset.pg !== "plano" && sujo() && !confirm("Há alterações não salvas na gôndola. Sair da tela mesmo assim?")) return;
  location.hash = "#/" + b.dataset.pg;
});

function render() {
  if (!E.inicio) return;
  montarNav();
  const pg = pagina();
  $("#rotulo-loja").hidden = pg !== "plano";
  montarSeletorLoja();
  if (pg === "usuarios") { $("#pg-titulo").textContent = "Usuários"; $("#pg-sub").textContent = "Quem entra no Planograma e com qual perfil"; telaUsuarios(); return; }
  if (pg === "cadastro" && render.ultima !== "cadastro") { FILA.dados = {}; E.semCad = null; }   // entrou na tela: busca de novo
  render.ultima = pg;
  if (pg === "cadastro") { $("#pg-titulo").textContent = "Fila do cadastro"; $("#pg-sub").textContent = "Produtos com venda que faltam foto, medida ou o próprio cadastro — os que mais vendem primeiro"; telaCadastro(); return; }
  if (pg === "base") { $("#pg-titulo").textContent = "Base de ativos"; $("#pg-sub").textContent = "O produtos.xlsx do ERP: ativos sem venda vão pro Banco e as medidas completam o cadastro"; telaBase(); return; }
  telaPlano();
}
function montarSeletorLoja() {
  const sel = $("#sel-loja");
  sel.innerHTML = (E.lojas || []).map((l) => `<option value="${esc(l)}"${l === E.loja ? " selected" : ""}>${esc(nomeLoja(l))}</option>`).join("");
}
$("#sel-loja").addEventListener("change", (e) => {
  if (sujo() && !confirm("Há alterações não salvas na gôndola. Trocar de loja mesmo assim?")) { e.target.value = E.loja; return; }
  E.loja = e.target.value; gravarLocal("plano_web_loja", E.loja);
  telaPlano();
});

// ============================================================
// MÓDULOS (largura / nº de réguas / alturas por módulo) - editor_modulos
// ============================================================
const gondolaSel = () => (E.inicio.gondolas || []).find((g) => g.nome === E.gNome);
function moduloPadrao(g) {
  const n = parseInt(g.num_prateleiras, 10) || 1;
  return { largura: Number(g.largura_cm) || 130, nreg: n, alturas: M.alturasDaGondola(g, n) };
}
function estadoModulos() {
  const g = gondolaSel();
  if (!E.modsEst[E.gNome]) E.modsEst[E.gNome] = [];
  const l = E.modsEst[E.gNome];
  while (l.length < E.nMod) l.push(moduloPadrao(g));
  return l;
}
function modsAtuais() {
  return estadoModulos().slice(0, E.nMod).map((m) => ({ largura: m.largura, alturas: m.alturas.slice(0, m.nreg) }));
}
// v7.35 - pôr/tirar régua: a altura do módulo se mantém, repartida igual (sobra vai pras de baixo)
function mudarNReg(m, novo) {
  const est = estadoModulos()[m], velho = est.nreg;
  if (novo === velho || novo < 1) return;
  const total = est.alturas.slice(0, velho).reduce((a, b) => a + Number(b), 0);
  const cada = Math.floor(total / novo), resto = Math.round(total - cada * novo);
  est.alturas = Array.from({ length: novo }, (_, i) => Math.max(5, cada + (i >= novo - resto ? 1 : 0)));
  est.nreg = novo;
}

// ============================================================
// TELA: PLANOGRAMA
// ============================================================
function opcoesLoja(col) {
  const i = col === "categoria" ? 1 : 2;
  return [...new Set((E.inicio.opcoes || []).filter((o) => o[0] === E.loja && o[i] != null).map((o) => o[i]))].sort(cmpTxt);
}
function subsDe() {
  const m = {};
  (E.inicio.opcoes || []).forEach((o) => { if (o[0] === E.loja && o[1] != null && o[2] != null) (m[o[1]] ||= new Set()).add(o[2]); });
  return m;
}
const colNivel = () => NIVEIS[E.nivel];
function escolhasAtuais() {
  const col = colNivel(), ops = opcoesLoja(col), sel = E.sel[col];
  return ops.filter((o) => sel.has(o));
}

function telaPlano() {
  if (!E.loja) { $("#conteudo").innerHTML = '<div class="cartao vazio-msg">Ainda não há vendas carregadas (layout_vendas).</div>'; return; }
  const esc_ = escolhasAtuais();
  $("#pg-titulo").textContent = esc_.length ? "Planograma — " + esc_.join(" + ") : "Planograma";
  $("#pg-sub").textContent = "Gestão de categoria · arraste os produtos, estique as frentes e salve";
  $("#conteudo").innerHTML = `<div class="plano">
    <aside class="painel" id="painel"></aside>
    <section class="area">
      <div class="acoes-barra" id="acoes"></div>
      <div id="chips" class="chips-rec"></div>
      <div id="metricas" class="metricas"></div>
      <div id="avisos"></div>
      <div class="cartao canvas-cartao"><div id="canvas"></div></div>
      <div id="resumo"></div>
    </section></div>`;
  renderPainel();
  atualizarPlano();
}

// ---------- painel da esquerda ----------
function renderPainel() {
  const p = $("#painel"); if (!p) return;
  const aba = E.abaPainel;
  p.innerHTML = `<div class="abas" role="tablist">
      <button type="button" data-aba="recorte" class="${aba === "recorte" ? "on" : ""}">🗂️ Categorias</button>
      <button type="button" data-aba="gondola" class="${aba === "gondola" ? "on" : ""}">⚙️ Gôndola</button></div>
    <div id="aba-corpo"></div>`;
  $$("[data-aba]", p).forEach((b) => b.onclick = () => { E.abaPainel = b.dataset.aba; gravarLocal("plano_web_aba", E.abaPainel); renderPainel(); });
  if (aba === "gondola") renderAbaGondola(); else renderAbaRecorte();
}
function renderAbaRecorte() {
  const corpo = $("#aba-corpo"), col = colNivel(), ops = opcoesLoja(col), marcadas = escolhasAtuais();
  corpo.innerHTML = `<div class="seg">${Object.keys(NIVEIS).map((n) => `<button type="button" data-nivel="${n}" class="${E.nivel === n ? "on" : ""}">${n === "SubCategoria" ? "Subcategoria" : n}</button>`).join("")}</div>
    <label class="busca mini">${IC.busca}<input id="busca-rec" type="search" placeholder="Filtrar… (ex.: cerveja)" value="${esc(E.busca[col])}" autocomplete="off"></label>
    <p class="nota" id="conta-sel"></p>
    <div class="lista-sel" id="lista-sel"></div>
    ${marcadas.length ? '<button type="button" class="btn btn-borda btn-bloco" id="limpar-sel">🧹 Limpar seleção</button>' : ""}
    <div id="ordem-rec"></div>`;
  $$("[data-nivel]", corpo).forEach((b) => b.onclick = () => {
    if (E.nivel === b.dataset.nivel) return;
    if (sujo() && !confirm("Há alterações não salvas na gôndola. Trocar mesmo assim?")) return;
    E.nivel = b.dataset.nivel; renderPainel(); atualizarPlano(); tituloPlano();
  });
  const inp = $("#busca-rec");
  inp.addEventListener("input", () => { E.busca[col] = inp.value; renderListaSel(); });
  const lim = $("#limpar-sel");
  if (lim) lim.onclick = () => {
    if (sujo() && !confirm("Há alterações não salvas na gôndola. Limpar mesmo assim?")) return;
    E.sel[col].clear(); renderPainel(); atualizarPlano(); tituloPlano();
  };
  renderListaSel();
  renderOrdem();
}
function renderListaSel() {
  const col = colNivel(), ops = opcoesLoja(col), sel = E.sel[col];
  const marcadas = ops.filter((o) => sel.has(o));
  const b = semAcento(E.busca[col]);
  const subs = col === "categoria" ? subsDe() : {};
  const vis = b ? ops.filter((o) => semAcento(o).includes(b) || [...(subs[o] || [])].some((x) => semAcento(x).includes(b))) : ops;
  const pend = vis.filter((o) => !sel.has(o));
  const item = (o, on) => `<label class="opc${on ? " on" : ""}"><input type="checkbox" data-op="${esc(o)}"${on ? " checked" : ""}><span>${esc(o)}</span></label>`;
  let h = marcadas.map((o) => item(o, true)).join("");
  if (marcadas.length && pend.length) h += '<hr>';
  h += pend.slice(0, MAX_LISTA_SEL).map((o) => item(o, false)).join("");
  if (!pend.length && !marcadas.length) h += '<p class="nota">Nada com esse nome nessa loja.</p>';
  if (pend.length > MAX_LISTA_SEL) h += `<p class="nota">+${pend.length - MAX_LISTA_SEL} opções — use o filtro acima</p>`;
  const el = $("#lista-sel"); el.innerHTML = h;
  $("#conta-sel").textContent = marcadas.length ? `${marcadas.length} marcada(s) de ${ops.length}` : `${ops.length} opções`;
  $$("input[data-op]", el).forEach((c) => c.onchange = () => {
    if (sujo() && !confirm("Há alterações não salvas na gôndola. Trocar de recorte mesmo assim?")) { c.checked = !c.checked; return; }
    c.checked ? sel.add(c.dataset.op) : sel.delete(c.dataset.op);
    const bu = $("#busca-rec"), foco = document.activeElement === bu;
    renderAbaRecorte(); if (foco) $("#busca-rec").focus();
    atualizarPlano(); tituloPlano();
  });
}
function chaveOrdem() { return colNivel() + "|" + escolhasAtuais().slice().sort(cmpTxt).join("\u0001"); }
function renderOrdem() {
  const el = $("#ordem-rec"); if (!el) return;
  const esc_ = escolhasAtuais();
  if (esc_.length < 2 || !E.ordens[chaveOrdem()]) { el.innerHTML = ""; return; }
  const o = E.ordens[chaveOrdem()];
  el.innerHTML = `<div class="ordem"><p class="nota"><b>Ordem na gôndola</b> (de cima pra baixo) — cada uma fica em réguas só dela</p>
    ${o.map((c, i) => `<div class="ordem-it"><span><b>${i + 1}.</b> ${esc(c)}</span>${i > 0 ? `<button type="button" class="btn btn-borda mini" data-subir="${i}" title="Coloca ${esc(c)} acima de ${esc(o[i - 1])}">⬆ Subir</button>` : ""}</div>`).join("")}</div>`;
  $$("[data-subir]", el).forEach((b) => b.onclick = () => {
    const i = +b.dataset.subir; [o[i - 1], o[i]] = [o[i], o[i - 1]];
    renderOrdem(); atualizarPlano(); tituloPlano();
  });
}
function tituloPlano() {
  const o = ordemAtual() || escolhasAtuais();
  $("#pg-titulo").textContent = o.length ? "Planograma — " + o.join(" + ") : "Planograma";
}
const ordemAtual = () => (escolhasAtuais().length > 1 ? E.ordens[chaveOrdem()] || null : null);

function renderAbaGondola() {
  const corpo = $("#aba-corpo"), g = gondolaSel();
  if (!g) { corpo.innerHTML = '<p class="nota">Nenhuma gôndola cadastrada (layout_gondolas).</p>'; return; }
  const est = estadoModulos(), mods = modsAtuais();
  const somas = [...new Set(mods.map((m) => Math.round(m.alturas.reduce((a, b) => a + b, 0) * 10) / 10))];
  let h = `<label class="campo"><span>Gôndola (molde)</span><select id="g-nome">${E.gondolasOrd.map((n) => `<option${n === E.gNome ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
    <div class="linha2">
      <label class="campo"><span>Módulos lado a lado</span><input id="g-nmod" type="number" min="1" max="8" step="1" value="${E.nMod}"></label>
      <label class="campo"><span>Zoom (px/cm)</span><div class="passo-n"><button type="button" data-zoom="-1">−</button><b id="zoom-v">${escalaAtual()}</b><button type="button" data-zoom="1">+</button></div></label>
    </div>
    <label class="check"><input type="checkbox" id="g-ajuste"${E.ajusteTela ? " checked" : ""}> Ajustar zoom à tela</label>`;
  if (E.nMod > 1) h += `<p class="nota">Fileira: <b>${esc(M.composicao(mods))}</b> — ${fmtCm(mods.reduce((a, m) => a + m.largura, 0))} cm de frente, ${fmtCm(M.alturaTotal(mods))} cm de altura</p>`;
  h += '<div class="mods">';
  for (let m = 0; m < E.nMod; m++) {
    const e = est[m], soma = e.alturas.slice(0, e.nreg).reduce((a, b) => a + Number(b), 0);
    h += `<details class="mod"${E.nMod <= 3 || m === 0 ? " open" : ""}><summary>Módulo ${m + 1} <small>${fmtCm(e.largura)} cm · ${e.nreg} réguas · ${fmtCm(soma)} cm</small></summary>
      <div class="linha2">
        <label class="campo"><span>Largura (cm)</span><input type="number" min="20" max="600" step="5" data-larg="${m}" value="${fmtCm(e.largura)}"></label>
        <label class="campo"><span>Nº de réguas</span><input type="number" min="1" max="12" step="1" data-nreg="${m}" value="${e.nreg}"></label>
      </div>
      <div class="alturas">${e.alturas.slice(0, e.nreg).map((a, i) => `<label class="campo"><span>R${i + 1}${i === 0 ? " (topo)" : ""}</span><input type="number" min="5" max="300" step="1" data-alt="${m}:${i}" value="${fmtCm(a)}"></label>`).join("")}</div>
    </details>`;
  }
  h += "</div>";
  if (somas.length > 1) h += `<div class="aviso laranja">Os módulos não somam a mesma altura (${somas.sort((a, b) => a - b).map(fmtCm).join(", ")} cm). Os pisos continuam alinhados; a sobra fica em cima.</div>`;
  h += `<div class="linha2">${E.nMod > 1 ? '<button type="button" class="btn btn-borda" id="g-igualar" title="Copia largura, nº de réguas e alturas do módulo 1 pros demais">Igualar ao M1</button>' : "<span></span>"}
    ${ehAdmin() ? '<button type="button" class="btn btn-borda" id="g-gravar" title="Grava as alturas do módulo 1 na gôndola (layout_gondolas), como molde das próximas montagens">💾 Gravar padrão</button>' : ""}</div>
    <p class="nota">As réguas se apoiam no CHÃO: se um módulo somar menos altura que o outro, a folga fica em cima. Pôr ou tirar régua mantém a altura do módulo e remonta os produtos.</p>`;
  corpo.innerHTML = h;

  $("#g-nome").onchange = (ev) => {
    if (sujo() && !confirm("Há alterações não salvas na gôndola. Trocar mesmo assim?")) { ev.target.value = E.gNome; return; }
    E.gNome = ev.target.value; renderPainel(); atualizarPlano();
  };
  $("#g-nmod").onchange = (ev) => {
    const n = Math.max(1, Math.min(8, parseInt(ev.target.value, 10) || 1));
    if (n === E.nMod) return;
    if (sujo() && !confirm("Há alterações não salvas na gôndola. Mudar os módulos mesmo assim?")) { ev.target.value = E.nMod; return; }
    E.nMod = n; renderPainel(); atualizarPlano();
  };
  $$("[data-zoom]", corpo).forEach((b) => b.onclick = () => {
    E.ajusteTela = false; E.zoomManual = Math.max(2, Math.min(8, escalaAtual() + +b.dataset.zoom));
    renderPainel(); renderCanvas();
  });
  $("#g-ajuste").onchange = (ev) => { E.ajusteTela = ev.target.checked; renderPainel(); renderCanvas(); };
  $$("[data-larg]", corpo).forEach((i) => i.onchange = () => {
    const v = parseFloat(String(i.value).replace(",", "."));
    if (!(v >= 20)) { i.value = fmtCm(est[+i.dataset.larg].largura); return; }
    est[+i.dataset.larg].largura = v; renderPainel(); atualizarPlano();
  });
  $$("[data-nreg]", corpo).forEach((i) => i.onchange = () => {
    const v = Math.max(1, Math.min(12, parseInt(i.value, 10) || 1));
    mudarNReg(+i.dataset.nreg, v); renderPainel(); atualizarPlano();
  });
  $$("[data-alt]", corpo).forEach((i) => i.onchange = () => {
    const [m, r] = i.dataset.alt.split(":").map(Number), v = parseFloat(String(i.value).replace(",", "."));
    if (!(v >= 5)) { i.value = fmtCm(est[m].alturas[r]); return; }
    est[m].alturas[r] = v; renderPainel(); atualizarPlano();
  });
  const ig = $("#g-igualar");
  if (ig) ig.onclick = () => {
    const m0 = est[0];
    for (let m = 1; m < est.length; m++) est[m] = { largura: m0.largura, nreg: m0.nreg, alturas: m0.alturas.slice() };
    renderPainel(); atualizarPlano();
  };
  const gr = $("#g-gravar");
  if (gr) gr.onclick = async () => {
    const alts = est[0].alturas.slice(0, est[0].nreg);
    try {
      await rpc("plano_web_gondola_alturas", { p_token: sessao.token, p_nome: E.gNome, p_alturas: M.textoAlturas(alts) });
      g.alturas_cm = M.textoAlturas(alts);
      toast(`Alturas do M1 gravadas na gôndola ${E.gNome}.`, "ok");
    } catch (e) { toast(e.message, "erro"); }
  };
}
function escalaAtual() {
  const mods = modsAtuais(), larg = mods.reduce((a, m) => a + m.largura, 0) || 1;
  if (E.ajusteTela) {
    const cv = $("#canvas"), w = cv ? cv.clientWidth : 1100;
    const util = w >= 1100 ? w - 360 : w;           // painel do Banco do lado em tela larga
    return Math.max(2, Math.min(8, Math.floor((util - 40 - 20 * mods.length) / larg)));
  }
  if (E.zoomManual) return E.zoomManual;
  const auto = Math.max(2, Math.min(8, Math.floor(1100 / Math.max(1, larg))));
  return Math.min(ESCALA, Math.max(2, auto));
}

// ---------- montar / carregar o plano (main() do Streamlit) ----------
async function carregarRecorte(col, escolhas) {
  const k = E.loja + "|" + col + "|" + escolhas.join("\u0001");
  if (E.cache[k]) return E.cache[k];
  const r = await rpc("plano_web_recorte", { p_token: sessao.token, p_loja: E.loja, p_col: col, p_escolhas: escolhas, p_norm: escolhas.map(window.Base.norm) });
  const recorte = r.recorte.map((a) => ({ ean: String(a[0]), qtde: num(a[1]), venda: num(a[2]), margem: num(a[3]), descricao: a[4], marca: a[5],
    categoria: a[6], subcategoria: a[7], largura_cm: num(a[8]), altura_cm: num(a[9]), profundidade_cm: num(a[10]), foto_url: a[11] || "", codigo_erp: a[12] }));
  const naVenda = new Set(recorte.map((r_) => r_.ean));
  const catExtra = r.catalogo.filter((a) => !naVenda.has(String(a[0]))).map((a) => ({ ean: String(a[0]), descricao: a[1], marca: a[2], categoria: a[3], subcategoria: a[4],
    largura_cm: num(a[5]), altura_cm: num(a[6]), profundidade_cm: num(a[7]), foto_url: a[8] || "", codigo_erp: a[9], qtde: 0, venda: 0, margem: 0 }));
  const b = window.Base.aplicar(recorte, catExtra, r.base);
  E.cache[k] = { recorte: b.recorte, catExtra: b.catExtra, stats: b.stats };
  return E.cache[k];
}
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

function buildProdInfo(linhas) {
  const info = {};
  linhas.forEach((r) => {
    const q = Number(r.qtde) || 0;
    info[r.ean] = { descricao: r.descricao || r.ean, marca: r.marca || "", foto_url: r.foto_url || "", largura_cm: r.largura_cm, altura_cm: r.altura_cm,
      profundidade_cm: r.profundidade_cm, codigo_erp: r.codigo_erp || "", categoria: r.categoria || "", subcategoria: r.subcategoria || "",
      preco_medio: q ? Number(r.venda) / q : 0 };
  });
  return info;
}
const largDe = (e) => { const v = E.prodInfo[e]?.largura_cm; return v == null || isNaN(v) ? 0 : Number(v); };

let geracao = 0;   // descarta respostas atrasadas quando o usuário muda de recorte rápido
async function atualizarPlano(opc = {}) {
  const minha = ++geracao;
  const g = gondolaSel(); if (!g) return;
  const col = colNivel(), escolhas = escolhasAtuais().slice().sort(cmpTxt);
  let mods = modsAtuais();
  if (!escolhas.length) { E.plan = null; E.planKey = null; renderArea(); return; }
  const recChave = escolhas.join(" + ");
  let dados;
  try {
    if (!E.cache[E.loja + "|" + col + "|" + escolhas.join("\u0001")]) carregando(true);
    dados = await carregarRecorte(col, escolhas);
  } catch (e) { carregando(false); toast(e.message, "erro"); return; }
  if (minha !== geracao) return;
  const { recorte, catExtra, stats } = dados;
  if (!recorte.length) { carregando(false); E.plan = null; E.planKey = null; renderArea("Sem produtos com venda nesse recorte."); return; }

  // v7.33 - ordem das categorias (mais cara em cima)
  let ordem = null;
  if (escolhas.length > 1) {
    const ko = chaveOrdem(), atual = E.ordens[ko];
    if (!atual || atual.slice().sort(cmpTxt).join("\u0001") !== escolhas.join("\u0001")) E.ordens[ko] = M.ordemPadraoRecorte(recorte, col, escolhas);
    ordem = E.ordens[ko].slice();
    renderOrdem();
  }
  const comp = M.composicao(mods);
  const chave = [E.loja, E.nivel, recChave, E.gNome, E.nMod, (ordem || []).join("\u0001"), comp].join("|");

  // v7.32 - produto mais alto que a régua: a régua de baixo sobe antes de montar (1x por recorte+fileira)
  if (E.planKey !== chave && !E.autoAltFeito.has(chave)) {
    E.autoAltFeito.add(chave);
    const atuais = mods.map((m) => m.alturas.map((a) => M._num.arred(Number(a), 1)));
    const ult = E.autoAltUltimo;
    let baseAlt = atuais;
    if (ult && ult.g === E.gNome && ult.comp === comp && JSON.stringify(ult.depois) === JSON.stringify(atuais)) baseAlt = ult.antes;
    const baseMods = mods.map((m, i) => ({ largura: m.largura, alturas: baseAlt[i] }));
    const [novas, txt] = M.alturasParaOsAltosBlocos(baseMods, recorte, col, ordem);
    const alvo = novas || baseAlt;
    if (novas) E.autoAltUltimo = { g: E.gNome, comp, antes: baseAlt, depois: novas }; else E.autoAltUltimo = null;
    if (JSON.stringify(alvo) !== JSON.stringify(atuais)) {
      const est = estadoModulos();
      alvo.forEach((alts, m) => alts.forEach((a, i) => { if (Math.abs(a - mods[m].alturas[i]) > 0.05) est[m].alturas[i] = Math.max(5, a); }));
      mods = modsAtuais();
      toast(txt || "Alturas das réguas voltaram ao que eram (este recorte não tem produto mais alto que a régua).", "ok");
      if (E.abaPainel === "gondola") renderPainel();
    }
  }
  const slots = M.montarSlots(mods);
  const gChave = M.chaveFileira(E.gNome, mods, g.largura_cm, g.num_prateleiras);

  if (E.planKey !== chave || opc.forcar) {
    E.prodInfo = buildProdInfo(recorte.concat(catExtra));
    let salvo = null;
    if (!opc.forcar) {
      try { salvo = await carregarPlanoSalvo(recChave, gChave, slots); }
      catch (e) { toast("Não consegui ler o arranjo salvo: " + e.message, "erro"); }
      if (minha !== geracao) return;
    }
    const sem = M.semearPlano(recorte, slots, col, ordem);
    let shelves, fora;
    if (salvo) { [shelves, fora] = salvo; E.origem = "salvo"; }
    else { [shelves, fora] = [sem[0], sem[1]]; E.origem = "automatico"; }
    const presentes = new Set(shelves.flat().map((e) => e.ean).concat(fora.map((i) => i.ean)));
    catExtra.forEach((r) => { if (!presentes.has(r.ean)) fora.push({ ean: r.ean, motivo: "sem venda (catalogo)" }); });
    E.plan = { loja: E.loja, nivel: E.nivel, recorte: recChave, gondola: gChave, slots, shelves, fora, titulo: (ordem || escolhas).join(" + ") };
    E.resumo = sem[2]; E.baseStats = stats; E.planKey = chave;
    E.planBase = estadoPlan(); E.hist = [];
  } else {
    E.plan.gondola = gChave;
    // v7.22 - mexeu só na altura das réguas: reencaixa sem re-semear
    const sig = (s) => s.map((x) => [x.mod, x.reg, x.larg, x.alt].join(",")).join(";");
    if (sig(E.plan.slots) !== sig(slots)) {
      const n = M.reencaixarSlots(E.plan, slots, largDe);
      E.hist = [];
      if (n) toast(`${n} item(ns) foram pro Banco - a fileira encolheu.`);
    }
  }
  carregando(false);
  renderArea();
}
async function carregarPlanoSalvo(recChave, gChave, slots) {
  const rows = await rpc("plano_web_plano_salvo", { p_token: sessao.token, p_loja: E.loja, p_nivel: E.nivel, p_recorte: recChave, p_gondola: gChave });
  if (!rows || !rows.length) return null;
  const nReg = {}; slots.forEach((sl, i) => { nReg[sl.mod + ":" + sl.reg] = i; });
  const shelves = slots.map(() => []), fora = [], antigas = {};
  let temModulo = false;
  rows.forEach(([modulo, prat, , ean, frentes]) => {
    const e = { ean: String(ean), frentes: parseInt(frentes, 10) };
    if (+prat === 0) { fora.push({ ean: e.ean, motivo: "removido manualmente" }); return; }
    const m = parseInt(modulo, 10) || 0;
    if (m >= 1) { temModulo = true; const i = nReg[(m - 1) + ":" + (prat - 1)]; if (i !== undefined) shelves[i].push(e); }
    else (antigas[prat - 1] ||= []).push(e);
  });
  const ks = Object.keys(antigas).map(Number);
  if (ks.length) {
    const ant = Array.from({ length: Math.max(...ks) + 1 }, (_, k) => antigas[k] || []);
    const [novas, sobra] = M.espalharAntigo(ant, slots, largDe);
    novas.forEach((l, i) => shelves[i].push(...l));
    sobra.forEach((e) => fora.push({ ean: e.ean, motivo: "nao coube no modulo" }));
  }
  if (!temModulo && !ks.length && !fora.length) return null;
  return [shelves, fora];
}

// ---------- área da direita ----------
function renderArea(msgVazia) {
  if (!$("#canvas")) return;
  renderAcoes(); renderChips(); renderMetricas(); renderAvisos(); renderCanvas(msgVazia); renderResumo();
}
function renderAcoes() {
  const el = $("#acoes"); if (!el) return;
  const tem = !!E.plan, s = sujo();
  el.innerHTML = `<button type="button" class="btn btn-primario" id="ac-salvar"${tem ? "" : " disabled"} title="${s ? "Há alterações não salvas. " : ""}Grava o arranjo da tela no Supabase">${IC.salvar}Salvar${s ? ' <i class="ponto"></i>' : ""}</button>
    <button type="button" class="btn btn-borda" id="ac-desfazer"${E.hist.length ? "" : " disabled"} title="Volta o último arraste ou clique (− / + / × / ⬇)">${IC.desfazer}Desfazer</button>
    <button type="button" class="btn btn-borda" id="ac-resetar"${tem ? "" : " disabled"} title="Descarta os arrastos e volta pro arranjo automático">${IC.resetar}Resetar</button>
    <button type="button" class="btn btn-borda" id="ac-atualizar" title="Busca de novo vendas, cadastro e base no Supabase (mantém o arranjo da tela)">${IC.atualizar}Atualizar</button>
    <button type="button" class="btn btn-borda" id="ac-imprimir"${tem ? "" : " disabled"} title="Imprimir ou salvar em PDF">${IC.imprimir}Imprimir</button>
    ${ehAdmin() ? `<button type="button" class="btn btn-borda" id="ac-novo" title="Cadastra um produto com venda que não aparece por não existir na dim_produtos (ou estar sem categoria)">${IC.mais}Novo item</button>` : ""}
    <span class="estado-plano">${tem ? (E.origem === "salvo" ? "💾 arranjo salvo" : "🟢 arranjo automático") : ""}${s ? ' · <b class="sujo">● alterações não salvas</b>' : ""}</span>`;
  $("#ac-salvar").onclick = salvarPlano;
  $("#ac-desfazer").onclick = () => {
    if (!E.hist.length) return;
    const [sh, fo] = JSON.parse(E.hist.pop());
    if (sh.length === E.plan.shelves.length) { E.plan.shelves = sh; E.plan.fora = fo; }
    renderArea();
  };
  $("#ac-resetar").onclick = () => {
    if (!confirm("Descartar os arrastos e voltar pro arranjo automático?")) return;
    atualizarPlano({ forcar: true });
  };
  $("#ac-atualizar").onclick = async () => {
    E.cache = {};
    try { E.inicio = await rpc("plano_web_inicio", { p_token: sessao.token }); prepararInicio(); } catch (e) { return toast(e.message, "erro"); }
    if (E.plan) {
      const col = colNivel(), escolhas = escolhasAtuais().slice().sort(cmpTxt);
      try { const d = await carregarRecorte(col, escolhas); E.prodInfo = buildProdInfo(d.recorte.concat(d.catExtra)); E.baseStats = d.stats; } catch (e) { return toast(e.message, "erro"); }
    }
    renderPainel(); renderArea(); toast("Dados atualizados do Supabase.", "ok");
  };
  $("#ac-imprimir").onclick = abrirImpressao;
  if ($("#ac-novo")) $("#ac-novo").onclick = () => abrirNovoItem();
}
async function salvarPlano() {
  if (!E.plan) return toast("Nada pra salvar: marque uma categoria ou subcategoria primeiro.");
  const rows = [];
  E.plan.shelves.forEach((sh, i) => { const sl = E.plan.slots[i]; sh.forEach((e, ordem) => rows.push({ modulo: sl.mod + 1, prateleira: sl.reg + 1, ordem, ean: e.ean, frentes: e.frentes })); });
  E.plan.fora.forEach((it, ordem) => rows.push({ modulo: 1, prateleira: 0, ordem, ean: it.ean, frentes: 0 }));
  const btn = $("#ac-salvar"); btn.disabled = true; btn.innerHTML = IC.salvar + "Salvando…";
  try {
    await rpc("plano_web_salvar", { p_token: sessao.token, p_loja: E.plan.loja, p_nivel: E.plan.nivel, p_recorte: E.plan.recorte, p_gondola: E.plan.gondola, p_rows: rows });
    E.origem = "salvo"; E.planBase = estadoPlan();
    toast("Arranjo salvo no Supabase.", "ok");
  } catch (e) { toast("Falha ao salvar: " + e.message, "erro"); }
  renderAcoes();
}
function renderChips() {
  const el = $("#chips"); if (!el) return;
  const mods = modsAtuais(), larg = mods.reduce((a, m) => a + m.largura, 0);
  const nregs = [...new Set(mods.map((m) => m.alturas.length))].sort((a, b) => a - b).join("/");
  const comp = new Set(mods.map((m) => m.largura)).size === 1 ? (mods[0].largura / 100).toFixed(2).replace(".", ",") + `m × ${nregs} réguas` : M.composicao(mods);
  const chips = [nomeLoja(E.loja), comp, `${E.nMod} módulo${E.nMod > 1 ? "s" : ""}`, `${fmtCm(larg)} cm de frente`, `${fmtCm(M.alturaTotal(mods))} cm de altura`];
  el.innerHTML = chips.map((c) => `<span class="chip-rec">${esc(c)}</span>`).join("") +
    (E.plan && E.baseStats?.existe ? `<span class="nota base-txt">📄 ${esc(window.Base.textoStats(E.baseStats))}</span>` : "");
}
function metricas() {
  if (!E.plan) return { skus: 0, frentes: 0, pct: 0, semFoto: 0, semDim: 0, usado: 0, total: 0 };
  const sh = E.plan.shelves.flat();
  const skus = new Set(sh.map((e) => e.ean)).size, frentes = sh.reduce((a, e) => a + e.frentes, 0);
  const usado = sh.reduce((a, e) => a + largDe(e.ean) * e.frentes, 0), total = M.capacidade(E.plan.slots);
  const semFoto = new Set(sh.filter((e) => !E.prodInfo[e.ean]?.foto_url).map((e) => e.ean)).size;
  const semDim = new Set(E.plan.fora.filter((i) => { const p = E.prodInfo[i.ean] || {}; return p.largura_cm == null || p.altura_cm == null; }).map((i) => i.ean)).size;
  return { skus, frentes, pct: total ? usado / total : null, semFoto, semDim };
}
function corOcup(p) { return p > 1.001 ? "var(--ocup-over)" : p >= 0.9 ? "var(--verde)" : p >= 0.7 ? "var(--ocup-warn)" : "var(--vermelho)"; }
function renderMetricas() {
  const el = $("#metricas"); if (!el) return;
  const m = metricas(), pct = m.pct, cor = pct ? corOcup(pct) : "var(--texto-fraco)";
  el.innerHTML = `<div class="met"><span>📦 SKUs na gôndola</span><strong class="num">${m.skus}</strong></div>
    <div class="met"><span>🧱 Frentes</span><strong class="num">${m.frentes}</strong></div>
    <div class="met"><span>📏 Ocupação total</span><strong class="num" style="color:${cor}">${pct == null ? "-" : Math.round(pct * 100) + "%"}</strong>
      <div class="barra"><i style="width:${Math.max(0, Math.min(100, Math.round((pct || 0) * 100)))}%;background:${cor}"></i></div></div>
    <div class="met${m.semFoto ? " alerta" : ""}"><span>📷 Sem foto</span><strong class="num">${m.semFoto}</strong></div>
    <div class="met${m.semDim ? " alerta" : ""}"><span>📐 Banco sem medida</span><strong class="num">${m.semDim}</strong></div>`;
}
function renderAvisos() {
  const el = $("#avisos"); if (!el) return;
  el.innerHTML = E.plan ? `<p class="nota dica">${E.origem === "automatico" ? "🟢 Arranjo automático" : "💾 Arranjo salvo"} — arraste os produtos na gôndola; estique a alcinha da direita pra somar frentes; arraste pro Banco pra tirar. ${ehAdmin() ? "Dois cliques no produto editam as medidas. " : ""}Clique em <b>Salvar</b> para gravar.</p>` : "";
}
let gondolaAtual = null;
function renderCanvas(msgVazia) {
  const el = $("#canvas"); if (!el) return;
  const esc_ = escalaAtual();
  const zv = $("#zoom-v"); if (zv) zv.textContent = esc_;
  if (!E.plan) {
    const mods = modsAtuais(), slots = M.montarSlots(mods);
    const cfg = { slots: slots.map((s) => ({ ...s })), escala: esc_, produtos: {}, edita: false, ajustaAlt: true,
      titulo: escolhasAtuais().length ? escolhasAtuais().join(" + ") : "Sem categoria", vazia: !msgVazia };
    gondolaAtual = Gondola.montar(el, cfg, { shelves: slots.map(() => []), fora: [] }, { alturas: (a) => aplicarAlturasArrastadas(slots, a) });
    if (msgVazia) el.insertAdjacentHTML("afterbegin", `<div class="aviso">${esc(msgVazia)}</div>`);
    return;
  }
  const produtos = {};
  const eans = new Set(E.plan.shelves.flat().map((e) => e.ean).concat(E.plan.fora.map((i) => i.ean)));
  eans.forEach((ean) => {
    const p = E.prodInfo[ean] || {};
    const f = (v) => (v == null || isNaN(v) ? null : Number(v));
    produtos[ean] = { desc: p.descricao || ean, foto: p.foto_url || "", larg: f(p.largura_cm), alt: f(p.altura_cm), prof: f(p.profundidade_cm),
      cod_erp: p.codigo_erp || "", marca: p.marca || "", sub: p.subcategoria || "", preco: p.preco_medio || 0 };
  });
  const cfg = { slots: E.plan.slots.map((s) => ({ ...s })), escala: esc_, produtos, edita: ehAdmin(), ajustaAlt: true, titulo: E.plan.titulo };
  gondolaAtual = Gondola.montar(el, cfg, E.plan, {
    mudou: (st) => {
      const antes = estadoPlan();
      E.plan.shelves = st.shelves.map((sh) => sh.map((e) => ({ ean: e.ean, frentes: Math.max(1, e.frentes) })));
      E.plan.fora = st.fora.map((i) => ({ ean: i.ean, motivo: i.motivo || "removido manualmente" }));
      if (estadoPlan() !== antes) { E.hist.push(antes); E.hist = E.hist.slice(-30); }
      renderAcoes(); renderMetricas();
    },
    alturas: (a) => aplicarAlturasArrastadas(E.plan.slots, a),
    editar: (ean) => abrirEditor(ean),
  });
}
// v7.23 - altura arrastada na tarja/topo vai pros campos dos módulos (arredonda pro cm, mínimo 5)
function aplicarAlturasArrastadas(slots, alts) {
  const est = estadoModulos();
  let mudou = false;
  slots.forEach((sl, i) => { const a = Math.max(5, Math.round(alts[i])); if (Math.abs(a - est[sl.mod].alturas[sl.reg]) > 0.4) { est[sl.mod].alturas[sl.reg] = a; mudou = true; } });
  if (!mudou) return;
  if (E.abaPainel === "gondola") renderPainel();
  atualizarPlano();
}
function renderResumo() {
  const el = $("#resumo"); if (!el) return;
  if (!E.plan || !E.resumo || !E.resumo.length) { el.innerHTML = ""; return; }
  const cols = Object.keys(E.resumo[0]);
  const f = (k, v) => (typeof v === "number" ? (k === "R$/cm3" ? v.toFixed(5) : k === "Preco medio" ? "R$ " + v.toFixed(2) : String(v).replace(".", ",")) : esc(v));
  el.innerHTML = `<details class="cartao resumo-cartao"><summary>📐 Distribuição sugerida por subcategoria (% Delta)</summary>
    <p class="nota">Referência do cálculo automático (não reflete edições).</p>
    <div class="tabela-wrap"><table class="simples"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${E.resumo.map((r) => `<tr>${cols.map((c) => `<td>${f(c, r[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}
window.addEventListener("resize", () => { if (E.ajusteTela && pagina() === "plano") { clearTimeout(window._rz); window._rz = setTimeout(renderCanvas, 200); } });

// ---------- zona de foto (editor e novo item): escolher, tratar e prever ----------
function htmlZonaFoto(titulo) {
  return `<div class="troca-foto">
      <label class="zona mini" id="zona-foto">${IC.base}<strong>${titulo}</strong><span>clique, arraste ou cole (Ctrl+V) · PNG, JPG ou WEBP</span>
        <input type="file" id="arq-foto" accept="image/png,image/jpeg,image/webp" hidden></label>
      <label class="check"><input type="checkbox" id="tratar-foto" checked> Remover fundo e cortar nas bordas</label>
      <p class="nota" style="margin-top:-4px">Mesmo tratamento do pipeline do Simplus. Desmarque se a foto já estiver recortada com fundo transparente.</p>
      <div class="prev-foto" id="prev-foto" hidden>
        <figure><figcaption>Original</figcaption><div class="xadrez"><img id="prev-orig" alt=""></div></figure>
        <figure><figcaption>Como vai ficar</figcaption><div class="xadrez"><img id="prev-novo" alt=""></div><small id="prev-info" class="nota"></small></figure>
      </div>
    </div>`;
}
// liga a zona; devolve {foto(): tratada|null}. btn fica travado enquanto trata.
function ligarZonaFoto(g, btn, aoMudar) {
  let foto = null, arquivo = null, versao = 0;
  async function preparar() {
    if (!arquivo) return;
    const minha = ++versao;
    btn.disabled = true; $("#prev-info").textContent = "Tratando a foto…";
    $("#prev-foto").hidden = false;
    $("#prev-orig").src = URL.createObjectURL(arquivo);
    try {
      const r = await window.Foto.tratar(arquivo, { removerFundo: $("#tratar-foto").checked });
      if (minha !== versao) return;
      foto = r;
      $("#prev-novo").src = URL.createObjectURL(r.blob);
      $("#prev-info").textContent = `${r.largura} × ${r.altura} px · ${(r.blob.size / 1024).toFixed(0)} KB · ${r.extensao.toUpperCase()}` +
        ($("#tratar-foto").checked && !r.fundoRemovido ? " · não achei fundo liso pra remover (só cortou)" : "");
    } catch (e) { foto = null; $("#prev-info").textContent = ""; toast("Não consegui tratar a foto: " + e.message, "erro"); }
    finally { if (minha === versao) { btn.disabled = false; if (aoMudar) aoMudar(foto); } }
  }
  function escolher(f) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(f.type)) return toast("Envie uma imagem PNG, JPG ou WEBP.", "erro");
    arquivo = f; preparar();
  }
  const zona = $("#zona-foto"), inp = $("#arq-foto");
  inp.onchange = () => escolher(inp.files[0]);
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("arrastando"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("arrastando"));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("arrastando"); escolher(e.dataTransfer.files[0]); });
  g.onpaste = (e) => { const it = [...(e.clipboardData?.items || [])].find((x) => x.type.startsWith("image/")); if (it) { e.preventDefault(); escolher(it.getAsFile()); } };
  $("#tratar-foto").onchange = preparar;
  return { foto: () => foto };
}
// produto mudou (medida/foto): reflete no plano aberto, nos recortes baixados e onde mais pedirem
function refletirProduto(ean, campos) {
  if (E.prodInfo[ean]) Object.assign(E.prodInfo[ean], campos);
  Object.keys(E.cache).forEach((k) => { const c = E.cache[k]; [c.recorte, c.catExtra].forEach((l) => l.forEach((x) => { if (x.ean === ean) Object.assign(x, campos); })); });
}

// ---------- editor de medidas e foto (dois cliques, só admin) ----------
// opc.produto: produto que não está no plano aberto (fila do cadastro); opc.aoSalvar(campos)
function abrirEditor(ean, opc = {}) {
  if (!ehAdmin()) return;
  const p = opc.produto || E.prodInfo[ean] || {};
  const v = (x) => (x == null || isNaN(x) ? "" : String(x));
  const g = $("#gaveta");
  g.innerHTML = `<header><div><h3>${esc(p.descricao || ean)}</h3><p>EAN ${esc(ean)}${p.marca ? " · " + esc(p.marca) : ""}${p.codigo_erp ? " · Cód ERP " + esc(p.codigo_erp) : ""}</p></div>
      <button type="button" class="btn-fechar" data-fechar aria-label="Fechar">×</button></header>
    <form class="corpo" id="form-medidas" autocomplete="off">
      <div class="foto-atual" id="foto-atual">${p.foto_url ? `<img src="${esc(p.foto_url)}" alt="foto atual">` : '<span class="nota">(sem foto)</span>'}</div>
      <div class="linha3">
        <label class="campo"><span>Largura (cm)</span><input name="l" type="number" min="0" max="500" step="0.1" value="${v(p.largura_cm)}"></label>
        <label class="campo"><span>Altura (cm)</span><input name="a" type="number" min="0" max="500" step="0.1" value="${v(p.altura_cm)}"></label>
        <label class="campo"><span>Profundidade (cm)</span><input name="p" type="number" min="0" max="500" step="0.1" value="${v(p.profundidade_cm)}"></label>
      </div>
      ${htmlZonaFoto(p.foto_url ? "Trocar a foto (opcional)" : "Enviar a foto (opcional)")}
      <p class="nota">Grava direto na <b>dim_produtos</b> e no bucket de fotos (vale pro Streamlit também). Produto que veio só da base de ativos ganha a linha no cadastro.</p>
    </form>
    <footer><button type="submit" form="form-medidas" class="btn btn-primario" id="btn-medidas">💾 Salvar</button><button type="button" class="btn btn-borda" data-fechar>Cancelar</button></footer>`;
  g.hidden = false; $("#veu").hidden = false;
  $$("[data-fechar]", g).forEach((b) => b.onclick = fecharGaveta);
  $('[name="l"]', g).focus();
  const zf = ligarZonaFoto(g, $("#btn-medidas"));

  $("#form-medidas").onsubmit = async (ev) => {
    ev.preventDefault();
    const f = ev.target, n = (k) => { const x = parseFloat(String(f.elements[k].value).replace(",", ".")); return x > 0 ? x : null; };
    const novo = { largura_cm: n("l"), altura_cm: n("a"), profundidade_cm: n("p") };
    const foto = zf.foto();
    // como no Streamlit: só regrava a medida (e marca fonte "manual") se ela mudou
    const mudouDim = Object.keys(novo).some((k) => { const a = p[k] == null || isNaN(p[k]) ? null : Number(p[k]); return (novo[k] == null) !== (a == null) || (novo[k] != null && Math.abs(novo[k] - a) > 0.001); });
    if (!mudouDim && !foto) { fecharGaveta(); return; }
    const btn = $("#btn-medidas"); btn.disabled = true; btn.textContent = "Gravando…";
    const produto = { descricao: p.descricao, marca: p.marca, categoria: p.categoria, subcategoria: p.subcategoria, codigo_erp: p.codigo_erp };
    const campos = {};
    try {
      if (mudouDim) {
        const r = await rpc("plano_web_produto_medidas", { p_token: sessao.token, p: { ean, ...novo, ...produto } });
        Object.assign(campos, { largura_cm: num(r.largura_cm), altura_cm: num(r.altura_cm), profundidade_cm: num(r.profundidade_cm) });
      }
      if (foto) {
        btn.textContent = "Enviando a foto…";
        const r = await enviarFoto(ean, foto, produto);
        campos.foto_url = r.foto_url;
      }
      refletirProduto(ean, campos);
      if (opc.produto) Object.assign(opc.produto, campos);
      fecharGaveta();
      if (pagina() === "plano") renderArea();
      if (opc.aoSalvar) opc.aoSalvar(campos);
      toast(foto && mudouDim ? "Medidas e foto salvas." : foto ? "Foto salva." : "Medidas salvas.", "ok");
    } catch (e) { toast(e.message, "erro"); btn.disabled = false; btn.textContent = "💾 Salvar"; }
  };
}
const ERROS_FOTO = { SEM_PERMISSAO: "Só o Administrador troca foto (ou a sessão expirou — entre de novo).", IMAGEM_INVALIDA: "A foto tratada veio inválida ou grande demais.",
  EAN_INVALIDO: "Esse produto não tem um EAN válido pra dar nome à foto.", STORAGE_FALHOU: "O Supabase recusou gravar a foto no bucket." };
async function enviarFoto(ean, foto, produto) {
  const imagem = await window.Foto.paraBase64(foto.blob);
  let resp;
  try {
    resp = await fetch(`${CFG.SUPABASE_URL}/functions/v1/plano-fotos`, {
      method: "POST", headers: { apikey: CFG.SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ token: sessao.token, ean, imagem, produto }),
    });
  } catch { throw new Error("Sem conexão com a internet. Tente de novo."); }
  const j = await resp.json().catch(() => ({}));
  if (resp.status === 404) throw new Error("A função plano-fotos ainda não está publicada no Supabase.");
  if (!resp.ok || !j.foto_url) throw new Error("Falha ao gravar a foto: " + (ERROS_FOTO[j.erro] || j.erro || `erro ${resp.status}`));
  return j;
}
function fecharGaveta() { $("#gaveta").hidden = true; $("#veu").hidden = true; }
$("#veu").addEventListener("click", fecharGaveta);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if (!$("#janela").hidden) fecharJanela(); else fecharGaveta(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && pagina() === "plano" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
    const b = $("#ac-desfazer"); if (b && !b.disabled) { e.preventDefault(); b.click(); }
  }
});
function abrirJanela(html) { const j = $("#janela"); j.innerHTML = html; j.hidden = false; $("#veu-janela").hidden = false; }
let aoFecharJanela = null;   // a câmera desliga quando a janela fecha (Esc, clique fora)
function fecharJanela() {
  $("#janela").hidden = true; $("#veu-janela").hidden = true;
  const f = aoFecharJanela; aoFecharJanela = null; if (f) f();
}
$("#veu-janela").addEventListener("click", fecharJanela);

// ---------- impressão / PDF (v7.10) ----------
function escalaImpressao(slots, papel, umaFolha) {
  const [, largUtil, altUtil] = PAPEIS[papel] || PAPEIS["A4 retrato"];
  const grupos = M.porModulo(slots), alt = M.alturas(slots);
  const largTotal = grupos.filter((g) => g.length).reduce((a, g) => a + Number(slots[g[0]].larg), 0);
  // fracionado (o Streamlit arredondava pra px inteiro e 3 módulos em A4 saíam a 1 px/cm)
  const piso = (x) => Math.floor(x * 4) / 4;
  let e = piso((largUtil - 20 * grupos.length) / Math.max(1, largTotal || 100));
  if (umaFolha && grupos.length) {
    const soma = Math.max(...grupos.map((g) => g.reduce((a, i) => a + alt[i], 0)));
    const n = Math.max(...grupos.map((g) => g.length));
    const disp = altUtil - 130 - n * 26 - 30;
    if (disp > 0 && soma > 0) e = Math.min(e, piso(disp / soma));
  }
  return Math.max(0.75, Math.min(10, e));
}
function abrirImpressao() {
  abrirJanela(`<h3>🖨️ Imprimir / salvar em PDF</h3>
    <label class="campo"><span>Papel (sempre retrato)</span><select id="imp-papel">${Object.keys(PAPEIS).map((p) => `<option>${p}</option>`).join("")}</select></label>
    <label class="check"><input type="checkbox" id="imp-folha" checked> Caber em uma folha</label>
    <p class="nota">Sai igual à tela, com os arrastos que você acabou de fazer. Fileira longa (vários módulos) fica mais legível em A3. No diálogo do navegador, escolha “Salvar como PDF” pra gerar o arquivo.</p>
    <div class="acoes"><button type="button" class="btn btn-borda" id="imp-nao">Cancelar</button><button type="button" class="btn btn-primario" id="imp-sim">${IC.imprimir}Imprimir</button></div>`);
  $("#imp-nao").onclick = fecharJanela;
  $("#imp-sim").onclick = () => { const papel = $("#imp-papel").value, folha = $("#imp-folha").checked; fecharJanela(); imprimir(papel, folha); };
}
function imprimir(papel, umaFolha) {
  const m = metricas(), mods = modsAtuais(), area = $("#impressao");
  const escImp = escalaImpressao(E.plan.slots, papel, umaFolha);
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
  const fileira = E.nMod === 1 ? E.gNome : `${E.gNome} x${E.nMod} módulos (${M.composicao(mods)} — ${Math.round(mods.reduce((a, x) => a + x.largura, 0))} cm)`;
  area.innerHTML = `<style>@page{size:${PAPEIS[papel][0]};margin:8mm}</style>
    <div class="imp-cab"><h1>Planograma — ${esc(E.plan.recorte)}</h1>
    <p>${esc(nomeLoja(E.loja))} · ${esc(fileira)} · ${E.plan.shelves.length} réguas em ${E.nMod} módulo(s) · ${fmtCm(M.alturaTotal(mods))} cm de altura · gerado em ${agora}</p>
    <div class="imp-met"><span>SKUs <b>${m.skus}</b></span><span>Frentes <b>${m.frentes}</b></span><span>Ocupação <b>${m.pct == null ? "-" : Math.round(m.pct * 100) + "%"}</b></span><span>Sem foto <b>${m.semFoto}</b></span></div></div>
    <div id="imp-gondola"></div>`;
  const produtos = gondolaAtual ? gondolaAtual.cfg.produtos : {};
  Gondola.montar($("#imp-gondola"), { slots: E.plan.slots.map((s) => ({ ...s })), escala: escImp, produtos, estatico: true, titulo: E.plan.titulo }, E.plan, {});
  const imgs = [...area.querySelectorAll(".blk")].map((b) => (b.style.backgroundImage.match(/url\("(.*)"\)/) || [])[1]).filter(Boolean);
  carregando(true);
  Promise.all([...new Set(imgs)].map((src) => new Promise((ok) => { const i = new Image(); i.onload = i.onerror = ok; i.src = src; setTimeout(ok, 6000); })))
    .then(() => { carregando(false); document.title = "planograma_" + E.loja + "_" + E.plan.recorte; window.print(); document.title = "Planograma · Molicenter"; });
}

// ============================================================
// TELA: BASE DE ATIVOS (importar o produtos.xlsx)
// ============================================================
let importBase = null;
function telaBase() {
  if (!ehAdmin()) { $("#conteudo").innerHTML = '<div class="cartao"><p class="erro">Só o Administrador importa a base.</p></div>'; return; }
  const b = E.inicio.base || {};
  let h = `<div class="pagina"><div class="cartao"><h3>Base atual<small>${b.ultima ? "importada em " + esc(dataHora(b.ultima.em)) + " por " + esc(b.ultima.usuario || "") : "ainda não importada"}</small></h3>
    <div class="passos"><div class="passo"><span>Produtos ativos</span><strong class="num">${b.total || 0}</strong><b>na base</b></div>
    <div class="passo"><span>Com medida</span><strong class="num">${b.com_dim || 0}</strong><b>largura preenchida</b></div>
    <div class="passo"><span>Arquivo</span><strong class="mini-txt">${esc(b.ultima?.arquivo || "-")}</strong><b>último importado</b></div></div></div>
    <div class="cartao"><h3>1 · Envie o arquivo</h3>
    <label class="zona" id="zona">${IC.base}<strong>Arraste aqui o produtos.xlsx do ERP</strong>
    <span>ou clique para escolher · colunas Codigo, Descricao, Categorias, SubCategoria, Marca, CodBarra e, se tiver, largura_cm, altura_cm, profundidade_cm</span>
    <input type="file" id="arquivo" accept=".xlsx" hidden></label>
    <p class="nota" style="margin-top:10px">A planilha <b>substitui</b> a base inteira. As medidas dela só completam o que está <b>vazio</b> no cadastro — nunca passam por cima do que a equipe mediu.</p></div>`;
  if (importBase) {
    const r = importBase.resumo, queda = r.atual > 0 && r.linhas < r.atual * 0.8;
    h += `<div class="cartao"><h3>2 · Confira antes de gravar<small>${esc(importBase.arquivo)}</small></h3>
      ${queda ? `<div class="aviso laranja" style="margin-bottom:12px">Atenção: o arquivo tem bem menos produtos que a base atual (${r.linhas} contra ${r.atual}). Confira se é o arquivo certo.</div>` : ""}
      ${importBase.faltam.length ? `<div class="aviso laranja" style="margin-bottom:12px">Colunas não encontradas: ${esc(importBase.faltam.join(", "))}.</div>` : ""}
      ${importBase.semMedida ? '<div class="aviso laranja" style="margin-bottom:12px">A planilha não tem as colunas de medida (largura_cm, altura_cm, profundidade_cm). Ela vale pra listar os ativos sem venda no Banco, mas não completa medida nenhuma.</div>' : ""}
      <div class="passos"><div class="passo"><span>Produtos lidos</span><strong class="num">${r.linhas}</strong><b>hoje na base: ${r.atual}</b></div>
      <div class="passo"><span>Com medida</span><strong class="num">${r.com_dim}</strong><b>largura preenchida</b></div>
      <div class="passo"><span>Novos</span><strong class="num">${r.novos}</strong><b>não estavam na base</b></div>
      <div class="passo"><span>Saíram</span><strong class="num">${r.sairam}</strong><b>somem da base</b></div></div>
      <p class="nota" style="margin-top:12px"><b>Colunas lidas:</b></p><div class="chips ok">${importBase.lidas.map((c) => `<span>${esc(c)}</span>`).join("")}</div>
      ${importBase.ignoradas.length ? `<p class="nota" style="margin-top:8px"><b>Colunas ignoradas:</b></p><div class="chips fora">${importBase.ignoradas.map((c) => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
      <p class="nota" style="margin-top:10px">${r.categorias} categorias · ${r.subcategorias} subcategorias · ${importBase.descartadas} linha(s) sem código ou repetidas ficaram de fora.</p>
      <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn btn-primario" id="btn-gravar-base">Gravar a base</button><button type="button" class="btn btn-borda" id="btn-cancelar-base">Cancelar</button></div></div>`;
  }
  h += '<div class="cartao"><h3>Últimas importações</h3><div id="hist-base" class="nota">Carregando…</div></div></div>';
  $("#conteudo").innerHTML = h;
  const zona = $("#zona"), inp = $("#arquivo");
  inp.addEventListener("change", () => inp.files[0] && lerBase(inp.files[0]));
  zona.addEventListener("dragover", (e) => { e.preventDefault(); zona.classList.add("arrastando"); });
  zona.addEventListener("dragleave", () => zona.classList.remove("arrastando"));
  zona.addEventListener("drop", (e) => { e.preventDefault(); zona.classList.remove("arrastando"); const f = e.dataTransfer.files[0]; if (f) lerBase(f); });
  if (importBase) {
    $("#btn-cancelar-base").onclick = () => { importBase = null; telaBase(); };
    $("#btn-gravar-base").onclick = gravarBase;
  }
  rpc("plano_web_base_historico", { p_token: sessao.token }).then((l) => {
    const el = $("#hist-base"); if (!el) return;
    el.innerHTML = l.length ? `<table class="simples"><thead><tr><th>Quando</th><th>Quem</th><th>Arquivo</th><th>Produtos</th><th>Com medida</th></tr></thead><tbody>${l.map((x) => `<tr><td class="num">${esc(dataHora(x.em))}</td><td>${esc(x.usuario || "")}</td><td>${esc(x.arquivo || "")}</td><td class="num">${x.linhas}</td><td class="num">${x.com_dim}</td></tr>`).join("")}</tbody></table>` : "Nenhuma importação ainda.";
  }).catch(() => {});
}
let exceljsPromessa = null;
function carregarExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  exceljsPromessa ||= new Promise((ok, falha) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
    s.onload = () => ok(window.ExcelJS);
    s.onerror = () => { exceljsPromessa = null; falha(new Error("Não consegui carregar o leitor de Excel. Confira a internet.")); };
    document.head.appendChild(s);
  });
  return exceljsPromessa;
}
function valorCelula(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("result" in v) return valorCelula(v.result);
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if ("text" in v) return v.text;
    return null;
  }
  return v;
}
async function lerBase(arquivo) {
  if (!/\.xlsx$/i.test(arquivo.name)) return toast("Envie o arquivo .xlsx (produtos.xlsx).", "erro");
  carregando(true);
  try {
    const ExcelJS = await carregarExcelJS();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await arquivo.arrayBuffer());
    const ws = wb.worksheets[0];                      // a 1a aba, igual ao pd.read_excel
    if (!ws) throw new Error("O arquivo não tem nenhuma aba.");
    const pos = {}, lidas = [], ignoradas = [];
    ws.getRow(1).eachCell({ includeEmpty: true }, (c, col) => {
      const nome = String(valorCelula(c.value) ?? "").trim(); if (!nome) return;
      const campo = window.Base.campoDaColuna(nome);
      if (campo && !(campo in pos)) { pos[campo] = col; lidas.push(nome); } else ignoradas.push(nome);
    });
    const faltam = ["ean", "codigo_erp", "descricao", "categoria", "subcategoria", "marca"].filter((c) => !pos[c])
      .map((c) => ({ ean: "CodBarra", codigo_erp: "Codigo", descricao: "Descricao", categoria: "Categorias", subcategoria: "SubCategoria", marca: "Marca" }[c]));
    if (!pos.ean && !pos.codigo_erp) throw new Error("A planilha precisa da coluna CodBarra ou Codigo.");
    const regs = [];
    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i), r = {};
      Object.keys(pos).forEach((k) => { r[k] = valorCelula(row.getCell(pos[k]).value); });
      if (Object.values(r).every((x) => x == null || String(x).trim() === "")) continue;
      regs.push(r);
    }
    const linhas = window.Base.prepararLinhas(regs);
    if (!linhas.length) throw new Error(MENSAGENS.ARQUIVO_VAZIO);
    const resumo = await rpc("plano_web_base_importar", { p_token: sessao.token, p_linhas: linhas, p_arquivo: arquivo.name, p_gravar: false });
    const semMedida = !pos.largura_cm && !pos.altura_cm && !pos.profundidade_cm;
    importBase = { arquivo: arquivo.name, linhas, resumo, faltam, descartadas: regs.length - linhas.length, lidas, ignoradas, semMedida };
    telaBase();
  } catch (e) { toast(e.message, "erro"); }
  finally { carregando(false); }
}
async function gravarBase() {
  const btn = $("#btn-gravar-base"); btn.disabled = true; btn.textContent = "Gravando…";
  carregando(true);
  try {
    await rpc("plano_web_base_importar", { p_token: sessao.token, p_linhas: importBase.linhas, p_arquivo: importBase.arquivo, p_gravar: true });
    importBase = null; E.cache = {};
    E.inicio = await rpc("plano_web_inicio", { p_token: sessao.token }); prepararInicio();
    toast("Base de ativos gravada.", "ok");
    telaBase();
  } catch (e) { toast(e.message, "erro"); btn.disabled = false; btn.textContent = "Gravar a base"; }
  finally { carregando(false); }
}

// ============================================================
// CADASTRAR NOVO ITEM (dialog_novo do Streamlit) - só admin
// ============================================================
const NOVA = "__nova__";
const eanValido = (c) => /^\d{6,14}$/.test(String(c || ""));
const reais = (v) => "R$ " + Number(v || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
async function carregarSemCadastro(forcar) {
  if (!E.semCad || forcar) E.semCad = await rpc("plano_web_sem_cadastro", { p_token: sessao.token });
  return E.semCad;
}
function catalogoCats() {   // categoria -> Set(subcategorias), de todas as lojas (igual ao opcoes_df)
  const m = {};
  (E.inicio.opcoes || []).forEach((o) => { if (o[1] != null) { m[o[1]] ||= new Set(); if (o[2] != null) m[o[1]].add(o[2]); } });
  return m;
}
function abrirNovoItem(eanInicial, opc = {}) {
  if (!ehAdmin()) return;
  const g = $("#gaveta"), cats = catalogoCats(), listaCats = Object.keys(cats).sort(cmpTxt);
  const opcoes = (l) => l.map((x) => `<option>${esc(x)}</option>`).join("") + `<option value="${NOVA}">— nova (digitar) —</option>`;
  g.innerHTML = `<header><div><h3>➕ Cadastrar novo item</h3><p>Pra produto com venda que não aparece no quadro por não existir na dim_produtos (ou estar sem categoria)</p></div>
      <button type="button" class="btn-fechar" data-fechar aria-label="Fechar">×</button></header>
    <form class="corpo" id="form-novo" autocomplete="off">
      <label class="campo"><span>Com venda e sem cadastro <small id="nv-conta"></small></span><select id="nv-lista"><option value="">Carregando…</option></select></label>
      <div class="ean-linha">
        <label class="campo"><span>EAN / código interno *</span><input id="nv-ean" inputmode="numeric" maxlength="14" placeholder="só números"></label>
        <button type="button" class="btn btn-borda" id="nv-camera">${IC.camera}Ler com a câmera</button>
      </div>
      <div id="nv-info"><p class="nota">Escolha na lista, leia com a câmera ou digite o código.</p></div>
      <fieldset class="nv-dados" id="nv-dados" disabled>
        <label class="campo"><span>Descrição *</span><input name="desc" maxlength="200"></label>
        <div class="linha2">
          <label class="campo"><span>Marca</span><input name="marca" maxlength="80"></label>
          <label class="campo"><span>Código ERP</span><input name="erp" maxlength="30"></label>
        </div>
        <label class="campo"><span>Categoria *</span><select name="cat"><option value="">Selecione…</option>${opcoes(listaCats)}</select></label>
        <label class="campo" id="nv-cat-nova" hidden><span>Nova categoria *</span><input name="catNova" maxlength="80"></label>
        <label class="campo"><span>Subcategoria *</span><select name="sub"><option value="">Selecione…</option></select></label>
        <label class="campo" id="nv-sub-nova" hidden><span>Nova subcategoria *</span><input name="subNova" maxlength="80"></label>
        <div class="linha3">
          <label class="campo"><span>Largura (cm)</span><input name="l" type="number" min="0" max="500" step="0.1"></label>
          <label class="campo"><span>Altura (cm)</span><input name="a" type="number" min="0" max="500" step="0.1"></label>
          <label class="campo"><span>Profundidade (cm)</span><input name="p" type="number" min="0" max="500" step="0.1"></label>
        </div>
        <p class="nota" style="margin-top:-4px">Sem medida o item vai pro Banco como “sem dimensão” (dá pra medir depois com dois cliques).</p>
        ${htmlZonaFoto("Foto do produto (opcional)")}
        <div class="nv-cosmos" id="nv-cosmos" hidden><img id="nv-cosmos-img" alt="foto do Cosmos">
          <div><b>Achei a foto no Cosmos</b><label class="check"><input type="checkbox" id="nv-usar-cosmos" checked> Usar essa foto do Cosmos</label>
          <p class="nota">Vale só se você não enviar uma foto própria.</p></div></div>
      </fieldset>
    </form>
    <footer><button type="submit" form="form-novo" class="btn btn-primario" id="btn-novo" disabled>💾 Cadastrar</button><button type="button" class="btn btn-borda" data-fechar>Cancelar</button></footer>`;
  g.hidden = false; $("#veu").hidden = false;
  $$("[data-fechar]", g).forEach((b) => b.onclick = fecharGaveta);
  const f = $("#form-novo"), el = f.elements, inpEan = $("#nv-ean"), btn = $("#btn-novo");
  let achado = null, consulta = 0, cosmosOk = false;
  const zf = ligarZonaFoto(g, btn, (foto) => { $("#nv-cosmos").hidden = !!foto || !cosmosOk; });

  // ---- lista dos com venda e sem cadastro ----
  carregarSemCadastro().then((l) => {
    const sel = $("#nv-lista"); if (!sel) return;
    $("#nv-conta").textContent = `(${l.length}${l.length >= 500 ? "+" : ""})`;
    sel.innerHTML = '<option value="">— escolher —</option>' + l.map((x) => `<option value="${esc(x.ean)}">${esc(x.ean)}  (venda ${esc(reais(x.venda))})${x.base ? " · " + esc(x.base.descricao || "") : ""}</option>`).join("");
    if (inpEan.value) sel.value = inpEan.value;
  }).catch((e) => { const sel = $("#nv-lista"); if (sel) sel.innerHTML = `<option value="">${esc(e.message)}</option>`; });
  $("#nv-lista").onchange = (e) => { if (e.target.value) { inpEan.value = e.target.value; buscar(); } };

  // ---- categoria / subcategoria (com "nova") ----
  function pegarOpcao(sel, valor) {   // casa sem ligar pra maiúscula/acento; senão vira "nova"
    if (!valor) { sel.value = ""; return false; }
    const o = [...sel.options].find((x) => x.value !== NOVA && x.value && semAcento(x.value) === semAcento(valor));
    sel.value = o ? o.value : NOVA;
    return !o;
  }
  function trocouCat() {
    const c = el.cat.value, subs = c && c !== NOVA ? [...(cats[c] || [])].sort(cmpTxt) : [];
    $("#nv-cat-nova").hidden = c !== NOVA;
    el.sub.innerHTML = '<option value="">Selecione…</option>' + opcoes(subs);
    if (c === NOVA) el.sub.value = NOVA;
    trocouSub();
  }
  function trocouSub() { $("#nv-sub-nova").hidden = el.sub.value !== NOVA; }
  el.cat.onchange = trocouCat; el.sub.onchange = trocouSub;
  function preencher(src) {
    const v = (x) => (x == null || x === "" || isNaN(Number(x)) || Number(x) <= 0 ? "" : String(Number(x)));
    el.desc.value = src.descricao || ""; el.marca.value = src.marca || ""; el.erp.value = src.codigo_erp || "";
    el.l.value = v(src.largura_cm); el.a.value = v(src.altura_cm); el.p.value = v(src.profundidade_cm);
    el.catNova.value = pegarOpcao(el.cat, src.categoria) ? src.categoria : "";
    trocouCat();
    el.subNova.value = pegarOpcao(el.sub, src.subcategoria) ? src.subcategoria : "";
    trocouSub();
  }

  // ---- foto do Cosmos (só se carregar de verdade) ----
  function testarCosmos(ean, temFoto) {
    cosmosOk = false; $("#nv-cosmos").hidden = true;
    const im = new Image(), minha = consulta;
    im.onload = () => {
      if (minha !== consulta || im.naturalWidth < 20) return;
      cosmosOk = true; $("#nv-cosmos-img").src = im.src; $("#nv-usar-cosmos").checked = !temFoto;
      $("#nv-cosmos").hidden = !!zf.foto();
    };
    im.src = `https://cdn-cosmos.bluesoft.com.br/products/${ean}`;
  }

  // ---- o EAN já existe? o que a base de ativos sabe dele? ----
  let tmr = null;
  inpEan.addEventListener("input", () => {
    const limpo = inpEan.value.replace(/\D/g, "").slice(0, 14);
    if (limpo !== inpEan.value) inpEan.value = limpo;
    clearTimeout(tmr); tmr = setTimeout(buscar, 400);
  });
  async function buscar() {
    clearTimeout(tmr);
    const ean = inpEan.value.trim(), minha = ++consulta, info = $("#nv-info");
    achado = null; cosmosOk = false; $("#nv-cosmos").hidden = true;
    if ($("#nv-lista").value !== ean) $("#nv-lista").value = [...$("#nv-lista").options].some((o) => o.value === ean) ? ean : "";
    if (!eanValido(ean)) {
      $("#nv-dados").disabled = true; btn.disabled = true;
      info.innerHTML = `<p class="nota">${ean ? "O código precisa ter de 6 a 14 números." : "Escolha na lista, leia com a câmera ou digite o código."}</p>`;
      return;
    }
    info.innerHTML = '<p class="nota">Procurando o código…</p>';
    let r;
    try { r = await rpc("plano_web_produto_buscar", { p_token: sessao.token, p_ean: ean }); }
    catch (e) { if (minha === consulta) info.innerHTML = `<p class="erro">${esc(e.message)}</p>`; return; }
    if (minha !== consulta) return;
    achado = r;
    const vd = r.venda && r.venda.venda != null ? `<p class="nota">💰 Venda: <b>${esc(reais(r.venda.venda))}</b> · ${esc(String(Math.round(r.venda.qtde || 0)))} un · loja(s) ${esc(r.venda.lojas || "")}</p>` : '<p class="nota">Sem venda registrada nesse código — dá pra cadastrar mesmo assim.</p>';
    if (r.cadastro) {
      info.innerHTML = `<div class="aviso laranja"><div>Esse EAN já existe no cadastro${r.cadastro.ean !== ean ? ` (como <b>${esc(r.cadastro.ean)}</b>)` : ""}: <b>${esc(r.cadastro.descricao || r.cadastro.ean)}</b>. Salvar aqui <b>SOBRESCREVE</b> — pra ajuste pontual de medida ou foto, prefira o editor.
        <div style="margin-top:8px"><button type="button" class="btn btn-borda mini" id="nv-editor">Abrir no editor</button></div></div></div>${vd}`;
      $("#nv-editor").onclick = () => { const c = { ...r.cadastro }; abrirEditor(c.ean, { produto: c, aoSalvar: opc.aoSalvar }); };
      preencher(r.cadastro);
    } else if (r.base) {
      info.innerHTML = `<p class="nota ok-txt">✔ Achei na base de ativos (produtos.xlsx) — preenchi com o que ela tem; confira.</p>${vd}`;
      preencher(r.base);
    } else {
      info.innerHTML = vd;
      preencher({});
    }
    $("#nv-dados").disabled = false; btn.disabled = false;
    testarCosmos(ean, !!(r.cadastro && r.cadastro.foto_url));
    (r.cadastro || r.base ? el.l : el.desc).focus();
  }

  // ---- câmera ----
  $("#nv-camera").onclick = async () => {
    const cod = await lerCodigoCamera();
    if (cod) { inpEan.value = cod; toast("Código lido: " + cod, "ok"); buscar(); }
  };

  // ---- cadastrar ----
  f.onsubmit = async (ev) => {
    ev.preventDefault();
    const ean = inpEan.value.trim();
    if (!eanValido(ean) || !achado) return;
    const categoria = (el.cat.value === NOVA ? el.catNova.value : el.cat.value).trim();
    const subcategoria = (el.sub.value === NOVA ? el.subNova.value : el.sub.value).trim();
    const descricao = el.desc.value.trim();
    if (!descricao || !categoria || !subcategoria) return toast("Preencha descrição, categoria e subcategoria.", "erro");
    if (achado.cadastro && achado.cadastro.ean === ean && !confirm(`O EAN ${ean} já está cadastrado como "${achado.cadastro.descricao || ean}". Sobrescrever?`)) return;
    const n = (k) => { const x = parseFloat(String(el[k].value).replace(",", ".")); return x > 0 ? x : null; };
    const foto = zf.foto();
    const p = { ean, descricao, marca: el.marca.value.trim(), categoria, subcategoria, codigo_erp: el.erp.value.trim(),
      largura_cm: n("l"), altura_cm: n("a"), profundidade_cm: n("p"), foto_cosmos: !foto && cosmosOk && $("#nv-usar-cosmos").checked };
    btn.disabled = true; btn.textContent = "Gravando…";
    try {
      const prod = await rpc("plano_web_produto_cadastrar", { p_token: sessao.token, p });
      if (foto) {
        btn.textContent = "Enviando a foto…";
        try { prod.foto_url = (await enviarFoto(ean, foto, prod)).foto_url; }
        catch (e) { toast("Produto cadastrado, mas a foto não subiu: " + e.message, "erro"); }
      }
      if (E.semCad) E.semCad = E.semCad.filter((x) => x.ean !== ean);
      const pertence = integrarNovoNoPlano(prod, achado.venda);
      E.cache = {};
      fecharGaveta();
      if (pagina() === "plano") renderArea();
      if (opc.aoSalvar) opc.aoSalvar(prod);
      if (!foto || prod.foto_url) toast(pertence ? `${descricao} cadastrado — está no Banco.` : `${descricao} cadastrado — aparece ao abrir “${E.nivel === "Categoria" ? categoria : subcategoria}”.`, "ok");
      // categoria/subcategoria nova passa a aparecer no painel
      rpc("plano_web_inicio", { p_token: sessao.token }).then((ini) => { E.inicio = ini; prepararInicio(); if (pagina() === "plano" && $("#painel")) renderPainel(); }).catch(() => {});
    } catch (e) { toast(e.message, "erro"); btn.disabled = false; btn.textContent = "💾 Cadastrar"; }
  };

  if (eanInicial) { inpEan.value = String(eanInicial); buscar(); } else inpEan.focus();
}
// se é do recorte aberto, já aparece no Banco sem perder as edições não salvas do arranjo
function integrarNovoNoPlano(prod, venda) {
  const campos = { descricao: prod.descricao || prod.ean, marca: prod.marca || "", foto_url: prod.foto_url || "", largura_cm: num(prod.largura_cm),
    altura_cm: num(prod.altura_cm), profundidade_cm: num(prod.profundidade_cm), codigo_erp: prod.codigo_erp || "", categoria: prod.categoria || "",
    subcategoria: prod.subcategoria || "" };
  refletirProduto(prod.ean, campos);
  if (!E.plan) return false;
  const valor = colNivel() === "categoria" ? prod.categoria : prod.subcategoria;
  if (!escolhasAtuais().includes(valor)) return false;
  if (!E.prodInfo[prod.ean]) {
    const q = Number(venda?.qtde) || 0;
    E.prodInfo[prod.ean] = { ...campos, preco_medio: q ? Number(venda.venda) / q : 0 };
  }
  const presentes = new Set(E.plan.shelves.flat().map((e) => e.ean).concat(E.plan.fora.map((i) => i.ean)));
  const noBanco = E.plan.fora.find((i) => i.ean === prod.ean);
  if (noBanco && noBanco.motivo === "sem venda (catalogo)") noBanco.motivo = "novo cadastro";   // vinha só da base de ativos
  else if (!presentes.has(prod.ean)) {
    E.hist.push(estadoPlan()); E.hist = E.hist.slice(-30);
    E.plan.fora.push({ ean: prod.ean, motivo: "novo cadastro" });
  }
  return true;
}

// ---------- leitor de código de barras pela câmera ----------
// BarcodeDetector nativo (Chrome no Android/Mac) ou ZXing (iPhone, Windows, Firefox)
const ZXING_URL = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js";
let zxingPromessa = null;
function carregarZXing() {
  if (window.ZXingBrowser) return Promise.resolve(window.ZXingBrowser);
  zxingPromessa ||= new Promise((ok, falha) => {
    const s = document.createElement("script");
    s.src = ZXING_URL;
    s.onload = () => ok(window.ZXingBrowser);
    s.onerror = () => { zxingPromessa = null; falha(new Error("Não consegui carregar o leitor de código. Confira a internet.")); };
    document.head.appendChild(s);
  });
  return zxingPromessa;
}
function lerCodigoCamera() {
  return new Promise((ok) => {
    let parar = () => {}, fim = false;
    abrirJanela(`<h3>📷 Ler código de barras</h3>
      <div class="leitor"><video id="cam" playsinline muted autoplay></video><i class="mira"></i></div>
      <p class="nota" id="cam-msg">Abrindo a câmera…</p>
      <div class="acoes"><button type="button" class="btn btn-borda" id="cam-fechar">Cancelar</button></div>`);
    aoFecharJanela = () => { if (!fim) { fim = true; parar(); ok(null); } };
    const terminar = (cod) => { if (fim) return; fim = true; parar(); aoFecharJanela = null; fecharJanela(); ok(cod); };
    $("#cam-fechar").onclick = () => terminar(null);
    const video = $("#cam"), msg = $("#cam-msg");
    const restr = { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador não libera a câmera aqui — digite o código.");
      let formatos = [];
      if ("BarcodeDetector" in window) { try { formatos = await window.BarcodeDetector.getSupportedFormats(); } catch {} }
      const quero = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf"].filter((x) => formatos.includes(x));
      if (quero.length) {
        const stream = await navigator.mediaDevices.getUserMedia(restr);
        parar = () => stream.getTracks().forEach((t) => t.stop());
        if (fim) return parar();
        video.srcObject = stream; await video.play().catch(() => {});
        msg.textContent = "Aponte para o código de barras, bem de perto e com luz.";
        const det = new window.BarcodeDetector({ formats: quero });
        const laco = async () => {
          if (fim) return;
          try { const r = await det.detect(video); const c = r.map((x) => x.rawValue).find(eanValido); if (c) return terminar(c); } catch {}
          setTimeout(laco, 120);
        };
        laco();
      } else {
        msg.textContent = "Carregando o leitor…";
        const ZX = await carregarZXing();
        if (fim) return;
        const leitor = new ZX.BrowserMultiFormatOneDReader();
        const ctrl = await leitor.decodeFromConstraints(restr, video, (res) => { if (res && eanValido(res.getText())) terminar(res.getText()); });
        parar = () => { try { ctrl.stop(); } catch {} };
        if (fim) return parar();
        msg.textContent = "Aponte para o código de barras, bem de perto e com luz.";
      }
    })().catch((e) => {
      if (fim) return;
      msg.classList.add("erro");
      msg.textContent = e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "A câmera foi bloqueada. Libere o acesso à câmera no navegador (cadeado ao lado do endereço) ou digite o código."
        : e && e.name === "NotFoundError" ? "Não achei câmera neste aparelho — digite o código." : (e?.message || "Não consegui abrir a câmera.");
    });
  });
}

// ============================================================
// TELA: FILA DO CADASTRO (sem foto / sem medida / sem cadastro)
// ============================================================
const FILA = { aba: lerLocal("plano_web_fila_aba") || "falta", loja: "", tipo: "tudo", cat: "", busca: "", limite: 150, dados: {}, buscaSem: "" };
async function telaCadastro() {
  if (!ehAdmin()) { $("#conteudo").innerHTML = '<div class="cartao"><p class="erro">Só o Administrador cuida do cadastro.</p></div>'; return; }
  $("#conteudo").innerHTML = `<div class="pagina"><div class="cartao">
      <div class="fila-topo"><div class="seg fila-abas">
        <button type="button" data-faba="falta" class="${FILA.aba === "falta" ? "on" : ""}">📷 Sem foto / sem medida</button>
        <button type="button" data-faba="sem" class="${FILA.aba === "sem" ? "on" : ""}">🆕 Sem cadastro</button></div>
        <button type="button" class="btn btn-primario" id="fila-novo">${IC.mais}Novo item</button></div>
      <div id="fila-corpo"><p class="nota">Carregando…</p></div></div></div>`;
  $$("[data-faba]").forEach((b) => b.onclick = () => { FILA.aba = b.dataset.faba; gravarLocal("plano_web_fila_aba", FILA.aba); FILA.limite = 150; telaCadastro(); });
  $("#fila-novo").onclick = () => abrirNovoItem(null, { aoSalvar: () => { FILA.dados = {}; telaCadastro(); } });
  if (FILA.aba === "sem") return renderSemCad();
  renderFalta();
}
const faltaFoto = (x) => !x.foto_url;
const faltaMedida = (x) => x.largura_cm == null || x.altura_cm == null;
async function renderFalta() {
  const corpo = $("#fila-corpo"), k = FILA.loja || "*";
  if (!FILA.dados[k]) {
    try { FILA.dados[k] = await rpc("plano_web_fila", { p_token: sessao.token, p_loja: FILA.loja || null }); }
    catch (e) { corpo.innerHTML = `<p class="erro">${esc(e.message)}</p>`; return; }
    if (pagina() !== "cadastro" || FILA.aba !== "falta") return;
  }
  const d = FILA.dados[k], itens = d.itens;
  const cats = [...new Set(itens.map((x) => x.categoria).filter(Boolean))].sort(cmpTxt);
  if (FILA.cat && !cats.includes(FILA.cat)) FILA.cat = "";
  corpo.innerHTML = `<div class="fila-filtros">
      <label class="campo"><span>Loja</span><select id="ff-loja"><option value="">Todas as lojas</option>${(E.lojas || []).map((l) => `<option value="${esc(l)}"${l === FILA.loja ? " selected" : ""}>${esc(nomeLoja(l))}</option>`).join("")}</select></label>
      <label class="campo"><span>Categoria</span><select id="ff-cat"><option value="">Todas</option>${cats.map((c) => `<option${c === FILA.cat ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="campo"><span>Falta</span><div class="seg seg3">${[["tudo", "Tudo"], ["foto", "Foto"], ["medida", "Medida"]].map(([v, t]) => `<button type="button" data-ftipo="${v}" class="${FILA.tipo === v ? "on" : ""}">${t}</button>`).join("")}</div></label>
      <label class="campo"><span>Procurar</span><input id="ff-busca" type="search" placeholder="descrição, marca ou EAN" value="${esc(FILA.busca)}"></label>
    </div>
    <div id="ff-resumo" class="chips-rec"></div>
    <div class="tabela-wrap"><table class="simples fila"><thead><tr><th></th><th>Produto</th><th>Categoria</th><th class="num">Venda</th><th>Falta</th><th></th></tr></thead><tbody id="ff-linhas"></tbody></table></div>
    <div id="ff-mais"></div>`;
  $("#ff-loja").onchange = (e) => { FILA.loja = e.target.value; FILA.limite = 150; corpo.innerHTML = '<p class="nota">Carregando…</p>'; renderFalta(); };
  $("#ff-cat").onchange = (e) => { FILA.cat = e.target.value; FILA.limite = 150; linhasFalta(); };
  $$("[data-ftipo]", corpo).forEach((b) => b.onclick = () => { FILA.tipo = b.dataset.ftipo; FILA.limite = 150; $$("[data-ftipo]", corpo).forEach((x) => x.classList.toggle("on", x === b)); linhasFalta(); });
  $("#ff-busca").oninput = (e) => { FILA.busca = e.target.value; FILA.limite = 150; linhasFalta(); };
  linhasFalta();
}
function linhasFalta() {
  const d = FILA.dados[FILA.loja || "*"]; if (!d || !$("#ff-linhas")) return;
  const b = semAcento(FILA.busca);
  const pend = d.itens.filter((x) => faltaFoto(x) || faltaMedida(x));
  const vis = pend.filter((x) => (!FILA.cat || x.categoria === FILA.cat)
    && (FILA.tipo === "tudo" || (FILA.tipo === "foto" ? faltaFoto(x) : faltaMedida(x)))
    && (!b || semAcento([x.descricao, x.marca, x.ean, x.codigo_erp].join(" ")).includes(b)));
  const nFoto = pend.filter(faltaFoto).length, nMed = pend.filter(faltaMedida).length;
  $("#ff-resumo").innerHTML = `<span class="chip-rec">📷 ${nFoto} sem foto</span><span class="chip-rec">📐 ${nMed} sem medida</span>` +
    (d.sem_cadastro ? `<button type="button" class="chip-rec chip-link" id="ff-ir-sem">🆕 ${d.sem_cadastro} com venda e sem cadastro →</button>` : "") +
    `<span class="nota">${vis.length === pend.length ? "" : vis.length + " no filtro · "}os que mais vendem primeiro${d.itens.length >= 1500 ? " (top 1500)" : ""}</span>`;
  const ir = $("#ff-ir-sem"); if (ir) ir.onclick = () => { FILA.aba = "sem"; gravarLocal("plano_web_fila_aba", "sem"); telaCadastro(); };
  const mostra = vis.slice(0, FILA.limite);
  $("#ff-linhas").innerHTML = mostra.length ? mostra.map((x) => `<tr>
      <td class="mini-foto">${x.foto_url ? `<img src="${esc(x.foto_url)}" alt="" loading="lazy">` : "<span>—</span>"}</td>
      <td><b>${esc(x.descricao || x.ean)}</b><small>EAN ${esc(x.ean)}${x.marca ? " · " + esc(x.marca) : ""}${x.codigo_erp ? " · ERP " + esc(x.codigo_erp) : ""}</small></td>
      <td>${esc(x.categoria || "-")}<small>${esc(x.subcategoria || "")}</small></td>
      <td class="num">${esc(reais(x.venda))}<small>${x.lojas > 1 ? x.lojas + " lojas" : ""}</small></td>
      <td>${faltaFoto(x) ? '<span class="badge b-falta">foto</span> ' : ""}${faltaMedida(x) ? '<span class="badge b-falta">medida</span>' : ""}</td>
      <td><button type="button" class="btn btn-borda mini" data-fed="${esc(x.ean)}">Editar</button></td></tr>`).join("")
    : `<tr><td colspan="6" class="nota">${pend.length ? "Nada nesse filtro." : "🎉 Tudo com foto e medida por aqui."}</td></tr>`;
  $("#ff-mais").innerHTML = vis.length > mostra.length ? `<button type="button" class="btn btn-borda" id="ff-mais-btn">Mostrar mais (${vis.length - mostra.length})</button>` : "";
  const mb = $("#ff-mais-btn"); if (mb) mb.onclick = () => { FILA.limite += 150; linhasFalta(); };
  $$("[data-fed]").forEach((bt) => bt.onclick = () => {
    const it = d.itens.find((x) => x.ean === bt.dataset.fed);
    abrirEditor(it.ean, { produto: it, aoSalvar: () => { Object.values(FILA.dados).forEach((dd) => dd !== d && dd.itens.forEach((y) => { if (y.ean === it.ean) Object.assign(y, it); })); linhasFalta(); } });
  });
}
async function renderSemCad() {
  const corpo = $("#fila-corpo");
  let l;
  try { l = await carregarSemCadastro(); } catch (e) { corpo.innerHTML = `<p class="erro">${esc(e.message)}</p>`; return; }
  if (pagina() !== "cadastro" || FILA.aba !== "sem") return;
  corpo.innerHTML = `<p class="nota" style="margin-bottom:10px">Produtos que <b>vendem</b> mas não existem na dim_produtos — por isso não aparecem em nenhum planograma. Quando a base de ativos conhece o código, o cadastro já vem preenchido.</p>
    <div class="fila-filtros"><label class="campo"><span>Procurar</span><input id="fs-busca" type="search" placeholder="EAN ou descrição da base" value="${esc(FILA.buscaSem)}"></label></div>
    <div class="tabela-wrap"><table class="simples fila"><thead><tr><th>EAN</th><th>Na base de ativos</th><th>Lojas</th><th class="num">Venda</th><th></th></tr></thead><tbody id="fs-linhas"></tbody></table></div>
    <p class="nota" style="margin-top:8px">${l.length >= 500 ? "Mostrando os 500 que mais vendem." : l.length + " produto(s)."}</p>`;
  const pintar = () => {
    const b = semAcento(FILA.buscaSem);
    const vis = l.filter((x) => !b || semAcento([x.ean, x.base?.descricao, x.base?.marca].join(" ")).includes(b));
    $("#fs-linhas").innerHTML = vis.length ? vis.slice(0, 500).map((x) => `<tr>
        <td class="num"><b>${esc(x.ean)}</b></td>
        <td>${x.base ? `${esc(x.base.descricao || "")}<small>${esc([x.base.categoria, x.base.subcategoria].filter(Boolean).join(" › "))}</small>` : '<span class="nota">não está na base</span>'}</td>
        <td>${esc(x.lojas || "")}</td>
        <td class="num">${esc(reais(x.venda))}</td>
        <td><button type="button" class="btn btn-primario mini" data-fcad="${esc(x.ean)}">Cadastrar</button></td></tr>`).join("")
      : `<tr><td colspan="5" class="nota">${l.length ? "Nada com esse filtro." : "🎉 Nenhum produto com venda sem cadastro."}</td></tr>`;
    $$("[data-fcad]").forEach((bt) => bt.onclick = () => abrirNovoItem(bt.dataset.fcad, { aoSalvar: () => { FILA.dados = {}; if (pagina() === "cadastro") telaCadastro(); } }));
  };
  $("#fs-busca").oninput = (e) => { FILA.buscaSem = e.target.value; pintar(); };
  pintar();
}

// ============================================================
// TELA: USUÁRIOS (só admin)
// ============================================================
async function telaUsuarios() {
  if (!ehAdmin()) { $("#conteudo").innerHTML = '<div class="cartao"><p class="erro">Só o Administrador gerencia usuários.</p></div>'; return; }
  $("#conteudo").innerHTML = '<div class="pagina"><div class="cartao"><p class="nota">Carregando…</p></div></div>';
  let lista;
  try { lista = await rpc("plano_web_usuarios_lista", { p_token: sessao.token }); }
  catch (e) { $("#conteudo").innerHTML = `<div class="cartao"><p class="erro">${esc(e.message)}</p></div>`; return; }
  $("#conteudo").innerHTML = `<div class="pagina"><div class="cartao"><h3>Usuários<small>${lista.length} cadastrado(s)</small></h3>
    <p class="nota" style="margin-bottom:12px"><b>Administrador</b> edita medidas dos produtos, grava o molde das gôndolas, importa a base de ativos e cuida dos usuários. <b>Usuário</b> monta, arrasta e salva os arranjos.</p>
    <div style="margin-bottom:12px"><button type="button" class="btn btn-primario" id="novo-usuario">${IC.mais}Novo usuário</button></div>
    <div class="tabela-wrap"><table class="simples usuarios"><thead><tr><th>Nome</th><th>Perfil</th><th>Situação</th><th>Último acesso</th><th></th></tr></thead><tbody>
    ${lista.map((u, i) => `<tr><td><b>${esc(u.nome)}</b>${u.nome === sessao.usuario ? ' <span class="badge b-voce">você</span>' : ""}</td>
      <td>${u.perfil === "admin" ? '<span class="badge b-admin">Administrador</span>' : '<span class="badge b-usuario">Usuário</span>'}</td>
      <td>${u.ativo ? '<span class="badge b-ativo">Ativo</span>' : '<span class="badge b-inativo">Desativado</span>'}</td>
      <td class="num">${u.ultimo_acesso ? esc(dataHora(u.ultimo_acesso)) : "-"}</td>
      <td><button type="button" class="btn btn-borda mini" data-editar="${i}">Editar</button></td></tr>`).join("")}</tbody></table></div></div></div>`;
  $("#novo-usuario").onclick = () => gavetaUsuario(null);
  $$("[data-editar]").forEach((b) => b.onclick = () => gavetaUsuario(lista[+b.dataset.editar]));
}
function gavetaUsuario(u) {
  const novo = !u, g = $("#gaveta");
  g.innerHTML = `<header><div><h3>${novo ? "Novo usuário" : esc(u.nome)}</h3><p>${novo ? "Aparece na lista do login" : "Deixe a senha em branco pra manter a atual"}</p></div>
      <button type="button" class="btn-fechar" data-fechar aria-label="Fechar">×</button></header>
    <form class="corpo" id="form-usuario" autocomplete="off">
      <label class="campo"><span>Nome (como aparece no login)</span><input name="nome" maxlength="60" value="${esc(u?.nome || "")}" required></label>
      <label class="campo"><span>Perfil</span><select name="perfil"><option value="usuario"${u?.perfil !== "admin" ? " selected" : ""}>Usuário — monta e salva arranjos</option><option value="admin"${u?.perfil === "admin" ? " selected" : ""}>Administrador — tudo, inclusive medidas e usuários</option></select></label>
      <label class="campo"><span>${novo ? "Senha" : "Nova senha (opcional)"}</span>
        <input name="senha" type="text" class="senha" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" data-lpignore="true" data-1p-ignore="true" data-form-type="other" ${novo ? "required" : ""}></label>
      <label class="check"><input type="checkbox" name="ativo"${u?.ativo === false ? "" : " checked"}> Ativo (pode entrar no sistema)</label>
      <p class="nota">Desativar derruba o login na hora e tira o nome da lista do login. Precisa sobrar pelo menos um Administrador ativo.</p>
    </form>
    <footer><button type="submit" form="form-usuario" class="btn btn-primario" id="btn-usuario">💾 Salvar</button><button type="button" class="btn btn-borda" data-fechar>Cancelar</button></footer>`;
  g.hidden = false; $("#veu").hidden = false;
  $$("[data-fechar]", g).forEach((b) => b.onclick = fecharGaveta);
  $('[name="nome"]', g).focus();
  $("#form-usuario").onsubmit = async (ev) => {
    ev.preventDefault();
    const f = ev.target, btn = $("#btn-usuario");
    btn.disabled = true; btn.textContent = "Gravando…";
    try {
      const nome = f.elements.nome.value.trim();
      await rpc("plano_web_usuario_salvar", { p_token: sessao.token, p_nome_antigo: novo ? null : u.nome, p_nome: nome,
        p_perfil: f.elements.perfil.value, p_ativo: f.elements.ativo.checked, p_senha: f.elements.senha.value });
      if (!novo && u.nome === sessao.usuario && nome !== u.nome) { sessao.usuario = nome; gravarLocal(CHAVE_SESSAO, JSON.stringify(sessao)); $("#conta-nome").textContent = nome; }
      fecharGaveta(); toast("Usuário salvo.", "ok"); telaUsuarios();
    } catch (e) { toast(e.message, "erro"); btn.disabled = false; btn.textContent = "💾 Salvar"; }
  };
}

// ============================================================
// TEMA / MENU / INÍCIO
// ============================================================
function temaAtual() { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function pintarBotaoTema() { $("#txt-tema").textContent = temaAtual() === "dark" ? "Claro" : "Escuro"; }
$("#btn-tema").addEventListener("click", () => {
  const novo = temaAtual() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = novo; gravarLocal("plano_web_tema", novo); pintarBotaoTema();
});
$("#btn-menu").addEventListener("click", () => {
  const fechado = document.documentElement.classList.toggle("menu-fechado");
  gravarLocal("plano_web_menu", fechado ? "fechado" : null);
  if (E.ajusteTela) setTimeout(renderCanvas, 250);
});
pintarBotaoTema();
if (sessao?.token) iniciarApp(); else telaLogin();
