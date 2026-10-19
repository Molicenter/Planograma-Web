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
  lista: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/></svg>',
  copiar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
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
  zoomManual: null, ajusteTela: lerLocal("plano_web_ajuste") !== "0",   // enquadrar na tela é o padrão
  sobraCanvas: 90,                    // px da gôndola que não são régua (título, topo, base) - medido a cada desenho
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
  if (pg === "cadastro" && render.ultima !== "cadastro") { FILA.dados = {}; FILA.sem = null; E.semCad = null; }   // entrou na tela: busca de novo
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
      <div id="analises"></div>
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
      <label class="campo"><span>Zoom (px/cm)</span><div class="passo-n"><button type="button" data-zoom="-0.5">−</button><b id="zoom-v">${fmtZoom(escalaAtual())}</b><button type="button" data-zoom="0.5">+</button></div></label>
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
    E.ajusteTela = false; gravarLocal("plano_web_ajuste", "0");
    E.zoomManual = Math.max(ESC_MIN, Math.min(ESC_MAX, Math.round((escalaAtual() + +b.dataset.zoom) * 2) / 2));
    renderPainel(); renderCanvas();
  });
  $("#g-ajuste").onchange = (ev) => { E.ajusteTela = ev.target.checked; gravarLocal("plano_web_ajuste", E.ajusteTela ? null : "0"); renderPainel(); renderCanvas(); };
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
const ESC_MIN = 1.5, ESC_MAX = 8;
const quarto = (x) => Math.floor(x * 4) / 4;
function escalaAtual() {
  const mods = modsAtuais(), larg = mods.reduce((a, m) => a + m.largura, 0) || 1;
  if (E.ajusteTela) {
    // cabe inteira na tela: na largura (com o Banco do lado em tela larga) E na altura (abaixo da barra de ações fixa)
    const cv = $("#canvas"), w = cv ? cv.clientWidth : 1100;
    const util = w >= 760 ? w - 340 : w;                       // deixa o Banco do lado sempre que der
    const porLarg = (util - 70 - 16 * (mods.length - 1)) / larg;
    const barra = $("#acoes") ? $("#acoes").offsetHeight + 24 : 80;
    const porAlt = (window.innerHeight - barra - E.sobraCanvas) / Math.max(1, M.alturaTotal(mods));
    return Math.max(ESC_MIN, Math.min(ESC_MAX, quarto(Math.min(porLarg, porAlt))));
  }
  if (E.zoomManual) return E.zoomManual;
  const auto = Math.max(2, Math.min(8, Math.floor(1100 / Math.max(1, larg))));
  return Math.min(ESCALA, Math.max(2, auto));
}

// ---------- montar / carregar o plano (main() do Streamlit) ----------
async function carregarRecorte(col, escolhas, loja = E.loja) {
  const k = loja + "|" + col + "|" + escolhas.join("\u0001");
  if (E.cache[k]) return E.cache[k];
  const r = await rpc("plano_web_recorte", { p_token: sessao.token, p_loja: loja, p_col: col, p_escolhas: escolhas, p_norm: escolhas.map(window.Base.norm) });
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
      preco_medio: q ? Number(r.venda) / q : 0, venda: Number(r.venda) || 0, qtde: q };
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
    // começou a vender depois que o arranjo foi salvo: aparece no Banco (o Streamlit sumia com ele)
    if (salvo) recorte.forEach((r) => { if (!presentes.has(r.ean)) { fora.push({ ean: r.ean, motivo: "novo (com venda, fora do arranjo salvo)" }); presentes.add(r.ean); } });
    catExtra.forEach((r) => { if (!presentes.has(r.ean)) fora.push({ ean: r.ean, motivo: "sem venda (catalogo)" }); });
    E.plan = { loja: E.loja, nivel: E.nivel, recorte: recChave, gondola: gChave, slots, shelves, fora, titulo: (ordem || escolhas).join(" + ") };
    E.resumo = sem[2]; E.baseStats = stats; E.planKey = chave; E.recAtual = recorte;
    E.ultimoSalvo = salvo ? copiaShelves(shelves) : null; E.ultimoSalvoAnterior = null;
    E.planBase = estadoPlan(); E.hist = [];
    E.salvoInfo = null; carregarInfoSalvo();
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
// quem salvou e quando (e em quais lojas esse recorte+gôndola já tem arranjo)
async function carregarInfoSalvo() {
  if (!E.plan) return;
  const plan = E.plan;
  try {
    const l = await rpc("plano_web_plano_info", { p_token: sessao.token, p_nivel: plan.nivel, p_recorte: plan.recorte, p_gondola: plan.gondola });
    if (E.plan !== plan) return;
    E.salvoLojas = l; E.salvoInfo = l.find((x) => x.loja === plan.loja) || null;
    renderAcoes();
  } catch { /* SQL 04 ainda não rodado: só não mostra */ }
}
const textoSalvo = (i) => (i ? ` · ${i.por ? "por " + esc(i.por) : "pelo Streamlit"} em ${esc(dataHora(i.em))}` : "");
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

