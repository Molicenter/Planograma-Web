import urllib.request, urllib.error
from playwright.sync_api import sync_playwright
S = "/tmp/claude-0/-home-claude/0b5cba9e-de49-5aac-aad9-38e5a69b996f/scratchpad/"
def proxy(r):
    url = r.request.url.replace("https://eemfqkxshqqlhdyofgoz.supabase.co", "http://localhost:8765")
    req = urllib.request.Request(url, data=(r.request.post_data or "").encode(), method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp: r.fulfill(status=200, body=resp.read(), content_type="application/json")
    except urllib.error.HTTPError as e: r.fulfill(status=e.code, body=e.read(), content_type="application/json")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1400, "height": 1000})
    pg.route("https://eemfqkxshqqlhdyofgoz.supabase.co/**", proxy)
    pg.goto("http://localhost:8765/"); pg.evaluate("localStorage.setItem('plano_web_aba','recorte')"); pg.reload()
    pg.wait_for_selector("#login-usuario option:nth-child(2)", state="attached")
    pg.select_option("#login-usuario", "Administrador"); pg.fill("#login-senha", "moli012345"); pg.click("#btn-entrar")
    pg.wait_for_selector(".painel .opc"); pg.check("input[data-op='Agua Sanitária']"); pg.wait_for_selector(".blk"); pg.wait_for_timeout(400)
    pg.evaluate("E.nMod=3; renderPainel(); atualizarPlano()"); pg.wait_for_timeout(800)
    pg.evaluate("window.print=()=>{}; imprimir('A4 retrato', true)"); pg.wait_for_timeout(600)
    pg.emulate_media(media="print")
    print(pg.evaluate("[...document.querySelectorAll('#impressao .gtopo')].map(e=>e.getBoundingClientRect().height)"), pg.evaluate("escalaImpressao(E.plan.slots,'A4 retrato',true)"))
    pdf = pg.pdf(path=S + "teste_impressao.pdf", format="A4", print_background=True, prefer_css_page_size=True)
    b.close()
