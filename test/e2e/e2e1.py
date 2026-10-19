import json, sys
from playwright.sync_api import sync_playwright
S = "/tmp/claude-0/-home-claude/0b5cba9e-de49-5aac-aad9-38e5a69b996f/scratchpad/"
erros = []
import urllib.request, urllib.error
def proxy(r):
    url = r.request.url.replace("https://eemfqkxshqqlhdyofgoz.supabase.co", "http://localhost:8765")
    req = urllib.request.Request(url, data=(r.request.post_data or "").encode(), method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp: r.fulfill(status=200, body=resp.read(), content_type="application/json")
    except urllib.error.HTTPError as e: r.fulfill(status=e.code, body=e.read(), content_type="application/json")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    pg.on("console", lambda m: m.type in ("error", "warning") and erros.append(m.text))
    pg.on("pageerror", lambda e: erros.append("PAGEERROR " + str(e)))
    pg.route("https://eemfqkxshqqlhdyofgoz.supabase.co/**", proxy)
    pg.goto("http://localhost:8765/")
    pg.wait_for_selector("#login-usuario option:nth-child(2)", state="attached")
    pg.select_option("#login-usuario", "Administrador")
    pg.fill("#login-senha", "moli012345")
    pg.click("#btn-entrar")
    pg.wait_for_selector(".painel .opc")
    pg.screenshot(path=S + "e1_vazio.png")
    pg.check("input[data-op='Agua Sanitária']")
    pg.wait_for_selector(".blk")
    pg.wait_for_timeout(500)
    print("toast:", pg.inner_text("#toast") if pg.is_visible("#toast") else "-")
    pg.screenshot(path=S + "e1_agua.png")
    est = pg.evaluate("JSON.stringify({sh:E.plan.shelves, fora:E.plan.fora, slots:E.plan.slots, mods:modsAtuais(), origem:E.origem, gondola:E.plan.gondola})")
    open(S + "e1_estado.json", "w").write(est)
    print("metricas:", pg.inner_text("#metricas").replace("\n", " | "))
    print("erros:", erros)
    b.close()
