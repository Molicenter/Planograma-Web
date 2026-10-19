"""
base_produtos.py - companheiro do planograma.py (v7.21)

BASE DE PRODUTOS ATIVOS lida do proprio repositorio (produtos.xlsx),
no mesmo espirito do Banco QL.xlsx do Quadro de Lotacao: o arquivo mora
no GitHub, sobe junto com o codigo e o app le direto - nao precisa rodar
script nenhum na maquina.

O QUE ELE RESOLVE
  1. ATIVOS NO BANCO. Ate a v7.20 so aparecia no quadro quem teve VENDA
     (view layout_base) mais o que ja existia na dim_produtos. Produto
     ativo no ERP e sem venda naquela loja simplesmente nao existia. Agora
     ele entra no Banco/Fora, pronto pra ser arrastado a mao. A GONDOLA
     AUTOMATICA NAO MUDOU: ela continua sendo montada so com quem vende,
     pelo delta de sempre (decisao do Adriano).
  2. DIMENSAO DOS NOVOS. A planilha traz largura/altura/profundidade
     (coluna que o comercial passa a alimentar nos produtos novos).

REGRA DE OURO - A PLANILHA NUNCA SOBRESCREVE O BANCO
  A dimensao tem varios donos: o Simplus, o app de medicao na loja e o
  editor de dois cliques daqui. Se a planilha gravasse por cima, um
  arquivo de duas semanas atras desfaria o que a equipe mediu ontem.
  Entao a medida do xlsx SO e usada onde o cadastro esta VAZIO. Nada
  aqui escreve no Supabase - este modulo so LE.

CASAMENTO
  O xlsx tem CodBarra (EAN, 13 digitos na maioria) e Codigo (codigo
  interno do ERP). Uns 4,4 mil produtos nao tem EAN de verdade: o
  CodBarra deles e um numero curto. Por isso a busca e em cascata,
  CodBarra e Codigo dos dois lados - a mesma logica do
  importarclassificacao.py.

COLUNAS ESPERADAS (aba unica; nome das colunas nao diferencia
acento/caixa):
  Codigo | Descricao | Categorias | SubCategoria | Marca | CodBarra
  | largura_cm | altura_cm | profundidade_cm
As tres ultimas podem vir vazias - vazio e simplesmente ignorado.

SE O ARQUIVO NAO EXISTIR no repo, tudo aqui vira no-op e o app se
comporta exatamente como na v7.20.
"""

import os
import unicodedata

import pandas as pd
import streamlit as st

ARQ_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "produtos.xlsx")

# piso/teto de sanidade da medida lida da PLANILHA (o cadastro do banco
# nao passa por aqui). O piso e bem baixo de proposito: sache de refresco
# e chiclete tem mesmo 2 a 4 mm de profundidade. O teto pega o digito a
# mais - 250 cm nao e produto de gondola, e erro de digitacao.
MIN_DIM_CM = 0.05
MAX_DIM_CM = 250.0

# teto de produtos SEM DIMENSAO que vao pro Banco. Eles nao podem ser
# arrastados pra gondola (so medidos, com dois cliques), entao servem de
# lista de trabalho - mas num recorte grande nao adianta despejar mil
# chips que ninguem vai ler.
MAX_SEM_DIMENSAO = 400


# ==========================================
# LEITURA DO ARQUIVO
# ==========================================
def _norm(t):
    """minusculo, sem acento e sem espaco repetido - pra comparar nome de
    coluna e de categoria sem depender de como foi digitado."""
    t = unicodedata.normalize("NFKD", str(t if t is not None else ""))
    t = "".join(c for c in t if not unicodedata.combining(c))
    return " ".join(t.lower().split())


def _chave(v):
    """Codigo/EAN como texto limpo. O pandas as vezes le codigo numerico
    como float e devolve '7891149200504.0' - o sufixo cai aqui."""
    s = str(v if v is not None else "").strip()
    if s.lower() in ("nan", "none", "<na>"):
        return ""
    if s.endswith(".0") and s[:-2].isdigit():
        s = s[:-2]
    return s


def _variantes(v):
    """Formas equivalentes do mesmo codigo, pro casamento nao perder por
    ZERO A ESQUERDA.

    Foi o que gerou produto duplicado no Banco na primeira rodada da
    v7.21: o ERP exporta o CodBarra com 12 digitos (602883847866) e a
    dim_produtos guarda com 13 (0602883847866). Como texto puro sao
    diferentes, o Cafe 500g Mineiro entrou como se fosse um item novo, ao
    lado dele mesmo. O mesmo vale pros codigos internos curtos, que no
    banco vieram preenchidos com zeros ate 13 ("0000000005944" x "5944")
    e so escaparam porque casaram pelo Cod ERP.

    Tirar os zeros da frente nao cria confusao: GTIN de verdade nao
    comeca com zero a toa, entao "5944" so colide com "0000000005944",
    que e exatamente o que queremos juntar."""
    s = _chave(v)
    if not s:
        return set()
    formas = {s}
    sem = s.lstrip("0")
    if sem:
        formas.add(sem)
        if len(sem) <= 13:
            formas.add(sem.zfill(13))
        if len(sem) <= 14:
            formas.add(sem.zfill(14))
    return formas


