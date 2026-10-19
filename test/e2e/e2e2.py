import json, sys, urllib.request, urllib.error
from playwright.sync_api import sync_playwright
S = "/tmp/claude-0/-home-claude/0b5cba9e-de49-5aac-aad9-38e5a69b996f/scratchpad/"
erros, ok = [], []
def check(cond, nome):
    (ok if cond else erros).append(nome); print(("OK   " if cond else "FALHA") + " " + nome)
def proxy(r):
    url = r.request.url.replace("https://eemfqkxshqqlhdyofgoz.supabase.co", "http://localhost:8765")
    req = urllib.request.Request(url, data=(r.request.post_data or "").encode(), method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp: r.fulfill(status=200, body=resp.read(), content_type="application/json")
    except urllib.error.HTTPError as e: r.fulfill(status=e.code, body=e.read(), content_type="application/json")
def excel(r): r.fulfill(path="node_modules/exceljs/dist/exceljs.min.js", content_type="text/javascript")
def ev(pg, js): return pg.evaluate(js)
def login(pg, u, s):
    pg.goto("http://localhost:8765/")
    pg.wait_for_selector("#login-usuario option:nth-child(2)", state="attached")
    pg.select_option("#login-usuario", u); pg.fill("#login-senha", s); pg.click("#btn-entrar")
def esperar_plano(pg):
    pg.wait_for_function("() => !document.querySelector('#carregando') || document.querySelector('#carregando').hidden")
    pg.wait_for_timeout(300)

import subprocess
subprocess.run(['psql','-h','/var/tmp/pgt','-p','5544','-U','postgres','-q','-f','seed.sql'],check=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1500, "height": 1900})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: erros.append("PAGEERROR " + str(e)))
    pg.on("console", lambda m: m.type == "error" and "400" not in m.text and erros.append("CONSOLE " + m.text))  # 400 = senha errada de proposito
    pg.on("dialog", lambda d: d.accept())
    pg.route("https://eemfqkxshqqlhdyofgoz.supabase.co/**", proxy)
    pg.route("https://cdnjs.cloudflare.com/**", excel)

    # ---- senha errada / certa ----
    login(pg, "Administrador", "errada")
    pg.wait_for_selector("#login-erro:not([hidden])")
    check("incorretos" in pg.inner_text("#login-erro"), "senha errada recusada")
    pg.fill("#login-senha", "moli012345"); pg.click("#btn-entrar")
    pg.wait_for_selector(".painel .opc")
    check(ev(pg, "sessao.perfil") == "admin", "login admin")

    # ---- base de ativos ----
    pg.click("button[data-pg=base]")
    pg.wait_for_selector("#zona")
    pg.set_input_files("#arquivo", "produtos_teste.xlsx")
    pg.wait_for_selector("#btn-gravar-base")
    txt = pg.inner_text("#conteudo")
    check("31" in txt, "base: 31 produtos lidos")
    pg.screenshot(path=S + "e2_base.png", full_page=True)
    pg.click("#btn-gravar-base"); pg.wait_for_selector("#hist-base table")
    check(ev(pg, "E.inicio.base.total") == 31, "base gravada (31)")

    # ---- duas categorias (Agua Sanitaria + Alvejante) ----
    pg.click("button[data-pg=plano]"); pg.wait_for_selector(".painel .opc")
    pg.check("input[data-op='Agua Sanitária']"); esperar_plano(pg)
    pg.check("input[data-op='Alvejante']"); esperar_plano(pg)
    pg.wait_for_selector(".blk")
    ordem = ev(pg, "ordemAtual()")
    check(ordem == ["Agua Sanitária", "Alvejante"] or ordem == ["Alvejante", "Agua Sanitária"], "ordem das categorias: %s" % ordem)
    fora = ev(pg, "E.plan.fora.map(i=>i.ean)")
    check("7891000000888" in fora and "5944" in fora and "7896083899999" in fora, "ativos sem venda da base foram pro Banco")
    sem_dim = ev(pg, "metricas().semDim")
    check(sem_dim >= 1, "Banco sem medida conta o 5944 (%s)" % sem_dim)
    pg.screenshot(path=S + "e2_multi.png", full_page=True)
    estado_multi = ev(pg, "JSON.stringify({sh:E.plan.shelves, mods:modsAtuais(), ordem:ordemAtual()})")
    open(S + "e2_multi.json", "w").write(estado_multi)

    # ---- arrastar um produto pro Banco + desfazer ----
    antes = ev(pg, "estadoPlan()")
    blk = pg.locator(".shelf .blk").first
    bb = blk.bounding_box(); banco = pg.locator(".banco").bounding_box()
    pg.mouse.move(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2); pg.mouse.down()
    pg.mouse.move(bb["x"] + 40, bb["y"] - 30, steps=5)
    pg.mouse.move(banco["x"] + 30, banco["y"] + 30, steps=10); pg.mouse.up()
    pg.wait_for_timeout(200)
    check(ev(pg, "estadoPlan()") != antes and ev(pg, "sujo()"), "arrastar pro Banco muda o plano e marca não salvo")
    check("não salvas" in pg.inner_text("#acoes"), "aviso de não salvo aparece")
    pg.click("#ac-desfazer"); pg.wait_for_timeout(150)
    check(ev(pg, "estadoPlan()") == antes, "Desfazer volta exatamente o estado anterior")

    # ---- botao + ----
    n0 = ev(pg, "E.plan.shelves.flat().reduce((a,e)=>a+e.frentes,0)")
    pg.locator(".fbtn.plus").first.click(); pg.wait_for_timeout(100)
    check(ev(pg, "E.plan.shelves.flat().reduce((a,e)=>a+e.frentes,0)") == n0 + 1, "botão + soma 1 frente")

    # ---- salvar e reabrir ----
    pg.click("#ac-salvar"); pg.wait_for_selector("#toast:not([hidden])")
    check("salvo" in pg.inner_text("#toast").lower(), "salvar")
    salvo = ev(pg, "estadoPlan()")
    pg.reload(); pg.wait_for_selector(".painel .opc")
    pg.check("input[data-op='Agua Sanitária']"); esperar_plano(pg)
    pg.check("input[data-op='Alvejante']"); esperar_plano(pg); pg.wait_for_selector(".blk")
    check(ev(pg, "E.origem") == "salvo", "reabriu com o arranjo salvo")
    sv = json.loads(salvo)
    check(ev(pg, "JSON.stringify(E.plan.shelves)") == json.dumps(sv[0], separators=(",", ":"), ensure_ascii=False), "réguas do arranjo salvo voltam idênticas")
    check(ev(pg, "E.plan.fora.map(i=>i.ean)") == [i["ean"] for i in sv[1]], "Banco do arranjo salvo volta idêntico (mesmos produtos, mesma ordem)")

    # ---- editor de medidas (dois cliques) ----
    chip = pg.locator(".banco .chip.sem-dim").first
    chip.dispatch_event("pointerdown"); chip.dispatch_event("pointerdown")
    pg.wait_for_selector("#form-medidas")
    pg.fill("[name=l]", "20"); pg.fill("[name=a]", "30"); pg.fill("[name=p]", "10")
    pg.click("#btn-medidas"); pg.wait_for_selector("#gaveta", state="hidden")
    check(ev(pg, "E.prodInfo['5944'].largura_cm") == 20, "editor grava medida do ativo sem cadastro")

    # ---- gondola: 3 modulos, M2 com 4 reguas e 1,00m ----
    pg.click("[data-aba=gondola]"); pg.wait_for_timeout(300); pg.screenshot(path=S + "e2_aba.png")
    pg.fill("#g-nmod", "3"); pg.press("#g-nmod", "Tab"); esperar_plano(pg)
    pg.fill("[data-larg='1']", "100"); pg.press("[data-larg='1']", "Tab"); esperar_plano(pg)
    pg.fill("[data-nreg='1']", "4"); pg.press("[data-nreg='1']", "Tab"); esperar_plano(pg)
    mods = ev(pg, "modsAtuais()")
    check([len(m["alturas"]) for m in mods] == [5, 4, 5] and mods[1]["largura"] == 100, "módulos 130x5 + 100x4 + 130x5: %s" % [(m['largura'], len(m['alturas'])) for m in mods])
    check(abs(sum(mods[1]["alturas"]) - sum(mods[0]["alturas"])) < 1.01, "pôr/tirar régua mantém a altura do módulo")
    check(ev(pg, "E.plan.gondola").startswith("Módulo 1,30m x 5 prateleiras | 130x5+100x4+130x5"), "chave da fileira mista igual ao Streamlit: " + ev(pg, "E.plan.gondola"))
    pg.screenshot(path=S + "e2_3mod.png", full_page=True)
    open(S + "e2_3mod.json", "w").write(ev(pg, "JSON.stringify({sh:E.plan.shelves, mods:modsAtuais(), ordem:ordemAtual()})"))

    # ---- arrastar a tarja (altura da regua) ----
    te = pg.locator(".testeira.ajusta").first; tb = te.bounding_box()
    alt0 = ev(pg, "E.plan.slots.map(s=>s.alt)")
    pg.mouse.move(tb["x"] + 60, tb["y"] + 8); pg.mouse.down(); pg.mouse.move(tb["x"] + 60, tb["y"] + 8 + 5 * ev(pg, "escalaAtual()"), steps=6); pg.mouse.up()
    esperar_plano(pg)
    alt1 = ev(pg, "E.plan.slots.map(s=>s.alt)")
    check(alt1 != alt0 and abs(sum(alt1) - sum(alt0)) < 0.01, "arrastar a tarja muda a altura e mantém a soma")

    # ---- imprimir (visual de impressão) ----
    pg.evaluate("window.print = () => {}")
    pg.click("#ac-imprimir"); pg.click("#imp-sim"); pg.wait_for_timeout(500)
    check(pg.locator("#impressao .shelf").count() == 14, "impressão monta as 14 réguas")
    pg.emulate_media(media="print"); pg.screenshot(path=S + "e2_print.png", full_page=True); pg.emulate_media(media="screen")

    # ---- usuarios ----
    pg.click("button[data-pg=usuarios]"); pg.wait_for_selector("#novo-usuario")
    pg.click("#novo-usuario"); pg.fill("[name=nome]", "Loja 03"); pg.fill("[name=senha]", "1234"); pg.click("#btn-usuario")
    pg.wait_for_selector("text=Loja 03")
    check(pg.locator("table.usuarios tbody tr").count() >= 3, "criar usuário")
    pg.screenshot(path=S + "e2_usuarios.png", full_page=True)

    # ---- perfil usuario: sem editor, sem menus de admin ----
    pg.click("#btn-sair"); login(pg, "Loja 03", "1234"); pg.wait_for_timeout(1500)
    print("DBG erro login:", pg.inner_text("#login-erro") if pg.is_visible("#login-erro") else "-", "| app:", pg.is_visible("#app"), "|", pg.inner_text("#conteudo")[:300] if pg.is_visible("#app") else "")
    pg.click("[data-aba=recorte]"); pg.wait_for_selector(".painel .opc")
    check(pg.locator("button[data-pg=usuarios]").count() == 0 and pg.locator("button[data-pg=base]").count() == 0, "usuário comum não vê Base/Usuários")
    pg.check("input[data-op='Arroz']"); esperar_plano(pg); pg.wait_for_selector(".blk")
    check(ev(pg, "gondolaAtual.cfg.edita") is False and ev(pg, "gondolaAtual.cfg.ajustaAlt") is True, "usuário: sem editor, com arraste de altura")
    pg.screenshot(path=S + "e2_arroz_usuario.png", full_page=True)
    open(S + "e2_arroz.json", "w").write(ev(pg, "JSON.stringify({sh:E.plan.shelves, mods:modsAtuais()})"))
    b.close()
print("\n%d ok, %d falhas" % (len(ok), len(erros)))
for e in erros: print(" -", e)
