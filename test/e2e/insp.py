import urllib.request, urllib.error
from playwright.sync_api import sync_playwright
exec(open('topo.py').read().split("W, H, TEMA")[0].split("def proxy")[1].join(["def proxy",""]) if False else "")
def proxy(r):
    url = r.request.url.replace("https://eemfqkxshqqlhdyofgoz.supabase.co", "http://localhost:8765")
    req = urllib.request.Request(url, data=(r.request.post_data or "").encode(), method="POST", headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp: r.fulfill(status=200, body=resp.read(), content_type="application/json")
    except urllib.error.HTTPError as e: r.fulfill(status=e.code, body=e.read(), content_type="application/json")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.route("https://eemfqkxshqqlhdyofgoz.supabase.co/**", proxy)
    pg.goto("http://localhost:8765/"); pg.wait_for_selector("#login-usuario option:nth-child(2)", state="attached")
    pg.select_option("#login-usuario", "Administrador"); pg.fill("#login-senha", "moli012345"); pg.click("#btn-entrar")
    pg.wait_for_selector(".painel .opc")
    print(pg.evaluate("""() => { const r=(s)=>{const e=document.querySelector(s); const b=e.getBoundingClientRect(); return s+': y='+Math.round(b.y)+' h='+Math.round(b.height)+' bg='+getComputedStyle(e).backgroundColor+' pos='+getComputedStyle(e).position};
      const e=document.elementFromPoint(800,10); return [r('.topo'), r('.conteudo'), r('.painel'), r('.acoes-barra'), 'ponto(800,10)='+e.tagName+'.'+e.className, 'scrollY='+scrollY].join('\\n') }"""))
    b.close()