def _num(v):
    """Medida em cm. Aceita virgula ou ponto; fora da faixa de sanidade
    (ou vazio) devolve None, que significa 'nao informado'."""
    s = str(v if v is not None else "").strip().replace(",", ".")
    if not s or s.lower() in ("nan", "none", "<na>"):
        return None
    try:
        x = float(s)
    except ValueError:
        return None
    if not (MIN_DIM_CM <= x <= MAX_DIM_CM):
        return None
    return x


_ALIAS = {
    "codbarra": "ean", "cod barra": "ean", "ean": "ean",
    "codigo de barras": "ean", "codigo barras": "ean",
    "codigo": "codigo_erp", "cod": "codigo_erp", "codigo erp": "codigo_erp",
    "cod erp": "codigo_erp",
    "descricao": "descricao", "produto": "descricao",
    "categorias": "categoria", "categoria": "categoria",
    "subcategoria": "subcategoria", "sub categoria": "subcategoria",
    "marca": "marca",
}


@st.cache_data(ttl=None, show_spinner="Lendo a base de produtos...")
def carregar_base():
    """produtos.xlsx do repositorio -> DataFrame normalizado.
    Arquivo ausente ou ilegivel devolve DataFrame vazio (no-op)."""
    if not os.path.isfile(ARQ_BASE):
        return pd.DataFrame()
    try:
        df = pd.read_excel(ARQ_BASE, dtype=str)
    except Exception:
        return pd.DataFrame()
    if df.empty:
        return pd.DataFrame()

    ren = {}
    for c in df.columns:
        n = _norm(c)
        if n in _ALIAS:
            ren[c] = _ALIAS[n]
        elif n.startswith("largura"):
            ren[c] = "largura_cm"
        elif n.startswith("altura"):
            ren[c] = "altura_cm"
        elif n.startswith("profund"):
            ren[c] = "profundidade_cm"
    df = df.rename(columns=ren)

    for c in ("ean", "codigo_erp", "descricao", "categoria", "subcategoria",
              "marca"):
        df[c] = df[c].map(_chave) if c in df.columns else ""
    for c in ("largura_cm", "altura_cm", "profundidade_cm"):
        df[c] = df[c].map(_num) if c in df.columns else None

    # chave de exibicao: o EAN quando ha, senao o codigo interno - e o que
    # vira o "ean" do produto dentro do app (e no layout_planograma)
    df["chave"] = df["ean"].where(df["ean"] != "", df["codigo_erp"])
    df = df[df["chave"] != ""]
    # EAN repetido (dois sabores dividindo o mesmo codigo) fica com o
    # primeiro, igual ao banco, onde o ean e chave primaria
    df = df.drop_duplicates(subset=["chave"], keep="first")

    df["_cat"] = df["categoria"].map(_norm)
    df["_sub"] = df["subcategoria"].map(_norm)
    return df.reset_index(drop=True)


def resumo_arquivo():
    """Numeros do arquivo inteiro, pra mostrar na sidebar."""
    base = carregar_base()
    if base.empty:
        return {"existe": False, "total": 0, "com_dim": 0}
    com = int(base["largura_cm"].notna().sum())
    return {"existe": True, "total": int(len(base)), "com_dim": com}


# ==========================================
# APLICACAO NO RECORTE ABERTO
# ==========================================
def _indices(sel):
    """Dois dicionarios de busca (por EAN e por codigo interno)."""
    por_ean, por_erp = {}, {}
    for r in sel.to_dict("records"):
        for k in _variantes(r.get("ean")):
            por_ean.setdefault(k, r)
        for k in _variantes(r.get("codigo_erp")):
            por_erp.setdefault(k, r)
    return por_ean, por_erp


def _vazio(v):
    try:
        return v is None or pd.isna(v)
    except Exception:
        return v is None


