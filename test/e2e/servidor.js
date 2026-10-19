// Servidor de TESTE: serve o docs/ e imita o PostgREST do Supabase (/rest/v1/rpc/<funcao>)
// em cima do Postgres local, rodando cada chamada como o papel anon - igual ao navegador.
const http = require("http"), fs = require("fs"), path = require("path"), { Pool } = require("pg");
const pool = new Pool({ host: "/var/tmp/pgt", port: 5544, user: "postgres", database: "postgres", max: 4 });
const DOCS = path.join(__dirname, "..", "..", "docs");
const ARRAYS = new Set(["p_escolhas", "p_norm"]);
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const m = u.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
  if (m) {
    let corpo = ""; for await (const c of req) corpo += c;
    const args = corpo ? JSON.parse(corpo) : {}, ks = Object.keys(args);
    const vals = ks.map((k) => (ARRAYS.has(k) || args[k] === null || typeof args[k] !== "object" ? args[k] : JSON.stringify(args[k])));
    const cli = await pool.connect();
    try {
      await cli.query("set role anon");
      const r = await cli.query(`select public.${m[1]}(${ks.map((k, i) => `${k} => $${i + 1}`).join(", ")}) as r`, vals);
      res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(r.rows[0].r));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ message: e.message }));
    } finally { await cli.query("reset role").catch(() => {}); cli.release(); }
    return;
  }
  let f = path.join(DOCS, u.pathname === "/" ? "index.html" : u.pathname);
  if (!f.startsWith(DOCS) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(8765, () => console.log("ok 8765"));
