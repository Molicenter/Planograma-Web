/* =====================================================================
   gondola.js - CANVAS DA GONDOLA (arrastar e soltar)
   ---------------------------------------------------------------------
   E o gondola_dnd/index.html do Streamlit (v7.40), agora como modulo do
   app: em vez de mandar mensagem pro Python e esperar o rerun, ele chama
   os callbacks direto. Todos os gestos sao os mesmos:
     - arrastar produto entre reguas e pro/do Banco;
     - alca da direita estica as frentes; -/+ ; X manda pro Banco;
     - seta azul duplica na regua de baixo (mesmo modulo) - v7.27;
     - tarja laranja = altura da regua, com emprestimo em cascata - v7.25;
     - barra cinza do topo = altura total do modulo, com ima - v7.26;
     - dois cliques no produto = editor (so admin);
     - Colorir por marca / subcategoria.

   Gondola.montar(el, cfg, estado, cb)
     cfg   = {slots, escala, produtos{ean:{desc,foto,larg,alt,prof,cod_erp,marca,sub,preco}},
              edita, ajustaAlt, titulo, vazia, estatico}
     estado= {shelves:[[{ean,frentes}]], fora:[{ean,motivo}]}
     cb    = {mudou(estado), alturas([alt por slot]), editar(ean)}
   ===================================================================== */