def aplicar_base(recorte, cat_extra, col_nivel, escolhas):
    """Completa dimensoes e acrescenta os ativos sem venda ao Banco.

    recorte   - produtos COM venda (view layout_base). SO completa
                dimensao; nenhuma linha e adicionada aqui, porque e ele
                que alimenta a montagem automatica da gondola.
    cat_extra - o que vai pro Banco/Fora. Ganha os ativos da planilha que
                nao apareceram nem no recorte nem na dim_produtos.

    Devolve (recorte, cat_extra, stats)."""
    stats = {"existe": False, "no_recorte": 0, "dim_preenchidas": 0,
             "novos": 0, "sem_dimensao": 0, "cortados": 0}
    base = carregar_base()
    if base.empty or not escolhas:
        return recorte, cat_extra, stats
    stats["existe"] = True

    col = "_cat" if col_nivel == "categoria" else "_sub"
    alvo = {_norm(e) for e in escolhas}
    sel = base[base[col].isin(alvo)]
    stats["no_recorte"] = int(len(sel))
    if sel.empty:
        return recorte, cat_extra, stats

    por_ean, por_erp = _indices(sel)

    def _acha(ean, cod):
        """Cascata CodBarra/Codigo dos dois lados, testando todas as
        formas do codigo (com e sem zero a esquerda)."""
        for v in _variantes(ean):
            r = por_ean.get(v) or por_erp.get(v)
            if r:
                return r
        for v in _variantes(cod):
            r = por_erp.get(v) or por_ean.get(v)
            if r:
                return r
        return None

    # ---- 1) completa a dimensao que falta (nunca sobrescreve) ----
    def _completar(df):
        if df is None or df.empty:
            return df, 0
        df = df.copy()
        for c in ("largura_cm", "altura_cm", "profundidade_cm"):
            if c not in df.columns:
                df[c] = None
        tem_cod = "codigo_erp" in df.columns
        n = 0
        for i in df.index:
            r = _acha(df.at[i, "ean"], df.at[i, "codigo_erp"] if tem_cod else "")
            if not r:
                continue
            mexeu = False
            for c in ("largura_cm", "altura_cm", "profundidade_cm"):
                if _vazio(df.at[i, c]) and r.get(c) is not None:
                    df.at[i, c] = r[c]
                    mexeu = True
            if mexeu:
                n += 1
        return df, n

    recorte, n1 = _completar(recorte)
    cat_extra, n2 = _completar(cat_extra)
    stats["dim_preenchidas"] = n1 + n2

    # ---- 2) ativos que nao estao em lugar nenhum -> Banco ----
    vistos = set()
    for df in (recorte, cat_extra):
        if df is None or df.empty:
            continue
        for v in df["ean"]:
            vistos |= _variantes(v)
        if "codigo_erp" in df.columns:
            for v in df["codigo_erp"]:
                vistos |= _variantes(v)
    vistos.discard("")

    novos = []
    for r in sel.to_dict("records"):
        conhecido = (_variantes(r["chave"]) | _variantes(r["ean"])
                     | _variantes(r["codigo_erp"])) & vistos
        if conhecido:
            continue
        novos.append({
            "ean": _chave(r["chave"]),
            "descricao": r.get("descricao") or _chave(r["chave"]),
            "marca": r.get("marca") or "",
            "categoria": r.get("categoria") or "",
            "subcategoria": r.get("subcategoria") or "",
            "largura_cm": r.get("largura_cm"),
            "altura_cm": r.get("altura_cm"),
            "profundidade_cm": r.get("profundidade_cm"),
            "foto_url": "", "codigo_erp": r.get("codigo_erp") or "",
            "qtde": 0.0, "venda": 0.0, "margem": 0.0})

    if novos:
        # com dimensao primeiro: sao os que dao pra arrastar de fato
        novos.sort(key=lambda d: (d["largura_cm"] is None,
                                  str(d["descricao"]).upper()))
        n_sem = sum(1 for d in novos if d["largura_cm"] is None)
        if n_sem > MAX_SEM_DIMENSAO:
            corte = len(novos) - (n_sem - MAX_SEM_DIMENSAO)
            stats["cortados"] = len(novos) - corte
            novos = novos[:corte]
        stats["novos"] = len(novos)
        novo_df = pd.DataFrame(novos)
        if cat_extra is None or cat_extra.empty:
            cat_extra = novo_df
        else:
            cat_extra = pd.concat([cat_extra, novo_df], ignore_index=True)

    if cat_extra is not None and not cat_extra.empty:
        stats["sem_dimensao"] = int(cat_extra["largura_cm"].isna().sum()
                                    + cat_extra["altura_cm"].isna().sum()) // 2
    return recorte, cat_extra, stats


def texto_stats(stats):
    """Uma linha pra legenda embaixo do titulo."""
    if not stats.get("existe"):
        return ""
    p = [f"base de ativos: {stats['no_recorte']} produto(s) neste recorte"]
    if stats.get("novos"):
        p.append(f"{stats['novos']} sem venda foram pro Banco")
    if stats.get("dim_preenchidas"):
        p.append(f"{stats['dim_preenchidas']} dimensao(oes) vieram da planilha")
    if stats.get("cortados"):
        p.append(f"{stats['cortados']} sem dimensao ficaram de fora da lista")
    return " \u00b7 ".join(p)
