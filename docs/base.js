/* =====================================================================
   base.js - BASE DE ATIVOS (o antigo produtos.xlsx do repositorio)
   ---------------------------------------------------------------------
   Traducao do base_produtos.py v7.21. A planilha agora e importada pela
   tela "Base de ativos" (igual ao Banco QL.xlsx do QL Web) e fica na
   tabela plano_web_base_produtos; o resto e igual:
     - ATIVO SEM VENDA vai pro Banco (a gondola automatica continua so
       com quem vende);
     - a dimensao da planilha SO entra onde o cadastro esta VAZIO;
     - casamento em cascata (CodBarra e Codigo dos dois lados), testando
       as formas com e sem ZERO A ESQUERDA (602883847866 = 0602883847866).
   ===================================================================== */
(function (raiz) {
  "use strict";
  var MIN_DIM_CM = 0.05, MAX_DIM_CM = 250.0, MAX_SEM_DIMENSAO = 400;

  /* minusculo, sem acento, sem espaco repetido (o _norm do Python) */
  function norm(t) {
    return String(t == null ? "" : t).normalize("NFKD").replace(/\p{Mn}/gu, "")
      .toLowerCase().split(/\s+/).filter(Boolean).join(" ");
  }
  /* codigo como texto limpo ("7891149200504.0" -> "7891149200504") */
  function chave(v) {
    var s = String(v == null ? "" : v).trim();
    if (["nan", "none", "<na>", "null", "undefined"].indexOf(s.toLowerCase()) >= 0) return "";
    if (/^\d+\.0$/.test(s)) s = s.slice(0, -2);
    return s;
  }
  function variantes(v) {
    var s = chave(v), f = {};
    if (!s) return [];
    f[s] = 1;
    var sem = s.replace(/^0+/, "");
    if (sem) {
      f[sem] = 1;
      if (sem.length <= 13) f[sem.padStart(13, "0")] = 1;
      if (sem.length <= 14) f[sem.padStart(14, "0")] = 1;
    }
    return Object.keys(f);
  }
  function numDim(v) {
    var s = String(v == null ? "" : v).trim().replace(",", ".");
    if (!s || ["nan", "none", "<na>", "null"].indexOf(s.toLowerCase()) >= 0) return null;
    var x = Number(s);
    if (!isFinite(x) || x < MIN_DIM_CM || x > MAX_DIM_CM) return null;
    return x;
  }
  var ALIAS = {
    "codbarra": "ean", "cod barra": "ean", "ean": "ean", "codigo de barras": "ean", "codigo barras": "ean",
    "codigo": "codigo_erp", "cod": "codigo_erp", "codigo erp": "codigo_erp", "cod erp": "codigo_erp",
    "descricao": "descricao", "produto": "descricao", "categorias": "categoria", "categoria": "categoria",
    "subcategoria": "subcategoria", "sub categoria": "subcategoria", "marca": "marca"
  };
  /* cabecalho da planilha -> campo do app (ou null) */
  function campoDaColuna(c) {
    var n = norm(c);
    if (ALIAS[n]) return ALIAS[n];
    if (n.indexOf("largura") === 0) return "largura_cm";
    if (n.indexOf("altura") === 0) return "altura_cm";
    if (n.indexOf("profund") === 0) return "profundidade_cm";
    return null;
  }
  /* registros crus da planilha -> linhas pra gravar (mesmo carregar_base) */
  function prepararLinhas(registros) {
    var vistos = {}, out = [];
    registros.forEach(function (r) {
      var o = {};
      ["ean", "codigo_erp", "descricao", "categoria", "subcategoria", "marca"].forEach(function (c) { o[c] = chave(r[c]); });
      ["largura_cm", "altura_cm", "profundidade_cm"].forEach(function (c) { o[c] = numDim(r[c]); });
      var ch = o.ean !== "" ? o.ean : o.codigo_erp;
      if (!ch || vistos[ch]) return;            /* sem chave fica de fora; repetido fica com o 1o */
      vistos[ch] = 1;
      out.push([ch, o.ean, o.codigo_erp, o.descricao, o.categoria, o.subcategoria, o.marca,
        o.largura_cm, o.altura_cm, o.profundidade_cm, norm(o.categoria), norm(o.subcategoria)]);
    });
    return out;
  }

  /* aplicar_base(recorte, cat_extra, base) -> {recorte, catExtra, stats}
     base = linhas do plano_web_recorte: [chave, ean, codigo_erp, descricao,
     categoria, subcategoria, marca, largura, altura, profundidade] */
  function aplicar(recorte, catExtra, base) {
    var stats = { existe: false, no_recorte: 0, dim_preenchidas: 0, novos: 0, sem_dimensao: 0, cortados: 0 };
    if (!base || !base.length) return { recorte: recorte, catExtra: catExtra, stats: stats };
    stats.existe = true;
    stats.no_recorte = base.length;
    var sel = base.map(function (a) {
      return { chave: a[0], ean: a[1] || "", codigo_erp: a[2] || "", descricao: a[3] || "", categoria: a[4] || "",
        subcategoria: a[5] || "", marca: a[6] || "", largura_cm: a[7], altura_cm: a[8], profundidade_cm: a[9] };
    });
    var porEan = {}, porErp = {};
    sel.forEach(function (r) {
      variantes(r.ean).forEach(function (k) { if (!porEan[k]) porEan[k] = r; });
      variantes(r.codigo_erp).forEach(function (k) { if (!porErp[k]) porErp[k] = r; });
    });
    function acha(ean, cod) {
      var v = variantes(ean), i;
      for (i = 0; i < v.length; i++) { var r = porEan[v[i]] || porErp[v[i]]; if (r) return r; }
      v = variantes(cod);
      for (i = 0; i < v.length; i++) { var q = porErp[v[i]] || porEan[v[i]]; if (q) return q; }
      return null;
    }
    function vazio(v) { return v === null || v === undefined || (typeof v === "number" && isNaN(v)); }
    function completar(df) {
      var n = 0;
      df = df.map(function (r) {
        var b = acha(r.ean, r.codigo_erp); if (!b) return r;
        var o = null;
        ["largura_cm", "altura_cm", "profundidade_cm"].forEach(function (c) {
          if (vazio(r[c]) && b[c] != null) { o = o || Object.assign({}, r); o[c] = b[c]; }
        });
        if (o) { n++; return o; }
        return r;
      });
      return { df: df, n: n };
    }
    var a = completar(recorte), b = completar(catExtra);
    recorte = a.df; catExtra = b.df; stats.dim_preenchidas = a.n + b.n;

    var vistos = {};
    [recorte, catExtra].forEach(function (df) {
      df.forEach(function (r) { variantes(r.ean).forEach(function (k) { vistos[k] = 1; }); variantes(r.codigo_erp).forEach(function (k) { vistos[k] = 1; }); });
    });
    var novos = [];
    sel.forEach(function (r) {
      var todas = variantes(r.chave).concat(variantes(r.ean), variantes(r.codigo_erp));
      if (todas.some(function (k) { return vistos[k]; })) return;
      novos.push({ ean: chave(r.chave), descricao: r.descricao || chave(r.chave), marca: r.marca || "",
        categoria: r.categoria || "", subcategoria: r.subcategoria || "",
        largura_cm: r.largura_cm, altura_cm: r.altura_cm, profundidade_cm: r.profundidade_cm,
        foto_url: "", codigo_erp: r.codigo_erp || "", qtde: 0.0, venda: 0.0, margem: 0.0 });
    });
    if (novos.length) {
      novos = novos.map(function (d, i) { return [d, i]; }).sort(function (x, y) {
        var a1 = x[0].largura_cm == null ? 1 : 0, b1 = y[0].largura_cm == null ? 1 : 0;
        if (a1 !== b1) return a1 - b1;
        var A = String(x[0].descricao).toUpperCase(), B = String(y[0].descricao).toUpperCase();
        return A < B ? -1 : A > B ? 1 : x[1] - y[1];
      }).map(function (t) { return t[0]; });
      var nSem = novos.filter(function (d) { return d.largura_cm == null; }).length;
      if (nSem > MAX_SEM_DIMENSAO) {
        var corte = novos.length - (nSem - MAX_SEM_DIMENSAO);
        stats.cortados = novos.length - corte; novos = novos.slice(0, corte);
      }
      stats.novos = novos.length;
      catExtra = catExtra.concat(novos);
    }
    stats.sem_dimensao = Math.floor((catExtra.filter(function (r) { return vazio(r.largura_cm); }).length +
      catExtra.filter(function (r) { return vazio(r.altura_cm); }).length) / 2);
    return { recorte: recorte, catExtra: catExtra, stats: stats };
  }
  function textoStats(st) {
    if (!st || !st.existe) return "";
    var p = ["base de ativos: " + st.no_recorte + " produto(s) neste recorte"];
    if (st.novos) p.push(st.novos + " sem venda foram pro Banco");
    if (st.dim_preenchidas) p.push(st.dim_preenchidas + " dimensão(ões) vieram da planilha");
    if (st.cortados) p.push(st.cortados + " sem dimensão ficaram de fora da lista");
    return p.join(" · ");
  }

  raiz.Base = { norm: norm, chave: chave, variantes: variantes, campoDaColuna: campoDaColuna,
    prepararLinhas: prepararLinhas, aplicar: aplicar, textoStats: textoStats };
})(typeof window !== "undefined" ? window : this);
