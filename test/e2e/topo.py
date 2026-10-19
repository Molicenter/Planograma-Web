import urllib.request, urllib.error, sys
from playwright.sync_api import sync_playwright
S = "/tmp/claude-0/-home-claude/0b5cba9e-de49-5aac-aad9-38e5a69b996f/scratchpad/"
def proxy(r):
    url = r.request.url.replace("https://eemfqkxshqqlhdyofgoz.supabase.co", "http://localhost:8765")
    req = urllib.request.Request(url, data=(r.request.post_data or "").encode(), method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp: r.fulfill(status=200, body=resp.read(), content_type="application/json")
    except urllib.error.HTTPError as e: r.fulfill(status=e.code, body=e.read(), content_type="application/json")
W, H, TEMA = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": W, "height": H})
    pg.route("https://eemfqkxshqqlhdyofgoz.supabase.co/**", proxy)
    pg.goto("http://localhost:8765/"); pg.evaluate(f"localStorage.setItem('plano_web_tema','{TEMA}'); localStorage.setItem('plano_web_aba','recorte')"); pg.reload()
    pg.wait_for_selector("#login-usuario option:nth-child(2)", state="attached"); pg.screenshot(path=S + f"login_{W}.png")
    pg.select_option("#login-usuario", "Administrador"); pg.fill("#login-senha", "moli012345"); pg.click("#btn-entrar")
    pg.wait_for_selector(".painel .opc"); pg.check("input[data-op='Energéticos']"); pg.wait_for_selector(".blk"); pg.wait_for_timeout(600)
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(200)
    pg.screenshot(path=S + f"tela_{W}_{TEMA}.png")
    b.close()