(function (raiz) {
  "use strict";
  var ALT_MIN = 8;          /* cm - regua nao fica menor que isso */
  var IMA_CM = 4;           /* encosta no topo do outro modulo */
  var DBL_MS = 350;
  var PALETA = ["#1e88e5", "#e53935", "#43a047", "#fb8c00", "#8e24aa", "#00acc1",
    "#c0ca33", "#6d4c41", "#d81b60", "#3949ab", "#00897b", "#f4511e",
    "#7cb342", "#5e35b1", "#fdd835", "#546e7a"];

  function Gondola(el, cfg, estado, cb) {
    this.el = el; this.cfg = cfg; this.cb = cb || {};
    this.state = { shelves: estado.shelves.map(function (sh) { return sh.map(function (e) { return { ean: e.ean, frentes: e.frentes }; }); }),
      fora: estado.fora.map(function (i) { return { ean: i.ean, motivo: i.motivo }; }) };
    this.drag = null; this.dragAlt = null; this.dragTopo = null;
    this.lastTap = { ean: null, t: 0 };
    this.filtroTxt = "";
    try { this.modoCor = localStorage.getItem("plano_web_cor") || "nada"; } catch (e) { this.modoCor = "nada"; }
    this.mapaCor = {};
    var g = document.getElementById("ghost");
    if (!g) { g = document.createElement("div"); g.id = "ghost"; document.body.appendChild(g); }
    this.ghost = g;
    this.render();
  }
  var P = Gondola.prototype;

  /* ---------- avisos pro app ---------- */
  P.mudou = function () { this.render(); if (this.cb.mudou) this.cb.mudou(this.estado()); };
  P.estado = function () { return JSON.parse(JSON.stringify(this.state)); };
  P.alturasAtuais = function () { var a = []; for (var s = 0; s < this.state.shelves.length; s++) a.push(this.alturaRegua(s)); return a; };

  /* ---------- helpers ---------- */
  P.pinfo = function (ean) { return this.cfg.produtos[ean] || {}; };
  P.slotDe = function (s) { var sl = this.cfg.slots; return sl[Math.min(s, sl.length - 1)]; };
  P.alturaRegua = function (s) { return this.slotDe(s).alt; };
  P.larguraRegua = function (s) { return this.slotDe(s).larg; };
  P.gruposPorModulo = function () {
    var g = [], self = this;
    for (var s = 0; s < this.state.shelves.length; s++) {
      var m = this.slotDe(s).mod || 0;
      while (g.length <= m) g.push([]);
      g[m].push(s);
    }
    g.forEach(function (x) { x.sort(function (a, b) { return self.slotDe(a).reg - self.slotDe(b).reg; }); });
    return g;
  };
  P.larguraPx = function (ean) { var p = this.pinfo(ean); return Math.max(6, Math.round((p.larg || 0) * this.cfg.escala)); };
  P.alturaPx = function (ean) { var p = this.pinfo(ean); return Math.max(10, Math.round((p.alt || 0) * this.cfg.escala)); };
  P.ocupacao = function (shelf) {
    var cm = 0, self = this;
    shelf.forEach(function (e) { var p = self.pinfo(e.ean); if (p.larg) cm += p.larg * e.frentes; });
    return cm;
  };
  function fmt(v) { return v.toFixed(1).replace(".", ","); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dimTxt(p) {
    if (p.larg && p.alt) { var t = fmt(p.larg) + " x " + fmt(p.alt); if (p.prof) t += " x " + fmt(p.prof); return t + " cm (LxAxP)"; }
    return "sem dimensão";
  }
  P.tituloProd = function (p, ean, frentes) {
    var t = "";
    if (p.cod_erp) t += "Cód ERP: " + p.cod_erp + "\n";
    t += (p.desc || ean);
    if (frentes !== undefined) t += " | R$ " + (p.preco || 0).toFixed(2) + " | " + frentes + " frente(s)";
    t += "\n" + dimTxt(p) + "\nEAN " + ean;
    if (this.cfg.edita) t += "\nDois cliques = editar";
    return t;
  };
  P.tapDuplo = function (ean) {
    var agora = Date.now();
    if (this.lastTap.ean === ean && agora - this.lastTap.t < DBL_MS) { this.lastTap = { ean: null, t: 0 }; return true; }
    this.lastTap = { ean: ean, t: agora }; return false;
  };
  P.chaveCor = function (ean) {
    var p = this.pinfo(ean);
    if (this.modoCor === "marca") return (p.marca || "(sem marca)").trim().toUpperCase();
    if (this.modoCor === "sub") return (p.sub || "(sem subcategoria)").trim();
    return null;
  };
  P.montarMapaCor = function () {
    this.mapaCor = {};
    if (this.modoCor === "nada") return [];
    var ordem = [], visto = {}, self = this;
    this.state.shelves.forEach(function (sh) { sh.forEach(function (e) {
      var k = self.chaveCor(e.ean); if (k !== null && !visto[k]) { visto[k] = 1; ordem.push(k); }
    }); });
    ordem.forEach(function (k, i) { self.mapaCor[k] = PALETA[i % PALETA.length]; });
    return ordem;
  };
  P.shelfAbaixoMesmoModulo = function (s) {
    var g = this.gruposPorModulo();
    for (var m = 0; m < g.length; m++) { var pos = g[m].indexOf(s); if (pos !== -1) return pos + 1 < g[m].length ? g[m][pos + 1] : null; }
    return null;
  };

  /* ---------- render ---------- */
  P.render = function () {
    var self = this, cfg = this.cfg, root = this.el;
    root.innerHTML = "";
    root.className = "gd-root" + (cfg.estatico ? " gd-estatico" : "");
    var legendaKeys = cfg.estatico ? [] : this.montarMapaCor();
    var gcol = document.createElement("div"); gcol.className = "gcol";
    var gbox = document.createElement("div"); gbox.className = "gbox";
    gcol.appendChild(gbox); root.appendChild(gcol);
    if (cfg.titulo) {
      var pl = document.createElement("div"); pl.className = "placa";
      pl.textContent = cfg.titulo; pl.title = cfg.titulo; gbox.appendChild(pl);
    }
    var grupos = this.gruposPorModulo(), OVER = 26, ajusta = cfg.ajustaAlt && !cfg.estatico;
    var altPx = grupos.map(function (g) {
      var soma = 0; g.forEach(function (s) { soma += self.alturaRegua(s) * cfg.escala; });
      return Math.round(soma) + OVER * g.length;
    });
    var alvo = Math.max.apply(null, altPx.concat([0]));
    var gcase = document.createElement("div"); gcase.className = "gcase";
    var upL = document.createElement("div"); upL.className = "upright"; gcase.appendChild(upL);

    grupos.forEach(function (g, m) {
      var W = Math.round(self.larguraRegua(g[0]) * cfg.escala);
      var inner = document.createElement("div"); inner.className = "ginner";
      var sp = document.createElement("div"); sp.className = "modfolga"; sp.dataset.mod = m;
      sp.style.height = Math.max(0, alvo - altPx[m]) + "px"; inner.appendChild(sp);
      var topo = document.createElement("div");
      topo.className = "gtopo" + (ajusta ? " ajusta" : ""); topo.dataset.mod = m; topo.style.width = W + "px";
      if (ajusta) {
        topo.innerHTML = "<span class='grip'></span>";
        topo.title = "Topo do módulo - arraste pra cima/baixo pra mudar a ALTURA TOTAL (a régua do topo acompanha). Encosta sozinho quando chega na altura de outro módulo.";
        self.ligarArrasteTopo(topo, g);
      }
      inner.appendChild(topo);
      if (grupos.length > 1) {
        var tg = document.createElement("div"); tg.className = "modtag";
        tg.textContent = "M" + (m + 1) + " · " + (+self.larguraRegua(g[0])).toFixed(0) + " cm";
        inner.appendChild(tg);
      }
      g.forEach(function (s, pos) {
        var shelf = self.state.shelves[s], altCm = self.alturaRegua(s), largCm = self.larguraRegua(s);
        var sh = document.createElement("div");
        sh.className = "shelf"; sh.dataset.shelf = s;
        sh.style.width = W + "px"; sh.style.height = Math.round(altCm * cfg.escala) + "px";
        shelf.forEach(function (e, i) { sh.appendChild(self.mkBlock(e, s, i)); });
        inner.appendChild(sh);
        var cm = self.ocupacao(shelf), pct = largCm ? cm / largCm : 0;
        var cls = cm <= 0 ? "zero" : pct > 1.001 ? "over" : pct >= 0.9 ? "ok" : pct >= 0.7 ? "warn" : "low";
        var te = document.createElement("div");
        te.className = "testeira" + (ajusta ? " ajusta" : "");
        te.style.width = Math.max(20, W - 16) + "px"; te.dataset.slot = s;
        te.innerHTML = "<span class='rot'>R" + (pos + 1) + (pos === 0 ? " (topo)" : "") + " · " + (+altCm).toFixed(0) + " cm</span>" +
          (ajusta ? "<span class='grip'></span>" : "") +
          "<span class='occ " + cls + "'>" + cm.toFixed(0) + "/" + largCm.toFixed(0) + " cm (" + Math.round(pct * 100) + "%)</span>";
        if (ajusta) {
          var abaixos = g.slice(pos + 1);
          te.title = "Arraste pra cima/baixo pra mudar a altura desta régua" + (abaixos.length
            ? " (o que ela ganha, as de baixo perdem — a altura do módulo não muda)"
            : " (é a última: muda a altura do módulo)");
          self.ligarArrasteAltura(te, s, abaixos, sh);
        }
        inner.appendChild(te);
      });
      var base = document.createElement("div"); base.className = "gbase"; base.style.width = W + "px";
      inner.appendChild(base);
      gcase.appendChild(inner);
      var up = document.createElement("div"); up.className = "upright"; gcase.appendChild(up);
    });
    gbox.appendChild(gcase);
    if (cfg.vazia) {
      var vz = document.createElement("div"); vz.className = "vazio";
      vz.innerHTML = "<div><span style='font-size:30px'>⬅️</span><b>Escolha uma categoria</b>" +
        "<small>Enquanto isso, dá pra ajustar a altura das réguas pela tarja laranja e a altura total pela barra cinza do topo.</small></div>";
      gbox.appendChild(vz);
    }
    if (cfg.estatico) return;

    /* ---------- painel lateral ---------- */
    var side = document.createElement("div"); side.className = "side"; root.appendChild(side);
    if (!cfg.vazia) {
      var bcor = document.createElement("div"); bcor.className = "bloco";
      bcor.innerHTML = "<h4>🎨 Colorir por</h4>";
      var cores = document.createElement("div"); cores.className = "cores";
      [["nada", "Nada"], ["marca", "Marca"], ["sub", "Subcategoria"]].forEach(function (o) {
        var b = document.createElement("button"); b.type = "button";
        b.textContent = o[1]; if (self.modoCor === o[0]) b.className = "on";
        b.addEventListener("click", function () {
          self.modoCor = o[0]; try { localStorage.setItem("plano_web_cor", o[0]); } catch (e) {}
          self.render();
        });
        cores.appendChild(b);
      });
      bcor.appendChild(cores);
      if (legendaKeys.length) {
        var lg = document.createElement("div"); lg.className = "legenda-cor";
        legendaKeys.forEach(function (k) {
          var s2 = document.createElement("span");
          s2.innerHTML = "<i style='background:" + self.mapaCor[k] + "'></i>";
          s2.appendChild(document.createTextNode(k)); lg.appendChild(s2);
        });
        bcor.appendChild(lg);
      }
      side.appendChild(bcor);
    }
    var bb = document.createElement("div"); bb.className = "bloco";
    bb.innerHTML = "<h4>📦 Banco / Fora (" + this.state.fora.length + ")</h4>" +
      "<div class='banco-sub'>Arraste pra cá pra tirar da gôndola; arraste daqui pra uma régua pra colocar.</div>";
    var filtro = document.createElement("input");
    filtro.className = "filtro"; filtro.type = "search"; filtro.placeholder = "Buscar produto no Banco…";
    filtro.value = this.filtroTxt; filtro.autocomplete = "off";
    filtro.addEventListener("input", function () { self.filtroTxt = filtro.value; self.renderBanco(); });
    bb.appendChild(filtro);
    var bc = document.createElement("div"); bc.className = "banco"; this.bancoEl = bc;
    bb.appendChild(bc); side.appendChild(bb);
    this.renderBanco();
    var hb = document.createElement("div"); hb.className = "bloco";
    hb.innerHTML = "<h4>💡 Como usar</h4>";
    var hint = document.createElement("p"); hint.className = "hint";
    hint.textContent = "Alça da direita estica as frentes; −/+ ajustam a quantidade; o X vermelho manda o item pro Banco; o ⬇ azul duplica o produto na régua de baixo (mesmo módulo). Cada módulo é fechado: o produto não atravessa a emenda." +
      (cfg.ajustaAlt ? " Arraste a tarja laranja pra cima/baixo pra mudar a altura da régua, e a barra cinza do topo pra mudar a altura TOTAL do módulo (ela encosta sozinha na altura dos outros)." : "") +
      (cfg.edita ? " Dois cliques num produto abrem o editor de medidas." : "");
    hb.appendChild(hint); side.appendChild(hb);
  };

  P.renderBanco = function () {
    var self = this, bc = this.bancoEl; if (!bc) return;
    bc.innerHTML = "";
    var f = this.filtroTxt.trim().toLowerCase();
    this.state.fora.forEach(function (item, k) {
      var p = self.pinfo(item.ean), nome = (p.desc || item.ean).toLowerCase();
      if (f && nome.indexOf(f) === -1 && String(item.ean).indexOf(f) === -1) return;
      bc.appendChild(self.mkChip(item, k));
    });
    if (!bc.children.length)
      bc.innerHTML = "<span class='banco-vazio'>" + (f ? "Nada com esse nome no Banco." : "Banco vazio.") + "</span>";
  };

  P.mkBlock = function (e, s, i) {
    var self = this, cfg = this.cfg, p = this.pinfo(e.ean);
    var wUnit = this.larguraPx(e.ean), h = this.alturaPx(e.ean), largoTotal = wUnit * e.frentes;
    var b = document.createElement("div");
    var estoura = p.alt && p.alt > this.alturaRegua(s) + 0.01;
    b.className = "blk" + (p.foto ? "" : " nofoto") + (estoura ? " alto" : "");
    b.style.width = largoTotal + "px"; b.style.height = h + "px";
    b.title = this.tituloProd(p, e.ean, e.frentes) + (estoura ? "\n⚠ mais alto que esta régua (" + (+this.alturaRegua(s)).toFixed(0) + " cm)" : "");
    if (p.foto) { b.style.backgroundImage = 'url("' + p.foto + '")'; b.style.backgroundSize = wUnit + "px 100%"; }
    else { var n = document.createElement("div"); n.className = "nome"; n.textContent = (p.desc || e.ean).slice(0, 20); b.appendChild(n); }
    var badge = document.createElement("div"); badge.className = "badge"; badge.textContent = "×" + e.frentes; b.appendChild(badge);
    var kc = cfg.estatico ? null : this.chaveCor(e.ean);
    if (kc !== null) {
      var c0 = this.mapaCor[kc] || "#999";
      b.classList.add("comcor"); b.style.setProperty("--c", c0);
      var fx = document.createElement("div"); fx.className = "cor"; fx.style.background = c0; b.appendChild(fx);
      b.title += "\n" + (this.modoCor === "marca" ? "Marca: " : "Subcategoria: ") + kc;
    }
    if (cfg.estatico) return b;

    function botao(cls, txt, tit, acao) {
      var x = document.createElement("div"); x.className = cls; x.textContent = txt; x.title = tit;
      x.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); ev.preventDefault(); });
      x.addEventListener("click", function (ev) { ev.stopPropagation(); acao(); });
      b.appendChild(x); return x;
    }
    var cabem = largoTotal >= 52;
    if (cabem) {
      botao("fbtn minus", "−", "Tirar 1 frente", function () { if (self.state.shelves[s][i].frentes > 1) { self.state.shelves[s][i].frentes--; self.mudou(); } });
      botao("fbtn plus", "+", "Somar 1 frente", function () { self.state.shelves[s][i].frentes++; self.mudou(); });
    }
    var bx = botao("xbtn", "×", "Remover item (manda pro Banco)", function () {
      var it = self.state.shelves[s][i]; if (!it) return;
      self.state.shelves[s].splice(i, 1);
      self.state.fora.push({ ean: it.ean, motivo: "removido manualmente" });
      self.mudou();
    });
    bx.style.right = cabem ? "13px" : "-6px";
    var alvoDup = this.shelfAbaixoMesmoModulo(s);
    if (cabem && alvoDup !== null && h >= 22)
      botao("dbtn", "⬇", "Duplicar este produto na régua de baixo (mesmo módulo)", function () {
        var it = self.state.shelves[s][i]; if (!it) return;
        self.state.shelves[alvoDup].push({ ean: it.ean, frentes: it.frentes }); self.mudou();
      });

    var handle = document.createElement("div"); handle.className = "handle"; handle.title = "Arraste pra esticar (frentes)";
    b.appendChild(handle);
    handle.addEventListener("pointerdown", function (ev) {
      ev.stopPropagation(); ev.preventDefault(); handle.setPointerCapture(ev.pointerId);
      self.drag = { type: "stretch", s: s, i: i, startX: ev.clientX, startFr: e.frentes, unit: wUnit, blk: b, badge: badge };
    });
    handle.addEventListener("pointermove", function (ev) {
      var d = self.drag; if (!d || d.type !== "stretch") return;
      var fr = Math.max(1, Math.round((d.startFr * d.unit + ev.clientX - d.startX) / d.unit));
      d.fr = fr; d.blk.style.width = fr * d.unit + "px"; d.badge.textContent = "×" + fr;
    });
    handle.addEventListener("pointerup", function () {
      var d = self.drag; if (!d || d.type !== "stretch") return;
      var fr = d.fr !== undefined ? d.fr : d.startFr;
      self.drag = null;
      if (fr !== d.startFr) { self.state.shelves[d.s][d.i].frentes = fr; self.mudou(); }
    });
    b.addEventListener("pointerdown", function (ev) {
      if (ev.target === handle) return;
      ev.preventDefault();
      if (cfg.edita && self.tapDuplo(e.ean)) { self.drag = null; if (self.cb.editar) self.cb.editar(e.ean); return; }
      b.setPointerCapture(ev.pointerId);
      self.drag = { type: "move", from: "shelf", s: s, i: i, ean: e.ean, frentes: e.frentes, blk: b, w: largoTotal, h: h, unit: wUnit, foto: p.foto };
      self.startGhost(ev); b.classList.add("dragging");
    });
    b.addEventListener("pointermove", function (ev) { self.moveGhost(ev); });
    b.addEventListener("pointerup", function (ev) { self.dropAt(ev); });
    return b;
  };

  P.mkChip = function (item, k) {
    var self = this, p = this.pinfo(item.ean), temDim = p.larg && p.alt;
    var c = document.createElement("div");
    c.className = "chip" + (temDim ? "" : " sem-dim");
    var mot = temDim ? "<span class='mot'>" + esc(item.motivo || "") + "</span>"
      : "<span class='mot'>sem dimensão" + (this.cfg.edita ? " — 2 cliques p/ medir" : "") + "</span>";
    c.innerHTML = (p.foto ? '<img src="' + esc(p.foto) + '" alt="" loading="lazy">' : "") +
      "<span class='cn'>" + esc(p.desc || item.ean) + "<br>" + mot + "</span>";
    c.title = this.tituloProd(p, item.ean);
    c.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      if (self.cfg.edita && self.tapDuplo(item.ean)) { self.drag = null; if (self.cb.editar) self.cb.editar(item.ean); return; }
      if (!temDim) return;
      c.setPointerCapture(ev.pointerId);
      self.drag = { type: "move", from: "banco", k: k, ean: item.ean, frentes: 1, blk: c,
        w: self.larguraPx(item.ean), h: self.alturaPx(item.ean), unit: self.larguraPx(item.ean), foto: p.foto };
      self.startGhost(ev); c.classList.add("dragging");
    });
    c.addEventListener("pointermove", function (ev) { self.moveGhost(ev); });
    c.addEventListener("pointerup", function (ev) { self.dropAt(ev); });
    return c;
  };

  /* ---------- tarja = altura da regua (emprestimo em cascata, v7.25) ---------- */
  P._rotAltura = function (el, s) {
    var r = el.querySelector(".rot"); if (!r) return;
    r.textContent = r.textContent.replace(/· [\d.,]+ cm$/, "· " + this.alturaRegua(s).toFixed(0) + " cm");
  };
  function repartirAltura(d, hs) {
    var novas = hs.slice(), real = 0;
    if (!hs.length) return { novas: novas, real: d };
    if (d <= 0) { novas[0] = hs[0] - d; return { novas: novas, real: d }; }
    var falta = d;
    for (var i = 0; i < novas.length && falta > 0; i++) {
      var t = Math.min(Math.max(0, novas[i] - ALT_MIN), falta);
      novas[i] -= t; falta -= t; real += t;
    }
    return { novas: novas, real: real };
  }
  P.ligarArrasteAltura = function (te, s, abaixos, shEl) {
    var self = this, cfg = this.cfg;
    te.addEventListener("pointerdown", function (ev) {
      ev.preventDefault(); ev.stopPropagation(); te.setPointerCapture(ev.pointerId);
      self.dragAlt = { s: s, y0: ev.clientY, hA: self.alturaRegua(s), elA: shEl, te: te,
        ab: abaixos.map(function (k) {
          return { s: k, h: self.alturaRegua(k), el: self.el.querySelector('.shelf[data-shelf="' + k + '"]'),
            te: self.el.querySelector('.testeira[data-slot="' + k + '"]') };
        }) };
      te.classList.add("arrastando");
    });
    te.addEventListener("pointermove", function (ev) {
      var d = self.dragAlt; if (!d || d.te !== te) return;
      var dd = Math.round((ev.clientY - d.y0) / cfg.escala);
      if (d.hA + dd < ALT_MIN) dd = ALT_MIN - d.hA;
      var r = repartirAltura(dd, d.ab.map(function (o) { return o.h; }));
      var a = d.hA + r.real; if (a < ALT_MIN) return;
      cfg.slots[d.s].alt = a; d.elA.style.height = Math.round(a * cfg.escala) + "px"; self._rotAltura(te, d.s);
      d.ab.forEach(function (o, i) {
        var h = r.novas[i]; if (Math.abs(h - cfg.slots[o.s].alt) < 0.01) return;
        cfg.slots[o.s].alt = h; if (o.el) o.el.style.height = Math.round(h * cfg.escala) + "px"; if (o.te) self._rotAltura(o.te, o.s);
      });
    });
    function soltar() {
      if (!self.dragAlt || self.dragAlt.te !== te) return;
      te.classList.remove("arrastando"); self.dragAlt = null;
      self.render(); if (self.cb.alturas) self.cb.alturas(self.alturasAtuais());
    }
    te.addEventListener("pointerup", soltar); te.addEventListener("pointercancel", soltar);
  };

  /* ---------- topo = altura total do modulo (ima, v7.26) ---------- */
  P._somaModulo = function (g) { var t = 0, self = this; g.forEach(function (s) { t += self.alturaRegua(s); }); return t; };
  P._ajustarFolgas = function () {
    var self = this, grupos = this.gruposPorModulo(), OVER = 26;
    var altPx = grupos.map(function (g) { var soma = 0; g.forEach(function (s) { soma += self.alturaRegua(s) * self.cfg.escala; }); return Math.round(soma) + OVER * g.length; });
    var alvo = Math.max.apply(null, altPx.concat([0]));
    grupos.forEach(function (g, m) { var sp = self.el.querySelector('.modfolga[data-mod="' + m + '"]'); if (sp) sp.style.height = Math.max(0, alvo - altPx[m]) + "px"; });
  };
  P.ligarArrasteTopo = function (el, g) {
    var self = this, cfg = this.cfg, sTopo = g[0];
    el.addEventListener("pointerdown", function (ev) {
      ev.preventDefault(); ev.stopPropagation(); el.setPointerCapture(ev.pointerId);
      var outras = self.gruposPorModulo().filter(function (o) { return o[0] !== sTopo; }).map(function (o) { return self._somaModulo(o); });
      self.dragTopo = { s: sTopo, y0: ev.clientY, h0: self.alturaRegua(sTopo), total0: self._somaModulo(g), outras: outras, el: el,
        shelf: self.el.querySelector('.shelf[data-shelf="' + sTopo + '"]'), te: self.el.querySelector('.testeira[data-slot="' + sTopo + '"]') };
      el.classList.add("arrastando");
    });
    el.addEventListener("pointermove", function (ev) {
      var d = self.dragTopo; if (!d || d.el !== el) return;
      var a = Math.max(ALT_MIN, d.h0 + Math.round((d.y0 - ev.clientY) / cfg.escala));
      var total = d.total0 + (a - d.h0), grudou = false;
      for (var i = 0; i < d.outras.length; i++) {
        var alvo = d.outras[i];
        if (Math.abs(total - alvo) <= IMA_CM && a + (alvo - total) >= ALT_MIN) { a += alvo - total; total = alvo; grudou = true; break; }
      }
      el.classList.toggle("alinhado", grudou);
      cfg.slots[d.s].alt = a;
      if (d.shelf) d.shelf.style.height = Math.round(a * cfg.escala) + "px";
      if (d.te) self._rotAltura(d.te, d.s);
      self._ajustarFolgas();
    });
    function soltar() {
      if (!self.dragTopo || self.dragTopo.el !== el) return;
      el.classList.remove("arrastando"); self.dragTopo = null;
      self.render(); if (self.cb.alturas) self.cb.alturas(self.alturasAtuais());
    }
    el.addEventListener("pointerup", soltar); el.addEventListener("pointercancel", soltar);
  };

  /* ---------- arrastar produto ---------- */
  P.startGhost = function (ev) {
    var g = this.ghost, d = this.drag;
    g.style.width = d.w + "px"; g.style.height = d.h + "px";
    if (d.foto) { g.style.backgroundImage = 'url("' + d.foto + '")'; g.style.backgroundSize = d.unit + "px 100%"; }
    else g.style.backgroundImage = "none";
    g.style.display = "block"; this.moveGhost(ev);
  };
  P.moveGhost = function (ev) {
    var d = this.drag; if (!d || d.type !== "move") return;
    var g = this.ghost;
    g.style.left = ev.clientX - d.w / 2 + "px"; g.style.top = ev.clientY - d.h + 8 + "px";
    this.el.querySelectorAll(".dragover").forEach(function (x) { x.classList.remove("dragover"); });
    var alvo = this.alvoEm(ev.clientX, ev.clientY);
    if (alvo && alvo.el) alvo.el.classList.add("dragover");
  };
  P.alvoEm = function (x, y) {
    var g = this.ghost; g.style.display = "none";
    var el = document.elementFromPoint(x, y); g.style.display = "block";
    if (!el || !this.el.contains(el)) return null;
    var sh = el.closest(".shelf");
    if (sh) return { tipo: "shelf", s: parseInt(sh.dataset.shelf, 10), el: sh, x: x };
    var bc = el.closest(".banco");
    if (bc) return { tipo: "banco", el: bc };
    return null;
  };
  P.dropAt = function (ev) {
    var d = this.drag; if (!d || d.type !== "move") return;
    var alvo = this.alvoEm(ev.clientX, ev.clientY);
    this.ghost.style.display = "none";
    this.el.querySelectorAll(".dragover").forEach(function (x) { x.classList.remove("dragover"); });
    if (d.blk) d.blk.classList.remove("dragging");
    this.drag = null;
    if (!alvo || (d.from === "banco" && alvo.tipo === "banco")) { this.render(); return; }
    var mov;
    if (d.from === "shelf") mov = this.state.shelves[d.s].splice(d.i, 1)[0];
    else { var it = this.state.fora.splice(d.k, 1)[0]; mov = { ean: it.ean, frentes: 1 }; }
    if (alvo.tipo === "banco") this.state.fora.push({ ean: mov.ean, motivo: "removido manualmente" });
    else {
      var idx = this.state.shelves[alvo.s].length, blocos = alvo.el.querySelectorAll(".blk:not(.dragging)");
      for (var j = 0; j < blocos.length; j++) { var r = blocos[j].getBoundingClientRect(); if (alvo.x < r.left + r.width / 2) { idx = j; break; } }
      this.state.shelves[alvo.s].splice(idx, 0, mov);
    }
    this.mudou();
  };

  raiz.Gondola = {
    montar: function (el, cfg, estado, cb) { return new Gondola(el, cfg, estado, cb); },
    ALT_MIN: ALT_MIN
  };
})(typeof window !== "undefined" ? window : this);
