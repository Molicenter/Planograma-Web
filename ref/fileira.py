"""
fileira.py - MODULOS INDEPENDENTES (Planograma Molicenter, v7.22)

Ate a v7.21 a fileira era um retangulo: `largura_prat` (um numero) x
`num_prateleiras`. Varios modulos lado a lado viravam UMA regua longa -
390cm de 1,30m x3 - e um produto podia ficar montado em cima da emenda
entre dois modulos.

A partir da v7.22 a fileira e uma LISTA DE MODULOS, cada um com a sua
largura e o seu numero de reguas (a altura TOTAL e a mesma - decisao do
Adriano). Como o produto NAO atravessa a emenda (tambem decisao dele),
cada MODULO x REGUA vira um container proprio: o SLOT.

    slot = {mod, reg, larg, alt, y}

O motor continua indexando por um numero so (slot 0, slot 1, ...), igual
fazia com as reguas - o que muda e que:

  * a ordem dos slots e por ALTURA FISICA (y = distancia do piso ate a
    base da regua), do topo pra base. Com nº de reguas diferente por
    modulo, "regua 2" nao e a mesma altura em todo mundo; o que alinha
    os modulos e o y, nao o indice. E o que faz o sabao 5kg continuar
    embaixo nos tres modulos ao mesmo tempo;
  * a largura deixa de ser um escalar e passa a ser uma por slot
    (caps[i]), porque 1,30 / 1,00 / 0,60 nao repartem igual.

ANCORAGEM NO PISO (confirmado com o Adriano): as alturas empilham de
BAIXO PRA CIMA. A regua de baixo de todo modulo apoia no mesmo chao
(y=0); se um modulo somar menos altura que o outro, a folga sobra EM
CIMA, nunca embaixo.

Este modulo e so calculo - nao importa streamlit nem supabase, e nao
escreve nada em lugar nenhum.
"""

# dois slots sao do MESMO NIVEL quando os pisos estao a menos disso (cm).
# Serve pro desenho e pra migracao do plano antigo; o motor usa a ordem.
TOL_NIVEL = 2.0


# ==========================================
# MODELO
# ==========================================
def normalizar(mods, largura_padrao=130.0, altura_padrao=40.0):
    """Sanea a configuracao vinda da tela. Devolve uma lista nova de
    {"largura": float, "alturas": [float,...]} - alturas na ordem
    TOPO -> BASE, igual a coluna alturas_cm da layout_gondolas."""
    limpos = []
    for mod in (mods or []):
        try:
            larg = float(mod.get("largura") or 0)
        except (TypeError, ValueError):
            larg = 0.0
        if larg <= 0:
            larg = float(largura_padrao)
        alturas = []
        for a in (mod.get("alturas") or []):
            try:
                a = float(a)
            except (TypeError, ValueError):
                continue
            if a > 0:
                alturas.append(a)
        if not alturas:
            alturas = [float(altura_padrao)]
        limpos.append({"largura": larg, "alturas": alturas})
    if not limpos:
        limpos = [{"largura": float(largura_padrao),
                   "alturas": [float(altura_padrao)]}]
    return limpos


def montar_slots(mods):
    """Lista de slots da fileira, ordenada TOPO -> BASE.

    Empate de altura (o caso normal, modulos com o mesmo nº de reguas):
    desempata pelo modulo da ESQUERDA primeiro, entao a faixa horizontal
    do topo atravessa os tres modulos antes de descer - que e o que o
    motor ja fazia quando a regua era continua."""
    slots = []
    for m, mod in enumerate(normalizar(mods)):
        alturas = mod["alturas"]
        n = len(alturas)
        for s in range(n):
            slots.append({"mod": m, "reg": s,
                          "larg": float(mod["largura"]),
                          "alt": float(alturas[s]),
                          # ancorado no CHAO: a ultima regua tem piso 0
                          "y": float(sum(alturas[s + 1:]))})
    slots.sort(key=lambda sl: (-sl["y"], sl["mod"], sl["reg"]))
    return slots


def larguras(slots):
    return [float(sl["larg"]) for sl in slots]


def alturas(slots):
    return [float(sl["alt"]) for sl in slots]


def capacidade(slots):
    """cm lineares da fileira inteira."""
    return sum(float(sl["larg"]) for sl in slots)