// ============================================================
// ANÁLISES: réguas × altura, espaço × venda, cobertura de estoque, lista de mudanças
// ============================================================
const CFG_PADRAO = { folga: 3, diasVenda: 365, diasRepos: 3, prof: {} };
E.cfg = (() => { try { const c = JSON.parse(lerLocal("plano_web_cfg") || "{}"); return { ...CFG_PADRAO, ...c, prof: { ...(c.prof || {}) } }; } catch { return { ...CFG_PADRAO, prof: {} }; } })();
function gravarCfg() { gravarLocal("plano_web_cfg", JSON.stringify(E.cfg)); }
const fmt1 = (v) => (Math.round(v * 10) / 10).toLocaleString("pt-BR");
const pct = (v) => (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
const somaArr = (l) => l.reduce((a, b) => a + Number(b), 0);
const E_ABERTOS = new Set((lerLocal("plano_web_abertos") || "").split(",").filter(Boolean));
function lembrarAberto(id, aberto) { aberto ? E_ABERTOS.add(id) : E_ABERTOS.delete(id); gravarLocal("plano_web_abertos", [...E_ABERTOS].join(",")); }

// ---------- 1. réguas × altura dos produtos ----------
function repartir(total, n) {
  const cada = Math.floor(total / n), resto = Math.round(total - cada * n);
  return Array.from({ length: n }, (_, i) => Math.max(5, cada + (i >= n - resto ? 1 : 0)));
}
function testarFileira(rec, mods, col, ordem, folga) {
  const slots = M.montarSlots(mods);
  const [sh, fora] = M.semearPlano(rec, slots, col, ordem);
  const alt = {}; rec.forEach((r) => { alt[r.ean] = Number(r.altura_cm) || 0; });
  const ok = sh.every((s, i) => s.every((e) => alt[e.ean] + folga <= slots[i].alt + 1e-6));
  return { ok, fora: fora.filter((i) => !/catalogo/.test(i.motivo || "")).length };
}
function calcularSugestaoReguas(mods, rec, col, ordem, folga) {
  const comAlt = rec.filter((r) => Number(r.altura_cm) > 0);
  if (!comAlt.length || comAlt.length < rec.length * 0.6) return null;      // pouca medida pra confiar
  const recFolga = rec.map((r) => (Number(r.altura_cm) > 0 ? { ...r, altura_cm: Number(r.altura_cm) + folga } : r));
  const atual = testarFileira(rec, mods, col, ordem, 0);
  let melhor = null;
  for (let extra = 1; extra <= 4; extra++) {
    let cand = mods.map((m) => ({ largura: m.largura, alturas: repartir(somaArr(m.alturas), m.alturas.length + extra) }));
    if (cand.some((m) => Math.min(...m.alturas) < 10)) break;
    const [novas] = M.alturasParaOsAltosBlocos(cand, recFolga, col, ordem);   // a régua do produto alto sobe (a altura total fica)
    if (novas) cand = cand.map((m, i) => ({ largura: m.largura, alturas: novas[i].map(Number) }));
    const r = testarFileira(rec, cand, col, ordem, folga);
    if (!r.ok || r.fora > atual.fora) break;
    melhor = { mods: cand, extra, ganho: somaArr(cand.map((m) => m.largura * extra)), maisAlto: Math.max(...comAlt.map((x) => Number(x.altura_cm))) };
  }
  return melhor;
}
let cacheReguas = { k: null, v: null };
function sugestaoReguas() {
  if (!E.plan || !E.recAtual) return null;
  const mods = modsAtuais(), ordem = ordemAtual();
  const k = JSON.stringify([E.planKey, mods, E.cfg.folga]);
  if (cacheReguas.k === k) return cacheReguas.v;
  let v = null;
  try { v = calcularSugestaoReguas(mods, E.recAtual, colNivel(), ordem ? ordem.slice() : null, E.cfg.folga); } catch (e) { console.warn("sugestão de réguas", e); }
  cacheReguas = { k, v };
  return v;
}
function abrirSugestaoReguas() {
  const sg = sugestaoReguas(); if (!sg) return;
  const mods = modsAtuais();
  abrirJanela(`<h3>📏 Mais réguas na mesma altura</h3>
    <p class="nota">O produto mais alto do recorte tem <b>${fmt1(sg.maisAlto)} cm</b>. Mantendo a altura de cada módulo e <b>${E.cfg.folga} cm</b> de folga em cima de cada produto, cabem <b>${sg.extra} régua(s) a mais</b> por módulo — <b>+${fmt1(sg.ganho)} cm de frente</b>, sem nenhum produto a mais fora da gôndola.</p>
    <table class="simples"><thead><tr><th>Módulo</th><th>Hoje</th><th>Sugerido (de cima pra baixo)</th></tr></thead><tbody>
    ${sg.mods.map((m, i) => `<tr><td>M${i + 1}</td><td>${mods[i].alturas.length} × ${mods[i].alturas.map(fmtCm).join("/")}</td><td><b>${m.alturas.length}</b> × ${m.alturas.map(fmtCm).join("/")}</td></tr>`).join("")}</tbody></table>
    <label class="campo"><span>Folga em cima do produto (cm) — espaço pra mão pegar e repor</span><input id="sg-folga" type="number" min="0" max="15" step="1" value="${E.cfg.folga}"></label>
    <p class="nota">Aplicar muda as réguas no painel e remonta a gôndola no automático (o arranjo salvo na configuração antiga continua guardado). Depois é conferir e salvar.</p>
    <div class="acoes"><button type="button" class="btn btn-borda" id="sg-nao">Fechar</button><button type="button" class="btn btn-primario" id="sg-sim">Aplicar ${sg.mods[0].alturas.length} réguas</button></div>`);
  $("#sg-nao").onclick = fecharJanela;
  $("#sg-folga").onchange = (e) => {
    E.cfg.folga = Math.max(0, Math.min(15, parseInt(e.target.value, 10) || 0)); gravarCfg();
    fecharJanela(); renderAvisos();
    if (sugestaoReguas()) abrirSugestaoReguas(); else toast("Com essa folga não cabe régua a mais.");
  };
  $("#sg-sim").onclick = () => {
    if (sujo() && !confirm("Há alterações não salvas na gôndola. Remontar com as novas réguas mesmo assim?")) return;
    const est = estadoModulos();
    sg.mods.forEach((m, i) => { est[i].nreg = m.alturas.length; est[i].alturas = m.alturas.slice(); });
    fecharJanela(); renderPainel(); atualizarPlano();
    toast(`Gôndola remontada com ${sg.mods[0].alturas.length} réguas por módulo (+${fmt1(sg.ganho)} cm de frente).`, "ok");
  };
}

// ---------- 2. espaço × venda ----------
function analiseEspaco(por) {
  const campo = por === "sub" ? "subcategoria" : "marca", vazio = por === "sub" ? "(sem subcategoria)" : "(sem marca)";
  const g = {}, pega = (k) => (g[k] ||= { k, skus: new Set(), frentes: 0, cm: 0, venda: 0, skusRec: 0 });
  (E.recAtual || []).forEach((r) => { const x = pega(r[campo] || vazio); x.venda += Number(r.venda) || 0; x.skusRec++; });
  E.plan.shelves.flat().forEach((e) => { const x = pega(E.prodInfo[e.ean]?.[campo] || vazio); x.skus.add(e.ean); x.frentes += e.frentes; x.cm += largDe(e.ean) * e.frentes; });
  const linhas = Object.values(g), tCm = somaArr(linhas.map((x) => x.cm)) || 1, tV = somaArr(linhas.map((x) => x.venda)) || 1;
  linhas.forEach((x) => { x.pe = x.cm / tCm; x.pv = x.venda / tV; x.ind = x.pv > 0 ? x.pe / x.pv : null; });
  return linhas.sort((a, b) => b.venda - a.venda || b.cm - a.cm);
}
function seloIndice(ind, cm) {
  if (ind == null) return cm > 0 ? '<span class="badge b-sobra">sem venda</span>' : "";
  if (ind < 0.8) return '<span class="badge b-falta">falta espaço</span>';
  if (ind > 1.25) return '<span class="badge b-sobra">sobra espaço</span>';
  return '<span class="badge b-ok">equilibrado</span>';
}
function htmlEspaco() {
  const por = E.cfg.espacoPor || "marca", l = analiseEspaco(por);
  const falta = l.filter((x) => x.ind != null && x.ind < 0.8).length, sobra = l.filter((x) => x.ind != null && x.ind > 1.25).length;
  return `<details class="cartao analise" data-id="espaco"${E_ABERTOS.has("espaco") ? " open" : ""}><summary>📊 Espaço × venda <small>${falta} com falta de espaço · ${sobra} sobrando</small></summary>
    <div class="analise-topo"><div class="seg seg-mini"><button type="button" data-espor="marca" class="${por === "marca" ? "on" : ""}">Por marca</button><button type="button" data-espor="sub" class="${por === "sub" ? "on" : ""}">Por subcategoria</button></div>
    <button type="button" class="btn btn-borda mini" id="esp-csv">⬇ Baixar CSV</button></div>
    <p class="nota">Índice = % do espaço ÷ % da venda (venda da ${esc(nomeLoja(E.loja))}, incluindo o que está no Banco). Abaixo de 0,8 a ${por === "sub" ? "subcategoria" : "marca"} vende mais do que ocupa — merece mais frente; acima de 1,25 ocupa mais do que vende.</p>
    <div class="tabela-wrap"><table class="simples analise-tab"><thead><tr><th>${por === "sub" ? "Subcategoria" : "Marca"}</th><th class="num">SKUs</th><th class="num">Frentes</th><th class="num">Espaço</th><th class="num">% espaço</th><th class="num">% venda</th><th class="num">Índice</th><th></th></tr></thead><tbody>
    ${l.map((x) => `<tr><td><b>${esc(x.k)}</b></td><td class="num">${x.skus.size}/${x.skusRec}</td><td class="num">${x.frentes}</td><td class="num">${fmt1(x.cm)} cm</td>
      <td class="num">${pct(x.pe)}<i class="barrinha" style="width:${Math.round(x.pe * 100)}%"></i></td><td class="num">${pct(x.pv)}<i class="barrinha v" style="width:${Math.round(x.pv * 100)}%"></i></td>
      <td class="num">${x.ind == null ? "-" : x.ind.toFixed(2).replace(".", ",")}</td><td>${seloIndice(x.ind, x.cm)}</td></tr>`).join("")}
    </tbody></table></div><p class="nota">SKUs = na gôndola / com venda no recorte.</p></details>`;
}
function baixarCsvEspaco() {
  const por = E.cfg.espacoPor || "marca", l = analiseEspaco(por);
  const n = (v) => String(Math.round(v * 1000) / 1000).replace(".", ",");
  const linhas = [[por === "sub" ? "Subcategoria" : "Marca", "SKUs na gondola", "SKUs com venda", "Frentes", "Espaco cm", "% espaco", "% venda", "Indice", "Venda R$"].join(";")]
    .concat(l.map((x) => [x.k, x.skus.size, x.skusRec, x.frentes, n(x.cm), n(x.pe * 100), n(x.pv * 100), x.ind == null ? "" : n(x.ind), n(x.venda)].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")));
  const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `espaco_x_venda_${E.loja}_${E.plan.recorte}_${por}.csv`.replace(/[^\w.+-]+/g, "_"); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------- 3. cobertura de estoque ----------
const profPrateleira = () => Number(E.cfg.prof[E.gNome]) || Number(gondolaSel()?.profundidade_cm) || 40;
function calcularCobertura() {
  const prof = profPrateleira(), dV = Math.max(1, Number(E.cfg.diasVenda) || 365), dR = Math.max(0.5, Number(E.cfg.diasRepos) || 3);
  const fr = {}; E.plan.shelves.flat().forEach((e) => { fr[e.ean] = (fr[e.ean] || 0) + e.frentes; });
  return Object.keys(fr).map((ean) => {
    const p = E.prodInfo[ean] || {}, pp = Number(p.profundidade_cm);
    const un = pp > 0 ? Math.max(1, Math.floor(prof / pp + 1e-9)) : null;
    const vd = (Number(p.qtde) || 0) / dV;
    const cob = un && vd > 0 ? (fr[ean] * un) / vd : null;
    const sug = un ? Math.max(1, Math.ceil((vd * dR) / un - 1e-9)) : null;
    const st = !un ? "sem" : vd <= 0 ? "parado" : cob < dR ? "risco" : fr[ean] > 1 && cob > dR * 4 && fr[ean] > sug ? "sobra" : "ok";
    return { ean, desc: p.descricao || ean, frentes: fr[ean], un, vd, cob, sug, st };
  }).sort((a, b) => (a.cob ?? 1e9) - (b.cob ?? 1e9));
}
function htmlCobertura() {
  const l = calcularCobertura(), risco = l.filter((x) => x.st === "risco").length, sem = l.filter((x) => x.st === "sem").length;
  const sel = { risco: '<span class="badge b-falta">risco de ruptura</span>', sobra: '<span class="badge b-sobra">frente sobrando</span>', ok: '<span class="badge b-ok">ok</span>', parado: '<span class="badge b-sobra">sem venda</span>', sem: '<span class="badge b-cinza">sem profundidade</span>' };
  return `<details class="cartao analise" data-id="cobertura"${E_ABERTOS.has("cobertura") ? " open" : ""}><summary>🧮 Frentes × cobertura de estoque <small>${risco} em risco de ruptura${sem ? ` · ${sem} sem profundidade` : ""}</small></summary>
    <div class="cob-params">
      <label class="campo"><span>A venda carregada é de quantos dias?</span><input type="number" min="1" max="1000" step="1" data-cfg="diasVenda" value="${E.cfg.diasVenda}"></label>
      <label class="campo"><span>Reposição a cada (dias)</span><input type="number" min="0.5" max="60" step="0.5" data-cfg="diasRepos" value="${E.cfg.diasRepos}"></label>
      <label class="campo"><span>Profundidade da prateleira (cm)</span><div class="linha-btn"><input type="number" min="10" max="150" step="1" id="cob-prof" value="${profPrateleira()}">${ehAdmin() ? '<button type="button" class="btn btn-borda mini" id="cob-gravar" title="Grava a profundidade na gôndola, pra todo mundo">💾</button>' : ""}</div></label>
    </div>
    <p class="nota">Unidades por frente = profundidade da prateleira ÷ profundidade do produto (uma fila, sem empilhar). Cobertura = frentes × unidades ÷ venda por dia. Sugerido = frentes pra aguentar a reposição.</p>
    <div class="analise-topo"><button type="button" class="btn btn-primario mini" id="cob-ajustar">⚖️ Ajustar frentes pela cobertura</button><span class="nota">Tira frente de quem sobra e dá pra quem está em risco, régua por régua, sem estourar a largura (dá pra desfazer).</span></div>
    <div class="tabela-wrap"><table class="simples analise-tab"><thead><tr><th>Produto</th><th class="num">Frentes</th><th class="num">Un/frente</th><th class="num">Venda/dia</th><th class="num">Cobertura</th><th class="num">Sugerido</th><th></th></tr></thead><tbody>
    ${l.map((x) => `<tr><td>${esc(x.desc)}<small>${esc(x.ean)}</small></td><td class="num">${x.frentes}</td><td class="num">${x.un ?? "-"}</td><td class="num">${fmt1(x.vd)}</td>
      <td class="num">${x.cob == null ? "-" : fmt1(x.cob) + " d"}</td><td class="num">${x.sug ?? "-"}</td><td>${sel[x.st]}</td></tr>`).join("")}
    </tbody></table></div></details>`;
}
function ajustarFrentesCobertura() {
  const l = calcularCobertura(), info = {};
  l.forEach((x) => { info[x.ean] = x; });
  const antes = estadoPlan();
  const total = {}; E.plan.shelves.flat().forEach((e) => { total[e.ean] = (total[e.ean] || 0) + e.frentes; });
  const cob = (e) => { const x = info[e.ean]; return x && x.un && x.vd > 0 ? (e.frentes * x.un) / x.vd : Infinity; };
  E.plan.shelves.forEach((sh, i) => {
    const W = Number(E.plan.slots[i].larg);
    const alvo = new Map();
    sh.forEach((e) => { const x = info[e.ean]; if (x && x.un && x.vd > 0) alvo.set(e, Math.max(1, Math.round((x.sug * e.frentes) / total[e.ean]))); });
    sh.forEach((e) => { if (alvo.has(e) && e.frentes > alvo.get(e)) e.frentes = alvo.get(e); });     // 1) quem sobra devolve
    let usado = somaArr(sh.map((e) => largDe(e.ean) * e.frentes));
    const crescer = (filtro) => {                                                                  // 2) e 3) uma frente por vez, menor cobertura primeiro
      for (;;) {
        const c = sh.filter((e) => filtro(e) && largDe(e.ean) > 0 && usado + largDe(e.ean) <= W + 1e-6).sort((a, b) => cob(a) - cob(b))[0];
        if (!c) break;
        c.frentes++; usado += largDe(c.ean);
      }
    };
    crescer((e) => alvo.has(e) && e.frentes < alvo.get(e));
    crescer((e) => alvo.has(e));                                                                     // sobrou espaço: vai pra menor cobertura
  });
  if (estadoPlan() === antes) return toast("As frentes já estão equilibradas pela cobertura.");
  E.hist.push(antes); E.hist = E.hist.slice(-30);
  const depois = calcularCobertura();
  renderArea();
  toast(`Frentes ajustadas: ${depois.filter((x) => x.st === "risco").length} item(ns) ainda em risco (falta largura na régua).`, "ok");
}

// ---------- 4. lista de mudanças pro repositor ----------
const copiaShelves = (sh) => sh.map((l) => l.map((e) => ({ ean: e.ean, frentes: e.frentes })));
function rotuloSlot(i, slots) { const s = slots[i]; return (E.nMod > 1 || slots.some((x) => x.mod > 0) ? `M${s.mod + 1} · ` : "") + `R${s.reg + 1}${s.reg === 0 ? " (topo)" : ""}`; }
function diffPlano(antes, depois) {
  const lugares = (sh) => { const m = {}; sh.forEach((l, i) => l.forEach((e) => { const x = (m[e.ean] ||= {}); x[i] = (x[i] || 0) + e.frentes; })); return m; };
  const A = lugares(antes), D = lugares(depois), porSlot = {}, saiu = [];
  const add = (i, x) => (porSlot[i] ||= []).push(x);
  Object.keys(D).forEach((ean) => {
    const d = D[ean], a = A[ean];
    if (!a) { Object.keys(d).forEach((i) => add(+i, { tipo: "entrou", ean, f: d[i] })); return; }
    const novos = Object.keys(d).filter((i) => a[i] == null).map(Number), velhos = Object.keys(a).filter((j) => d[j] == null).map(Number);
    novos.forEach((i) => add(i, { tipo: "veio", ean, f: d[i], de: velhos }));
    Object.keys(d).forEach((i) => { if (a[i] != null && a[i] !== d[i]) add(+i, { tipo: "frentes", ean, de: a[i], f: d[i] }); });
    if (!novos.length) velhos.forEach((j) => add(j, { tipo: "tirou", ean }));
  });
  Object.keys(A).forEach((ean) => { if (!D[ean]) saiu.push({ ean, de: Object.keys(A[ean]).map(Number) }); });
  const n = somaArr(Object.values(porSlot).map((l) => l.length)) + saiu.length;
  return { porSlot, saiu, n };
}
function textoMudancas(df, slots, rodape) {
  const nome = (e) => E.prodInfo[e]?.descricao || e, fr = (f) => `${f} frente${f > 1 ? "s" : ""}`;
  const onde = (l) => l.map((i) => rotuloSlot(i, slots)).join(", ");
  const linhas = [`*Planograma — ${E.plan.titulo} · ${nomeLoja(E.plan.loja)}*`, rodape, ""];
  Object.keys(df.porSlot).map(Number).sort((a, b) => a - b).forEach((i) => {
    linhas.push(`*${rotuloSlot(i, slots)}*`);
    const ordem = { entrou: 0, veio: 1, frentes: 2, tirou: 3 };
    df.porSlot[i].sort((a, b) => ordem[a.tipo] - ordem[b.tipo]).forEach((x) => {
      if (x.tipo === "entrou") linhas.push(`➕ Entra: ${nome(x.ean)} — ${fr(x.f)}`);
      if (x.tipo === "veio") linhas.push(`↔️ Vem pra cá: ${nome(x.ean)} — ${fr(x.f)}${x.de.length ? ` (estava em ${onde(x.de)})` : ""}`);
      if (x.tipo === "frentes") linhas.push(`🔢 ${nome(x.ean)}: ${x.de} → ${fr(x.f)}`);
      if (x.tipo === "tirou") linhas.push(`➖ Sai desta régua: ${nome(x.ean)}`);
    });
    linhas.push("");
  });
  if (df.saiu.length) {
    linhas.push("*Sai da gôndola*");
    df.saiu.forEach((x) => linhas.push(`➖ ${nome(x.ean)} (estava em ${onde(x.de)})`));
  }
  return linhas.join("\n").trim();
}
function abrirMudancas(antes, titulo, rodape) {
  if (!E.plan) return;
  if (!antes) return toast("Ainda não há arranjo salvo pra comparar — pra primeira montagem, use a impressão.");
  const df = diffPlano(antes, E.plan.shelves);
  if (!df.n) return toast("Nada mudou em relação ao último arranjo salvo.");
  const txt = textoMudancas(df, E.plan.slots, rodape);
  const html = esc(txt).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  abrirJanela(`<h3>📝 ${esc(titulo)}</h3>
    <p class="nota">${df.n} mudança(s). Mande pra loja: o repositor segue régua por régua, de cima pra baixo.</p>
    <div class="mudancas">${html}</div>
    <div class="acoes"><button type="button" class="btn btn-borda" id="md-fechar">Fechar</button><button type="button" class="btn btn-borda" id="md-imp">${IC.imprimir}Imprimir</button><button type="button" class="btn btn-primario" id="md-copiar">📋 Copiar pro WhatsApp</button></div>`);
  $("#md-fechar").onclick = fecharJanela;
  $("#md-copiar").onclick = async () => {
    try { await navigator.clipboard.writeText(txt); toast("Texto copiado — é só colar no WhatsApp.", "ok"); }
    catch { const t = document.createElement("textarea"); t.value = txt; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); toast("Texto copiado.", "ok"); }
  };
  $("#md-imp").onclick = () => {
    $("#impressao").innerHTML = `<style>@page{size:A4 portrait;margin:12mm}</style><div class="imp-mud">${html}</div>`;
    fecharJanela(); window.print();
  };
}

function renderAnalises() {
  const el = $("#analises"); if (!el) return;
  if (!E.plan) { el.innerHTML = ""; return; }
  el.innerHTML = htmlEspaco() + htmlCobertura();
  $$("details.analise", el).forEach((d) => d.addEventListener("toggle", () => lembrarAberto(d.dataset.id, d.open)));
  $$("[data-espor]", el).forEach((b) => b.onclick = () => { E.cfg.espacoPor = b.dataset.espor; gravarCfg(); renderAnalises(); });
  $("#esp-csv").onclick = baixarCsvEspaco;
  $$("[data-cfg]", el).forEach((i) => i.onchange = () => { const v = parseFloat(String(i.value).replace(",", ".")); if (v > 0) { E.cfg[i.dataset.cfg] = v; gravarCfg(); } renderAnalises(); });
  $("#cob-prof").onchange = (e) => { const v = parseFloat(String(e.target.value).replace(",", ".")); if (v >= 10) { E.cfg.prof[E.gNome] = v; gravarCfg(); } renderAnalises(); };
  const gr = $("#cob-gravar");
  if (gr) gr.onclick = async () => {
    try { await rpc("plano_web_gondola_profundidade", { p_token: sessao.token, p_nome: E.gNome, p_prof: profPrateleira() }); const g = gondolaSel(); if (g) g.profundidade_cm = profPrateleira(); toast(`Profundidade de ${fmt1(profPrateleira())} cm gravada na gôndola.`, "ok"); }
    catch (e) { toast(e.message, "erro"); }
  };
  $("#cob-ajustar").onclick = ajustarFrentesCobertura;
}

// ---------- área da direita ----------
function renderArea(msgVazia) {
  if (!$("#canvas")) return;
  renderAcoes(); renderChips(); renderMetricas(); renderAvisos(); renderCanvas(msgVazia); renderAnalises(); renderResumo();
}
function renderAcoes() {
  const el = $("#acoes"); if (!el) return;
  const tem = !!E.plan, s = sujo();
  el.innerHTML = `<button type="button" class="btn btn-primario" id="ac-salvar"${tem ? "" : " disabled"} title="${s ? "Há alterações não salvas. " : ""}Grava o arranjo da tela no Supabase">${IC.salvar}Salvar${s ? ' <i class="ponto"></i>' : ""}</button>
    <button type="button" class="btn btn-borda" id="ac-desfazer"${E.hist.length ? "" : " disabled"} title="Volta o último arraste ou clique (− / + / × / ⬇)">${IC.desfazer}Desfazer</button>
    <button type="button" class="btn btn-borda" id="ac-resetar"${tem ? "" : " disabled"} title="Descarta os arrastos e volta pro arranjo automático">${IC.resetar}Resetar</button>
    <button type="button" class="btn btn-borda" id="ac-atualizar" title="Busca de novo vendas, cadastro e base no Supabase (mantém o arranjo da tela)">${IC.atualizar}Atualizar</button>
    <button type="button" class="btn btn-borda" id="ac-imprimir"${tem ? "" : " disabled"} title="Imprimir ou salvar em PDF">${IC.imprimir}Imprimir</button>
    <button type="button" class="btn btn-borda" id="ac-mudancas"${tem && E.ultimoSalvo ? "" : " disabled"} title="O que mudou em relação ao último arranjo salvo — lista pro repositor">${IC.lista}Mudanças</button>
    <button type="button" class="btn btn-borda" id="ac-copiar"${tem ? "" : " disabled"} title="Grava este arranjo (como está na tela) em outras lojas">${IC.copiar}Copiar p/ lojas</button>
    ${ehAdmin() ? `<button type="button" class="btn btn-borda" id="ac-novo" title="Cadastra um produto com venda que não aparece por não existir na dim_produtos (ou estar sem categoria)">${IC.mais}Novo item</button>` : ""}
    <span class="estado-plano">${tem ? (E.origem === "salvo" ? "💾 arranjo salvo" + textoSalvo(E.salvoInfo) : "🟢 arranjo automático") : ""}${s ? ' · <b class="sujo">● alterações não salvas</b>' : ""}</span>`;
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
      try { const d = await carregarRecorte(col, escolhas); E.prodInfo = buildProdInfo(d.recorte.concat(d.catExtra)); E.baseStats = d.stats; E.recAtual = d.recorte; cacheReguas = { k: null, v: null }; } catch (e) { return toast(e.message, "erro"); }
    }
    renderPainel(); renderArea(); toast("Dados atualizados do Supabase.", "ok");
  };
  $("#ac-imprimir").onclick = abrirImpressao;
  // a barra fixa mudou de altura (quebrou linha): reenquadra a gôndola
  const hb = el.offsetHeight;
  if (E.ajusteTela && E.altBarra && Math.abs(hb - E.altBarra) > 4) { clearTimeout(renderAcoes.t); renderAcoes.t = setTimeout(renderCanvas, 0); }
  E.altBarra = hb;
  $("#ac-copiar").onclick = abrirCopiar;
  $("#ac-mudancas").onclick = () => abrirMudancas(sujo() ? E.ultimoSalvo : E.ultimoSalvoAnterior || E.ultimoSalvo, sujo() ? "Mudanças ainda não salvas" : "Mudanças do último salvamento", sujo() ? "Comparado com o arranjo salvo (falta salvar)" : `Comparado com o arranjo salvo antes${textoSalvo(E.salvoInfo).replace(/^ · /, " — ")}`);
  if ($("#ac-novo")) $("#ac-novo").onclick = () => abrirNovoItem();
}
function linhasDoPlano(shelves, fora, slots) {
  const rows = [];
  shelves.forEach((sh, i) => { const sl = slots[i]; sh.forEach((e, ordem) => rows.push({ modulo: sl.mod + 1, prateleira: sl.reg + 1, ordem, ean: e.ean, frentes: e.frentes })); });
  fora.forEach((it, ordem) => rows.push({ modulo: 1, prateleira: 0, ordem, ean: it.ean, frentes: 0 }));
  return rows;
}
async function salvarPlano() {
  if (!E.plan) return toast("Nada pra salvar: marque uma categoria ou subcategoria primeiro.");
  const rows = linhasDoPlano(E.plan.shelves, E.plan.fora, E.plan.slots);
  const btn = $("#ac-salvar"); btn.disabled = true; btn.innerHTML = IC.salvar + "Salvando…";
  try {
    const r = await rpc("plano_web_salvar", { p_token: sessao.token, p_loja: E.plan.loja, p_nivel: E.plan.nivel, p_recorte: E.plan.recorte, p_gondola: E.plan.gondola, p_rows: rows });
    const anterior = E.ultimoSalvo;
    E.origem = "salvo"; E.planBase = estadoPlan(); E.ultimoSalvo = copiaShelves(E.plan.shelves); E.ultimoSalvoAnterior = anterior;
    if (anterior && diffPlano(anterior, E.plan.shelves).n)
      setTimeout(() => abrirMudancas(anterior, "Mudanças salvas — mande pra loja", `Salvo ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "")} por ${sessao.usuario}`), 50);
    E.salvoInfo = { loja: E.plan.loja, em: r?.em || new Date().toISOString(), por: r?.por || sessao.usuario };
    E.salvoLojas = (E.salvoLojas || []).filter((x) => x.loja !== E.plan.loja).concat(E.salvoInfo);
    toast("Arranjo salvo no Supabase.", "ok");
  } catch (e) { toast("Falha ao salvar: " + e.message, "erro"); }
  renderAcoes();
}
// ---------- copiar o arranjo pra outras lojas ----------
// Grava o arranjo da tela (mesma gôndola e recorte) em cada loja marcada: o que a loja
// não vende sai da gôndola (o espaço fica pra ajustar) e o que ela vende e não está aqui vai pro Banco.
function abrirCopiar() {
  if (!E.plan) return;
  const plan = E.plan, col = colNivel(), escolhas = escolhasAtuais().slice().sort(cmpTxt);
  const i = col === "categoria" ? 1 : 2;
  const vendeRecorte = (l) => { const ops = new Set((E.inicio.opcoes || []).filter((o) => o[0] === l).map((o) => o[i])); return escolhas.some((x) => ops.has(x)); };
  const salvoDe = (l) => (E.salvoLojas || []).find((x) => x.loja === l);
  const outras = (E.lojas || []).filter((l) => l !== plan.loja);
  abrirJanela(`<h3>📋 Copiar o arranjo pra outras lojas</h3>
    <p class="nota">Grava <b>${esc(plan.titulo)}</b> na mesma gôndola, do jeito que está na tela${sujo() ? " (inclusive o que você ainda não salvou aqui)" : ""}. Em cada loja, o que ela não vende sai da gôndola — fica o espaço pra você ajustar — e o que ela vende e não está aqui vai pro Banco.</p>
    <label class="check"><input type="checkbox" id="cp-todas"> Marcar todas</label>
    <div class="cp-lojas">${outras.map((l) => { const ok = vendeRecorte(l), s = salvoDe(l);
      return `<label class="cp-loja${ok ? "" : " off"}"><input type="checkbox" value="${esc(l)}"${ok ? "" : " disabled"}><span><b>${esc(nomeLoja(l))}</b>
        <small>${!ok ? "não vende esse recorte" : s ? `⚠ já tem arranjo salvo${textoSalvo(s)} — será substituído` : "sem arranjo salvo"}</small></span></label>`; }).join("")}</div>
    <div id="cp-res"></div>
    <div class="acoes"><button type="button" class="btn btn-borda" id="cp-nao">Fechar</button><button type="button" class="btn btn-primario" id="cp-sim" disabled>${IC.copiar}Copiar</button></div>`);
  const caixas = $$(".cp-lojas input:not(:disabled)"), btn = $("#cp-sim");
  const marcadas = () => caixas.filter((c) => c.checked).map((c) => c.value);
  const atualizar = () => { const n = marcadas().length; btn.disabled = !n; btn.innerHTML = IC.copiar + (n ? `Copiar pra ${n} loja${n > 1 ? "s" : ""}` : "Copiar"); $("#cp-todas").checked = n && n === caixas.length; };
  caixas.forEach((c) => c.onchange = atualizar);
  $("#cp-todas").onchange = (e) => { caixas.forEach((c) => (c.checked = e.target.checked)); atualizar(); };
  $("#cp-nao").onclick = fecharJanela;
  btn.onclick = async () => {
    const lojas = marcadas();
    const subst = lojas.filter(salvoDe);
    if (subst.length && !confirm(`${subst.map(nomeLoja).join(", ")} já ${subst.length > 1 ? "têm" : "tem"} arranjo salvo desse recorte nessa gôndola. Substituir?`)) return;
    btn.disabled = true; caixas.forEach((c) => (c.disabled = true));
    const res = $("#cp-res");
    res.innerHTML = '<table class="simples"><thead><tr><th>Loja</th><th class="num">Mantidos</th><th class="num">Saíram</th><th class="num">Pro Banco</th></tr></thead><tbody id="cp-linhas"></tbody></table>';
    let falhas = 0;
    for (const l of lojas) {
      btn.innerHTML = `${IC.copiar}Copiando ${nomeLoja(l)}…`;
      let linha;
      try {
        const r = await copiarPara(l, plan, col, escolhas);
        linha = `<td>${esc(nomeLoja(l))}</td><td class="num">${r.mantidos}</td><td class="num">${r.sairam}</td><td class="num">${r.novos}</td>`;
        E.salvoLojas = (E.salvoLojas || []).filter((x) => x.loja !== l).concat({ loja: l, em: r.em, por: r.por });
      } catch (e) { falhas++; linha = `<td>${esc(nomeLoja(l))}</td><td colspan="3" class="erro">${esc(e.message)}</td>`; }
      $("#cp-linhas").insertAdjacentHTML("beforeend", `<tr>${linha}</tr>`);
    }
    btn.innerHTML = IC.copiar + "Copiado";
    res.insertAdjacentHTML("beforeend", '<p class="nota" style="margin-top:8px">Mantidos / saíram = produtos (SKUs) da gôndola. Abra cada loja pra fechar os espaços e conferir o Banco.</p>');
    toast(falhas ? `Copiado com ${falhas} falha(s).` : `Arranjo copiado pra ${lojas.length} loja(s).`, falhas ? "erro" : "ok");
  };
}
async function copiarPara(loja, plan, col, escolhas) {
  const d = await carregarRecorte(col, escolhas, loja);
  const vende = new Set(d.recorte.map((r) => r.ean));
  const naGondola = new Set(plan.shelves.flat().map((e) => e.ean));
  const shelves = plan.shelves.map((sh) => sh.filter((e) => vende.has(e.ean)).map((e) => ({ ean: e.ean, frentes: e.frentes })));
  const presentes = new Set(shelves.flat().map((e) => e.ean));
  const fora = plan.fora.filter((it) => vende.has(it.ean) && !presentes.has(it.ean)).map((it) => ({ ean: it.ean }));
  fora.forEach((it) => presentes.add(it.ean));
  let novos = 0;
  d.recorte.forEach((r) => { if (!presentes.has(r.ean)) { fora.push({ ean: r.ean }); presentes.add(r.ean); novos++; } });
  const r = await rpc("plano_web_salvar", { p_token: sessao.token, p_loja: loja, p_nivel: plan.nivel, p_recorte: plan.recorte, p_gondola: plan.gondola,
    p_rows: linhasDoPlano(shelves, fora, plan.slots) });
  const mantidos = new Set(shelves.flat().map((e) => e.ean)).size;
  return { mantidos, sairam: naGondola.size - mantidos, novos, em: r?.em || new Date().toISOString(), por: r?.por || sessao.usuario };
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
  const sg = E.plan && !E.sgDispensada?.has(E.planKey + "|" + JSON.stringify(modsAtuais())) ? sugestaoReguas() : null;
  const dica = sg ? `<div class="aviso sugestao">💡 <span>Os produtos estão baixos pra essas réguas: cabe${sg.extra > 1 ? "m" : ""} <b>${sg.extra} régua${sg.extra > 1 ? "s" : ""} a mais</b> por módulo na mesma altura (${E.cfg.folga} cm de folga) — <b>+${fmt1(sg.ganho)} cm de frente</b>.</span><button type="button" id="sg-ver">Ver sugestão</button><button type="button" id="sg-x" title="Não mostrar de novo pra essa gôndola">✕</button></div>` : "";
  el.innerHTML = dica + (E.plan ? `<p class="nota dica">${E.origem === "automatico" ? "🟢 Arranjo automático" : "💾 Arranjo salvo"} — arraste os produtos na gôndola; estique a alcinha da direita pra somar frentes; arraste pro Banco pra tirar. ${ehAdmin() ? "Dois cliques no produto editam as medidas. " : ""}Clique em <b>Salvar</b> para gravar.</p>` : "");
  if (sg) {
    $("#sg-ver").onclick = abrirSugestaoReguas;
    $("#sg-x").onclick = () => { (E.sgDispensada ||= new Set()).add(E.planKey + "|" + JSON.stringify(modsAtuais())); renderAvisos(); };
  }
}
let gondolaAtual = null;
const fmtZoom = (v) => String(v).replace(".", ",");
// desenha e, no "ajustar à tela", mede o que a gôndola gasta além das réguas pra acertar o enquadramento
function renderCanvas(msgVazia) {
  const esc_ = desenharCanvas(msgVazia);
  const g = E.ajusteTela && esc_ ? $("#canvas .gbox") : null;
  if (!g) return;
  const sobra = Math.round(g.offsetHeight - M.alturaTotal(modsAtuais()) * esc_);
  if (sobra > 0 && Math.abs(sobra - E.sobraCanvas) > 6) {
    E.sobraCanvas = sobra;
    if (escalaAtual() !== esc_) desenharCanvas(msgVazia);
  }
}
function desenharCanvas(msgVazia) {
  const el = $("#canvas"); if (!el) return null;
  const esc_ = escalaAtual();
  const zv = $("#zoom-v"); if (zv) zv.textContent = fmtZoom(esc_);
  if (!E.plan) {
    const mods = modsAtuais(), slots = M.montarSlots(mods);
    const cfg = { slots: slots.map((s) => ({ ...s })), escala: esc_, produtos: {}, edita: false, ajustaAlt: true,
      titulo: escolhasAtuais().length ? escolhasAtuais().join(" + ") : "Sem categoria", vazia: !msgVazia };
    gondolaAtual = Gondola.montar(el, cfg, { shelves: slots.map(() => []), fora: [] }, { alturas: (a) => aplicarAlturasArrastadas(slots, a) });
    if (msgVazia) el.insertAdjacentHTML("afterbegin", `<div class="aviso">${esc(msgVazia)}</div>`);
    return esc_;
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
      renderAcoes(); renderMetricas(); renderAnalises();
    },
    alturas: (a) => aplicarAlturasArrastadas(E.plan.slots, a),
    editar: (ean) => abrirEditor(ean),
  });
  return esc_;
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
      if (FILA.sem) FILA.sem = FILA.sem.filter((x) => x.ean !== ean);
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
const FILA = { aba: lerLocal("plano_web_fila_aba") || "falta", loja: "", tipo: "tudo", cat: "", busca: "", limite: 150, dados: {}, buscaSem: "", sem: null, limiteSem: 200 };
async function telaCadastro() {
  if (!ehAdmin()) { $("#conteudo").innerHTML = '<div class="cartao"><p class="erro">Só o Administrador cuida do cadastro.</p></div>'; return; }
  $("#conteudo").innerHTML = `<div class="pagina"><div class="cartao">
      <div class="fila-topo"><div class="seg fila-abas">
        <button type="button" data-faba="falta" class="${FILA.aba === "falta" ? "on" : ""}">📷 Sem foto / sem medida</button>
        <button type="button" data-faba="sem" class="${FILA.aba === "sem" ? "on" : ""}">🆕 Sem cadastro</button></div>
        <button type="button" class="btn btn-primario" id="fila-novo">${IC.mais}Novo item</button></div>
      <div id="fila-corpo"><p class="nota">Carregando…</p></div></div></div>`;
  $$("[data-faba]").forEach((b) => b.onclick = () => { FILA.aba = b.dataset.faba; gravarLocal("plano_web_fila_aba", FILA.aba); FILA.limite = 150; FILA.limiteSem = 200; telaCadastro(); });
  $("#fila-novo").onclick = () => abrirNovoItem(null, { aoSalvar: depoisDeCadastrar });
  if (FILA.aba === "sem") return renderSemCad();
  renderFalta();
}
function depoisDeCadastrar(prod) {
  FILA.dados = {};
  if (FILA.sem && prod) FILA.sem = FILA.sem.filter((x) => x.ean !== prod.ean);
  if (pagina() === "cadastro") telaCadastro();
}
const faltaFoto = (x) => !x.foto_url;
const faltaMedida = (x) => x.largura_cm == null || x.altura_cm == null;
const chaveFila = () => (FILA.loja || "*") + "|" + (FILA.cat || "*");
async function renderFalta() {
  const corpo = $("#fila-corpo"), k = chaveFila();
  if (!FILA.dados[k]) {
    try { FILA.dados[k] = await rpc("plano_web_fila", { p_token: sessao.token, p_loja: FILA.loja || null, p_categoria: FILA.cat || null }); }
    catch (e) { corpo.innerHTML = `<p class="erro">${esc(e.message)}</p>`; return; }
    if (pagina() !== "cadastro" || FILA.aba !== "falta" || k !== chaveFila()) return;
  }
  const d = FILA.dados[k], cats = d.categorias || [];
  corpo.innerHTML = `<div class="fila-filtros">
      <label class="campo"><span>Loja</span><select id="ff-loja"><option value="">Todas as lojas</option>${(E.lojas || []).map((l) => `<option value="${esc(l)}"${l === FILA.loja ? " selected" : ""}>${esc(nomeLoja(l))}</option>`).join("")}</select></label>
      <label class="campo"><span>Categoria</span><select id="ff-cat"><option value="">Todas (${cats.reduce((a, c) => a + c[1], 0)})</option>${cats.map(([c, n]) => `<option value="${esc(c)}"${c === FILA.cat ? " selected" : ""}>${esc(c)} (${n})</option>`).join("")}</select></label>
      <label class="campo"><span>Falta</span><div class="seg seg3">${[["tudo", "Tudo"], ["foto", "Foto"], ["medida", "Medida"]].map(([v, t]) => `<button type="button" data-ftipo="${v}" class="${FILA.tipo === v ? "on" : ""}">${t}</button>`).join("")}</div></label>
      <label class="campo"><span>Procurar</span><input id="ff-busca" type="search" placeholder="descrição, marca ou EAN" value="${esc(FILA.busca)}"></label>
    </div>
    <div id="ff-resumo" class="chips-rec"></div>
    <div class="tabela-wrap"><table class="simples fila"><thead><tr><th></th><th>Produto</th><th>Categoria</th><th class="num">Venda</th><th>Falta</th><th></th></tr></thead><tbody id="ff-linhas"></tbody></table></div>
    <div id="ff-mais"></div>`;
  const recarregar = () => { FILA.limite = 150; $("#ff-linhas").innerHTML = '<tr><td colspan="6" class="nota">Carregando…</td></tr>'; renderFalta(); };
  $("#ff-loja").onchange = (e) => { FILA.loja = e.target.value; recarregar(); };
  $("#ff-cat").onchange = (e) => { FILA.cat = e.target.value; recarregar(); };
  $$("[data-ftipo]", corpo).forEach((b) => b.onclick = () => { FILA.tipo = b.dataset.ftipo; FILA.limite = 150; $$("[data-ftipo]", corpo).forEach((x) => x.classList.toggle("on", x === b)); linhasFalta(); });
  $("#ff-busca").oninput = (e) => { FILA.busca = e.target.value; FILA.limite = 150; linhasFalta(); };
  linhasFalta();
}
function linhasFalta() {
  const d = FILA.dados[chaveFila()]; if (!d || !$("#ff-linhas")) return;
  const b = semAcento(FILA.busca), completo = d.itens.length < (d.limite || 1e9);
  const pend = d.itens.filter((x) => faltaFoto(x) || faltaMedida(x));
  const vis = pend.filter((x) => (FILA.tipo === "tudo" || (FILA.tipo === "foto" ? faltaFoto(x) : faltaMedida(x)))
    && (!b || semAcento([x.descricao, x.marca, x.ean, x.codigo_erp].join(" ")).includes(b)));
  // contagem: a lista inteira veio -> conta na tela (já desconta o que foi resolvido); senão, o total do banco
  const nFoto = completo ? pend.filter(faltaFoto).length : d.totais.foto, nMed = completo ? pend.filter(faltaMedida).length : d.totais.medida;
  $("#ff-resumo").innerHTML = `<span class="chip-rec">📷 ${nFoto} sem foto</span><span class="chip-rec">📐 ${nMed} sem medida</span>` +
    (d.sem_cadastro ? `<button type="button" class="chip-rec chip-link" id="ff-ir-sem">🆕 ${d.sem_cadastro} com venda e sem cadastro →</button>` : "") +
    `<span class="nota">${vis.length === pend.length ? "" : vis.length + " no filtro · "}os que mais vendem primeiro${completo ? "" : ` · mostrando os ${d.itens.length} primeiros de ${d.totais.itens} — escolha uma categoria pra ver todos`}</span>`;
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
    abrirEditor(it.ean, { produto: it, aoSalvar: () => {
      Object.values(FILA.dados).forEach((dd) => dd !== d && dd.itens.forEach((y) => { if (y.ean === it.ean) Object.assign(y, it); }));
      linhasFalta();
    } });
  });
}
async function renderSemCad() {
  const corpo = $("#fila-corpo");
  if (!FILA.sem) {
    try { FILA.sem = await rpc("plano_web_sem_cadastro", { p_token: sessao.token, p_limite: 20000 }); }
    catch (e) { corpo.innerHTML = `<p class="erro">${esc(e.message)}</p>`; return; }
    if (pagina() !== "cadastro" || FILA.aba !== "sem") return;
  }
  const l = FILA.sem, naBase = l.filter((x) => x.base).length;
  corpo.innerHTML = `<p class="nota" style="margin-bottom:10px">Produtos que <b>vendem</b> mas não existem na dim_produtos — por isso não aparecem em nenhum planograma. Quando a base de ativos conhece o código, o cadastro já vem preenchido.</p>
    <div class="fila-filtros"><label class="campo"><span>Procurar</span><input id="fs-busca" type="search" placeholder="EAN ou descrição da base" value="${esc(FILA.buscaSem)}"></label></div>
    <div class="chips-rec" style="margin-bottom:10px"><span class="chip-rec">🆕 ${l.length} sem cadastro</span><span class="chip-rec">📄 ${naBase} já na base de ativos (vêm preenchidos)</span><span class="nota" id="fs-conta"></span></div>
    <div class="tabela-wrap"><table class="simples fila"><thead><tr><th>EAN</th><th>Na base de ativos</th><th>Lojas</th><th class="num">Venda</th><th></th></tr></thead><tbody id="fs-linhas"></tbody></table></div>
    <div id="fs-mais" style="margin-top:10px"></div>`;
  const pintar = () => {
    const b = semAcento(FILA.buscaSem);
    const vis = l.filter((x) => !b || semAcento([x.ean, x.base?.descricao, x.base?.marca].join(" ")).includes(b));
    const mostra = vis.slice(0, FILA.limiteSem);
    $("#fs-conta").textContent = vis.length === l.length ? "os que mais vendem primeiro" : vis.length + " no filtro";
    $("#fs-linhas").innerHTML = mostra.length ? mostra.map((x) => `<tr>
        <td class="num"><b>${esc(x.ean)}</b></td>
        <td>${x.base ? `${esc(x.base.descricao || "")}<small>${esc([x.base.categoria, x.base.subcategoria].filter(Boolean).join(" › "))}</small>` : '<span class="nota">não está na base</span>'}</td>
        <td>${esc(x.lojas || "")}</td>
        <td class="num">${esc(reais(x.venda))}</td>
        <td><button type="button" class="btn btn-primario mini" data-fcad="${esc(x.ean)}">Cadastrar</button></td></tr>`).join("")
      : `<tr><td colspan="5" class="nota">${l.length ? "Nada com esse filtro." : "🎉 Nenhum produto com venda sem cadastro."}</td></tr>`;
    $("#fs-mais").innerHTML = vis.length > mostra.length ? `<button type="button" class="btn btn-borda" id="fs-mais-btn">Mostrar mais (${vis.length - mostra.length})</button>` : "";
    const mb = $("#fs-mais-btn"); if (mb) mb.onclick = () => { FILA.limiteSem += 200; pintar(); };
    $$("[data-fcad]").forEach((bt) => bt.onclick = () => abrirNovoItem(bt.dataset.fcad, { aoSalvar: depoisDeCadastrar }));
  };
  $("#fs-busca").oninput = (e) => { FILA.buscaSem = e.target.value; FILA.limiteSem = 200; pintar(); };
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
