/* =====================================================================
   foto.js - TRATAMENTO DA FOTO DO PRODUTO (no navegador)
   ---------------------------------------------------------------------
   Mesma receita do _tratar_foto do planograma.py (que era a do
   tirar_fundo_fotos.py, usado no pipeline do Simplus):
     1. gira pela orientacao da camera (EXIF);
     2. REMOVE O FUNDO de estudio: a cor de fundo e a mediana da borda
        (3 px de cada lado); pixel a ate TOLERANCIA dela vira candidato,
        mas so some o que estiver LIGADO A BORDA (um branco no meio do
        rotulo fica);
     3. suaviza a borda do recorte (desfoque de 1 px no canal alfa);
     4. CORTA na caixa dos pixels bem opacos, ignorando linha/coluna
        quase vazia;
     5. reduz pra no maximo 1200 px e salva em WEBP (qualidade 85).
   ===================================================================== */
(function (raiz) {
  "use strict";
  var TOLERANCIA = 26, LIMIAR_CAIXA = 40, FRACAO_MINIMA = 0.01, MAX_LADO = 1200;

  function carregar(arquivo) {
    if (window.createImageBitmap)
      return createImageBitmap(arquivo, { imageOrientation: "from-image" }).catch(function () { return viaImg(arquivo); });
    return viaImg(arquivo);
  }
  function viaImg(arquivo) {
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(arquivo), im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { URL.revokeObjectURL(url); falha(new Error("Não consegui abrir essa imagem.")); };
      im.src = url;
    });
  }
  function mediana(v) {
    v.sort(function (a, b) { return a - b; });
    var n = v.length, m = n >> 1;
    return n % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }
  /* desfoque gaussiano (sigma 1) separavel, so no canal alfa */
  function desfocarAlfa(px, w, h) {
    var k = [], s = 0, r = 3, i, x, y;
    for (i = -r; i <= r; i++) { var g = Math.exp(-(i * i) / 2); k.push(g); s += g; }
    k = k.map(function (g) { return g / s; });
    var a = new Float32Array(w * h), t = new Float32Array(w * h);
    for (i = 0; i < w * h; i++) a[i] = px[i * 4 + 3];
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var acc = 0;
      for (i = -r; i <= r; i++) { var xx = Math.min(w - 1, Math.max(0, x + i)); acc += a[y * w + xx] * k[i + r]; }
      t[y * w + x] = acc;
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var acc2 = 0;
      for (i = -r; i <= r; i++) { var yy = Math.min(h - 1, Math.max(0, y + i)); acc2 += t[yy * w + x] * k[i + r]; }
      px[(y * w + x) * 4 + 3] = Math.round(acc2);
    }
  }
  function removerFundo(px, w, h) {
    /* cor do fundo = mediana dos 3 px de borda (igual ao numpy) */
    var R = [], G = [], B = [], x, y, i;
    function amostra(x_, y_) { var p = (y_ * w + x_) * 4; R.push(px[p]); G.push(px[p + 1]); B.push(px[p + 2]); }
    for (y = 0; y < Math.min(3, h); y++) for (x = 0; x < w; x++) amostra(x, y);
    for (y = Math.max(0, h - 3); y < h; y++) for (x = 0; x < w; x++) amostra(x, y);
    for (y = 0; y < h; y++) for (x = 0; x < Math.min(3, w); x++) amostra(x, y);
    for (y = 0; y < h; y++) for (x = Math.max(0, w - 3); x < w; x++) amostra(x, y);
    var fr = mediana(R), fg = mediana(G), fb = mediana(B);
    var fundo = new Uint8Array(w * h);
    for (i = 0; i < w * h; i++) {
      var p = i * 4;
      if (Math.abs(px[p] - fr) + Math.abs(px[p + 1] - fg) + Math.abs(px[p + 2] - fb) <= TOLERANCIA) fundo[i] = 1;
    }
    /* so some a regiao de fundo LIGADA a borda (4-vizinhos, como o ndimage.label) */
    var some = new Uint8Array(w * h), fila = new Int32Array(w * h), ini = 0, fim = 0;
    function semear(i_) { if (fundo[i_] && !some[i_]) { some[i_] = 1; fila[fim++] = i_; } }
    for (x = 0; x < w; x++) { semear(x); semear((h - 1) * w + x); }
    for (y = 0; y < h; y++) { semear(y * w); semear(y * w + w - 1); }
    if (!fim) return false;
    while (ini < fim) {
      var c = fila[ini++], cx = c % w, cy = (c - cx) / w;
      if (cx > 0) semear(c - 1);
      if (cx < w - 1) semear(c + 1);
      if (cy > 0) semear(c - w);
      if (cy < h - 1) semear(c + w);
    }
    for (i = 0; i < w * h; i++) if (some[i]) px[i * 4 + 3] = 0;
    desfocarAlfa(px, w, h);
    return true;
  }
  function caixa(px, w, h) {
    var col = new Uint32Array(w), lin = new Uint32Array(h), x, y, tem = false;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3] > LIMIAR_CAIXA) { col[x]++; lin[y]++; tem = true; }
    if (!tem) return null;
    var x0 = -1, x1 = -1, y0 = -1, y1 = -1;
    for (x = 0; x < w; x++) if (col[x] / h >= FRACAO_MINIMA) { if (x0 < 0) x0 = x; x1 = x; }
    for (y = 0; y < h; y++) if (lin[y] / w >= FRACAO_MINIMA) { if (y0 < 0) y0 = y; y1 = y; }
    if (x0 < 0 || y0 < 0) return null;
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  function blob(canvas, tipo, q) {
    return new Promise(function (ok) { canvas.toBlob(function (b) { ok(b); }, tipo, q); });
  }

  /* arquivo -> {blob, tipo, extensao, largura, altura, fundoRemovido} */
  async function tratar(arquivo, opc) {
    opc = opc || {};
    var bm = await carregar(arquivo);
    var w = bm.width, h = bm.height;
    /* imagem gigante de celular: reduz antes pra o recorte nao travar a tela */
    var pre = Math.min(1, 2400 / Math.max(w, h));
    w = Math.max(1, Math.round(w * pre)); h = Math.max(1, Math.round(h * pre));
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bm, 0, 0, w, h);
    if (bm.close) bm.close();
    var dados = ctx.getImageData(0, 0, w, h), removido = false;
    if (opc.removerFundo !== false) removido = removerFundo(dados.data, w, h);
    ctx.putImageData(dados, 0, 0);
    var cx = caixa(dados.data, w, h) || { x: 0, y: 0, w: w, h: h };
    var esc = Math.min(1, MAX_LADO / Math.max(cx.w, cx.h));
    var fw = Math.max(1, Math.round(cx.w * esc)), fh = Math.max(1, Math.round(cx.h * esc));
    var o = document.createElement("canvas"); o.width = fw; o.height = fh;
    var octx = o.getContext("2d"); octx.imageSmoothingQuality = "high";
    octx.drawImage(c, cx.x, cx.y, cx.w, cx.h, 0, 0, fw, fh);
    var b = await blob(o, "image/webp", 0.85);
    var tipo = b && b.type === "image/webp" ? "image/webp" : "image/png";
    if (tipo !== "image/webp") b = await blob(o, "image/png");   /* navegador sem WEBP (Safari antigo) */
    return { blob: b, tipo: tipo, extensao: tipo === "image/webp" ? "webp" : "png", largura: fw, altura: fh, fundoRemovido: removido };
  }
  function paraBase64(b) {
    return new Promise(function (ok, falha) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).replace(/^data:[^,]*,/, "")); };
      r.onerror = function () { falha(new Error("Não consegui ler a foto tratada.")); };
      r.readAsDataURL(b);
    });
  }
  raiz.Foto = { tratar: tratar, paraBase64: paraBase64 };
})(typeof window !== "undefined" ? window : this);