def largura_tipica(slots):
    """Largura de referencia pras regras que eram escritas em 'fracao de
    uma regua' (MIN_CLASSE_REGUA, por exemplo). Com modulos diferentes
    nao existe 'uma regua', entao vale a MEDIANA das larguras - o modulo
    de 0,60m no meio nao afunda o criterio."""
    ls = sorted(larguras(slots))
    if not ls:
        return 0.0
    return ls[len(ls) // 2]


def altura_total(mods):
    """Maior altura somada entre os modulos (cm). E a altura da fileira."""
    return max([sum(m["alturas"]) for m in normalizar(mods)] or [0.0])


def niveis(slots, tol=TOL_NIVEL):
    """Agrupa os indices dos slots em NIVEIS por altura de piso, do topo
    pra base. Com todo mundo no mesmo nº de reguas da uma lista por
    regua; com nº diferente, os niveis ficam desencontrados de proposito
    - e a realidade da loja."""
    grupos = []
    for i, sl in enumerate(slots):
        if grupos and abs(slots[grupos[-1][0]]["y"] - sl["y"]) <= tol:
            grupos[-1].append(i)
        else:
            grupos.append([i])
    return grupos


def por_modulo(slots):
    """Indices dos slots agrupados por modulo, cada grupo na ordem
    TOPO -> BASE. E o que o desenho (estatico e canvas) consome."""
    n = max([sl["mod"] for sl in slots] or [0]) + 1
    grupos = [[] for _ in range(n)]
    for i, sl in enumerate(slots):
        grupos[sl["mod"]].append(i)
    for g in grupos:
        g.sort(key=lambda i: slots[i]["reg"])
    return grupos


# ==========================================
# REPARTICAO (o que era "quota de reguas")
# ==========================================
def quotas_por_capacidade(blocos, largs):
    """Reparte len(largs) slots entre os blocos, na ordem em que serao
    entregues, proporcional ao cm que cada bloco pede.

    Substitui o _quotas_de_reguas, que contava REGUAS INTEIRAS assumindo
    que toda regua tem a mesma largura. Com 1,30 / 1,00 / 0,60 isso
    deixaria de valer: dar "uma regua" pra uma classe pode ser dar 130cm
    ou 60cm. Aqui a conta e em centimetro.

    Todo bloco leva pelo menos 1 slot enquanto houver slot - faixa de
    marca nunca fica pela metade, igual antes. Os blocos consomem os
    slots em sequencia, entao cada um fica com uma faixa CONTIGUA."""
    k, n = len(blocos), len(largs)
    if k <= 0 or n <= 0:
        return [0] * k
    if k >= n:                       # mais blocos que slots: 1 pra cada
        return [1] * n + [0] * (k - n)
    q = [1] * k
    media = sum(largs) / float(n)
    restam = n - k
    while restam > 0:
        # o bloco com o maior DEFICIT (cm que pede - cm que ja tem) leva
        # o proximo slot; e o mesmo criterio de maior resto de antes, so
        # que medido em centimetro
        i = max(range(k), key=lambda j: float(blocos[j].get("cm") or 0.0)
                - q[j] * media)
        q[i] += 1
        restam -= 1
    return q


def reparte_territorios(cls_blocos, reguas, largs, alts):
    """TERRITORIOS POR CLASSE DE TAMANHO com slots de larguras
    diferentes. `cls_blocos` vem da classe MENOR pra MAIOR, cada um com
    "itens" e "cm"; `reguas` sao os indices dos slots disponiveis, na
    ordem TOPO -> BASE.

    Serve de BAIXO PRA CIMA: a classe MAIOR escolhe primeiro e leva as
    reguas mais baixas QUE A COMPORTAM EM PE (fisica ganha da regra de
    exposicao, v7.12). A diferenca pra v7.21 e que a quantidade de
    reguas nao vem mais de quota proporcional: ela pega slots ate a
    CAPACIDADE somada cobrir o que a classe pede - com um modulo de
    0,60m no meio, "duas reguas" pode nao ser espaco nenhum.

    Devolve [(bloco, [indices dos slots])] na ordem menor -> maior."""
    livres = list(reguas)
    res, restantes = [], len(cls_blocos)
    for bl in reversed(cls_blocos):
        restantes -= 1
        if not livres:
            res.append((bl, []))
            continue
        h = max([float(i.get("altura_cm") or 0) for i in bl["itens"]] or [0.0])
        viav = [s for s in livres if alts[s] + 1e-6 >= h] or list(livres)
        # deixa pelo menos 1 slot pra cada classe que ainda vem
        max_k = max(1, min(len(viav), len(livres) - restantes))
        k, acum = 0, 0.0
        for s in reversed(viav):
            if k >= max_k:
                break
            if k >= 1 and acum >= float(bl.get("cm") or 0.0) - 1e-6:
                break
            acum += largs[s]
            k += 1
        reg = sorted(viav[-k:]) if k else []
        livres = [s for s in livres if s not in reg]
        res.append((bl, reg))
    res.reverse()
    # slot que sobrou e sempre dos mais ALTOS: vai pra classe de cima
    if livres and res:
        bl, reg = res[0]
        res[0] = (bl, sorted(set(reg) | set(livres)))
    return res


# ==========================================
# CHAVE DO ARRANJO SALVO
# ==========================================
def composicao(mods):
    """Assinatura curta da fileira: '130x5+100x4+60x5'. Note que a
    ALTURA das reguas nao entra - igual a v7.21, onde a altura morava na
    gondola e mexer nela nao trocava o arranjo salvo."""
    return "+".join(f"{m['largura']:g}x{len(m['alturas'])}"
                    for m in normalizar(mods))


def uniforme(mods, largura, n_reguas):
    """Todos os modulos iguais ao cadastro da gondola?"""
    mods = normalizar(mods)
    return all(abs(m["largura"] - float(largura)) < 0.01
               and len(m["alturas"]) == int(n_reguas) for m in mods)


def chave(g_nome, mods, largura_cad, reguas_cad):
    """Chave da fileira pro layout_planograma.

    RETROCOMPATIVEL de proposito: enquanto os modulos forem todos iguais
    ao cadastro, a chave sai exatamente como saia ate a v7.21 - '<nome>'
    com 1 modulo e '<nome> xN' com N - entao nenhum arranjo ja salvo se
    perde. So quando a fileira for mista e que entra a composicao."""
    mods = normalizar(mods)
    if uniforme(mods, largura_cad, reguas_cad):
        return g_nome if len(mods) == 1 else f"{g_nome} x{len(mods)}"
    return f"{g_nome} | {composicao(mods)}"


# ==========================================
# MIGRACAO DO PLANO SALVO ANTES DA v7.22
# ==========================================
def espalhar_antigo(shelves_ant, slots, larg_de):
    """Plano salvo quando a regua era CONTINUA (modulos emendados).

    La `prateleira` era o indice da regua sobre a fileira inteira; aqui
    cada modulo tem a sua. Cada regua antiga e redistribuida entre os
    slots do NIVEL correspondente, da esquerda pra direita, respeitando a
    largura de cada modulo. Item que nao cabe inteiro e QUEBRADO por
    frente (2 frentes num modulo, 1 no seguinte) em vez de cair no
    Banco - a ordem visual da fileira continua a mesma.

    O mapeamento e por INDICE DE REGUA dentro do modulo (a regua 2 da
    fileira antiga vira a regua 2 de cada modulo), que e exatamente o que
    a fileira continua da v7.21 significava - e nao por altura fisica: o
    plano antigo so existe pra fileira uniforme, onde os dois criterios
    coincidem, e por indice a migracao nao quebra se a composicao mudou
    no meio do caminho.

    `larg_de(ean)` devolve a largura de 1 frente em cm (0/None = sem
    dimensao). Devolve (shelves_novas, sobra)."""
    novo = [[] for _ in slots]
    sobra = []
    for r, linha in enumerate(shelves_ant or []):
        alvo = sorted((i for i, s in enumerate(slots) if s["reg"] == r),
                      key=lambda i: slots[i]["mod"])
        if not alvo:
            sobra.extend(linha)
            continue
        j, usado = 0, 0.0
        for e in linha:
            try:
                w = float(larg_de(e["ean"]) or 0.0)
            except (TypeError, ValueError):
                w = 0.0
            resta = max(1, int(e.get("frentes", 1)))
            if w <= 0:               # sem dimensao: nao da pra medir
                sobra.append(dict(e))
                continue
            while resta > 0 and j < len(alvo):
                cabe = int((slots[alvo[j]]["larg"] - usado + 1e-6) // w)
                if cabe <= 0:
                    j += 1
                    usado = 0.0
                    continue
                n = min(cabe, resta)
                dest = novo[alvo[j]]
                if dest and dest[-1]["ean"] == e["ean"]:
                    dest[-1]["frentes"] += n
                else:
                    dest.append({"ean": e["ean"], "frentes": n})
                usado += n * w
                resta -= n
            if resta > 0:
                sobra.append({"ean": e["ean"], "frentes": resta})
    return novo, sobra
