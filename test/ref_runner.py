"""Roda o MOTOR ORIGINAL (planograma.py do Streamlit) sobre cenarios em JSON.

Uso: python ref_runner.py < cenarios.json > saida.json
Cada cenario: {"id", "rows": [{...layout_base...}], "mods": [{"largura", "alturas"}],
               "col_nivel": "categoria"|"subcategoria", "ordem": [..] | null}
Saida por cenario: alturas ajustadas (alturas_para_os_altos_blocos), e o
resultado do semear_plano (shelves + fora) ja com as alturas novas - igual a
sequencia do main() do app.
"""
import json
import os
import sys
import types

# ---------- stubs do streamlit / supabase (o motor nao usa nenhum dos dois) ----------
def _deco(*a, **k):
    if a and callable(a[0]) and not k:
        return a[0]
    return lambda f: f

st = types.ModuleType("streamlit")
st.cache_data = _deco
st.cache_resource = _deco
st.dialog = lambda *a, **k: (lambda f: f)
st.secrets = {}
st.session_state = {}
comp = types.ModuleType("streamlit.components")
comp_v1 = types.ModuleType("streamlit.components.v1")
comp_v1.declare_component = lambda *a, **k: None
comp_v1.html = lambda *a, **k: None
comp.v1 = comp_v1
st.components = comp
sys.modules["streamlit"] = st
sys.modules["streamlit.components"] = comp
sys.modules["streamlit.components.v1"] = comp_v1
sb = types.ModuleType("supabase")
sb.create_client = lambda *a, **k: None
sys.modules["supabase"] = sb

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ref"))
import pandas as pd  # noqa: E402
import fileira as fl  # noqa: E402

# O original tira o desempate do corte de frentes da ordem de um set() de
# EANs - que muda a cada execucao (hash aleatorio do Python). Ou seja, nesse
# caso o app em producao e aleatorio. O motor.js fixa o desempate pela ordem
# de leitura das reguas; aqui a MESMA regra e aplicada numa copia do original
# so pra o teste ter uma referencia deterministica. E a unica mudanca.
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ref", "planograma.py"), encoding="utf-8").read()
_velho = 'ocupantes = {str(it["ean"]) for i in uteis for it, _ in prats[i]}'
_novo = 'ocupantes = list(dict.fromkeys(str(it["ean"]) for i in sorted(uteis) for it, _ in prats[i]))'
assert _velho in _src
pg = types.ModuleType("planograma")
pg.__file__ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ref", "planograma.py")
exec(compile(_src.replace(_velho, _novo), pg.__file__, "exec"), pg.__dict__)


def rodar(c):
    df = pd.DataFrame(c["rows"])
    for col in ("largura_cm", "altura_cm", "profundidade_cm", "qtde", "venda", "margem"):
        if col in df:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype(float)
    df["ean"] = df["ean"].astype(str)
    mods = fl.normalizar(c["mods"])
    col_nivel = c.get("col_nivel") or "categoria"
    ordem = c.get("ordem")
    out = {"id": c["id"]}
    try:
        nv, txt = pg.alturas_para_os_altos_blocos(mods, df, col_nivel, ordem)
        out["alturas"] = nv
        out["txt_alt"] = txt
        if nv:
            mods = [dict(m, alturas=a) for m, a in zip(mods, nv)]
        slots = fl.montar_slots(mods)
        shelves, fora, resumo = pg.semear_plano(df, slots, col_nivel, ordem)
        out["shelves"] = shelves
        out["fora"] = fora
        out["slots"] = slots
    except Exception as err:  # o erro tambem tem que bater
        import traceback
        out["erro"] = f"{type(err).__name__}: {err}"
        out["tb"] = traceback.format_exc()[-600:]
    return out


if __name__ == "__main__":
    cen = json.load(sys.stdin)
    json.dump([rodar(c) for c in cen], sys.stdout, ensure_ascii=False)
