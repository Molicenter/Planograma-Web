/* =====================================================================
   motor.js - MOTOR DO PLANOGRAMA (Molicenter) em JavaScript
   ---------------------------------------------------------------------
   Traducao fiel, funcao a funcao, do motor do planograma.py v7.42
   (Streamlit) + fileira.py v7.22. Mesmos nomes, mesma ordem, mesmas
   regras - o historico de cada regra continua documentado la.

   Roda no navegador (window.Motor) e no Node (module.exports), sem DOM.

   PARIDADE: a saida foi conferida contra o Python original com dados
   reais (test/paridade.js). Para isso alguns detalhes "invisiveis" do
   Python/pandas foram reproduzidos de proposito:
     - soma de coluna do pandas  = soma PAREADA do numpy  (somaPd)
     - soma/media de groupby     = soma de KAHAN          (somaGrupo)
     - sum() do Python 3.12+     = soma de NEUMAIER        (somaPy)
     - `//` do Python            = divisao piso do CPython (divPiso)
     - round() do Python         = meio-para-par decimal   (arred)
     - groupby ordena as chaves e descarta chave vazia (NaN)
   Mexer nisso muda o resultado em casos de fronteira - nao "simplifique".
   ===================================================================== */
(function (raiz, fabrica) {
  if (typeof module === "object" && module.exports) module.exports = fabrica();
  else raiz.Motor = fabrica();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------------- constantes (iguais ao planograma.py) ---------------- */
  var FRENTES_MIN_ESPELHO = 4;
  var MAX_FRENTES_TOPO = 4;
  var LIMIAR_GIGANTE_PRAT = 0.75;
  var LIMIAR_GIGANTE_MEDIA = 1.30;
  var FRACAO_MAX_GIGANTE = 0.50;
  var FATOR_CLASSE_PORTE = 1.35;
  var MAX_CLASSES_PORTE = 3;
  var MIN_CLASSE_REGUA = 0.85;
  var TOL_DENSIDADE = 1.15;
  var FRACAO_MAX_GIGANTES = 0.15;
  var DEGRAU_MIN_CM = 4.0;
  var TOL_NIVEL = 2.0;

  /* =====================================================================
     APOIO NUMERICO (comportamento do Python/pandas)
     ===================================================================== */
  function vazio(v) { return v === null || v === undefined || (typeof v === "number" && isNaN(v)); }
  function num(v) { return vazio(v) ? NaN : Number(v); }

  /* soma pareada do numpy (pandas Series.sum) */
  function _par(a, i0, n) {
    var i, r;
    if (n < 8) { r = 0.0; for (i = 0; i < n; i++) r += a[i0 + i]; return r; }
    if (n <= 128) {
      var q = [a[i0], a[i0 + 1], a[i0 + 2], a[i0 + 3], a[i0 + 4], a[i0 + 5], a[i0 + 6], a[i0 + 7]];
      for (i = 8; i < n - (n % 8); i += 8)
        for (var j = 0; j < 8; j++) q[j] += a[i0 + i + j];
      r = ((q[0] + q[1]) + (q[2] + q[3])) + ((q[4] + q[5]) + (q[6] + q[7]));
      for (; i < n; i++) r += a[i0 + i];
      return r;
    }
    var n2 = Math.floor(n / 2); n2 -= n2 % 8;
    return _par(a, i0, n2) + _par(a, i0 + n2, n - n2);
  }
  /* pandas: NaN e pulado (vira 0) */
  function somaPd(lista) {
    var a = lista.map(function (v) { return vazio(v) ? 0.0 : Number(v); });
    return _par(a, 0, a.length);
  }
  /* pandas groupby sum (Kahan) */
  function somaGrupo(lista) {
    var s = 0.0, c = 0.0;
    for (var i = 0; i < lista.length; i++) {
      var x = lista[i]; if (vazio(x)) continue;
      var y = x - c, t = s + y; c = (t - s) - y; s = t;
    }
    return s;
  }
  function mediaGrupo(lista) {
    var v = lista.filter(function (x) { return !vazio(x); });
    return v.length ? somaGrupo(v) / v.length : NaN;
  }
  /* sum() do Python 3.12+ (Neumaier) */
  function somaPy(lista) {
    var s = 0.0, c = 0.0;
    for (var i = 0; i < lista.length; i++) {
      var x = Number(lista[i]), t = s + x;
      if (Math.abs(s) >= Math.abs(x)) c += (s - t) + x; else c += (x - t) + s;
      s = t;
    }
    return (c && isFinite(c)) ? s + c : s;
  }
  /* a // b do CPython (float) */
  function divPiso(vx, wx) {
    var mod = vx % wx, div = (vx - mod) / wx;
    if (mod) { if ((wx < 0) !== (mod < 0)) { mod += wx; div -= 1.0; } }
    var fd;
    if (div) { fd = Math.floor(div); if (div - fd > 0.5) fd += 1.0; }
    else fd = (vx / wx < 0 || Object.is(vx / wx, -0)) ? -0 : 0;
    return fd;
  }
  /* round(x, nd) do Python: meio-para-par sobre o valor decimal EXATO */
  function arred(x, nd) {
    if (!isFinite(x)) return x;
    var s = Math.abs(x).toFixed(Math.min(100, nd + 30));   /* expansao exata o bastante */
    var p = s.indexOf("."), ip = s.slice(0, p), fp = s.slice(p + 1);
    var mant = ip + fp.slice(0, nd), resto = fp.slice(nd);
    var acima = false, meio = false;
    if (resto.length) {
      if (resto[0] > "5") acima = true;
      else if (resto[0] === "5") { if (/[1-9]/.test(resto.slice(1))) acima = true; else meio = true; }
    }
    var dig = BigInt(mant);
    if (acima || (meio && (dig % 2n === 1n))) dig += 1n;
    var r = Number(dig) / Math.pow(10, nd);
    /* reconstroi pelo texto pra nao introduzir erro na divisao */
    var t = dig.toString();
    if (nd > 0) { while (t.length <= nd) t = "0" + t; t = t.slice(0, t.length - nd) + "." + t.slice(t.length - nd); }
    r = parseFloat(t);
    return x < 0 ? -r : r;
  }
  /* f"{x:g}" (6 algarismos significativos, sem zeros a direita) */
  function fmtG(x) {
    x = Number(x);
    if (x === 0) return "0";
    var e = Math.floor(Math.log10(Math.abs(x)));
    if (e < -4 || e >= 6) {
      var m = x.toExponential(5).replace(/\.?0+e/, "e");
      return m.replace(/e([+-])(\d)$/, "e$10$2");
    }
    var s = x.toPrecision(6);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }
  /* repr() de float do Python (36.0 -> "36.0") */
  function reprF(x) { x = Number(x); return Number.isInteger(x) ? x.toFixed(1) : String(x); }
  function cmpTxt(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  /* sorted() estavel por chave (lista de valores comparaveis) */
  function ordenar(lista, chave, desc) {
    var idx = lista.map(function (v, i) { return [chave(v), i, v]; });
    idx.sort(function (A, B) {
      var r = cmpChave(A[0], B[0]);
      if (desc) r = -r;
      return r || (A[1] - B[1]);
    });
    return idx.map(function (t) { return t[2]; });
  }
  function cmpChave(a, b) {
    if (Array.isArray(a)) {
      for (var i = 0; i < a.length; i++) { var r = cmpChave(a[i], b[i]); if (r) return r; }
      return 0;
    }
    if (typeof a === "boolean") { a = +a; b = +b; }
    if (typeof a === "string") return cmpTxt(a, b);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function primeiroMax(lista, chave) {
    var m = null, mk;
    lista.forEach(function (v) { var k = chave(v); if (m === null || cmpChave(k, mk) > 0) { m = v; mk = k; } });
    return m;
  }
  function primeiroMin(lista, chave) {
    var m = null, mk;
    lista.forEach(function (v) { var k = chave(v); if (m === null || cmpChave(k, mk) < 0) { m = v; mk = k; } });
    return m;
  }
  function range(a, b) { var r = []; for (var i = a; i < b; i++) r.push(i); return r; }
  function maxNum(l) { return l.reduce(function (m, v) { return v > m ? v : m; }, -Infinity); }
  function minNum(l) { return l.reduce(function (m, v) { return v < m ? v : m; }, Infinity); }
  /* ordenacao do pandas por colunas (estavel, NaN no fim) */
  function ordenarPd(linhas, colunas, asc) {
    var idx = linhas.map(function (r, i) { return [r, i]; });
    idx.sort(function (A, B) {
      for (var k = 0; k < colunas.length; k++) {
        var a = A[0][colunas[k]], b = B[0][colunas[k]];
        var na = vazio(a), nb = vazio(b);
        if (na || nb) { if (na && nb) continue; return na ? 1 : -1; }
        var r = (typeof a === "string") ? cmpTxt(a, b) : (a < b ? -1 : a > b ? 1 : 0);
        if (r) return asc[k] ? r : -r;
      }
      return A[1] - B[1];
    });
    return idx.map(function (t) { return t[0]; });
  }
  /* groupby: chaves ordenadas, chave vazia descartada */
  function agrupar(linhas, col) {
    var g = {}, chaves = [];
    linhas.forEach(function (r) {
      var k = r[col]; if (vazio(k)) return;
      var kk = (typeof k === "number") ? "n:" + k : "s:" + k;
      if (!g[kk]) { g[kk] = { chave: k, linhas: [] }; chaves.push(kk); }
      g[kk].linhas.push(r);
    });
    var lst = chaves.map(function (kk) { return g[kk]; });
    lst.sort(function (a, b) { return cmpChave(a.chave, b.chave); });
    return lst;
  }
  function copiar(r) { var o = {}; for (var k in r) o[k] = r[k]; return o; }

  /* =====================================================================
     FILEIRA (fileira.py)
     ===================================================================== */
  function normalizar(mods, largura_padrao, altura_padrao) {
    largura_padrao = largura_padrao === undefined ? 130.0 : largura_padrao;
    altura_padrao = altura_padrao === undefined ? 40.0 : altura_padrao;
    var limpos = [];
    (mods || []).forEach(function (mod) {
      var larg = parseFloat(mod.largura); if (!(larg > 0)) larg = Number(largura_padrao);
      var alturas = [];
      (mod.alturas || []).forEach(function (a) { a = parseFloat(a); if (a > 0) alturas.push(a); });
      if (!alturas.length) alturas = [Number(altura_padrao)];
      limpos.push({ largura: larg, alturas: alturas });
    });
    if (!limpos.length) limpos = [{ largura: Number(largura_padrao), alturas: [Number(altura_padrao)] }];
    return limpos;
  }
  function montarSlots(mods) {
    var slots = [];
    normalizar(mods).forEach(function (mod, m) {
      var al = mod.alturas, n = al.length;
      for (var s = 0; s < n; s++)
        slots.push({ mod: m, reg: s, larg: Number(mod.largura), alt: Number(al[s]), y: somaPy(al.slice(s + 1)) });
    });
    return ordenar(slots, function (sl) { return [-sl.y, sl.mod, sl.reg]; });
  }
  function larguras(slots) { return slots.map(function (s) { return Number(s.larg); }); }
  function alturas(slots) { return slots.map(function (s) { return Number(s.alt); }); }
  function capacidade(slots) { return somaPy(slots.map(function (s) { return s.larg; })); }
  function larguraTipica(slots) {
    var ls = larguras(slots).sort(function (a, b) { return a - b; });
    return ls.length ? ls[Math.floor(ls.length / 2)] : 0.0;
  }
  function alturaTotal(mods) {
    var t = normalizar(mods).map(function (m) { return somaPy(m.alturas); });
    return t.length ? maxNum(t) : 0.0;
  }
  function niveis(slots, tol) {
    tol = tol === undefined ? TOL_NIVEL : tol;
    var g = [];
    slots.forEach(function (sl, i) {
      if (g.length && Math.abs(slots[g[g.length - 1][0]].y - sl.y) <= tol) g[g.length - 1].push(i);
      else g.push([i]);
    });
    return g;
  }
  function porModulo(slots) {
    var n = (slots.length ? maxNum(slots.map(function (s) { return s.mod; })) : 0) + 1;
    var g = []; for (var k = 0; k < n; k++) g.push([]);
    slots.forEach(function (sl, i) { g[sl.mod].push(i); });
    g.forEach(function (x) { x.sort(function (a, b) { return slots[a].reg - slots[b].reg; }); });
    return g;
  }
  function quotasPorCapacidade(blocos, largs) {
    var k = blocos.length, n = largs.length, i;
    if (k <= 0 || n <= 0) return blocos.map(function () { return 0; });
    if (k >= n) { var r = []; for (i = 0; i < k; i++) r.push(i < n ? 1 : 0); return r; }
    var q = blocos.map(function () { return 1; });
    var media = somaPy(largs) / n, restam = n - k;
    while (restam > 0) {
      var best = primeiroMax(range(0, k), function (j) { return Number(blocos[j].cm || 0.0) - q[j] * media; });
      q[best] += 1; restam -= 1;
    }
    return q;
  }
  function reparteTerritorios(clsBlocos, reguas, largs, alts) {
    var livres = reguas.slice(), res = [], restantes = clsBlocos.length;
    for (var b = clsBlocos.length - 1; b >= 0; b--) {
      var bl = clsBlocos[b];
      restantes -= 1;
      if (!livres.length) { res.push([bl, []]); continue; }
      var h = bl.itens.length ? maxNum(bl.itens.map(function (i) { return Number(i.altura_cm || 0); })) : 0.0;
      var viav = livres.filter(function (s) { return alts[s] + 1e-6 >= h; });
      if (!viav.length) viav = livres.slice();
      var max_k = Math.max(1, Math.min(viav.length, livres.length - restantes));
      var k = 0, acum = 0.0;
      for (var t = viav.length - 1; t >= 0; t--) {
        var s = viav[t];
        if (k >= max_k) break;
        if (k >= 1 && acum >= Number(bl.cm || 0.0) - 1e-6) break;
        acum += largs[s]; k += 1;
      }
      var reg = k ? viav.slice(viav.length - k).sort(function (a, c) { return a - c; }) : [];
      livres = livres.filter(function (s) { return reg.indexOf(s) < 0; });
      res.push([bl, reg]);
    }
    res.reverse();
    if (livres.length && res.length) {
      var u = res[0][1].concat(livres.filter(function (s) { return res[0][1].indexOf(s) < 0; }));
      res[0] = [res[0][0], u.sort(function (a, c) { return a - c; })];
    }
    return res;
  }
  function composicao(mods) {
    return normalizar(mods).map(function (m) { return fmtG(m.largura) + "x" + m.alturas.length; }).join("+");
  }
  function uniforme(mods, largura, nReguas) {
    return normalizar(mods).every(function (m) {
      return Math.abs(m.largura - Number(largura)) < 0.01 && m.alturas.length === Math.trunc(Number(nReguas));
    });
  }
  function chaveFileira(gNome, mods, larguraCad, reguasCad) {
    mods = normalizar(mods);
    if (uniforme(mods, larguraCad, reguasCad)) return mods.length === 1 ? gNome : gNome + " x" + mods.length;
    return gNome + " | " + composicao(mods);
  }
  function espalharAntigo(shelvesAnt, slots, largDe) {
    var novo = slots.map(function () { return []; }), sobra = [];
    (shelvesAnt || []).forEach(function (linha, r) {
      var alvo = ordenar(range(0, slots.length).filter(function (i) { return slots[i].reg === r; }),
        function (i) { return slots[i].mod; });
      if (!alvo.length) { sobra.push.apply(sobra, linha); return; }
      var j = 0, usado = 0.0;
      linha.forEach(function (e) {
        var w = Number(largDe(e.ean) || 0.0); if (isNaN(w)) w = 0.0;
        var resta = Math.max(1, Math.trunc(e.frentes === undefined ? 1 : e.frentes));
        if (w <= 0) { sobra.push(copiar(e)); return; }
        while (resta > 0 && j < alvo.length) {
          var cabe = Math.trunc(divPiso(slots[alvo[j]].larg - usado + 1e-6, w));
          if (cabe <= 0) { j += 1; usado = 0.0; continue; }
          var n = Math.min(cabe, resta), dest = novo[alvo[j]];
          if (dest.length && dest[dest.length - 1].ean === e.ean) dest[dest.length - 1].frentes += n;
          else dest.push({ ean: e.ean, frentes: n });
          usado += n * w; resta -= n;
        }
        if (resta > 0) sobra.push({ ean: e.ean, frentes: resta });
      });
    });
    return [novo, sobra];
  }

  /* =====================================================================
     MOTOR (planograma.py)
     ===================================================================== */
  /* linhas = registros da layout_base: ean, qtde, venda, margem, descricao,
     marca, categoria, subcategoria, largura_cm, altura_cm, profundidade_cm */
  function calcularPesos(linhas) {
    var d = linhas.map(copiar);
    d.forEach(function (r) { r.margem_pos = vazio(r.margem) ? NaN : Math.max(0, r.margem); });
    [["margem_pos", "margem_n"], ["venda", "venda_n"], ["qtde", "qtde_n"]].forEach(function (p) {
      var total = somaPd(d.map(function (r) { return r[p[0]]; }));
      d.forEach(function (r) { r[p[1]] = (total && total > 0) ? num(r[p[0]]) / total : 0.0; });
    });
    d.forEach(function (r) {
      r.peso = r.margem_n * 0.40 + r.venda_n * 0.30 + r.qtde_n * 0.30;
      var q = num(r.qtde), v = num(r.venda);
      var pm = (q === 0 || isNaN(q)) ? NaN : v / q;
      r.preco_medio = isNaN(pm) ? 0 : pm;
    });
    return d;
  }

  function particaoOtima(logs, k) {
    var n = logs.length;
    if (k <= 1 || n <= 1) return [0];
    k = Math.min(k, n);
    var pre = [0.0], pre2 = [0.0], i, j, t;
    for (i = 0; i < n; i++) { pre.push(pre[i] + logs[i]); pre2.push(pre2[i] + logs[i] * logs[i]); }
    function sse(a, b) {
      var m = b - a; if (m <= 1) return 0.0;
      var soma = pre[b] - pre[a];
      return Math.max(0.0, (pre2[b] - pre2[a]) - soma * soma / m);
    }
    var dp = [], de = [];
    for (t = 0; t <= k; t++) { dp.push(new Array(n + 1).fill(Infinity)); de.push(new Array(n + 1).fill(0)); }
    dp[0][0] = 0.0;
    for (t = 1; t <= k; t++)
      for (j = t; j <= n; j++)
        for (i = t - 1; i < j; i++) {
          var c = dp[t - 1][i] + sse(i, j);
          if (c < dp[t][j]) { dp[t][j] = c; de[t][j] = i; }
        }
    var inicios = []; j = n;
    for (t = k; t >= 1; t--) { i = de[t][j]; inicios.push(i); j = i; }
    return inicios.sort(function (a, b) { return a - b; });
  }

  function cortesDeClasse(portes, densidades) {
    if (!densidades) densidades = portes.map(function () { return null; });
    var pares = [];
    for (var q = 0; q < portes.length; q++) {
      var p = Number(portes[q]); if (!(p > 0)) continue;
      var d = densidades[q];
      d = (vazio(d) || !(Number(d) > 0)) ? null : Number(d);
      pares.push([p, d]);
    }
    if (pares.length < 2) return [];
    pares = ordenar(pares, function (x) { return x[0]; });
    var vals = [], dens = {};
    pares.forEach(function (pd) {
      var ch = arred(pd[0], 3);
      if (!vals.length || ch !== vals[vals.length - 1]) vals.push(ch);
      if (pd[1] !== null) (dens[ch] = dens[ch] || []).push(pd[1]);
    });
    if (vals.length < 2) return [];
    var amplitude = vals[vals.length - 1] / vals[0];
    if (amplitude <= FATOR_CLASSE_PORTE) return [];
    var k = 1 + Math.trunc(Math.log(amplitude) / Math.log(FATOR_CLASSE_PORTE));
    k = Math.max(2, Math.min(MAX_CLASSES_PORTE, k, vals.length));
    var logs = vals.map(Math.log);
    var inicios = particaoOtima(logs, k), grupos = [];
    inicios.forEach(function (ini, ni) {
      var fim = ni + 1 < inicios.length ? inicios[ni + 1] : vals.length;
      if (fim > ini) grupos.push(range(ini, fim));
    });
    function centro(gr) { return Math.exp(somaPy(gr.map(function (i) { return logs[i]; })) / gr.length); }
    function densMed(gr) {
      var v = [];
      gr.forEach(function (i) { (dens[vals[i]] || []).forEach(function (x) { v.push(x); }); });
      v.sort(function (a, b) { return a - b; });
      return v.length ? v[Math.floor(v.length / 2)] : null;
    }
    var i = 0;
    while (i < grupos.length - 1) {
      var junta = centro(grupos[i + 1]) / centro(grupos[i]) <= FATOR_CLASSE_PORTE;
      if (!junta) {
        var db = densMed(grupos[i]), dc = densMed(grupos[i + 1]);
        junta = !!(db && dc && dc > TOL_DENSIDADE * db);
      }
      if (junta) { grupos.splice(i, 2, grupos[i].concat(grupos[i + 1])); i = Math.max(0, i - 1); }
      else i += 1;
    }
    return grupos.slice(1).map(function (gr) { return vals[gr[0]]; });
  }
  function classeDoPorte(p, cortes) {
    var v = Number(p); if (isNaN(v)) return 0;
    return cortes.filter(function (c) { return v >= c; }).length;
  }

  function prepAlturas(largs, alts) {
    var n = largs.length;
    if (!Array.isArray(alts)) { var v = Number(alts); alts = largs.map(function () { return v; }); }
    alts = alts.slice();
    return { n: n, alts: alts };
  }

  /* devolve [fita, resumo, excl]; excl = [[ean, descricao, motivo], ...] */
  function alocar(df, largs, alts) {
    var excl = [];
    largs = largs.map(Number); if (!largs.length) largs = [130.0];
    if (!Array.isArray(alts)) { var av = Number(alts); alts = largs.map(function () { return av; }); }
    alts = alts.slice(); if (!alts.length) alts = [40.0];
    while (alts.length < largs.length) alts.push(alts[alts.length - 1]);
    alts = alts.slice(0, largs.length);
    var num_prat = largs.length;
    var alt_max = maxNum(alts);

    var ok = df.filter(function (r) { return !vazio(r.largura_cm) && !vazio(r.altura_cm); });
    df.forEach(function (r) { if (vazio(r.largura_cm) || vazio(r.altura_cm)) excl.push([r.ean, r.descricao, "sem dimensao"]); });
    ok.forEach(function (r) {
      if (r.altura_cm > alt_max)
        excl.push([r.ean, r.descricao, "altura " + reprF(r.altura_cm) + "cm > a regua mais alta (" + fmtG(alt_max) + "cm)"]);
    });
    ok = ok.filter(function (r) { return r.altura_cm <= alt_max; });
    if (!ok.length) return [[], [], excl];

    ok = calcularPesos(ok);
    ok.forEach(function (r) {
      r._porte = Number(r.largura_cm) * Number(r.altura_cm);
      var pr = vazio(r.profundidade_cm) ? Number(r.largura_cm) : Number(r.profundidade_cm);
      if (!(pr > 0)) pr = Number(r.largura_cm);
      r._volume = r._porte * pr;
      r._dens = r._volume === 0 ? NaN : Number(r.preco_medio) / r._volume;
    });
    var cortes = cortesDeClasse(ok.map(function (r) { return r._porte; }), ok.map(function (r) { return r._dens; }));
    ok.forEach(function (r) { r._classe = classeDoPorte(r._porte, cortes); });

    var cap_total = somaPy(largs);
    ok = ordenarPd(ok, ["peso"], [false]);
    var larg_map = {};
    ok.forEach(function (r) { larg_map[String(r.ean)] = Number(r.largura_cm); });

    /* conjuntos de reguas viaveis (chave = indices em texto) */
    var set_de = {}, conjS = {}, todas = range(0, alts.length);
    ok.forEach(function (r) {
      var h = Number(r.altura_cm);
      var S = range(0, alts.length).filter(function (i) { return h <= alts[i] + 1e-6; });
      if (!S.length) S = todas;
      var k = S.join(",");
      conjS[k] = S; set_de[String(r.ean)] = k;
    });
    var conjuntos = Object.keys(conjS);
    function subset(ka, kb) {        /* ka contido em kb */
      var B = conjS[kb]; return conjS[ka].every(function (i) { return B.indexOf(i) >= 0; });
    }
    var contidos = {}, cap_S = {};
    conjuntos.forEach(function (S) {
      contidos[S] = Object.keys(set_de).filter(function (e) { return subset(set_de[e], S); });
      cap_S[S] = somaPy(conjS[S].map(function (i) { return largs[i]; }));
    });

    /* (1) 1 frente garantida */
    var facings = {}, ordemF = [], usado = 0.0;
    ok.forEach(function (r) {
      var w = Number(r.largura_cm);
      if (usado + w <= cap_total + 1e-6) { facings[String(r.ean)] = 1; ordemF.push(String(r.ean)); usado += w; }
      else excl.push([r.ean, r.descricao, "gondola lotada (sem espaco nem pra 1 frente)"]);
    });
    var presentes = ok.filter(function (r) { return facings[String(r.ean)] !== undefined; });
    if (!presentes.length) return [[], [], excl];

    var usado_S = {};
    conjuntos.forEach(function (S) {
      usado_S[S] = somaPy(contidos[S].map(function (e) { return (facings[e] || 0) * larg_map[e]; }));
    });
    function cabeNoConjunto(ean, w) {
      var Se = set_de[ean];
      for (var i = 0; i < conjuntos.length; i++) {
        var S = conjuntos[i];
        if (subset(Se, S) && usado_S[S] + w > cap_S[S] + 1e-6) return false;
      }
      return true;
    }
    function somar(ean, w, n) {
      n = n === undefined ? 1 : n;
      var Se = set_de[ean];
      conjuntos.forEach(function (S) { if (subset(Se, S)) usado_S[S] += w * n; });
    }

    /* (2) espaco restante pelo delta */
    var larg_media = usado / Math.max(1, ordemF.length);
    var folga = larg_media * num_prat;
    var leftover = Math.max(0.0, cap_total - usado - folga);
    var pesos = {};
    presentes.forEach(function (r) { pesos[String(r.ean)] = Number(r.peso); });
    var total_peso = somaPy(presentes.map(function (r) { return pesos[String(r.ean)]; }));
    if (leftover > 0 && total_peso > 0) {
      ordemF.slice().forEach(function (ean) {
        var w = larg_map[ean];
        var add = Math.trunc(divPiso((pesos[ean] / total_peso) * leftover, w));
        while (add > 0 && !conjuntos.every(function (S) {
          return !subset(set_de[ean], S) || usado_S[S] + add * w <= cap_S[S] + 1e-6;
        })) add -= 1;
        if (add > 0) { facings[ean] += add; somar(ean, w, add); leftover -= add * w; }
      });
      var fila = ordenarPd(presentes, ["peso"], [false]).map(function (r) { return String(r.ean); });
      var avancou = true;
      while (leftover > 1e-6 && avancou) {
        avancou = false;
        for (var fi = 0; fi < fila.length; fi++) {
          var ean = fila[fi], w = larg_map[ean];
          if (w <= leftover + 1e-6 && cabeNoConjunto(ean, w)) {
            facings[ean] += 1; somar(ean, w); leftover -= w; avancou = true;
            if (leftover <= 1e-6) break;
          }
        }
      }
    }

    /* (3) classes magras + ordem das subs */
    presentes.forEach(function (r) {
      r._fr = facings[String(r.ean)];
      r._cm_cls = r._fr * Number(r.largura_cm);
      r._classe_fis = r._classe;
    });
    var ordL = largs.slice().sort(function (a, b) { return a - b; });
    var larg_tipica = ordL[Math.floor(ordL.length / 2)];
    function nunique(col) { var s = {}; presentes.forEach(function (r) { s[r[col]] = 1; }); return Object.keys(s).length; }
    while (nunique("_classe") > 1) {
      var gcl = agrupar(presentes, "_classe");
      var idxC = gcl.map(function (g) { return Math.trunc(g.chave); });
      var cmC = gcl.map(function (g) { return somaGrupo(g.linhas.map(function (r) { return r._cm_cls; })); });
      var iMin = primeiroMin(range(0, idxC.length - 1), function (kk) { return cmC[kk]; });
      var magra = cmC[iMin] < MIN_CLASSE_REGUA * larg_tipica;
      if (!magra && idxC.length <= num_prat) break;
      var destino = iMin > 0 ? idxC[iMin - 1] : idxC[1];
      var origem = idxC[iMin];
      presentes.forEach(function (r) { if (r._classe === origem) r._classe = destino; });
    }
    var minCl = minNum(presentes.map(function (r) { return r._classe; }));
    presentes.forEach(function (r) { r._grande = r._classe > minCl; });

    var gsub = agrupar(presentes, "subcategoria");
    var infSub = gsub.map(function (g) {
      return { sub: g.chave,
        preco: mediaGrupo(g.linhas.map(function (r) { return r.preco_medio; })),
        cl: mediaGrupo(g.linhas.map(function (r) { return r._classe_fis; })) };
    });
    var ordemSub = ordenar(infSub, function (s) { return [Number(s.cl), -Number(s.preco)]; });
    var fita = ordemSub.map(function (s) {
      var g = ordenarPd(presentes.filter(function (r) { return r.subcategoria === s.sub; }),
        ["_classe_fis", "preco_medio"], [true, false]);
      return { sub: s.sub, itens: g.map(function (r) { var d = copiar(r); d.facings = Math.trunc(facings[String(r.ean)]); return d; }) };
    });

    /* resumo por subcategoria (informativo) */
    var nCls = nunique("_classe_fis");
    var resumo = gsub.map(function (g) {
      var l = g.linhas, cm = somaGrupo(l.map(function (r) { return r._fr * Number(r.largura_cm); }));
      var cl = mediaGrupo(l.map(function (r) { return r._classe_fis; }));
      var eans = {}; l.forEach(function (r) { eans[r.ean] = 1; });
      return { SubCategoria: g.chave, _cl: cl,
        Formato: nCls <= 1 ? "tamanho unico" : "tam. " + (Math.trunc(arred(cl, 0)) + 1) + " de " + nCls,
        "Preco medio": arred(mediaGrupo(l.map(function (r) { return r.preco_medio; })), 2),
        "R$/cm3": arred(mediaGrupo(l.map(function (r) { return r._dens; })), 5),
        "Espaco (cm)": cm, SKUs: Object.keys(eans).length,
        Frentes: somaGrupo(l.map(function (r) { return r._fr; })) };
    });
    var totCm = somaPd(resumo.map(function (r) { return r["Espaco (cm)"]; }));
    resumo.forEach(function (r) {
      r["% Delta"] = totCm ? arred(r["Espaco (cm)"] / totCm * 100, 2) : 0;
      r["Espaco (cm)"] = arred(r["Espaco (cm)"], 1);
    });
    resumo = ordenarPd(resumo, ["_cl", "Preco medio"], [true, false]);
    resumo.forEach(function (r) { delete r._cl; });
    return [fita, resumo, excl];
  }

  /* ---------------- faixas por marca ---------------- */
  function marcaDe(it) { var m = it.marca; return (typeof m === "string" && m.trim()) ? m.trim().toUpperCase() : "SEM MARCA"; }
  function classeDe(it) {
    var v = it._classe_fis || it._classe || 0;
    v = Math.trunc(Number(v)); return isNaN(v) ? 0 : v;
  }
  function precoDe(it) { var v = Number(it.preco_medio || 0); return isNaN(v) ? 0.0 : v; }
  function ehGigante(it, alturaPrat, altMedia) {
    var h = Number(it.altura_cm || 0); if (isNaN(h) || h <= 0) return false;
    return h > LIMIAR_GIGANTE_PRAT * Number(alturaPrat || 0) && h > LIMIAR_GIGANTE_MEDIA * Number(altMedia || 0);
  }
  function blocosPorMarca(itens, frRest, grande) {
    var g = {}, ordem = [];
    itens.forEach(function (it) { var m = marcaDe(it); if (!g[m]) { g[m] = []; ordem.push(m); } g[m].push(it); });
    var blocos = ordem.map(function (marca) {
      var lst = ordenar(g[marca], function (i) { return [classeDe(i), -precoDe(i)]; });
      var cm = somaPy(lst.map(function (i) { return Number(i.largura_cm) * frRest[String(i.ean)]; }));
      var preco = somaPy(lst.map(precoDe)) / lst.length;
      return { marca: marca, itens: lst, cm: cm, preco: preco, grande: !!grande };
    });
    return ordenar(blocos, function (b) { return [minNum(b.itens.map(classeDe)), -b.preco]; });
  }
  function fundir(a, b) {
    return { marca: a.marca + " + " + b.marca, itens: a.itens.concat(b.itens), cm: a.cm + b.cm,
      preco: Math.max(a.preco, b.preco), grande: a.grande && b.grande };
  }
  function fundirAte(blocos, nMax) {
    blocos = blocos.slice();
    while (blocos.length > nMax && blocos.length > 1) {
      var i = primeiroMin(range(0, blocos.length), function (k) { return blocos[k].cm; });
      var viz = [i - 1, i + 1].filter(function (k) { return k >= 0 && k < blocos.length; });
      var mesma = viz.filter(function (k) { return blocos[k].grande === blocos[i].grande; });
      var cand = mesma.length ? mesma : viz;
      var j = primeiroMin(cand, function (k) { return blocos[k].cm; });
      var a = Math.min(i, j), b = Math.max(i, j);
      blocos.splice(a, b - a + 1, fundir(blocos[a], blocos[b]));
    }
    return blocos;
  }
  function fundirPequenas(blocos, largsFila) {
    blocos = blocos.slice();
    if (blocos.length < 2 || !largsFila.length) return blocos;
    var larg = somaPy(largsFila) / largsFila.length;
    var voltas = blocos.length;
    for (var v = 0; v < voltas; v++) {
      var q = quotasPorCapacidade(blocos, largsFila);
      var falta = maxNum(blocos.map(function (b, k) { return Number(b.cm) - q[k] * larg; }));
      if (falta <= 0.5 * larg) break;
      var pares = range(0, blocos.length - 1).filter(function (k) {
        return q[k] <= 1 && q[k + 1] <= 1 && blocos[k].grande === blocos[k + 1].grande &&
          blocos[k].cm + blocos[k + 1].cm <= larg * 1.02;
      });
      if (!pares.length) break;
      var k = primeiroMin(pares, function (i) { return blocos[i].cm + blocos[i + 1].cm; });
      blocos.splice(k, 2, fundir(blocos[k], blocos[k + 1]));
    }
    return blocos;
  }
  function cabeAltura(it, s, alts) {
    if (!alts || !alts.length) return true;
    var h = Number(it.altura_cm || 0); if (isNaN(h)) return true;
    return h <= Number(alts[s]) + 1e-6;
  }
  function colocar(it, q, s, frRest, prats, caps, usados, alts) {
    var ean = String(it.ean), w = Number(it.largura_cm);
    if (alts && !cabeAltura(it, s, alts)) return 0;
    var n = 0;
    while (n < q && (frRest[ean] || 0) > 0 && usados[s] + w <= caps[s] + 1e-6) {
      prats[s].push(it); usados[s] += w; frRest[ean] -= 1; n += 1;
    }
    return n;
  }
  function montarFaixa(bloco, frRest, prats, faixa, caps, usados, alts) {
    var k = faixa.length, itens = bloco.itens;
    if (k >= 2) {
      itens.forEach(function (it) {
        var ean = String(it.ean), n = Math.trunc(frRest[ean] || 0);
        if (n < FRENTES_MIN_ESPELHO) return;
        var w = Number(it.largura_cm);
        if (alts && !faixa.every(function (s) { return cabeAltura(it, s, alts); })) return;
        var q = Math.floor(n / k);
        while (q >= 1 && !faixa.every(function (s) { return usados[s] + q * w <= caps[s] + 1e-6; })) q -= 1;
        if (q >= 1) {
          faixa.forEach(function (s) { colocar(it, q, s, frRest, prats, caps, usados, alts); });
          frRest[ean] = 0;
        }
      });
    }
    itens.forEach(function (it) {
      var ean = String(it.ean);
      while ((frRest[ean] || 0) > 0) {
        var posto = 0;
        var ord = ordenar(faixa, function (x) { return caps[x] - usados[x]; }, true);
        for (var i = 0; i < ord.length; i++) {
          posto = colocar(it, frRest[ean], ord[i], frRest, prats, caps, usados, alts);
          if (posto) break;
        }
        if (!posto) break;
      }
    });
  }
  function repescagem(blocos, faixas, frRest, prats, reguas, caps, usados, alts, territorios, permitirFora) {
    blocos.forEach(function (bloco, idx) {
      var faixa = faixas[idx];
      if (!faixa.length) return;
      var centro = (faixa[0] + faixa[faixa.length - 1]) / 2.0;
      var proprio = territorios ? territorios[idx].slice() : reguas.slice();
      var perto = ordenar(proprio, function (s) { return [faixa.indexOf(s) < 0, Math.abs(s - centro)]; });
      var longe = reguas.filter(function (s) { return proprio.indexOf(s) < 0; });
      bloco.itens.forEach(function (it) {
        var ean = String(it.ean);
        while ((frRest[ean] || 0) > 0) {
          var jaTem = prats.some(function (sh) { return sh.some(function (i) { return String(i.ean) === ean; }); });
          var pref = jaTem ? perto.filter(function (s) { return faixa.indexOf(s) >= 0; })
            : (!permitirFora ? perto : perto.concat(longe));
          var posto = 0;
          for (var p = 0; p < pref.length; p++) {
            posto = colocar(it, frRest[ean], pref[p], frRest, prats, caps, usados, alts);
            if (posto) break;
          }
          if (!posto) break;
        }
      });
    });
  }

  /* devolve [prateleiras (lista de itens por slot), descartadas] */
  function distribuirPrateleiras(fita, largs, alts) {
    largs = largs.map(Number); if (!largs.length) largs = [130.0];
    var num_prat = largs.length;
    var prateleiras = largs.map(function () { return []; }), descartadas = [];
    if (!Array.isArray(alts)) { var av = Number(alts); alts = largs.map(function () { return av; }); }
    alts = alts.slice();
    while (alts.length < num_prat) alts.push(alts.length ? alts[alts.length - 1] : 40.0);
    alts = alts.slice(0, num_prat);

    function nSlots(cm, deBaixo) {
      if (cm <= 0) return 0;
      var n = 0, acum = 0.0;
      var ordem = deBaixo ? range(0, num_prat).reverse() : range(0, num_prat);
      for (var t = 0; t < ordem.length; t++) {
        if (acum >= cm - 1e-6) break;
        acum += largs[ordem[t]]; n += 1;
      }
      return Math.max(1, n);
    }
    if (!fita.length) return [prateleiras, descartadas];

    var fr = {}, ordemFr = [], alturasItens = [];
    fita.forEach(function (g) {
      g.itens.forEach(function (it) {
        var e = String(it.ean);
        if (fr[e] === undefined) ordemFr.push(e);
        fr[e] = Math.trunc(it.facings);
        var h = Number(it.altura_cm || 0); if (h > 0) alturasItens.push(h);
      });
    });
    var altMedia = alturasItens.length ? somaPy(alturasItens) / alturasItens.length : 0.0;
    var ordAlt = alts.slice().sort(function (a, b) { return a - b; });
    var alturaRef = ordAlt.length ? ordAlt[Math.floor(ordAlt.length / 2)] : 0.0;

    var todosItens = [];
    fita.forEach(function (g) { g.itens.forEach(function (it) { todosItens.push(it); }); });
    var gig = {};
    todosItens.forEach(function (it) { if (!it._grande && ehGigante(it, alturaRef, altMedia)) gig[String(it.ean)] = 1; });
    if (Object.keys(gig).length > Math.max(2, Math.trunc(FRACAO_MAX_GIGANTES * todosItens.length))) gig = {};
    function ficaEmbaixo(it) { return !!it._grande || gig[String(it.ean)] === 1; }

    function montar(permitirFora) {
      var prats = largs.map(function () { return []; });
      var caps = largs.slice();
      var usados = largs.map(function () { return 0.0; });

      var largG = fita.map(function (g) {
        return somaPy(g.itens.filter(function (it) { return !ficaEmbaixo(it); })
          .map(function (it) { return Number(it.largura_cm) * fr[String(it.ean)]; }));
      });
      var cmGrande = somaPy(todosItens.filter(function (it) { return it._grande; })
        .map(function (it) { return Number(it.largura_cm) * fr[String(it.ean)]; }));
      var nRes = cmGrande > 0 ? nSlots(cmGrande, true) : 1;
      var tetoHorizontal = fita.length <= 1 ? num_prat : Math.max(1, num_prat - nRes);

      function slotsEmpacotando(nGrupos) {
        var linhaE = 0, xE = 0.0, usou = false;
        fita.slice(0, nGrupos).forEach(function (g) {
          g.itens.forEach(function (it) {
            if (ficaEmbaixo(it)) return;
            var w = Number(it.largura_cm);
            for (var q = 0; q < fr[String(it.ean)]; q++) {
              if (xE + w > largs[Math.min(linhaE, num_prat - 1)] + 1e-6) { linhaE += 1; xE = 0.0; }
              xE += w; usou = true;
            }
          });
        });
        return usou ? linhaE + 1 : 0;
      }

      var nHorizSubs = 0;
      if (fita.length > 1) {
        var acum = 0.0;
        for (var gi = 0; gi < fita.length - 1; gi++) {
          var acumTry = acum + largG[gi];
          var reguasN = Math.max(nSlots(acumTry), slotsEmpacotando(gi + 1));
          if (reguasN <= tetoHorizontal) { acum = acumTry; nHorizSubs = gi + 1; }
          else break;
        }
      }

      /* FASE 1 */
      var linha = 0, x = 0.0, sobraFase1 = [];
      fase1:
      for (var g1 = 0; g1 < nHorizSubs; g1++) {
        var itens1 = fita[g1].itens;
        for (var t1 = 0; t1 < itens1.length; t1++) {
          var it = itens1[t1], nAlvo = fr[String(it.ean)];
          if (ficaEmbaixo(it)) { sobraFase1.push([it, nAlvo]); continue; }
          var w = Number(it.largura_cm), posto = 0;
          for (var q = 0; q < nAlvo; q++) {
            if (linha < num_prat && x + w > caps[linha] + 1e-6) { linha += 1; x = 0.0; }
            if (linha >= num_prat) break;
            if (!cabeAltura(it, linha, alts)) break;
            prats[linha].push(it); x += w; usados[linha] = x; posto += 1;
          }
          if (posto < nAlvo) sobraFase1.push([it, nAlvo - posto]);
          if (linha >= num_prat) break;
        }
      }

      var resto = sobraFase1.map(function (p) { return p[0]; });
      fita.slice(nHorizSubs).forEach(function (g) { g.itens.forEach(function (it) { resto.push(it); }); });
      var frRest = {};
      sobraFase1.forEach(function (p) { var e = String(p[0].ean); frRest[e] = (frRest[e] || 0) + p[1]; });
      fita.slice(nHorizSubs).forEach(function (g) {
        g.itens.forEach(function (it) { var e = String(it.ean); if (frRest[e] === undefined) frRest[e] = fr[e]; });
      });
      var ri = 0;

      /* FASE 1b */
      if (linha < num_prat && 0 < x && x < caps[linha]) {
        var postoTopo = {};
        while (ri < resto.length) {
          var it2 = resto[ri], e2 = String(it2.ean), w2 = Number(it2.largura_cm);
          if (frRest[e2] <= 0 || ficaEmbaixo(it2) || !cabeAltura(it2, linha, alts) ||
              (postoTopo[e2] || 0) >= MAX_FRENTES_TOPO) { ri += 1; continue; }
          if (x + w2 > caps[linha] + 1e-6) break;
          prats[linha].push(it2); x += w2; usados[linha] = x; frRest[e2] -= 1;
          postoTopo[e2] = (postoTopo[e2] || 0) + 1;
        }
        linha += 1;
      }

      /* FASE 2 */
      var base = Math.min(linha, num_prat - 1);
      var reguas = range(base, num_prat), nVert = reguas.length, ultima = reguas[reguas.length - 1];
      var pendentes = resto.filter(function (it) { return frRest[String(it.ean)] > 0; });
      var gigantes = pendentes.filter(function (it) { return gig[String(it.ean)] === 1; });
      var normais = pendentes.filter(function (it) { return gig[String(it.ean)] !== 1; });

      var planoGig = [], gigCm = 0.0, tetoGig = Number(caps[ultima]) * FRACAO_MAX_GIGANTE;
      gigantes.forEach(function (it) {
        var e = String(it.ean), w = Number(it.largura_cm), q = 0;
        if (cabeAltura(it, ultima, alts))
          while (q < frRest[e] && gigCm + w <= tetoGig + 1e-6) { gigCm += w; q += 1; }
        planoGig.push([it, q]);
      });
      caps[ultima] = Math.max(0.0, Number(largs[ultima]) - gigCm);
      planoGig.forEach(function (p) { if (p[1] <= 0) normais.push(p[0]); });
      planoGig = planoGig.filter(function (p) { return p[1] > 0; });

      var reguasOrd = reguas.slice().sort(function (a, b) { return a - b; });
      var porClasse = {}, chavesC = [];
      normais.forEach(function (it) {
        var c = Math.trunc(Number(it._classe || 0));
        if (!porClasse[c]) { porClasse[c] = []; chavesC.push(c); }
        porClasse[c].push(it);
      });
      chavesC.sort(function (a, b) { return a - b; });
      var clsBlocos = chavesC.map(function (c) {
        return { itens: porClasse[c], cm: somaPy(porClasse[c].map(function (i) { return Number(i.largura_cm) * frRest[String(i.ean)]; })) };
      });
      while (clsBlocos.length > nVert)
        clsBlocos.splice(0, 2, { itens: clsBlocos[0].itens.concat(clsBlocos[1].itens), cm: clsBlocos[0].cm + clsBlocos[1].cm });

      var territorios = reparteTerritorios(clsBlocos, reguasOrd, largs, alts);
      var faixas = [], blocos = [], terrBloco = [];
      territorios.forEach(function (tr) {
        var bl = tr[0], reg = tr[1];
        if (!bl.itens.length) return;
        if (!reg.length) reg = reguasOrd;
        var bm = blocosPorMarca(bl.itens, frRest);
        bm = fundirAte(bm, Math.max(1, Math.min(bm.length, reg.length)));
        var fila = ordenar(reg, function (s) { return [Number(alts[s]), s]; });
        bm = fundirPequenas(bm, fila.map(function (s) { return largs[s]; }));
        var qs = quotasPorCapacidade(bm, fila.map(function (s) { return largs[s]; }));
        for (var b = 0; b < bm.length && b < qs.length; b++) {
          var k = qs[b];
          var faixa = fila.slice(0, k).sort(function (a, c) { return a - c; });
          fila = fila.slice(k);
          blocos.push(bm[b]); faixas.push(faixa); terrBloco.push(reg);
          if (faixa.length) montarFaixa(bm[b], frRest, prats, faixa, caps, usados, alts);
        }
      });

      repescagem(blocos, faixas, frRest, prats, reguas, caps, usados, alts, terrBloco, permitirFora);

      planoGig.forEach(function (p) {
        var it = p[0], e = String(it.ean), w = Number(it.largura_cm);
        if (!cabeAltura(it, ultima, alts)) return;
        for (var q = 0; q < p[1]; q++) {
          if (frRest[e] <= 0) break;
          prats[ultima].push(it); usados[ultima] += w; frRest[e] -= 1;
        }
      });

      var colocados = {};
      prats.forEach(function (sh) { sh.forEach(function (it) { colocados[String(it.ean)] = 1; }); });
      var faltaram = ordemFr.filter(function (e) { return !colocados[e]; });
      return [prats, faltaram];
    }

    var mapaIt = {};
    todosItens.forEach(function (it) { mapaIt[String(it.ean)] = it; });

    var r = montar(false), prats = r[0], faltaram = r[1], guarda = 0;
    while (faltaram.length && guarda < 5000) {
      var cand = faltaram.filter(function (e) { return (fr[e] || 0) > 1; });
      if (!cand.length) {
        var uteis = {};
        faltaram.forEach(function (e) {
          var it = mapaIt[e]; if (!it) return;
          for (var i = 0; i < num_prat; i++) if (cabeAltura(it, i, alts)) uteis[i] = 1;
        });
        /* set() do Python: a ordem nao importa porque so vale o maximo (e o
           1o maximo na ordem do set). Para empate, a ordem de insercao abaixo
           segue reguas crescentes e a ordem da regua - ver ocupantesOrdem. */
        cand = ocupantesOrdem(prats, uteis, fr);
      }
      if (!cand.length) cand = ordemFr.filter(function (e) { return fr[e] > 1; });
      if (!cand.length) break;
      var alvo = primeiroMax(cand, function (e) { return fr[e]; });
      fr[alvo] -= 1;
      r = montar(false); prats = r[0]; faltaram = r[1];
      guarda += 1;
    }
    var modoFora = false;
    if (faltaram.length) { r = montar(true); prats = r[0]; faltaram = r[1]; modoFora = true; }

    function ocup(ps) {
      var l = []; ps.forEach(function (sh) { sh.forEach(function (it) { l.push(Number(it.largura_cm)); }); });
      return somaPy(l);
    }
    var eansGrandes = {};
    ordemFr.forEach(function (e) { if ((mapaIt[e] || {})._grande) eansGrandes[e] = 1; });
    function topoGrande(ps) {
      for (var s = 0; s < ps.length; s++)
        if (ps[s].some(function (it) { return eansGrandes[String(it.ean)]; })) return s;
      return num_prat;
    }
    function delta(e) { return Number((mapaIt[e] || {}).peso || 0.0); }

    var bloqueadas = {}; guarda = 0;
    while (!faltaram.length && guarda < 200) {
      guarda += 1;
      var folgas = [];
      for (var s = 0; s < num_prat; s++) {
        if (bloqueadas[s]) continue;
        var livre = largs[s] - somaPy(prats[s].map(function (it) { return Number(it.largura_cm); }));
        if (livre > 1e-6) folgas.push([livre, s]);
      }
      if (!folgas.length) break;
      var fm = primeiroMax(folgas, function (f) { return f; });
      var folga = fm[0]; s = fm[1];
      var vistos = {}, candP = [];
      var fonte = prats[s].length ? prats[s].slice() : todosItens.filter(function (it) { return cabeAltura(it, s, alts); });
      fonte.forEach(function (it) {
        var e = String(it.ean);
        if (vistos[e] || Number(it.largura_cm) > folga + 1e-6) return;
        vistos[e] = 1; candP.push(e);
      });
      candP = ordenar(candP, function (e) { return delta(e) / (fr[e] + 1); }, true);
      var avancou = false;
      var lim = prats[s].length ? 4 : 8;
      for (var ci = 0; ci < Math.min(lim, candP.length) && !avancou; ci++) {
        var e = candP[ci];
        for (var inc = 1; inc <= Math.min(num_prat, 6); inc++) {
          fr[e] += inc;
          var r2 = montar(modoFora), novos = r2[0], falt2 = r2[1];
          var limite = topoGrande(prats);
          if (!prats[s].length) limite = Math.min(limite, s);
          if (!falt2.length && ocup(novos) > ocup(prats) + 1e-6 && topoGrande(novos) >= limite) {
            prats = novos; avancou = true; break;
          }
          fr[e] -= inc;
        }
      }
      if (!avancou) bloqueadas[s] = 1;
    }

    /* acabamento local */
    for (var s3 = 0; s3 < num_prat; s3++) {
      if (!prats[s3].length) continue;
      while (true) {
        var livre3 = largs[s3] - somaPy(prats[s3].map(function (it) { return Number(it.largura_cm); }));
        var cand3 = {}, ord3 = [];
        prats[s3].forEach(function (it) {
          var e = String(it.ean);
          if (Number(it.largura_cm) <= livre3 + 1e-6 && cabeAltura(it, s3, alts)) {
            if (cand3[e] === undefined) ord3.push(e);
            cand3[e] = it;
          }
        });
        if (!ord3.length) break;
        var e3 = primeiroMax(ord3, function (x) { return delta(x) / ((fr[x] === undefined ? 1 : fr[x]) + 1); });
        var it3 = cand3[e3], pos = -1;
        prats[s3].forEach(function (x, i) { if (String(x.ean) === e3) pos = i; });
        prats[s3].splice(pos + 1, 0, it3);
        fr[e3] = (fr[e3] === undefined ? 1 : fr[e3]) + 1;
      }
    }

    faltaram.forEach(function (ean) {
      var it = mapaIt[ean];
      if (it) descartadas.push([it.ean, it.descricao, "gondola lotada"]);
    });
    return [prats, descartadas];
  }
  /* ordem dos ocupantes: no Python e um set(); como so se tira o 1o maximo
     de fr, empates resolvem pela ordem de iteracao do set. Reproduzimos a
     ordem de iteracao de set de str do CPython? Nao da (hash aleatorio por
     processo). Entao, pra empate, vale a 1a ocorrencia na leitura das
     reguas - e o teste de paridade roda o Python com PYTHONHASHSEED fixo
     e confere se esse caminho decidiu algo diferente. */
  function ocupantesOrdem(prats, uteis, fr) {
    var vis = {}, l = [];
    Object.keys(uteis).map(Number).sort(function (a, b) { return a - b; }).forEach(function (i) {
      prats[i].forEach(function (it) { var e = String(it.ean); if (!vis[e]) { vis[e] = 1; l.push(e); } });
    });
    return l.filter(function (e) { return (fr[e] || 0) > 1; });
  }

  /* ---------------- estado do plano ---------------- */
  function ordemPadraoRecorte(df, colNivel, escolhas) {
    var esc = escolhas.slice();
    if (!df || !df.length) return esc;
    var preco = {};
    esc.forEach(function (c) {
      var x = df.filter(function (r) { return r[colNivel] === c; });
      var q = x.length ? somaPd(x.map(function (r) { return r.qtde; })) : 0.0;
      preco[c] = q > 0 ? somaPd(x.map(function (r) { return r.venda; })) / q : 0.0;
    });
    return ordenar(esc, function (c) { return [-preco[c], c]; });
  }
  function niveisPorCategoria(df, colNivel, ordem, slots) {
    var n = slots.length;
    var d = df.length ? calcularPesos(df) : df;
    var largSlot = larguraTipica(slots) || 1.0;
    var minimo = [], share = [];
    ordem.forEach(function (c) {
      var x = d.filter(function (r) { return r[colNivel] === c; });
      var cm1 = somaPd(x.map(function (r) { return vazio(r.largura_cm) ? 0 : Number(r.largura_cm); }));
      minimo.push(Math.max(1, Math.ceil(cm1 / largSlot - 1e-6)));
      share.push(x.length ? somaPd(x.map(function (r) { return r.peso; })) : 0.0);
    });
    var tot = somaPy(share) || 1.0;
    share = share.map(function (v) { return v / tot; });
    var k = ordem.length, q, i;
    if (k > n) { q = []; for (i = 0; i < k; i++) q.push(i < n ? 1 : 0); }
    else {
      q = minimo.slice();
      var somaQ = function () { return q.reduce(function (a, b) { return a + b; }, 0); };
      while (somaQ() > n) {
        i = primeiroMax(range(0, k).filter(function (j) { return q[j] > 1; }), function (j) { return q[j] - share[j] * n; });
        q[i] -= 1;
      }
      while (somaQ() < n) {
        i = primeiroMax(range(0, k), function (j) { return share[j] * n - q[j]; });
        q[i] += 1;
      }
    }
    var res = {}, pos = 0;
    ordem.forEach(function (c, j) { res[c] = range(pos, pos + q[j]); pos += q[j]; });
    return res;
  }

  /* linhas do DataFrame com rotulo de indice (_i) pra reproduzir .loc */
  function rotular(linhas) {
    return linhas.map(function (r, i) { var o = copiar(r); if (o._i === undefined) o._i = i; o.ean = String(o.ean); return o; });
  }

  function semearPlano(df, slots, colNivel, ordem) {
    df = rotular(df);
    if (!ordem || ordem.length < 2 || !colNivel || !df.length)
      return semearBloco(df, slots);
    var blocos = niveisPorCategoria(df, colNivel, ordem, slots);
    var shelves = slots.map(function () { return []; }), fora = [], resumos = [];
    ordem.forEach(function (c) {
      var sub = df.filter(function (r) { return r[colNivel] === c; });
      var idx = blocos[c] || [];
      if (!sub.length) return;
      if (!idx.length) {
        sub.forEach(function (r) { fora.push({ ean: String(r.ean), motivo: "sem régua pra " + c }); });
        return;
      }
      var res = semearBloco(sub, idx.map(function (i) { return slots[i]; }));
      idx.forEach(function (i, j) { if (j < res[0].length) shelves[i] = res[0][j]; });
      fora = fora.concat(res[1]);
      res[2].forEach(function (rr) { var o = { Categoria: c }; for (var kk in rr) o[kk] = rr[kk]; resumos.push(o); });
    });
    return [shelves, fora, resumos];
  }

  function semearBloco(df, slots) {
    if (!df.length) return semearUm(df, slots);
    var modsSet = {};
    slots.forEach(function (sl) { modsSet[Math.trunc(sl.mod)] = 1; });
    var mods = Object.keys(modsSet).map(Number).sort(function (a, b) { return a - b; });
    if (mods.length < 2) return semearUm(df, slots);
    var idx = {}, cap = {};
    mods.forEach(function (m) {
      idx[m] = range(0, slots.length).filter(function (i) { return Math.trunc(slots[i].mod) === m; });
      cap[m] = somaPy(idx[m].map(function (i) { return Number(slots[i].larg); }));
    });
    var d = calcularPesos(df);
    d.forEach(function (r) {
      var m = vazio(r.marca) ? "" : String(r.marca).trim();
      r._marca = m === "" ? "(sem marca)" : m;
    });
    var fr = {};
    try {
      var fita = alocar(df, larguras(slots), alturas(slots))[0];
      fita.forEach(function (g) { g.itens.forEach(function (it) { fr[String(it.ean)] = Math.trunc(it.facings); }); });
    } catch (err) { fr = {}; }
    d.forEach(function (r) {
      var w = vazio(r.largura_cm) ? 0.0 : Number(r.largura_cm);
      var f = fr[String(r.ean)] === undefined ? 1 : fr[String(r.ean)];
      r._cm = Math.max(w, w * f);
    });
    var gm = agrupar(d, "_marca").map(function (g) { return { m: g.chave, p: somaGrupo(g.linhas.map(function (r) { return r.peso; })) }; });
    var marcas = ordenarPd(gm, ["p"], [false]).map(function (g) { return g.m; });

    var destino = [], mi = 0, usado = 0.0;     /* [[_i, mod], ...] na ordem de insercao */
    marcas.forEach(function (mc) {
      var x = ordenarPd(d.filter(function (r) { return r._marca === mc; }), ["subcategoria", "peso"], [true, false]);
      var cmMarca = somaPd(x.map(function (r) { return r._cm; }));
      var livre = cap[mods[mi]] - usado;
      if (cmMarca > livre && mi < mods.length - 1 && cmMarca <= cap[mods[mi + 1]] && usado >= 0.6 * cap[mods[mi]]) {
        mi += 1; usado = 0.0;
      }
      x.forEach(function (r) {
        if (usado + r._cm > cap[mods[mi]] * 1.02 && usado > 0 && mi < mods.length - 1) { mi += 1; usado = 0.0; }
        destino.push([r._i, mods[mi]]);
        usado += Number(r._cm);
      });
    });
    var porRot = {};
    df.forEach(function (r) { porRot[r._i] = r; });
    var shelves = slots.map(function () { return []; }), fora = [], resumos = [];
    mods.forEach(function (m) {
      var sub = destino.filter(function (p) { return p[1] === m; }).map(function (p) { return porRot[p[0]]; });
      if (!sub.length) return;
      var res = semearUm(sub, idx[m].map(function (i) { return slots[i]; }));
      idx[m].forEach(function (i, j) { if (j < res[0].length) shelves[i] = res[0][j]; });
      fora = fora.concat(res[1]);
      res[2].forEach(function (rr) { var o = { Modulo: "M" + (m + 1) }; for (var kk in rr) o[kk] = rr[kk]; resumos.push(o); });
    });
    return [shelves, fora, resumos];
  }

  function semearUm(df, slots) {
    var largs = larguras(slots), alts = alturas(slots);
    var a = alocar(df, largs, alts), fita = a[0], resumo = a[1], excl = a[2];
    if (API._dbg) API._dbg(fita);
    var dist = distribuirPrateleiras(fita, largs, alts);
    excl = excl.concat(dist[1]);
    var shelves = dist[0].map(function (prat) {
      var linha = [];
      prat.forEach(function (item) {
        var ean = String(item.ean);
        if (linha.length && linha[linha.length - 1].ean === ean) linha[linha.length - 1].frentes += 1;
        else linha.push({ ean: ean, frentes: 1 });
      });
      return linha;
    });
    var fora = excl.map(function (e) { return { ean: String(e[0]), motivo: e[2] }; });
    return [shelves, fora, resumo];
  }

  /* ---------------- regua de baixo sobe pro produto alto ---------------- */
  function alturasParaOsAltos(mods, df) {
    if (!df || !df.length || !mods || !mods.length) return [null, null];
    var d = df.filter(function (r) { return !vazio(r.largura_cm) && !vazio(r.altura_cm); }).map(copiar);
    if (!d.length) return [null, null];
    var teto = minNum(mods.map(function (m) { return maxNum(m.alturas.map(Number)); }));
    var altos = d.filter(function (r) { return r.altura_cm > teto + 1e-6; });
    if (!altos.length) return [null, null];
    var precisa = Math.ceil(maxNum(altos.map(function (r) { return r.altura_cm; })) - 1e-6);
    var baixos = d.filter(function (r) { return r.altura_cm <= teto + 1e-6; });
    var pisoDoador = baixos.length ? Math.max(8, Math.ceil(maxNum(baixos.map(function (r) { return r.altura_cm; })) - 1e-6)) : 8;

    var largFileira = somaPy(mods.map(function (m) { return Number(m.largura); })) || 1.0;
    var capac = somaPy(mods.map(function (m) { return Number(m.largura) * m.alturas.length; }));
    var pesos = calcularPesos(d);
    var pesoDe = new Map(); d.forEach(function (r, i) { pesoDe.set(r, pesos[i].peso); });
    var necessidade = {}, acum = 0.0;
    ordenarPd(altos, ["altura_cm"], [false]).forEach(function (r) {
      var h = Math.ceil(r.altura_cm - 1e-6);
      var cm = Math.max(Number(r.largura_cm), Number(pesoDe.get(r)) * capac);
      var j0 = Math.trunc(divPiso(acum, largFileira));
      acum += cm;
      var j1 = Math.trunc(divPiso(Math.max(acum - 1e-6, 0), largFileira));
      for (var j = j0; j <= j1; j++) necessidade[j] = Math.max(necessidade[j] === undefined ? 0.0 : necessidade[j], h);
    });
    var js = Object.keys(necessidade).map(Number).sort(function (a, b) { return a - b; });
    for (var t = 0; t + 1 < js.length; t++)
      if (necessidade[js[t]] - necessidade[js[t + 1]] < DEGRAU_MIN_CM) necessidade[js[t + 1]] = necessidade[js[t]];

    var novas = [], cresceu = false;
    mods.forEach(function (m) {
      var alts = m.alturas.map(Number), n = alts.length;
      var tetoK = (n > 1 && baixos.length) ? n - 1 : n;
      var sobe = [];
      for (var q = 0; q < js.length; q++) {
        var j = js[q], h = necessidade[j];
        if (j >= tetoK) break;
        var i = n - 1 - j;
        if (h > alts[i] + 1e-6) sobe.push(i);
        alts[i] = Math.max(alts[i], h);
      }
      var falta = somaPy(alts) - somaPy(m.alturas.map(Number));
      var doad = range(0, n).filter(function (i) { return sobe.indexOf(i) < 0; });
      while (falta > 1e-6) {
        var cands = doad.filter(function (i) { return alts[i] - pisoDoador > 1e-6; });
        if (!cands.length) break;
        var iD = primeiroMax(cands, function (x) { return [alts[x], -x]; });
        var tt = Math.min(1.0, alts[iD] - pisoDoador, falta);
        alts[iD] -= tt; falta -= tt;
      }
      if (falta > 1e-6) cresceu = true;
      novas.push(alts.map(function (a) { return arred(a, 1); }));
    });
    var igual = mods.every(function (m, k) {
      var o = m.alturas.map(function (a) { return arred(Number(a), 1); });
      return o.length === novas[k].length && o.every(function (v, i) { return v === novas[k][i]; });
    });
    if (igual) return [null, null];
    var set = {}; altos.forEach(function (r) { set[String(r.descricao)] = 1; });
    var nomes = Object.keys(set).sort(cmpTxt).slice(0, 3).join(", ");
    if (altos.length > 3) nomes += " e mais " + (altos.length - 3);
    var txt = "Régua de baixo subiu pra " + fmtG(precisa) + " cm pra caber " + nomes +
      (cresceu ? " - a gôndola ficou mais alta (as de cima não tinham folga)." : "; a diferença saiu das réguas de cima.");
    return [novas, txt];
  }
  function alturasParaOsAltosBlocos(mods, df, colNivel, ordem) {
    if (!ordem || ordem.length < 2 || !colNivel || !df || !df.length) return alturasParaOsAltos(mods, df);
    var slots = montarSlots(mods);
    var blocos = niveisPorCategoria(df, colNivel, ordem, slots);
    var novas = mods.map(function (m) { return m.alturas.map(Number); });
    var textos = [];
    ordem.forEach(function (c) {
      var idx = blocos[c] || [];
      if (!idx.length) return;
      var regs = {};
      idx.forEach(function (i) { var m = Math.trunc(slots[i].mod); (regs[m] = regs[m] || []).push(Math.trunc(slots[i].reg)); });
      var ms = Object.keys(regs).map(Number).sort(function (a, b) { return a - b; });
      var subMods = ms.map(function (m) {
        var rs = regs[m].slice().sort(function (a, b) { return a - b; });
        return { largura: mods[m].largura, alturas: rs.map(function (r) { return novas[m][r]; }) };
      });
      var res = alturasParaOsAltos(subMods, df.filter(function (r) { return r[colNivel] === c; }));
      if (!res[0]) return;
      ms.forEach(function (m, k) {
        var rs = regs[m].slice().sort(function (a, b) { return a - b; });
        rs.forEach(function (r, z) { if (z < res[0][k].length) novas[m][r] = Number(res[0][k][z]); });
      });
      textos.push(c + ": " + res[1]);
    });
    if (!textos.length) return [null, null];
    return [novas.map(function (m) { return m.map(function (a) { return arred(a, 1); }); }), textos.join(" | ")];
  }

  /* ---------------- reencaixe ao mexer nos modulos ---------------- */
  function reencaixarSlots(plan, slots, largDe) {
    largDe = largDe || function () { return 0.0; };
    var antigo = {};
    (plan.slots || []).forEach(function (sl, i) { antigo[sl.mod + ":" + sl.reg] = i; });
    var novas = slots.map(function () { return []; }), usados = {}, cortados = 0;
    slots.forEach(function (sl, i) {
      var j = antigo[sl.mod + ":" + sl.reg];
      if (j === undefined || j >= plan.shelves.length) return;
      usados[j] = 1;
      var cap = Number(sl.larg), cheio = 0.0;
      plan.shelves[j].forEach(function (e) {
        var w = Number(largDe(e.ean) || 0.0); if (isNaN(w)) w = 0.0;
        if (w <= 0) { plan.fora.push({ ean: e.ean, motivo: "sem dimensao" }); cortados += 1; return; }
        var cabem = Math.trunc(divPiso(cap - cheio + 1e-6, w));
        if (cabem <= 0) { plan.fora.push({ ean: e.ean, motivo: "nao cabe no modulo" }); cortados += 1; return; }
        var n = Math.min(cabem, Math.trunc(e.frentes));
        novas[i].push({ ean: e.ean, frentes: n }); cheio += n * w;
      });
    });
    plan.shelves.forEach(function (shelf, j) {
      if (usados[j]) return;
      shelf.forEach(function (e) { plan.fora.push({ ean: e.ean, motivo: "regua removida" }); cortados += 1; });
    });
    plan.shelves = novas; plan.slots = slots;
    return cortados;
  }

  /* ---------------- altura da gondola (layout_gondolas) ---------------- */
  function alturasDaGondola(g, numPrat) {
    var padrao = parseFloat(g && g.altura_prateleira_cm); if (isNaN(padrao)) padrao = 40.0;
    var bruto = g ? g.alturas_cm : null, vals = [];
    if (typeof bruto === "string" && bruto.trim())
      bruto.trim().split(/[;,\s]+/).forEach(function (p) {
        if (!p) return; var v = parseFloat(p.replace(",", ".")); if (!isNaN(v) && v > 0) vals.push(v);
      });
    var n = Math.max(1, Math.trunc(numPrat));
    if (!vals.length) return range(0, n).map(function () { return padrao; });
    if (vals.length >= n) return vals.slice(0, n);
    return vals.concat(range(0, n - vals.length).map(function () { return padrao; }));
  }
  function textoAlturas(alts) { return alts.map(fmtG).join(","); }

  var API = {
    /* motor */
    calcularPesos: calcularPesos, alocar: alocar, distribuirPrateleiras: distribuirPrateleiras,
    cortesDeClasse: cortesDeClasse, classeDoPorte: classeDoPorte,
    semearPlano: semearPlano, ordemPadraoRecorte: ordemPadraoRecorte, niveisPorCategoria: niveisPorCategoria,
    alturasParaOsAltos: alturasParaOsAltos, alturasParaOsAltosBlocos: alturasParaOsAltosBlocos,
    reencaixarSlots: reencaixarSlots, alturasDaGondola: alturasDaGondola, textoAlturas: textoAlturas,
    /* fileira */
    normalizar: normalizar, montarSlots: montarSlots, larguras: larguras, alturas: alturas,
    capacidade: capacidade, larguraTipica: larguraTipica, alturaTotal: alturaTotal, niveis: niveis,
    porModulo: porModulo, quotasPorCapacidade: quotasPorCapacidade, reparteTerritorios: reparteTerritorios,
    composicao: composicao, uniforme: uniforme, chaveFileira: chaveFileira, espalharAntigo: espalharAntigo,
    /* apoio (exportado pros testes) */
    _num: { somaPd: somaPd, somaGrupo: somaGrupo, somaPy: somaPy, divPiso: divPiso, arred: arred, fmtG: fmtG, reprF: reprF }
  };
  return API;
});
