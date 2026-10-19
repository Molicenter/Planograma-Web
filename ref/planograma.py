"""
Planograma Molicenter - v7.40

  v7.40 - VISUAL NOVO (pedido do Adriano). Nada do motor mudou.
  - CABECALHO: logo do Molicenter (passaro_logo.png) no lugar do emoji,
    titulo + linha de apoio, e o recorte aberto vira CHIPS (Loja,
    gondola, modulos, cm de frente) em vez do subtitulo corrido.
  - METRICAS: cartoes maiores com icone; a Ocupacao ganhou barra de
    progresso em semaforo (verde >= 90%, amarelo 70-90%, vermelho
    abaixo, vermelho escuro acima de 100%); "Sem foto" e "Banco sem
    medida" ficam laranja quando passam de zero (sao a fila de trabalho).
  - GONDOLA (index.html): placa no topo com o nome da categoria (a
    "testeira" da loja), montantes e rodape com volume, sombra embaixo
    das reguas, selo de ocupacao de cada regua no mesmo semaforo.
  - PAINEL LATERAL: o Banco, a legenda e a dica sairam de baixo da
    gondola e foram pra direita, aproveitando a tela larga (em tela
    estreita eles voltam pra baixo sozinhos).
  - COLORIR POR: nada / marca / subcategoria, no painel lateral. Pinta
    uma borda em cada produto e mostra a legenda - pra conferir se as
    faixas de marca ficaram juntas. So visual, nao grava nada.
  - TELA VAZIA: sem categoria marcada, a mensagem "escolha uma
    categoria" aparece DENTRO da gondola, centralizada.
  - Acentos na sidebar e nas metricas (Gondola, Modulos, No de reguas,
    Ocupacao) e um pouco mais de respiro entre os blocos.
  - Barra "Share / estrela / lapis" do Streamlit escondida por CSS.
    Pra garantir, da pra pôr no .streamlit/config.toml:
        [client]
        toolbarMode = "minimal"
  Suba os DOIS arquivos juntos (planograma.py + gondola_dnd/index.html).

  v7.41 - SIDEBAR CABE NA TELA + DESFAZER (pedido do Adriano)
  - ABAS na sidebar: "Categorias" (a que mais se usa, abre primeiro) e
    "Gondola". So uma aparece por vez.
  - Bloco Gondola compacto: Loja e Gondola na mesma linha; Modulos e
    Zoom na mesma linha (o zoom virou campo -/+ no lugar do slider).
  - BOTOES DE ACAO FIXOS NO RODAPE da sidebar: Salvar / Desfazer /
    Atualizar / Resetar / Novo item ficam sempre visiveis; o resto rola
    por tras deles.
  - AVISO DE NAO SALVO: com mudanca na tela que ainda nao foi gravada, o
    Salvar ganha uma bolinha e aparece "alteracoes nao salvas".
  - DESFAZER: volta o ultimo arraste / -/+ / X / duplicar (ate 30 passos,
    por recorte). Trocar de categoria, de gondola ou mexer no nº de
    reguas zera o historico.
  - Os botoes passaram a usar on_click (a acao vale mesmo com o botao
    desenhado no fim da rodada) - e isso que deixa o rotulo do Salvar
    refletir o estado ATUAL da tela.
  So o planograma.py mudou; o index.html segue o da v7.40.

  v7.42 - MENU REORDENADO (pedido do Adriano)
  - LOJA saiu de dentro das abas e fica fixa logo abaixo do cartao
    Configuracao/Sair, acima das abas - vale pras duas.
  - Abas invertidas: "Gondola" vem primeiro (abre por padrao) e
    "Categorias" depois.
  So o planograma.py mudou; o index.html segue o da v7.40.

  v7.39 - MARCA NAO SE ESPALHA ENTRE AS REGUAS (Leite Condensado: a
  Piracanjuba aparecia em R3, R4, R5 e R6, no fim das reguas das outras)
  - Frente EXTRA de quem ja esta na gondola fica so na faixa da propria
    marca (_repescagem). Era a sobra que se espalhava.
  - Marcas pequenas VIZINHAS dividem uma regua quando outra marca pede
    bem mais do que ganhou (_fundir_pequenas): Tirol + Italac numa regua,
    e a Piracanjuba fica com duas.
  - Acabamento local no fim: a sobra de cada regua vira frente extra dos
    itens que ja estao nela, sem remontar - as reguas fecham perto de 100%
    sem misturar marca.

  v7.38 - MARCA JUNTA EM FILEIRA DE VARIOS MODULOS (Detergente em 2
  modulos: Limpol e Ype apareciam nos dois, com o mesmo SKU dos dois
  lados). Agora os SKUs sao repartidos entre os modulos POR MARCA (maior
  delta primeiro, da esquerda pra direita; marca grande demais continua
  no modulo vizinho) e o motor roda dentro de cada modulo. Cada SKU fica
  num modulo so. Com um modulo, nada muda. (_semear_bloco -> _semear_um)
  - Preenchimento tenta +1 ate +6 frentes: item espelhado em k reguas so
    cresce de k em k, e a regua ficava parada em 66-80%.

  v7.37
  - BUSCA DO SELETOR: continua "contem", mas agora ignora acento ("agua"
    acha "Água") e, em "Montar por: Categoria", acha a categoria tambem
    pelo nome das subcategorias dela ("alu" traz Limpadores, que tem
    Limpador Alumínios).

  v7.36 (Sabao em Po + Barra + Pasta, 3 modulos 130x7 + 130x6 + 130x6)
  - ORDEM DAS CATEGORIAS = PRECO MEDIO, mais cara em cima. Saiu o
    criterio de tamanho entre categorias: ele punha o Sabao em Barra
    (R$ 8,81, o mais barato) no topo por ser pequeno. Po (R$ 19,97) >
    Pasta (R$ 10,53) > Barra.
  - REGUAS POR CATEGORIA EM SLOTS (regua de um modulo), na ordem de
    leitura da fileira: cada categoria e um trecho continuo. Categoria
    pequena (Pasta, 3 SKUs) fica com uma regua de um modulo, nao com uma
    regua da fileira inteira.

  v7.35 - POR/TIRAR REGUA REMONTA SOZINHO (pedido do Adriano: no Creme
  de Leite + Leite Condensado ele passou de 5 pra 7 reguas e as 2 novas
  apareceram vazias, porque so o reencaixe rodava)
  - A composicao (largura e nº de reguas por modulo) entrou na chave do
    plano: mudou, o motor monta de novo (ou carrega o arranjo salvo
    dessa composicao, se existir). Mexer so na altura continua so
    reencaixando, sem perder arrastos.
  - Altura fixa da gondola: ao mudar o nº de reguas, a altura somada do
    modulo se mantem e e repartida igual (5 x 35 = 175 -> 7 x 25).
    Se tiver produto alto, o ajuste automatico da v7.32 roda em cima.

  v7.34
  - ORDEM DAS CATEGORIAS: tamanho so decide com diferenca grande
    (FATOR_PORTE_CATEGORIA = 2x na area de frente media); abaixo disso, a
    categoria de PRECO MEDIO maior vai pra cima. Caso que motivou: Leite
    Condensado (R$ 5,65) agora fica acima do Creme de Leite (R$ 2,81).
  - As setas da ordem viraram um botao "Subir" com texto (elas apareciam
    como botao vazio na sidebar).

  v7.33 - MAIS DE UMA CATEGORIA SEM MISTURAR (pedido do Adriano: Agua
  Sanitaria + Alvejante saiam intercalados nas mesmas reguas)
  - Com 2+ marcadas, cada uma fica com REGUAS INTEIRAS so dela (o nivel
    atravessa os modulos), empilhadas de cima pra baixo. Quantas reguas:
    pelo menos o que mostra 1 frente de cada SKU, o resto pelo DELTA
    (niveis_por_categoria). O motor roda separado dentro de cada bloco
    (semear_plano -> _semear_bloco), entao "maior embaixo", faixas de
    marca e preenchimento valem dentro da categoria.
  - ORDEM na sidebar, embaixo do seletor, com setas pra subir/descer.
    Padrao: categoria de produto menor (porte medio ponderado pelo delta)
    em cima. A ordem entra na chave do plano: mudou, remonta.
  - Regua alta por BLOCO (alturas_para_os_altos_blocos): a regua de baixo
    de CADA categoria sobe pro produto alto dela, e as de cima do mesmo
    bloco cedem.
  - Com uma categoria so, nada muda.

  v7.32 (caso real: Agua Sanitaria, loja 001, 1,30m x 5 de 35 cm - os
  tres 5L foram pro Banco e a R3 saiu com UM produto, 2%)
  - REGUA DE BAIXO SOBE PRO PRODUTO ALTO: alturas_para_os_altos(). Os
    5L tem 36 cm e as reguas 35, entao o alocar cortava eles antes de
    montar. Agora, ao abrir um recorte, se algum produto e mais alto que
    a regua, as reguas DE BAIXO sobem ate ele (cm inteiro pra cima) em
    DEGRAUS (5L embaixo a 37, 2L acima so no que precisa), e a
    diferenca sai das reguas de cima, 1 cm por vez da mais alta, nunca
    abaixo do maior produto que ja cabia. Altura total igual; so cresce
    se as de cima nao tiverem folga (o aviso diz). Grava nos campos da
    sidebar (mesmo caminho do arraste da tarja) e mostra um toast. Roda
    uma vez por recorte+fileira: baixar a mao depois e respeitado. Ao
    trocar pra um recorte sem produto alto, as reguas voltam ao que eram.
    Degraus a menos de DEGRAU_MIN_CM (4) viram um so.
  - FAIXA HORIZONTAL CONTA FRENTE INTEIRA: 31 frentes de 8,2 cm (254 cm)
    "cabiam" em 2 reguas de 130 pela conta em cm, mas cada regua leva
    15; a 31a abria a R3 com 1 produto e a regua se perdia. Agora a
    decisao usa o empacotamento real (_slots_empacotando).
  - PREENCHIMENTO: regua VAZIA tambem e preenchida (antes era pulada e
    podia ficar em 0%), o remonte usa o mesmo modo da montagem final
    (permitir_fora) e, so pra regua vazia, um item de classe maior pode
    subir ATE ela.

  v7.31
  - Abre com 5 reguas: GONDOLA_PADRAO voltou pra "Modulo 1,30m x 5
    prateleiras" (era x 6 desde a v7.28).
  - SIDEBAR REORDENADA (pedido do Adriano): Configuracao/Sair no topo,
    depois Gondola, depois Recorte e os botoes de Acoes (Atualizar,
    Salvar, Resetar, Novo item) por ultimo, embaixo. So a ordem dos
    containers mudou - nenhum widget mudou de comportamento.

  v7.30
  - ABRE SEM CATEGORIA, MAS JA COM A GONDOLA DESENHADA (pedido do
    Adriano, revendo a v7.28): CATEGORIA_PADRAO virou "" - nenhuma
    checkbox nasce marcada. Ate a v7.29, sem recorte marcado o app dava
    st.stop() com "Selecione ao menos uma opcao" e a tela ficava em
    branco. Agora gondola_vazia() desenha os modulos e as reguas da
    gondola escolhida (largura, nº de reguas e alturas da sidebar), sem
    produto nenhum, no mesmo componente do arrastar - entao ja da pra
    ajustar a altura pela tarja laranja e pela barra cinza do topo antes
    de escolher a categoria. Metricas aparecem zeradas. O Salvar nao
    grava nada nesse estado (so avisa), pra nunca gravar um arranjo
    vazio. O plano da sessao (st.session_state.plan) nao e tocado, entao
    voltar pra uma categoria ja aberta continua com os arrastos.
    Se quiser voltar a abrir com uma categoria marcada, e so preencher
    a constante CATEGORIA_PADRAO de novo. O index.html NAO mudou.

  v7.29
  - TRAVA CONTRA SALVAR EM DOBRO (pedido do Adriano, depois de um caso
    real: a gondola "Modulo 1,30m x 6 prateleiras" da categoria
    Achocolatados salvou cada produto DUAS VEZES, virando 184% de
    ocupacao e produtos que pareciam travados em frentes que nao
    reduziam). Causa achada direto no banco: 46 linhas onde deveriam
    ser 23, todas em pares identicos - o Salvar disparou duas vezes
    quase juntas (duplo clique, ou duas abas abertas na mesma
    categoria/gondola) e as duas rodadas de apagar+inserir se
    intercalaram, cada uma sem ver o que a outra tinha acabado de
    gravar.
    Precisa rodar a migracao "layout_planograma_substituir_atomico" uma
    vez no Supabase (ja rodei na sessao do Cowork - se voce le isto
    antes de eu confirmar, roda no SQL Editor): cria a funcao
    layout_planograma_substituir(loja, nivel, recorte, gondola, rows),
    que faz o apagar+inserir INTEIRO dentro de uma transacao so, trancada
    por pg_advisory_xact_lock na combinacao (loja, nivel, recorte,
    gondola). Uma 2a chamada pra MESMA combinacao espera a 1a terminar
    antes de comecar - por isso nunca mais duplica, mesmo com duplo
    clique ou duas abas.
    salvar_plano() agora chama essa funcao via sb.rpc(); se ela ainda
    nao existir no banco (migracao nao rodada), cai pro delete+insert de
    sempre - continua funcionando, so sem a trava. Sem mudanca na
    interface; so um "Salvando..." (spinner) no botao.
  - Os 46 registros duplicados da gondola "1,30m x 6" (Achocolatados,
    loja 001) ja foram limpos direto no banco - voltou pra 23, igual a
    gondola de 5.

  v7.28
  - GONDOLA PADRAO: GONDOLA_PADRAO agora aponta pra "Modulo 1,30m x 6
    prateleiras" (era "x 5"). So trocar a constante ja resolve o "N de
    reguas" tambem - editor_modulos() sempre parte do num_prateleiras
    cadastrado na gondola escolhida, entao a tela ja abre com 6.
  - CATEGORIA JA MARCADA AO ABRIR (pedido do Adriano, pra tela nao
    nascer em branco na primeira vez que alguem entra): constante nova
    CATEGORIA_PADRAO ("Achocolatados"). Na PRIMEIRA renderizacao da
    sessao - antes de qualquer clique -, se o "Montar por" estiver em
    "Categoria" e essa categoria existir na loja escolhida, a checkbox
    dela e marcada sozinha, mesma ideia do GONDOLA_PADRAO (v7.17). So
    acontece UMA vez por sessao (flag categ_padrao_feita): desmarcar
    depois, ou usar "Limpar selecao", nao traz ela de volta sozinha.
    Pra trocar a categoria padrao, e so editar a constante.
  - ATUALIZAR CONTINUA SENDO O GATILHO MANUAL (confirmado com o
    Adriano): mudar o nº de reguas ja reflui o arranjo sozinho a cada
    rerun (reencaixar_slots, v7.22) sem precisar de botao; o botao
    "Atualizar" continua reservado pra quando o CADASTRO mudou por fora
    (Supabase/planilha) e precisa limpar o cache. Nao mudou nada aqui -
    so decidimos NAO tornar isso 100% automatico, pra nao arriscar
    perder ajuste manual da tela toda vez que o campo for tocado.

  v7.27
  - SIDEBAR NO AZUL ESCURO (pedido do Adriano, pra ficar igual aos outros
    apps, ex. Promotores). Ate a v7.16 a sidebar era um gradiente azul
    CLARO com o cartao de cabecalho em AZUL_MOLI solido por cima. Agora o
    fundo inteiro da sidebar vira o AZUL_MOLI solido (mesmo tom do login) e
    todo o texto solto (rotulos, legendas, titulos de secao "ACOES /
    GONDOLA / RECORTE", cartao de cabecalho, quadro do seletor de
    categoria, expander de altura das reguas) passou pra uma cor clara
    nova, AZUL_SIDEBAR_TXT. Os CAMPOS dos widgets (selects, number_input,
    text_input, checkbox) continuam brancos por dentro, como sempre -
    so o fundo ao redor deles escureceu. estilo_sidebar() concentra a
    mudanca; os dois rotulos "Modulo N" do editor_modulos() (que usavam
    AZUL_MOLI, texto escuro) tambem trocaram pra AZUL_SIDEBAR_TXT, senao
    ficariam ilegiveis no fundo novo. So CSS - nenhum widget mudou de
    comportamento nem de posicao.
  - DUPLICAR PRODUTO NA REGUA DE BAIXO (pedido do Adriano): cada produto no
    canvas ganhou um botao novo (⬇, canto inferior do bloco, ao lado
    dos existentes −/+/×) que copia aquele produto (mesmo EAN e
    mesma qtde de frentes) pra REGUA IMEDIATAMENTE ABAIXO, dentro do MESMO
    MODULO - so aparece quando ha uma regua abaixo naquele modulo (nao
    aparece na ultima regua). Muda so o gondola_dnd/index.html (JS puro,
    client-side): o Python nao precisa de nenhuma mudanca, porque o
    "SKUs na gondola" ja conta EAN distinto (um set) e o salvar_plano ja
    grava uma linha por modulo+regua+ordem, sem exigir EAN unico na
    gondola - ter o mesmo produto em duas reguas ja era uma estrutura de
    dados suportada, so nao existia gesto pra criar isso manualmente ate
    agora. PRECISA subir os DOIS arquivos juntos (o planograma.py tambem
    mudou, por causa da sidebar).

  v7.24
  - ALTURA DA REGUA LIBERADA PRO PERFIL USUARIO (pedido do Adriano).
    A alca da tarja (v7.23) estava presa na mesma flag `edita` que
    liga a edicao de dimensao/foto - e essa e exclusiva do admin,
    entao o usuario ficou sem o arraste. As duas coisas viraram
    flags SEPARADAS no payload: `edita` (admin) e `ajusta_alt`
    (todos). O editor numerico da sidebar ja valia pros dois.
      * o retorno do canvas com as alturas novas nao depende mais
        do perfil - o valor cai nos campos da sidebar do mesmo
        jeito, via flag alt_drag;
      * unica coisa que segue so no admin dentro do bloco de
        altura: o botao "Gravar padrao", porque ele escreve na
        layout_gondolas e vira o molde de todas as montagens;
      * PRECISA subir tambem o gondola_dnd/index.html novo (o
        componente le a flag nova; um index.html antigo em cache
        ignora a chave e continua liberando pelos dois perfis).

  v7.23
  - ALTURA DA REGUA NO MOUSE (pedido do Adriano). A tarja laranja E a
    prateleira, entao ela virou alca: arrastar pra cima ou pra baixo
    muda a altura daquela regua, direto no canvas, sem abrir o expander
    da sidebar. (v7.24: vale pros DOIS perfis.)
      * o que a regua GANHA, a de baixo PERDE, na mesma medida - a
        altura somada do modulo nao muda e o piso continua no lugar,
        que e o que acontece de verdade ao remanejar uma prateleira
        dentro da gondola;
      * na ULTIMA regua nao ha vizinha embaixo: ali o arraste muda a
        altura do modulo inteiro (e o aviso de "os modulos nao somam a
        mesma altura" aparece se for o caso);
      * minimo de 8cm por regua, e o valor arredonda pro centimetro;
      * o desenho acompanha o arraste na hora; no SOLTAR e que o valor
        vai pro Streamlit, que grava nos campos da sidebar - um rerun
        so por arraste, e a sidebar continua sendo a fonte da verdade.
  - CORRIGIDO: ESTREITAR UM MODULO ESTOURAVA A REGUA. O reencaixar_slots
    da v7.22 movia o conteudo pro slot de mesmo (modulo, regua) mas nao
    reconferia a LARGURA - quem baixava o M2 de 1,30m pra 1,00m ficava
    com os mesmos 127cm de produto numa regua de 100 (tarja em 127%,
    ocupacao total em 121%). Agora as frentes que sobram sao cortadas
    do FIM da regua, e o SKU que perde todas vai pro Banco em vez de
    sumir; um toast diz quantos itens sairam.

  v7.22
  - MODULOS INDEPENDENTES. Ate a v7.21 a fileira era um retangulo:
    "Modulos lado a lado" so repetia a MESMA gondola, e as reguas
    viravam uma faixa continua (3 x 1,30m = 390cm). Nas lojas isso nao
    e verdade - tem fileira com 1,30m, depois 1,00m e ate 0,60m. Agora
    cada modulo tem a SUA largura e o SEU nº de reguas, digitados na
    sidebar (decisao do Adriano), e o produto NAO ATRAVESSA A EMENDA:
    cada modulo x regua e um container fechado.
    SQL (rode antes de salvar um arranjo novo):
        ALTER TABLE layout_planograma
          ADD COLUMN IF NOT EXISTS modulo int NOT NULL DEFAULT 1;
      * O MOTOR passou a trabalhar com SLOTS. `largura_prat` era um
        numero so; virou uma lista `largs`, uma largura por slot,
        paralela ao `alturas` da v7.12. Toda regra escrita em "nº de
        reguas" passou a ser em CENTIMETRO - dar duas reguas pra classe
        do 5kg pode ser dar 260cm ou 160cm.
      * ORDEM POR ALTURA FISICA. Com nº de reguas diferente, "regua 2"
        nao e a mesma altura em todo modulo. Os slots sao ordenados
        pelo piso (y), do topo pra base, com empate resolvido pelo
        modulo da esquerda - entao a faixa horizontal do topo atravessa
        os modulos antes de descer, igual fazia com a regua continua, e
        o formato grande continua no chao dos TRES ao mesmo tempo.
      * ANCORAGEM NO PISO (decisao do Adriano): as alturas empilham de
        baixo pra cima; se um modulo somar menos altura, a folga sobra
        EM CIMA. No desenho, o modulo com menos reguas ganha um
        espacador no topo - por isso a tarja laranja continua fora da
        altura da regua, exatamente como sempre foi.
      * TERRITORIOS e QUOTAS foram pro fileira.py (arquivo novo), junto
        com a montagem dos slots, a chave da fileira e a migracao. A
        classe MAIOR agora pega slots de baixo ate a CAPACIDADE SOMADA
        cobrir o que ela pede, em vez de ceil(cm / largura da regua).
      * CHAVE RETROCOMPATIVEL: enquanto os modulos forem todos iguais
        ao cadastro da gondola, a chave do arranjo salvo sai identica a
        v7.21 ("<gondola>" com 1 modulo, "<gondola> xN" com N) - nada
        do que ja esta salvo se perde. Fileira mista ganha a composicao
        no nome ("<gondola> | 130x5+100x4+60x5").
      * MIGRACAO do que foi salvo antes: la `prateleira` era a regua da
        fileira INTEIRA. A regua antiga e redistribuida pelos modulos e
        o item que estava em cima da emenda e QUEBRADO POR FRENTE (20
        frentes viram 13 no M1 e 7 no M2), sem perder nenhuma; o que
        nao couber vai pro Banco em vez de sumir.
      * SIDEBAR: "N de reguas" e o editor de alturas viraram um bloco so
        por modulo (largura / nº de reguas / altura de cada regua), com
        "Igualar ao M1" e "Gravar padrao" (grava as alturas do M1 na
        gondola, que passa a ser so o MOLDE da fileira).
      * Mexer numa largura NAO re-semeia mais o arranjo: o
        reencaixar_slots leva o que ja estava montado pro slot de mesmo
        (modulo, regua) e manda pro Banco so o que ficou sem lugar.
    ATENCAO: um modulo estreito comporta menos frentes por regua, entao
    a ocupacao dos modulos de 0,60m tende a ficar abaixo do que voce ve
    numa fileira toda de 1,30m - e o preco de nao atravessar a emenda.
    O gondola_dnd/index.html TAMBEM mudou (uma coluna por modulo, com
    montante entre elas) - suba os DOIS arquivos juntos, mais o
    fileira.py novo.

  v7.21
  - BASE DE ATIVOS NO REPOSITORIO (produtos.xlsx), no mesmo padrao do
    Banco QL.xlsx do Quadro de Lotacao: o arquivo mora no GitHub, sobe
    junto com o codigo e o app le direto - nao precisa rodar script
    nenhum na maquina. Toda a leitura esta no base_produtos.py.
      * ATIVO SEM VENDA APARECE NO BANCO. Ate a v7.20 o quadro so
        conhecia quem teve venda (view layout_base) mais o que ja existia
        na dim_produtos; produto ativo no ERP e sem giro naquela loja
        simplesmente nao existia. Agora ele entra no Banco/Fora, pronto
        pra inclusao manual.
      * A GONDOLA AUTOMATICA NAO MUDOU. Ela continua sendo montada so
        com quem vende, pelo delta de sempre (decisao do Adriano) - o
        motor de classes/territorios nao foi tocado nesta versao.
      * DIMENSAO: a planilha SO preenche onde o cadastro esta VAZIO,
        nunca por cima. A medida tem varios donos (Simplus, app de
        medicao na loja, editor de dois cliques) e um arquivo de duas
        semanas atras nao pode desfazer o que a equipe mediu ontem.
      * O casamento e em cascata (CodBarra e Codigo dos dois lados),
        igual ao importarclassificacao.py - sem isso os ~4,4 mil
        produtos de codigo interno curto ficariam de fora.
      * Item SEM MEDIDA passou a aparecer no Banco (antes era filtrado e
        sumia): vira a lista de trabalho do app de dimensoes. Metrica
        nova "Banco sem medida" no topo.
      * O editor de dois cliques agora CRIA a linha na dim_produtos
        quando o produto veio so da planilha - antes o update nao
        pegaria linha nenhuma e a medida se perderia calada.
      * Arquivo ausente = no-op: sem o produtos.xlsx no repo o app se
        comporta exatamente como na v7.20.
    Requer openpyxl no requirements.txt (ja esta). Nenhum ALTER TABLE.
  - Nada mudou na interface. O gondola_dnd/index.html segue o do v7.12.

  v7.20
  - TERRITORIO DA CLASSE VIROU REGRA DURA. A v7.19 ja prendia a
    repescagem ao territorio, MAS mantinha um escape: item que ainda nao
    tinha NENHUMA frente na gondola podia ir pra qualquer regua, pra nao
    cair no Banco. Era por ali que o Monster 473ml continuava aparecendo
    na regua dos 2L - com as reguas de cima em 99% e sobrando 2 a 4cm em
    cada (menos que uma lata), o SKU sem lugar descia.
    Agora a montagem normal NAO usa o escape: quem nao cabe no proprio
    territorio entra na lista de FALTANTES, o laco de fora corta uma
    frente EXTRA de quem ocupa as reguas onde ele caberia e remonta - o
    espaco aparece no lugar certo, que e onde ele deveria estar. So se
    nem cortando resolver e que a gondola e remontada com
    permitir_fora=True, porque ficar de fora e pior que estar na regua
    errada (a 1a frente e garantida desde a v7.6).
    Cenario de regressao novo (14 Monster de larguras diferentes + Baly
    + Red Bull + seis 2L em 1,30m x 5, que fragmenta as reguas de
    proposito): ANTES a regua 4 saia com lata junto dos 2L; DEPOIS as
    latas ficam em R1-R3 e os 2L em R4-R5, ninguem no Banco.
  - Nada mudou na interface. O gondola_dnd/index.html segue o do v7.12.

  v7.19
  - PREENCHIMENTO POR DELTA EM QUALQUER REGUA. O passe da v7.14 so
    engordava a faixa da classe MAIOR. Mas o buraco cai onde quiser: no
    lava roupas de 1 modulo foi a REGUA 2, com 53% (69/130 cm). A causa
    e estrutural - as frentes sao decididas antes do layout e o
    territorio e sempre em reguas INTEIRAS, entao a classe que pede 1,5
    regua leva 2 e deixa meia vazia.
    Agora a regua mais vazia recebe frentes extras dos itens que JA
    estao nela, escolhidos pelo DELTA (o mesmo peso do rateio: margem
    40% / venda 30% / qtde 30%), na forma peso/(frentes+1) - quem vende
    mais e ainda tem poucas frentes leva primeiro, que e o rateio
    proporcional de sempre. Cada tentativa REMONTA a gondola e so vale
    se as tres condicoes baterem: ninguem ficou de fora, a ocupacao
    total SUBIU e nenhum item de classe maior subiu de regua. Se os 4
    melhores candidatos falharem, a regua e marcada como "nao tem como
    encher" e o passe segue pra proxima.
    Lava roupas 1 modulo: regua 2 de 53% -> 99%, e nenhuma regua abaixo
    de 94%. Custo: 0,06s num recorte de 120 SKUs em 390cm x 5.
  - REPESCAGEM RESPEITA O TERRITORIO DA CLASSE. Era ela que colocava
    duas latas de Monster 473ml na ultima regua, no meio dos energeticos
    2L: a faixa da marca transbordava e a regua vizinha mais proxima era
    justamente o territorio da classe maior. Agora, quem JA tem frente
    na gondola so e repescado dentro do proprio territorio - frente
    EXTRA nao vale quebrar a separacao por tamanho. Quem ainda nao
    entrou em lugar nenhum continua podendo ir pra qualquer regua,
    porque ficar de fora e pior (a 1a frente e garantida desde a v7.6).
  - Nada mudou na interface nem no motor de classes. O
    gondola_dnd/index.html segue o do v7.12.

  v7.18
  - CLASSE DE TAMANHO NO CONTINUO (o caso do LAVA ROUPAS). Ate a v7.17 a
    classe saia da comparacao de cada porte com o VIZINHO imediato: abria
    classe onde o salto passava de 1,35. Funciona onde a categoria tem
    degrau limpo (arroz 1kg/2kg/5kg), mas nao no continuo. No lava roupas
    tem 500ml, 1L, 1,5L, 2L, refil e 3L: nenhum salto isolado chega a
    1,35 (1L->2L da 1,30, refil->3L da 1,14), embora a categoria inteira
    va de 176 a 560 - 3,2x. Saiu UMA classe so, o tamanho nao reordenou
    nada e o 3L subiu pro topo por ser o mais caro, com 1L na ultima
    regua. Era exatamente o que o Adriano viu no print.
    Agora o recorte e AGRUPADO de verdade:
      1. quantas classes cabem na amplitude - com o maior porte sendo N
         vezes o menor, cabem log(N)/log(1,35) degraus, ate o teto de
         MAX_CLASSES_PORTE. Tamanho uniforme da 1 e a regra nao faz nada;
      2. reparticao OTIMA em k grupos contiguos (menor variancia interna,
         em escala log - tamanho e multiplicativo, de 1L pra 2L e o mesmo
         degrau que de 2L pra 4L). Olha o recorte inteiro em vez de
         degrau por degrau;
      3. funde os grupos vizinhos cujos CENTROS estao a menos de 1,35 um
         do outro. E aqui que mora a regra dele, "diferenca de gramagem
         apenas nao precisa": o Red Bull e a lata de 269ml tem centros a
         1,34 e viram uma classe so, onde manda o preco; 1kg e 2kg tem
         centros a 1,67 e ficam separados.
    A densidade continua como ultimo filtro, por DEGRAU (grupo de cima
    bem mais denso = premium, nao embalagem economica: nao separa).
  - MIN_CLASSE_REGUA 0,60 -> 0,85. O territorio e sempre em reguas
    INTEIRAS, entao classe com 0,6 de regua deixava 40% de buraco. Foi o
    que apareceu ao testar o agrupamento novo: o Red Bull virou classe
    sozinha e deixou a regua do topo em 63%. Com 0,85 a classe so ganha
    regua propria se tiver produto pra quase encher uma.
  - Nada mudou na interface. O gondola_dnd/index.html segue o do v7.12.

  v7.17
  - GONDOLA PADRAO: a constante GONDOLA_PADRAO (no topo do arquivo) diz
    qual gondola abre selecionada. Ela vai pra PRIMEIRA posicao da lista
    e, por ser a primeira, ja vem escolhida; as demais seguem na ordem
    alfabetica do cadastro. A comparacao ignora acento, caixa e espaco
    repetido, entao nao depende de como o nome foi digitado na
    layout_gondolas; se o nome nao existir la, a lista sai como sempre.
    Pra trocar o padrao depois, e so editar essa linha.

  v7.16
  - SIDEBAR REORGANIZADA (pedido do Adriano). Ela vinha crescendo por
    acumulacao - botao aparecia no meio dos selects, o "Salvar" e o
    "Resetar" ficavam la no fim, depois do seletor de categoria - e nao
    tinha hierarquia nenhuma. Agora sao TRES BLOCOS, no visual azul do
    Portal de Pedidos:
      1. ACOES - Atualizar / Salvar / Resetar / Novo item, todos juntos
         em cima, em grade de dois;
      2. GONDOLA - loja, gondola, modulos lado a lado, zoom, nº de
         reguas e altura das reguas;
      3. RECORTE - montar por + o quadro de categorias/subcategorias.
    DETALHE TECNICO: os widgets nao nascem na ordem em que precisam
    aparecer (o nº de reguas so existe depois do plano montado, e o
    plano depende do recorte escolhido). Os lugares sao RESERVADOS como
    st.container() no comeco e preenchidos depois - o Streamlit desenha
    na posicao do container, nao na hora da chamada.
  - O quadro do seletor caiu de ~15 linhas pra 5 (ALTURA_SELETOR 460 ->
    200): com os tres blocos, o quadro alto empurrava o resto pra fora
    da tela. O que passar de 5 rola dentro do proprio quadro.
  - estilo_sidebar() concentra o CSS (fundo azulado, cartao de
    cabecalho, titulos de secao, primario magenta) e secao() desenha os
    titulos. So CSS - nenhum widget mudou de comportamento.
  - NADA do motor mudou nesta versao.

  v7.15
  - CLASSES DE TAMANHO (substitui o "grande x padrao" da v7.11/v7.14).
    O gatilho foi o ARROZ: ate a v7.14 o porte virava um SIM/NAO
    comparado com o quartil inferior do recorte. No arroz o quartil da
    280, entao o 2kg (400) e o 5kg (836) caiam no MESMO balde e iam pra
    mesma regua - e, como quase todo o recorte virava "grande", o
    desligamento por fracao da v7.14 chutava a regra inteira e as
    gramaturas embaralhavam de vez. Era exatamente o que o Adriano viu:
    5kg em cima e 2kg embaixo junto do 5kg.
    Agora o porte vira CLASSES: os portes sao ordenados e uma classe
    nova so abre onde o SALTO pro vizinho passa de FATOR_CLASSE_PORTE
    (1,35). Dois sacos de 5kg que variam 2cm dao salto 1,02 e ficam na
    MESMA classe - ali quem manda e o preco; 1kg -> 2kg (1,67) e
    2kg -> 5kg (2,05) abrem classe. E a regra que ele descreveu: "o
    tamanho e em seguida o preco, mas quando a diferenca for bem alta;
    diferenca de gramagem apenas nao precisa, o de maior preco fica em
    cima".
  - A DENSIDADE DE VALOR (v7.13) mudou de lugar: decide se o DEGRAU
    existe, e nao item a item. Se o lado maior do degrau for bem mais
    denso que o menor, nao e embalagem economica e sim produto premium -
    o degrau nao abre e os dois lados ficam na mesma classe, onde manda
    o preco (lava-loucas x detergente 500ml). Item a item quebrava a
    classe: a Coca 2L subia sozinha pro topo deixando Pepsi e Sukita 2L,
    do mesmo tamanho, la embaixo.
  - TAMANHO E DEPOIS PRECO nos tres niveis: ordem das subcategorias
    (a sub de arroz japones 1kg sobe mesmo custando menos que a de
    5kg), ordem dos itens dentro da sub, e ordem das faixas de marca
    dentro do territorio.
  - TERRITORIOS por classe (a v7.14 so tinha dois): classe menor em
    cima, maior embaixo, cada uma com o nº de reguas que o espaco dela
    pede. A classe MAIOR nunca recebe menos reguas do que precisa - com
    quota so proporcional faltavam uns centimetros, a sobra caia na
    repescagem e o item pesado reaparecia numa regua de cima.
  - CLASSE MAGRA nao sustenta regua propria e junta com a vizinha MENOR
    (assim o 2kg sobe junto do 1kg em vez de descer pra regua do 5kg);
    a classe 0, que nao tem vizinha menor, junta com a de cima. A classe
    MAIOR e intocavel - se ficar folgada, quem resolve e o passe de
    preenchimento. Mesmo fundida, a classe FISICA (_classe_fis) e
    preservada e mantem os leves na FRENTE da regua compartilhada.
  - GIGANTE (v7.9, canto direito da ultima regua) agora so vale pra quem
    NAO tem classe propria. As duas regras se atropelavam: a reserva do
    gigante comia a capacidade da regua do territorio, a faixa nao cabia
    e a sobra vazava pra cima. Sobra pro gigante o caso pra que ele foi
    feito e que a classe nao pega - o item ALTO que, em area frontal,
    fica na mesma classe dos vizinhos.
  - O passe de preenchimento da v7.14 ganhou trava: nao aceita o remonte
    se ele subir a regua mais alta ocupada por item de classe maior.
  - O resumo por subcategoria mostra "tam. N de M" no lugar do
    "grande (desce) / padrao".
  - SAIU: FATOR_PORTE_GRANDE, QUANTIL_PORTE_TIPICO e FRACAO_MAX_GRANDES.
    Categoria toda do mesmo tamanho (racao, agua mineral) da UMA classe
    so e a regra nao faz nada sozinha - nao precisa mais de
    desligamento.

  v7.14
  - FORMATO GRANDE SEMPRE EMBAIXO (regra do Adriano: "os maiores
    produtos ficam de baixo pra cima, pra facilitar a retirada pelo
    cliente" - vale pra TODA categoria). Ate a v7.13 o "_grande" era so
    ORDEM: o item grande ia pro fim da fita. So que a FASE 1 enche as
    reguas de CIMA com essa fita, entao "fim da fila" ainda caia na
    regua 2 de 4 - foi o que aconteceu nos energeticos, com o 2L na
    segunda regua no meio das latas. Agora e RESTRICAO, nao ordem:
      * a FASE 1 (faixa horizontal do topo) e a FASE 1b PULAM o item de
        formato grande - ele nao entra no topo em hipotese nenhuma, e
        desce inteiro pra FASE 2;
      * a FASE 2 passa a ter TERRITORIOS: os grandes ficam com as reguas
        de BAIXO e os pequenos com as de cima. O nº de reguas dos
        grandes vem do espaco que eles precisam (teto de cm / largura da
        regua), nao de quota proporcional - assim o formato grande nunca
        divide regua com o pequeno so porque o arredondamento pegou mal;
      * FISICA GANHA DA REGRA: as reguas dos grandes sao as MAIS BAIXAS
        QUE OS COMPORTAM EM PE (v7.12). Se a de baixo for curta demais
        pro item, ele sobe o minimo necessario em vez de ficar de fora;
      * a faixa horizontal do topo cede reguas quando os grandes
        precisam de mais de uma la embaixo;
      * o corte de quantas subs vao pro topo passa a medir so os itens
        pequenos - eram os grandes que inflavam a conta e encolhiam a
        faixa horizontal a toa.
  - DESLIGAMENTO AUTOMATICO: se mais de FRACAO_MAX_GRANDES (70%) do
    recorte for marcado como grande, nao existe "pequeno" de referencia
    (racao, refrigerante 2L, agua mineral) - a regra se desliga sozinha
    e o recorte volta ao fluxo normal por preco. Mesma ideia do
    FRACAO_MAX_GIGANTES da v7.11.
  - SELETOR DE CATEGORIA/SUBCATEGORIA SEMPRE ABERTO: o popover virou um
    QUADRO FIXO na sidebar, ja mostrando ~15 opcoes com rolagem, com a
    busca em cima. Nao precisa mais clicar em "Escolha..." pra ver a
    lista. As marcadas continuam pinadas no topo do quadro.
    OBS: o filtro roda quando voce aperta Enter ou sai do campo - o
    st.text_input do Streamlit nao dispara a cada tecla. Como o quadro
    ja nasce com a lista visivel, na maioria das categorias nem precisa
    digitar.

  v7.13
  - EMBALAGEM MAIOR DESCE (refina a v7.11). O limiar de porte da v7.11
    (2,5x) foi calibrado na farinha 5kg x 1kg, que da 4,3x - grosso
    demais pra garrafa: a agua sanitaria 2L e so 1,40x a de 1L em area
    frontal, entao nao era marcada e subia pro topo por ser mais cara.
    Baixar so o limiar nao resolve: o lava-loucas tambem e maior que o
    detergente 500ml e PRECISA continuar em cima. Entra um 2o criterio,
    que e o que o proprio Adriano descreveu - "e mais caro por se tratar
    de uma embalagem maior" x "e mais caro porque vale mais":
      * DENSIDADE DE VALOR = preco_medio / volume (R$ por cm3, com
        profundidade; sem ela usa a largura como profundidade).
      * o item so e "de formato grande" (e portanto desce) se for maior
        que o tipico E NAO for mais denso que o tipico. Ou seja: caro por
        ser grande desce; caro por valer mais fica em cima.
    Numeros reais do recorte dele:
        lava-loucas    R$/cm3 0,01113  (2,3x o 500ml -> NAO desce)
        detergente 5L  R$/cm3 0,00321  (menos denso   -> desce)
        agua sanit. 2L R$/cm3 0,00195  (= a de 1L     -> desce)
        farinha 5kg    R$/cm3 0,00210  (menos densa   -> desce)
    Com isso o limiar de porte pode cair de 2,5x pra 1,35x sem risco.
  - O resumo por subcategoria mostra o R$/cm3 medio, pra dar pra
    conferir por que uma sub subiu ou desceu.

  v7.12
  - ALTURA POR REGUA. Ate a v7.11 todas as reguas usavam a mesma
    altura_prateleira_cm. Agora a gondola pode ter uma altura por
    regua - util justamente depois da v7.11, ja que o formato grande
    desce e a regua de baixo e a que precisa de mais espaco.
      * coluna nova em layout_gondolas:
            ALTER TABLE layout_gondolas
              ADD COLUMN IF NOT EXISTS alturas_cm text;
        texto simples, na ordem TOPO -> BASE, ex.: "35,40,40,45".
        VAZIA = comportamento de sempre (altura_prateleira_cm em todas),
        entao e retrocompativel: sem rodar o ALTER nada muda.
      * a altura fica salva POR GONDOLA (decisao do Adriano) - vale pra
        toda categoria montada nela - e cada regua e livre, sem altura
        util total fixa.
      * editor na sidebar (so admin): um campo por regua + total somado,
        grava direto na layout_gondolas. Nao precisa abrir o Supabase.
      * se o "N de reguas" da tela passar do cadastro, as reguas extras
        entram com a altura padrao; se for menor, usa as primeiras.
      * o corte de "nao cabe" agora e pela regua MAIS ALTA, com motivo
        proprio ("altura Xcm > a regua mais alta (Ycm)"); e na montagem
        um item so entra em regua que comporte a altura dele - o que
        nao couber na faixa da propria marca e repescado numa regua
        alta o suficiente.
      * a escala de impressao passou a usar a SOMA das alturas, nao
        altura x nº de reguas.
    O gondola_dnd/index.html tambem mudou (recebe a lista "alturas" e
    desenha cada regua com a sua) - suba os DOIS arquivos juntos.

  v7.11
  - FORMATO GRANDE DESCE. Ate a v7.10 a ordem era so PRECO MEDIO, entao
    a farinha 5kg (mais cara) subia pro topo e a de 1kg ficava embaixo -
    o contrario do certo. Agora cada item ganha um PORTE (largura x
    altura, a cara que ele ocupa na regua); quem passa de
    FATOR_PORTE_GRANDE x a MEDIANA do recorte e "de formato grande"
    (5kg no meio dos 1kg, 5L no meio dos 500ml) e vai pras reguas de
    BAIXO, por acessibilidade - mesmo sendo o mais caro. Vale nos dois
    niveis:
      * entre SUBCATEGORIAS: a sub de formato grande sai da faixa
        horizontal do topo e desce (dentro de cada classe de tamanho a
        ordem continua sendo preco desc);
      * entre ITENS da mesma sub: os grandes vao pro fim da fita;
      * FASE 1b nao usa mais item de formato grande pra completar a
        regua parcial do topo - nada de porte grande sobe;
      * FASE 2 monta primeiro as faixas de marca dos PEQUENOS e depois
        as dos GRANDES, entao os grandes caem nas ultimas reguas.
  - GIGANTE virou de fato excecao: se mais de FRACAO_MAX_GIGANTES (15%)
    dos SKUs disparariam a regra de altura, nao e outlier e sim formato -
    o tratamento de "canto direito da ultima regua" e desligado e quem
    resolve e a regra de porte. Gigante que nao coube na reserva volta
    pro fluxo normal em vez de sumir pro Banco.
  - Resumo por subcategoria ganhou a coluna Formato (padrao / grande).

  v7.10
  - EXPORTAR / IMPRIMIR: o expander de baixo virou "Visualizacao
    estatica - imprimir ou salvar em PDF" e ganhou dois botoes:
      * Imprimir / Salvar em PDF -> abre uma aba com uma pagina propria
        (titulo, loja, gondola, nº de reguas, data + as metricas),
        espera as fotos carregarem e chama o print() do navegador;
      * Baixar HTML -> o mesmo arquivo autocontido, pra guardar no Drive
        ou mandar pra loja.
    Exporta o ESTADO DA TELA (com os arrastos), nao o arranjo do banco.
  - SEMPRE RETRATO (PAPEL_PADRAO = "A4 retrato"); da pra escolher A3
    retrato pra fileira longa. A escala respeita a largura E a altura
    uteis do papel (checkbox "Caber em uma folha", ligado por padrao),
    entao a gondola inteira sai numa folha so.
  - A escala de impressao (px por cm) e calculada NO PYTHON pela largura
    util do papel. A 1a tentativa desenhava grande e encaixava com
    transform:scale() por JS - NAO funciona: o transform nao muda o box
    no fluxo, o Chrome remonta o layout com a largura da folha e empurra
    o quadro pra folha seguinte (saia a 1a pagina em branco).
  - Cada prateleira (regua + tarja) vai num wrapper .mp-linha com
    break-inside:avoid, pra nao partir no meio da folha; o cabecalho
    leva break-after:avoid.
  - _esc() escapa as descricoes: produto com aspas ou < quebrava o
    title do tooltip e o HTML exportado.
  - HORA no rodape do impresso via agora_br() (America/Sao_Paulo): o
    Streamlit Cloud roda em UTC e o datetime.now() puro carimbava o
    planograma 3h adiantado. Fallback em UTC-3 fixo se faltar tzdata.

  v7.9
  - FAIXAS POR MARCA na parte de baixo (substitui as colunas verticais
    puras da v7.6/v7.8). A regua de cima segue igual (subcategoria mais
    cara na horizontal, faixa continua). Do miolo pra baixo:
      * os itens que sobraram sao agrupados por MARCA, marcas ordenadas
        por preco medio desc (cara em cima);
      * cada marca ocupa REGUAS INTEIRAS - faixa de marca nao fica pela
        metade. Se a marca merece 1,5 regua, arredonda e a sobra volta
        pras vizinhas;
      * marca que ocupa 2+ reguas ESPELHA: SKU com 4+ frentes divide as
        frentes meio a meio entre as reguas da faixa (5 vira 3+2, sobra
        em cima), na MESMA sequencia - o bloco de baixo fica exatamente
        sob o de cima. Como as reguas espelhadas tem sequencia e larguras
        identicas, o alinhamento sai de graca (o index.html NAO muda);
      * SKU com ate 3 frentes NUNCA vira coluna magra: fica inteiro numa
        regua so, lado a lado, na regua mais vazia da faixa;
      * se ha mais marcas que reguas, as marcas mais magras vao sendo
        FUNDIDAS com a vizinha ate caber (ex.: Sol + Brilhante na mesma
        regua);
      * GIGANTE (altura > 75% da prateleira E > 1,3x a altura media do
        recorte, ex.: o Ype 5L no meio dos 500ml) vai pro CANTO DIREITO
        da ULTIMA regua, por acessibilidade, e reserva esse espaco antes
        das marcas serem distribuidas.
    distribuir_prateleiras agora recebe altura_prat (pra achar o gigante).

  v7.8
  - HORIZONTAL CONTINUA (refina a v7.7): a faixa horizontal de cima
    nao deixa mais buraco. As subcategorias caras enchem regua apos
    regua sem fechar entre elas; quando a ultima regua horizontal fica
    parcial, ela e COMPLETADA deitando os proximos itens (mais baratos)
    ate encher; so entao o restante desce nas reguas de baixo.
    A faixa horizontal pode usar ate num_prat-1 reguas (guarda so 1).

  v7.7
  - LAYOUT MISTO por subcategoria: subs empilhadas por PRECO MEDIO,
    caras HORIZONTAIS em cima e o resto embaixo.

  v7.6
  - NINGUEM FICA DE FORA: todo SKU que cabe fisicamente ganha 1
    frente garantida ANTES de qualquer distribuicao; so o espaco que
    sobra e repartido pelo DELTA (peso). So fica no Banco quem nao
    cabe mesmo (sem dimensao, alto demais, ou gondola lotada).

  v7.5
  - Cod ERP no tooltip: a dim_produtos ganhou a coluna codigo_erp
    (rode antes: ALTER TABLE dim_produtos ADD COLUMN IF NOT EXISTS
    codigo_erp text;). O balao que aparece ao passar o mouse no
    produto (canvas e visualizacao estatica) mostra "Cod ERP: <valor>"
    na primeira linha, quando o produto tem esse codigo preenchido.
    Popular a coluna com o importar_ajustes_banco.py (casa por EAN).
    NOTA: o recorte (produtos COM venda) vem da view layout_base, que
    nao carrega codigo_erp - por isso o app agora traz o codigo do
    catalogo (dim_produtos) casando por EAN, pra aparecer no tooltip
    tambem dos produtos montados na gondola, nao so os do Banco.

  v7.4
  - LOGIN sem a sugestao de "senha forte" do Chrome: o campo de senha
    ganhou autocomplete="one-time-code" (param nativo do st.text_input)
    + um observer JS que reaplica o atributo se o Streamlit redesenhar
    o campo. Mesmo truque dos outros apps.
  - Categoria/SubCategoria comeca VAZIA - nada pre-selecionado.
  - CORRIGIDO o dialogo "Cadastrar novo item" que reabria sozinho
    depois de fechado no X: a abertura agora e de disparo unico (a
    flag e consumida com pop no momento de abrir) e acontece ANTES do
    st.stop() de "sem categoria" - entao o botao tambem passa a
    funcionar sem nenhum recorte aberto.

  LOGIN (v7.2/v7.3)
  - Tela de login no visual do Portal de Pedidos: cartao centralizado,
    titulo azul + logo passaro_logo.png (na raiz do repo), select de
    usuario (Administrador / Usuario) e senha, botao magenta "Entrar
    no Sistema". Tudo dentro de st.form (mesmo modelo dos outros apps).
    Dois perfis: ADMIN edita dimensoes/foto (dois cliques) e cadastra
    itens novos; USUARIO faz todo o resto (montar, arrastar, salvar
    arranjo), so nao mexe no cadastro. Botao "Sair" na sidebar.
  - Senhas padrao no codigo; da pra sobrescrever sem mexer no codigo
    criando no secrets do Streamlit:
        [acessos]
        admin = "..."
        usuario = "..."

Arquivos que sobem juntos: planograma.py + fileira.py (v7.22) +
base_produtos.py (v7.21) + produtos.xlsx + gondola_dnd/index.html.

Dados: Supabase - dim_produtos + layout_vendas (via exportarlayoutvendas.py)
+ layout_gondolas + layout_planograma (arranjo salvo) + views
layout_opcoes / layout_base / layout_sem_cadastro (views_planograma.sql).
Secrets (Streamlit): [supabase] url / key
"""

import io
import json
import math
import os
import time

import pandas as pd
import streamlit as st
import streamlit.components.v1 as components
from supabase import create_client

import base_produtos as bp        # v7.21 - base de ativos (produtos.xlsx)
import fileira as fl              # v7.22 - modulos independentes (slots)

ESCALA = 5  # pixels por cm
LARANJA = "#e8620d"
BUCKET_FOTOS = "fotos"

# --- v7.16: seletor de categoria/subcategoria -------------------------
# quadro fixo na sidebar (nao e mais popover). v7.16 - 5 linhas visiveis
# (eram ~15): com a sidebar reorganizada em blocos, o quadro alto empurrava
# o resto pra fora da tela. O que passar disso rola dentro do quadro.
ALTURA_SELETOR = 200   # px (~5 linhas + respiro)
MAX_LISTA_SEL = 60     # itens renderizados por vez (checkbox custa rerun)

# --- v7.9: faixas por marca -------------------------------------------
# SKU com pelo menos esse tanto de frentes e que espelha entre as reguas
# da faixa; abaixo disso ele fica inteiro numa regua so (nunca coluna
# magra de 1 frente).
FRENTES_MIN_ESPELHO = 4
# ao completar a regua parcial do topo (fase 1b), nenhum SKU entra com
# mais que isso - senao um item so toma o pedaco inteiro que sobrou
MAX_FRENTES_TOPO = 4
# "gigante" = passa dos dois limiares ao mesmo tempo (o Ype 5L no meio
# dos 500ml dispara facil; nenhum item normal dispara)
LIMIAR_GIGANTE_PRAT = 0.75   # fracao da altura util da prateleira
LIMIAR_GIGANTE_MEDIA = 1.30  # vezes a altura media do recorte
FRACAO_MAX_GIGANTE = 0.50    # gigante nao toma mais que metade da regua

# --- v7.15: CLASSES DE TAMANHO ----------------------------------------
# PORTE do item = largura x altura (a cara que ele ocupa na regua; e a
# unica medida sempre presente, ja que o alocar exige largura e altura).
# Ate a v7.14 o porte virava um SIM/NAO ("grande" x "padrao") comparado
# com o quartil inferior do recorte. No arroz isso quebra: o quartil da
# 280, entao o 2kg (400) e o 5kg (836) caem no MESMO balde e vao pra
# mesma regua - foi o que o Adriano viu, 2kg deitado junto do 5kg.
# Agora o porte vira CLASSES: os portes sao ordenados e uma classe nova
# so abre quando o salto pro proximo passa de FATOR_CLASSE_PORTE. Duas
# embalagens de 5kg que variam 2cm ficam na MESMA classe (salto 1,02) e
# ali quem manda e o preco; 1kg -> 2kg (1,67) e 2kg -> 5kg (2,05) abrem
# classe. E exatamente a regra que ele descreveu: "o tamanho e em
# seguida o preco, mas so quando a diferenca for bem alta - diferenca de
# gramagem apenas nao precisa, o de maior preco fica em cima".
FATOR_CLASSE_PORTE = 1.35
# teto de classes: acima disso as menores vao sendo fundidas (mais
# classes que isso vira uma regua por gramatura e sobra buraco)
MAX_CLASSES_PORTE = 3
# uma classe so ganha REGUA PROPRIA se tiver produto pra quase encher
# uma; senao entra junto da vizinha. O territorio e sempre em reguas
# INTEIRAS, entao classe com 0,6 de regua deixava 40% de buraco - foi o
# que aconteceu com o Red Bull, que virou classe sozinha e deixou a
# regua do topo em 63%. v7.18 - subiu de 0,60 pra 0,85.
# A classe MAIOR nunca sobe por aqui - se ela e que ficar folgada, quem
# resolve e o passe de preenchimento, engordando as frentes dela.
MIN_CLASSE_REGUA = 0.85
# DENSIDADE DE VALOR = preco / volume (R$ por cm3). E o que separa
# "caro porque a embalagem e maior" de "caro porque vale mais": item
# MUITO mais denso que o tipico do recorte SOBE UMA CLASSE, ou seja,
# nao desce so por ser um pouco maior - e o que mantem o lava-loucas
# (maior que o detergente 500ml, porem 2,3x mais denso) la em cima.
TOL_DENSIDADE = 1.15
# v7.15 - o desligamento por fracao (FRACAO_MAX_GRANDES da v7.14) saiu:
# com classes ele nao faz falta e atrapalhava. Categoria toda do mesmo
# tamanho (racao, agua mineral) da UMA classe so, e ai a regra nao faz
# nada sozinha; e no arroz, onde o 5kg e a maioria, era justamente o
# desligamento que embaralhava as gramaturas.
# se MAIS que isso dos SKUs disparariam a regra de altura, nao sao
# outliers e sim o formato da categoria: desliga o tratamento de canto
# do gigante e deixa a regra de porte cuidar
FRACAO_MAX_GIGANTES = 0.15

# --- v7.17: gondola que ja vem escolhida ------------------------------
# Nome (igual ao da layout_gondolas) da gondola que abre selecionada e
# aparece em PRIMEIRO na lista. O resto continua em ordem alfabetica.
# Se esse nome nao existir no cadastro, a lista sai como sempre - nao
# quebra nada. Pra trocar o padrao, basta editar esta linha.
# v7.28 - trocado de "x 5" pra "x 6 prateleiras" (pedido do Adriano).
# v7.31 - de volta pra "x 5 prateleiras" (pedido do Adriano: abrir com 5 reguas).
GONDOLA_PADRAO = "M\u00f3dulo 1,30m x 5 prateleiras"

# --- v7.28: categoria que ja vem marcada ao abrir ----------------------
# Nome (igual ao que aparece na coluna "categoria") que a checkbox do
# seletor de recorte marca sozinha na PRIMEIRA renderizacao da sessao,
# pra tela nao abrir em branco. So vale quando "Montar por" = Categoria
# e essa categoria existir na loja escolhida; senao nao faz nada. Pra
# trocar, basta editar esta linha.
# v7.30 - vazio = abre SEM categoria marcada (a gondola aparece vazia,
# com as reguas desenhadas). Pra voltar, ex.: "Achocolatados".
CATEGORIA_PADRAO = ""

# --- v7.42: lojas que aparecem no filtro ------------------------------
# So essas entram no campo Loja (a 031 saiu). Pra incluir uma loja nova,
# basta acrescentar o numero aqui.
LOJAS_ATIVAS = {1, 2, 3, 4, 5, 6, 7, 8}

# --- v7.32: regua de baixo sobe pro produto alto ------------------------
# Quando a regua precisa subir em degraus (5L embaixo, 2L logo acima),
# degraus mais proximos que isso viram um so - evita 32/33/34 cm, que
# fragmenta a gondola sem ganho nenhum.
DEGRAU_MIN_CM = 4.0

# senhas dos dois perfis (o secrets [acessos] admin/usuario sobrescreve)
SENHA_ADMIN = "moli012345"
SENHA_USUARIO = "moli1234"

# identidade visual do login (mesma do Portal de Pedidos)
AZUL_MOLI = "#0B3D63"
MAGENTA_MOLI = "#E5007D"
# v7.27 - texto claro pro fundo ESCURO da sidebar (mesmo azul do Portal de
# Pedidos/Promotores, so que agora preenchendo a sidebar inteira, nao so o
# cartao de cabecalho - por isso precisa de uma cor de texto propria).
AZUL_SIDEBAR_TXT = "#EAF1F8"
LOGO_LOGIN = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "passaro_logo.png")

# o Streamlit Cloud roda em UTC: datetime.now() puro carimbava o
# planograma 3h adiantado
FUSO_BR = "America/Sao_Paulo"


def agora_br():
    """Data/hora local (Londrina-PR). Usa o tzdata do sistema quando
    existe; senao cai num UTC-3 fixo - o Brasil nao tem mais horario de
    verao desde 2019, entao o offset fixo confere o ano todo. Pra
    garantir o ZoneInfo no Streamlit Cloud, basta ter tzdata no
    requirements.txt."""
    from datetime import datetime, timedelta, timezone
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo(FUSO_BR))
    except Exception:
        return datetime.now(timezone.utc).astimezone(
            timezone(timedelta(hours=-3)))


def alturas_da_gondola(g, num_prat):
    """Lista de alturas (cm) por regua, na ordem TOPO -> BASE.

    Le a coluna alturas_cm da layout_gondolas (texto, ex.: "35,40,40,45").
    Vazia/ausente = altura_prateleira_cm em todas as reguas, que e o
    comportamento de ate a v7.11 - por isso da pra subir esta versao sem
    rodar o ALTER TABLE. Se a lista tiver menos valores que o numero de
    reguas pedido, o resto entra com a altura padrao; se tiver mais,
    usa os primeiros."""
    padrao = 40.0
    try:
        padrao = float(g["altura_prateleira_cm"])
    except Exception:
        pass
    bruto = None
    try:
        bruto = g.get("alturas_cm") if hasattr(g, "get") else g["alturas_cm"]
    except Exception:
        bruto = None
    vals = []
    if isinstance(bruto, str) and bruto.strip():
        import re as _re
        for p in _re.split(r"[;,\s]+", bruto.strip()):
            if not p:
                continue
            try:
                v = float(p.replace(",", "."))
            except ValueError:
                continue
            if v > 0:
                vals.append(v)
    n = max(1, int(num_prat))
    if not vals:
        return [padrao] * n
    if len(vals) >= n:
        return vals[:n]
    return vals + [padrao] * (n - len(vals))


def ordem_gondolas(nomes):
    """v7.17 - poe a GONDOLA_PADRAO em primeiro na lista (e, por ser a
    primeira, ela ja abre selecionada), mantendo as demais na ordem
    alfabetica que veio do cadastro.

    A comparacao ignora acento, caixa e espaco repetido, pra nao
    depender de como o nome foi digitado na layout_gondolas ("Modulo
    1,30M  x 5 Prateleiras" casa com "M\u00f3dulo 1,30m x 5 prateleiras").
    Se nao achar, devolve a lista como veio."""
    import unicodedata

    def _norm(t):
        t = unicodedata.normalize("NFKD", str(t))
        t = "".join(c for c in t if not unicodedata.combining(c))
        return " ".join(t.lower().split())

    nomes = list(nomes)
    alvo = _norm(GONDOLA_PADRAO)
    for n in nomes:
        if _norm(n) == alvo:
            return [n] + [o for o in nomes if o != n]
    return nomes


def texto_alturas(alturas):
    """Lista -> texto pra gravar na coluna alturas_cm."""
    return ",".join(f"{a:g}" for a in alturas)


def checar_login():
    """Tela de login no padrao do Portal de Pedidos: cartao centralizado,
    select de usuario + senha dentro de st.form. Devolve o perfil
    ('admin' ou 'usuario') e guarda na sessao."""
    if st.session_state.get("perfil") in ("admin", "usuario"):
        return st.session_state["perfil"]

    st.markdown(f"""
    <style>
      [data-testid="stFormSubmitButton"] button{{
        background:{MAGENTA_MOLI} !important;
        border-color:{MAGENTA_MOLI} !important;
        color:#fff !important;font-weight:600}}
      [data-testid="stFormSubmitButton"] button:hover{{
        background:#c50069 !important;border-color:#c50069 !important}}
    </style>""", unsafe_allow_html=True)

    _, meio, _ = st.columns([1, 1, 1])
    with meio:
        with st.container(border=True):
            ct, cl = st.columns([5, 1])
            ct.markdown(
                f"<h2 style='color:{AZUL_MOLI};text-align:center;"
                "margin:0 0 2px'>Planograma</h2>"
                f"<p style='color:{AZUL_MOLI};text-align:center;"
                "font-size:12px;margin:0'>Gest\u00e3o de Categoria \u2014 "
                "Molicenter</p>",
                unsafe_allow_html=True)
            if os.path.isfile(LOGO_LOGIN):
                cl.image(LOGO_LOGIN, width=64)
            st.divider()
            with st.form("login"):
                usuario_sel = st.selectbox(
                    "\U0001F464 Usu\u00e1rio de acesso:",
                    ["Selecione...", "Administrador", "Usu\u00e1rio"])
                senha = st.text_input("\U0001F511 Senha de acesso:",
                                      type="password",
                                      autocomplete="one-time-code")
                entrar = st.form_submit_button("Entrar no Sistema",
                                               use_container_width=True)
            if entrar:
                ac = st.secrets.get("acessos", {})
                esperada = {"Administrador": ac.get("admin", SENHA_ADMIN),
                            "Usu\u00e1rio": ac.get("usuario", SENHA_USUARIO)
                            }.get(usuario_sel)
                if esperada is None:
                    st.warning("Selecione o usu\u00e1rio de acesso.")
                elif senha.strip() == esperada:
                    st.session_state["perfil"] = ("admin"
                                                  if usuario_sel == "Administrador"
                                                  else "usuario")
                    st.rerun()
                else:
                    st.error("Senha incorreta.")

    # O Chrome trata campo type=password como formulario de cadastro e
    # oferece "senha forte". autocomplete=one-time-code desliga tanto a
    # sugestao quanto a oferta de salvar (mesmo truque dos outros apps).
    # O param nativo acima ja marca o input; este observer reaplica o
    # atributo caso o Streamlit redesenhe o campo.
    components.html("""
    <script>
    const doc = window.parent.document;
    const ajustar = () => doc.querySelectorAll('input[type="password"]')
        .forEach(el => {
            el.setAttribute('autocomplete', 'one-time-code');
            el.setAttribute('data-lpignore', 'true');
        });
    ajustar();
    new MutationObserver(ajustar).observe(doc.body,
                                          {childList: true, subtree: true});
    </script>""", height=0)
    st.stop()

# mesmos parametros do tirar_fundo_fotos.py
TOLERANCIA = 26      # distancia RGB pra considerar pixel = fundo
LIMIAR_CAIXA = 40    # alpha minimo pra pixel contar na caixa de corte
FRACAO_MINIMA = 0.01 # linha/coluna quase vazia nao estica a caixa


# ==========================================
# CONEXAO E CARGA (filtrada no servidor)
# ==========================================
@st.cache_resource
def get_supabase():
    return create_client(st.secrets["supabase"]["url"], st.secrets["supabase"]["key"])


def _paginado(monta_query):
    """Roda a query em paginas de 1.000 (PostgREST limita o retorno)."""
    dados, off = [], 0
    while True:
        r = monta_query().range(off, off + 999).execute()
        dados.extend(r.data)
        if len(r.data) < 1000:
            break
        off += 1000
    return pd.DataFrame(dados)


@st.cache_data(ttl=None, show_spinner="Carregando gondolas...")
def carregar_gondolas():
    r = get_supabase().table("layout_gondolas").select("*").order("nome").execute()
    return pd.DataFrame(r.data)


@st.cache_data(ttl=None, show_spinner="Carregando lojas e categorias...")
def carregar_opcoes():
    """View layout_opcoes: distinct loja x categoria x subcategoria."""
    return _paginado(lambda: get_supabase().table("layout_opcoes").select("*"))


@st.cache_data(ttl=None, show_spinner="Carregando produtos do recorte...")
def carregar_recorte(loja, col_nivel, escolhas):
    """View layout_base filtrada: so a loja + categorias selecionadas."""
    return _paginado(lambda: (get_supabase().table("layout_base").select("*")
                              .eq("loja", loja)
                              .in_(col_nivel, list(escolhas))))


@st.cache_data(ttl=None, show_spinner="Carregando catalogo do recorte...")
def carregar_catalogo(col_nivel, escolhas):
    """dim_produtos filtrada: itens do recorte mesmo sem venda (pro Banco)."""
    cols = ("ean,descricao,marca,categoria,subcategoria,"
            "largura_cm,altura_cm,profundidade_cm,foto_url,codigo_erp")
    return _paginado(lambda: (get_supabase().table("dim_produtos").select(cols)
                              .in_(col_nivel, list(escolhas))))


@st.cache_data(ttl=None, show_spinner=False)
def carregar_faltantes():
    """View layout_sem_cadastro: EANs com venda que nao existem na
    dim_produtos (por isso somem do quadro). Top 500 por venda."""
    r = (get_supabase().table("layout_sem_cadastro").select("*")
         .order("venda", desc=True).limit(500).execute())
    return pd.DataFrame(r.data)


# ==========================================
# MOTOR (frentes + arranjo automatico inicial)
# ==========================================
def calcular_pesos(df):
    """Peso por participacao dentro do recorte. Margem negativa conta como 0."""
    d = df.copy()
    d["margem_pos"] = d["margem"].clip(lower=0)
    for col, novo in (("margem_pos", "margem_n"), ("venda", "venda_n"),
                      ("qtde", "qtde_n")):
        total = d[col].sum()
        d[novo] = d[col] / total if total and total > 0 else 0.0
    d["peso"] = d["margem_n"] * 0.40 + d["venda_n"] * 0.30 + d["qtde_n"] * 0.30
    d["preco_medio"] = (d["venda"] / d["qtde"].replace(0, pd.NA)).fillna(0)
    return d


def _particao_otima(logs, k):
    """Melhor reparticao dos valores (ja ordenados, em LOG) em k grupos
    contiguos - a que minimiza a soma das variancias internas. DP
    classica de 1-D clustering; com poucas dezenas de tamanhos
    distintos e k<=3 e instantanea.

    E em LOG porque tamanho e multiplicativo: de 1L pra 2L e o mesmo
    "degrau" que de 2L pra 4L, e a distancia absoluta enganaria."""
    n = len(logs)
    if k <= 1 or n <= 1:
        return [0]
    k = min(k, n)
    pre, pre2 = [0.0] * (n + 1), [0.0] * (n + 1)
    for i, x in enumerate(logs):
        pre[i + 1] = pre[i] + x
        pre2[i + 1] = pre2[i] + x * x

    def sse(i, j):                    # soma dos quadrados de logs[i..j-1]
        m = j - i
        if m <= 1:
            return 0.0
        soma = pre[j] - pre[i]
        return max(0.0, (pre2[j] - pre2[i]) - soma * soma / m)

    INF = float("inf")
    dp = [[INF] * (n + 1) for _ in range(k + 1)]
    de = [[0] * (n + 1) for _ in range(k + 1)]
    dp[0][0] = 0.0
    for t in range(1, k + 1):
        for j in range(t, n + 1):
            for i in range(t - 1, j):
                c = dp[t - 1][i] + sse(i, j)
                if c < dp[t][j]:
                    dp[t][j], de[t][j] = c, i
    inicios, j = [], n
    for t in range(k, 0, -1):
        i = de[t][j]
        inicios.append(i)
        j = i
    return sorted(inicios)


def cortes_de_classe(portes, densidades=None):
    """v7.18 - CLASSES DE TAMANHO do recorte. Devolve os pontos de corte;
    a classe de um item e quantos cortes ele deixou pra tras (0 = menor).

    Ate a v7.17 o corte saia da comparacao de cada porte com o VIZINHO
    imediato: abria classe onde o salto passava de FATOR_CLASSE_PORTE.
    Funciona onde a categoria tem degraus limpos (1kg / 2kg / 5kg), mas
    QUEBRA no continuo - o lava-roupas tem 500ml, 1L, 1,5L, 2L, refil e
    3L, e nenhum salto isolado chega a 1,35 (1L->2L da 1,30; refil->3L
    da 1,14). Resultado: uma classe so, o tamanho nao reordenava nada e
    o 3L subia pro topo por ser o mais caro - foi o que o Adriano viu.

    Agora o recorte e AGRUPADO de verdade, em tres passos:
      1. quantas classes cabem na amplitude: com o maior porte sendo N
         vezes o menor, cabem log(N)/log(FATOR) degraus, limitado por
         MAX_CLASSES_PORTE. Categoria de tamanho uniforme da 1 e a regra
         nao faz nada;
      2. reparticao otima em k grupos contiguos (menor variancia
         interna, em escala log) - olha o recorte inteiro em vez de
         degrau por degrau;
      3. FUSAO dos grupos vizinhos cujos CENTROS estao a menos de
         FATOR_CLASSE_PORTE um do outro. E aqui que mora a regra dele -
         "diferenca de gramagem apenas nao precisa": Red Bull x lata de
         269ml tem centros a 1,34 e viram uma classe so, onde manda o
         preco; 1kg x 2kg tem centros a 1,67 e ficam separados.

    A DENSIDADE DE VALOR (R$/cm3) e o ultimo filtro, e vale por DEGRAU,
    nao por item: se o grupo de cima for bem mais denso que o de baixo,
    nao e embalagem economica e sim produto premium - os dois viram uma
    classe so, onde manda o preco (lava-loucas x detergente 500ml). Se
    fosse por item, o caro de uma classe subiria sozinho e quebraria a
    classe: a Coca 2L ia pro topo deixando Pepsi e Sukita 2L, do mesmo
    tamanho, embaixo."""
    import math

    if densidades is None:
        densidades = [None] * len(list(portes))
    pares = []
    for p, d in zip(portes, densidades):
        try:
            p = float(p)
        except Exception:
            continue
        if not (p > 0):
            continue
        try:
            d = float(d)
            d = d if d == d and d > 0 else None    # NaN/zero -> ignora
        except Exception:
            d = None
        pares.append((p, d))
    if len(pares) < 2:
        return []
    pares.sort(key=lambda x: x[0])

    # os tamanhos DISTINTOS e que formam a escada; repetir o mesmo porte
    # 20 vezes nao deve puxar a fronteira pra perto dele
    vals, dens = [], {}
    for p, d in pares:
        chave = round(p, 3)
        if not vals or chave != vals[-1]:
            vals.append(chave)
        if d is not None:
            dens.setdefault(chave, []).append(d)
    if len(vals) < 2:
        return []

    # (1) quantas classes cabem na amplitude do recorte
    amplitude = vals[-1] / vals[0]
    if amplitude <= FATOR_CLASSE_PORTE:
        return []                      # tamanho praticamente uniforme
    k = 1 + int(math.log(amplitude) / math.log(FATOR_CLASSE_PORTE))
    k = max(2, min(MAX_CLASSES_PORTE, k, len(vals)))

    # (2) reparticao otima em k grupos contiguos (log)
    logs = [math.log(v) for v in vals]
    inicios = _particao_otima(logs, k)
    grupos = []
    for n_i, ini in enumerate(inicios):
        fim = inicios[n_i + 1] if n_i + 1 < len(inicios) else len(vals)
        if fim > ini:
            grupos.append(list(range(ini, fim)))

    def _centro(gr):                   # media geometrica do grupo
        return math.exp(sum(logs[i] for i in gr) / len(gr))

    def _dens_med(gr):
        v = sorted(d for i in gr for d in dens.get(vals[i], []))
        return v[len(v) // 2] if v else None

    # (3) funde vizinhos proximos demais (gramagem) ou premium (densidade)
    i = 0
    while i < len(grupos) - 1:
        junta = _centro(grupos[i + 1]) / _centro(grupos[i]) <= FATOR_CLASSE_PORTE
        if not junta:
            db, dc = _dens_med(grupos[i]), _dens_med(grupos[i + 1])
            junta = bool(db and dc and dc > TOL_DENSIDADE * db)
        if junta:
            grupos[i:i + 2] = [grupos[i] + grupos[i + 1]]
            i = max(0, i - 1)          # a fusao muda centro e mediana
        else:
            i += 1

    return [vals[gr[0]] for gr in grupos[1:]]


def classe_do_porte(p, cortes):
    """Quantos cortes esse porte deixou pra tras (0 = classe menor)."""
    try:
        v = float(p)
    except Exception:
        return 0
    return sum(1 for c in cortes if v >= c)


def alocar(df, largs, alturas):
    """Calcula as FRENTES de cada SKU (ninguem fica de fora) e devolve a
    fita AGRUPADA por subcategoria, subs ordenadas por PRECO MEDIO desc.
    Quem monta o layout (horizontal em cima / faixas de marca embaixo) e
    o distribuir_prateleiras.
      1) todo SKU que cabe fisicamente ganha 1 frente garantida;
      2) o espaco que sobra vai por DELTA (peso);
      3) dentro da subcategoria, itens por preco desc (caro primeiro).
    Capacidade = soma da largura de todos os SLOTS.

    v7.22 - `largs` e `alturas` sao listas PARALELAS, uma entrada por
    SLOT (modulo x regua), ja na ordem TOPO -> BASE que o fileira.py
    monta. Ate a v7.21 a largura era um numero so, valendo pra fileira
    inteira; com modulos de 1,30 / 1,00 / 0,60 cada slot tem a sua e a
    capacidade deixa de ser largura x nº de reguas."""
    excl = []
    largs = [float(w) for w in largs] or [130.0]
    if not isinstance(alturas, (list, tuple)):
        alturas = [float(alturas)] * len(largs)
    alturas = list(alturas) or [40.0]
    while len(alturas) < len(largs):
        alturas.append(alturas[-1])
    alturas = alturas[:len(largs)]
    num_prat = len(largs)
    # v7.12 - o corte de "nao cabe" e pela regua MAIS ALTA: item que nao
    # entra nem nela nao entra em lugar nenhum
    alt_max = max(alturas)

    ok = df[df["largura_cm"].notna() & df["altura_cm"].notna()].copy()
    for _, r in df[~df.index.isin(ok.index)].iterrows():
        excl.append((r["ean"], r["descricao"], "sem dimensao"))

    alto = ok[ok["altura_cm"] > alt_max]
    for _, r in alto.iterrows():
        excl.append((r["ean"], r["descricao"],
                     f"altura {r['altura_cm']}cm > a regua mais alta "
                     f"({alt_max:g}cm)"))
    ok = ok[ok["altura_cm"] <= alt_max]
    if ok.empty:
        return [], pd.DataFrame(), excl

    ok = calcular_pesos(ok)  # peso + preco_medio

    # v7.15 - PORTE: a cara que o item ocupa na regua. Vira CLASSE DE
    # TAMANHO (0 = menor), e a ordem passa a ser TAMANHO e depois PRECO.
    ok["_porte"] = (ok["largura_cm"].astype(float)
                    * ok["altura_cm"].astype(float))

    # v7.13 - DENSIDADE DE VALOR (R$ por cm3). Sem profundidade cadastrada
    # usa a largura no lugar dela (caixa/garrafa de base ~quadrada).
    _prof = (ok["profundidade_cm"].astype(float)
             .fillna(ok["largura_cm"].astype(float))
             if "profundidade_cm" in ok.columns
             else ok["largura_cm"].astype(float))
    _prof = _prof.where(_prof > 0, ok["largura_cm"].astype(float))
    ok["_volume"] = ok["_porte"] * _prof
    ok["_dens"] = (ok["preco_medio"].astype(float)
                   / ok["_volume"].replace(0, pd.NA))

    # v7.15 - as CLASSES DE TAMANHO saem do porte + densidade juntos: o
    # porte define onde ha degrau de embalagem e a densidade diz se esse
    # degrau e economia de escala (abre) ou produto premium (nao abre).
    cortes = cortes_de_classe(ok["_porte"].tolist(), ok["_dens"].tolist())
    ok["_classe"] = ok["_porte"].map(lambda p: classe_do_porte(p, cortes))

    capacidade = float(sum(largs))                     # cm lineares totais

    # v7.12 - quantas reguas comportam cada item em pe. Item alto (que so
    # cabe em 1 regua) NAO pode receber frentes como se a gondola inteira
    # fosse dele: sem esse teto ele fica com frentes demais no rateio, o
    # empacotamento nao consegue posicionar e o motor acaba cortando as
    # frentes de todo mundo - reguas inteiras ficavam vazias.
    ok = ok.sort_values("peso", ascending=False)
    larg_map = {str(k): float(v)
                for k, v in ok.set_index("ean")["largura_cm"].items()}
    # cada item enxerga um CONJUNTO de reguas (as que o comportam em pe).
    # A restricao que vale e por conjunto, nao por item: tudo que so cabe
    # nas reguas de S junto nao pode passar de largura x |S|. Sem isso,
    # 5 itens altos que so cabem numa regua recebem frentes como se cada
    # um tivesse a gondola inteira, o empacotamento nao posiciona e o
    # motor acaba cortando as frentes de todo mundo.
    set_de, todas = {}, frozenset(range(len(alturas)))
    for _, r in ok.iterrows():
        h = float(r["altura_cm"])
        S = frozenset(i for i, a in enumerate(alturas) if h <= a + 1e-6)
        set_de[str(r["ean"])] = S or todas
    conjuntos = sorted(set(set_de.values()), key=len)
    contidos = {S: [e for e, Se in set_de.items() if Se <= S]
                for S in conjuntos}
    # v7.22 - a capacidade do conjunto e a SOMA das larguras dos slots
    # dele, nao largura x quantidade: 3 slots podem ser 390cm ou 180cm
    cap_S = {S: float(sum(largs[i] for i in S)) for S in conjuntos}

    # (1) 1 frente garantida a cada um, na ordem de peso caso estoure
    facings, usado = {}, 0.0
    for _, r in ok.iterrows():
        w = float(r["largura_cm"])
        if usado + w <= capacidade + 1e-6:
            facings[str(r["ean"])] = 1
            usado += w
        else:
            excl.append((r["ean"], r["descricao"],
                         "gondola lotada (sem espaco nem pra 1 frente)"))

    presentes = ok[ok["ean"].astype(str).isin(facings)].copy()
    if presentes.empty:
        return [], pd.DataFrame(), excl

    # quanto cada conjunto de reguas ja tem comprometido (as 1as frentes)
    usado_S = {S: sum(facings.get(e, 0) * larg_map[e] for e in contidos[S])
               for S in conjuntos}

    def _cabe_no_conjunto(ean, w):
        """A frente extra respeita a capacidade de TODOS os conjuntos que
        contem as reguas viaveis desse item?"""
        Se = set_de[ean]
        for S in conjuntos:
            if Se <= S and usado_S[S] + w > cap_S[S] + 1e-6:
                return False
        return True

    def _somar(ean, w, n=1):
        Se = set_de[ean]
        for S in conjuntos:
            if Se <= S:
                usado_S[S] += w * n

    # (2) reparte o espaco restante por peso (delta), com uma folga pro
    # desperdicio do empacotamento (resto de faixa / fim de regua)
    larg_media = usado / max(1, len(facings))
    folga = larg_media * int(num_prat)   # um item perdido por slot
    leftover = max(0.0, capacidade - usado - folga)
    pesos = {str(e): float(p)
             for e, p in zip(presentes["ean"], presentes["peso"])}
    total_peso = sum(pesos.values())
    if leftover > 0 and total_peso > 0:
        for ean in list(facings):        # 2a) proporcional ao peso
            w = larg_map[ean]
            add = int(((pesos[ean] / total_peso) * leftover) // w)
            # v7.12 - nunca passa do que as reguas compativeis comportam
            while add > 0 and not all(
                    usado_S[S] + add * w <= cap_S[S] + 1e-6
                    for S in conjuntos if set_de[ean] <= S):
                add -= 1
            if add > 0:
                facings[ean] += add
                _somar(ean, w, add)
                leftover -= add * w
        fila = (presentes.sort_values("peso", ascending=False)["ean"]  # 2b)
                .astype(str).tolist())
        avancou = True
        while leftover > 1e-6 and avancou:
            avancou = False
            for ean in fila:
                w = larg_map[ean]
                if w <= leftover + 1e-6 and _cabe_no_conjunto(ean, w):
                    facings[ean] += 1
                    _somar(ean, w)
                    leftover -= w
                    avancou = True
                    if leftover <= 1e-6:
                        break

    # (3) agrupa por subcategoria (ordenada por PRECO MEDIO desc);
    # dentro de cada sub, itens por preco desc (caro primeiro)
    presentes["_fr"] = presentes["ean"].astype(str).map(facings)

    # v7.15 - classe magra demais nao sustenta uma regua so pra ela.
    # A MAIOR e intocavel: e o ponto da regra (peso embaixo), e se ela
    # ficar folgada quem resolve e o passe de preenchimento la no
    # distribuir_prateleiras, engordando as frentes dela. Entre as
    # demais, a mais magra junta com a vizinha MENOR - assim o 2kg sobe
    # junto do 1kg em vez de descer pra regua do 5kg, que era a queixa.
    # A classe 0 nao tem vizinha menor, entao junta com a de cima: uma
    # lata solitaria no meio de oito 2L nao fica com a regua do topo
    # inteira so pra ela.
    presentes["_cm_cls"] = (presentes["_fr"]
                            * presentes["largura_cm"].astype(float))
    _ord = sorted(largs)
    larg_tipica = _ord[len(_ord) // 2]
    # a classe FISICA nunca e fundida: mesmo quando os leves nao ganham
    # regua propria, e ela que garante que eles fiquem NA FRENTE (mais
    # perto do topo) dentro da regua que passarem a dividir
    presentes["_classe_fis"] = presentes["_classe"]
    while presentes["_classe"].nunique() > 1:
        cm_cls = presentes.groupby("_classe")["_cm_cls"].sum().sort_index()
        idx = [int(c) for c in cm_cls.index]
        i = min(range(len(idx) - 1),          # candidatas: todas menos a MAIOR
                key=lambda k: float(cm_cls.iloc[k]))
        # v7.22 - "fracao de UMA regua" nao existe mais quando os slots
        # tem larguras diferentes; a referencia passa a ser a MEDIANA
        # das larguras, pra o modulo de 0,60m no meio nao afundar o
        # criterio (nem o de 1,30m inflar).
        magra = (float(cm_cls.iloc[i])
                 < MIN_CLASSE_REGUA * larg_tipica)
        if not magra and len(idx) <= int(num_prat):
            break
        destino = idx[i - 1] if i > 0 else idx[1]
        presentes.loc[presentes["_classe"] == idx[i], "_classe"] = destino
    # "grande" = qualquer classe acima da menor presente. E quem nao
    # sobe pra faixa horizontal do topo (v7.14).
    presentes["_grande"] = presentes["_classe"] > presentes["_classe"].min()

    # v7.11 - a sub e "de formato grande" quando a maioria dos itens dela
    # e grande. Ordem: primeiro as de formato padrao (preco desc, caro em
    # cima), depois as de formato grande (preco desc entre elas) - assim
    # a farinha 5kg desce mesmo custando mais que a de 1kg.
    # v7.15 - a ordem das subs tambem passa a ser TAMANHO e depois
    # PRECO: a sub de formato menor (arroz japones 1kg) sobe pro topo
    # mesmo custando menos que a de 5kg, e entre subs do mesmo porte
    # continua valendo o preco medio (caro em cima), como sempre foi.
    inf_sub = presentes.groupby("subcategoria").agg(
        _preco=("preco_medio", "mean"), _cl=("_classe_fis", "mean"))
    ordem_sub = sorted(inf_sub.index.tolist(),
                       key=lambda s: (float(inf_sub.loc[s, "_cl"]),
                                      -float(inf_sub.loc[s, "_preco"])))
    fita = []   # lista de grupos: {"sub":..., "itens":[dict,...]}
    for sub in ordem_sub:
        # v7.15 - dentro da sub: TAMANHO primeiro (classe menor na
        # frente) e PRECO em seguida (caro primeiro dentro da classe)
        g = presentes[presentes["subcategoria"] == sub] \
            .sort_values(["_classe_fis", "preco_medio"],
                         ascending=[True, False])
        itens = []
        for _, r in g.iterrows():
            d = r.to_dict()
            d["facings"] = int(facings[str(r["ean"])])
            itens.append(d)
        fita.append({"sub": sub, "itens": itens})

    # resumo por subcategoria (informativo - % do espaco ocupado)
    tmp = presentes.copy()
    tmp["_cm"] = tmp["_fr"] * tmp["largura_cm"].astype(float)
    resumo = (tmp.groupby("subcategoria")
                 .agg(SKUs=("ean", "nunique"), Frentes=("_fr", "sum"),
                      **{"Espaco (cm)": ("_cm", "sum")},
                      Preco=("preco_medio", "mean"),
                      _cl=("_classe_fis", "mean"), Dens=("_dens", "mean"))
                 .reset_index().rename(columns={"subcategoria": "SubCategoria",
                                                "Preco": "Preco medio"}))
    # v7.15 - o Formato deixa de ser sim/nao e mostra a classe de tamanho
    # (1 = a menor, que fica no topo; a maior fica na regua de baixo)
    n_cls = int(presentes["_classe_fis"].nunique())
    resumo["Formato"] = resumo["_cl"].map(
        lambda v: ("tamanho unico" if n_cls <= 1
                   else f"tam. {int(round(v)) + 1} de {n_cls}"))
    tot_cm = float(resumo["Espaco (cm)"].sum())
    resumo["% Delta"] = ((resumo["Espaco (cm)"] / tot_cm * 100).round(2)
                         if tot_cm else 0)
    resumo["Espaco (cm)"] = resumo["Espaco (cm)"].round(1)
    resumo["Preco medio"] = resumo["Preco medio"].round(2)
    resumo["R$/cm3"] = resumo["Dens"].round(5)
    resumo = resumo.sort_values(["_cl", "Preco medio"],
                                ascending=[True, False])[
        ["SubCategoria", "Formato", "Preco medio", "R$/cm3", "% Delta",
         "Espaco (cm)", "SKUs", "Frentes"]]
    return fita, resumo, excl


# ------------------------------------------
# v7.9 - apoio das FAIXAS POR MARCA
# ------------------------------------------
def _marca_de(it):
    """Marca normalizada; item sem marca cai num balde unico."""
    m = it.get("marca")
    if isinstance(m, str) and m.strip():
        return m.strip().upper()
    return "SEM MARCA"


def _classe_de(it):
    """Classe FISICA de tamanho do item (0 = a menor do recorte)."""
    try:
        return int(it.get("_classe_fis") or it.get("_classe") or 0)
    except Exception:
        return 0


def _preco_de(it):
    try:
        v = float(it.get("preco_medio") or 0)
        return v if v == v else 0.0   # NaN -> 0
    except Exception:
        return 0.0


def _eh_gigante(it, altura_prat, alt_media):
    """Produto que foge da metrica da gondola (ex.: o 5L no meio dos
    500ml). Precisa passar dos DOIS limiares pra nao pegar item normal."""
    try:
        h = float(it.get("altura_cm") or 0)
    except Exception:
        return False
    if h <= 0:
        return False
    return (h > LIMIAR_GIGANTE_PRAT * float(altura_prat or 0)
            and h > LIMIAR_GIGANTE_MEDIA * float(alt_media or 0))


def _blocos_por_marca(itens, fr_rest, grande=False):
    """Agrupa por MARCA. Cada bloco vira uma FAIXA de reguas inteiras.
    Marcas ordenadas por preco medio desc (cara em cima); dentro da
    marca, itens por preco desc."""
    grupos = {}
    for it in itens:
        grupos.setdefault(_marca_de(it), []).append(it)
    blocos = []
    for marca, lst in grupos.items():
        # v7.15 - dentro da marca: classe menor primeiro, preco depois.
        # Importa quando o territorio ficou com mais de uma classe (os
        # formatos leves de pouco volume, que nao sustentam regua so
        # deles) - assim eles ficam na frente da faixa, nao no fim.
        lst = sorted(lst, key=lambda i: (_classe_de(i), -_preco_de(i)))
        cm = sum(float(i["largura_cm"]) * fr_rest[str(i["ean"])] for i in lst)
        preco = sum(_preco_de(i) for i in lst) / len(lst)
        blocos.append({"marca": marca, "itens": lst, "cm": cm,
                       "preco": preco, "grande": grande})
    blocos.sort(key=lambda b: (min(_classe_de(i) for i in b["itens"]),
                               -b["preco"]))
    return blocos


def _fundir_ate(blocos, n_max):
    """Se ha mais marcas que reguas, funde a marca mais magra com a
    vizinha mais magra (preservando a ordem de preco) ate caber."""
    blocos = list(blocos)
    while len(blocos) > n_max and len(blocos) > 1:
        i = min(range(len(blocos)), key=lambda k: blocos[k]["cm"])
        # v7.11 - prefere a vizinha da MESMA classe de tamanho, pra nao
        # misturar 5kg com 1kg na mesma faixa enquanto houver alternativa
        viz = [k for k in (i - 1, i + 1) if 0 <= k < len(blocos)]
        mesma = [k for k in viz
                 if blocos[k].get("grande") == blocos[i].get("grande")]
        cand = mesma or viz
        j = min(cand, key=lambda k: blocos[k]["cm"])
        a, b = min(i, j), max(i, j)
        blocos[a:b + 1] = [{
            "marca": f'{blocos[a]["marca"]} + {blocos[b]["marca"]}',
            "itens": blocos[a]["itens"] + blocos[b]["itens"],
            "cm": blocos[a]["cm"] + blocos[b]["cm"],
            "preco": max(blocos[a]["preco"], blocos[b]["preco"]),
            "grande": blocos[a].get("grande") and blocos[b].get("grande")}]
    return blocos


def _fundir_pequenas(blocos, largs_fila):
    """v7.39 - MARCA GRANDE NAO SE ESPALHA (pedido do Adriano: no Leite
    Condensado a Piracanjuba, com 35 frentes, ganhava UMA regua como as
    marcas pequenas e o que sobrava dela caia no fim das reguas das
    outras - R3, R4, R5 e R6).

    Cada marca leva reguas inteiras, entao com 5 marcas em 5 reguas todo
    mundo fica com uma, por menor que seja. Aqui, enquanto alguma marca
    pedir bem mais do que a regua que ganhou, duas marcas VIZINHAS que
    juntas cabem numa regua so passam a dividir uma (Tirol + Italac), e a
    regua liberada vai pra quem precisa. A ordem de preco nao muda."""
    blocos = list(blocos)
    if len(blocos) < 2 or not largs_fila:
        return blocos
    larg = sum(largs_fila) / float(len(largs_fila))
    for _ in range(len(blocos)):
        q = fl.quotas_por_capacidade(blocos, largs_fila)
        falta = max(float(b["cm"]) - qi * larg for b, qi in zip(blocos, q))
        if falta <= 0.5 * larg:
            break
        pares = [k for k in range(len(blocos) - 1)
                 if q[k] <= 1 and q[k + 1] <= 1
                 and blocos[k].get("grande") == blocos[k + 1].get("grande")
                 and blocos[k]["cm"] + blocos[k + 1]["cm"] <= larg * 1.02]
        if not pares:
            break
        k = min(pares, key=lambda i: blocos[i]["cm"] + blocos[i + 1]["cm"])
        a, b = blocos[k], blocos[k + 1]
        blocos[k:k + 2] = [{
            "marca": f'{a["marca"]} + {b["marca"]}',
            "itens": a["itens"] + b["itens"],
            "cm": a["cm"] + b["cm"],
            "preco": max(a["preco"], b["preco"]),
            "grande": a.get("grande") and b.get("grande")}]
    return blocos


def _cabe_altura(it, s, alturas):
    """v7.12 - o item cabe em pe na regua s?"""
    if not alturas:
        return True
    try:
        h = float(it.get("altura_cm") or 0)
    except Exception:
        return True
    return h <= float(alturas[s]) + 1e-6


def _colocar(it, q, s, fr_rest, prats, caps, usados, alturas=None):
    """Coloca ate q frentes do item na regua s (respeitando a largura
    disponivel E, na v7.12, a altura da regua).
    Devolve quantas frentes realmente entraram."""
    ean = str(it["ean"])
    w = float(it["largura_cm"])
    if alturas is not None and not _cabe_altura(it, s, alturas):
        return 0
    n = 0
    while n < q and fr_rest.get(ean, 0) > 0 and usados[s] + w <= caps[s] + 1e-6:
        prats[s].append((it, 1))
        usados[s] += w
        fr_rest[ean] -= 1
        n += 1
    return n


def _montar_faixa(bloco, fr_rest, prats, faixa, caps, usados, alturas=None):
    """Monta uma faixa de marca nas reguas de indice `faixa`.
      1) ESPELHO EXATO - com 2+ reguas, cada SKU forte entra com o maior
         multiplo de k que cabe (k = nº de reguas da faixa), a MESMA
         quantidade em cada regua e na MESMA ordem. Como as reguas ficam
         com sequencia e larguras identicas, o alinhamento vertical sai
         de graca (o index.html empacota flush-left e nao precisa mudar);
      2) SOBRAS - o que restou do espelho + os SKUs fracos (< 4 frentes,
         que nunca viram coluna magra) entram inteiros, lado a lado, na
         regua mais vazia da faixa, ou seja, a DIREITA do bloco
         espelhado - sem estragar o alinhamento da esquerda."""
    k = len(faixa)
    itens = bloco["itens"]

    if k >= 2:
        for it in itens:
            ean = str(it["ean"])
            n = int(fr_rest.get(ean, 0))
            if n < FRENTES_MIN_ESPELHO:
                continue          # SKU fraco fica inteiro numa regua so
            w = float(it["largura_cm"])
            # v7.12 - so espelha se o item couber EM PE em todas as reguas
            # da faixa; senao o bloco de baixo nao teria par la em cima
            if alturas is not None and not all(_cabe_altura(it, s, alturas)
                                               for s in faixa):
                continue
            q = n // k
            while q >= 1 and not all(usados[s] + q * w <= caps[s] + 1e-6
                                     for s in faixa):
                q -= 1            # nao cabe igual em todas: reduz o espelho
            if q >= 1:
                for s in faixa:
                    _colocar(it, q, s, fr_rest, prats, caps, usados, alturas)
                # a sobra (n nao multiplo de k) e CORTADA de proposito:
                # 3 em cima e 2 embaixo empurraria tudo o que vem depois
                # e o alinhamento morreria dali pra frente. Cortando, as
                # reguas da faixa saem com sequencia identica. Sao sempre
                # frentes EXTRAS - a 1a garantida nunca cai aqui.
                fr_rest[ean] = 0

    for it in itens:              # SKUs fracos, inteiros na regua mais vazia
        ean = str(it["ean"])
        while fr_rest.get(ean, 0) > 0:
            # v7.12 - tenta as reguas da faixa da mais vazia pra mais
            # cheia: a mais vazia pode ser justamente a baixa demais
            # pra esse item, e antes isso abortava a colocacao
            posto = 0
            for s in sorted(faixa, key=lambda x: caps[x] - usados[x],
                            reverse=True):
                posto = _colocar(it, fr_rest[ean], s, fr_rest, prats,
                                 caps, usados, alturas)
                if posto:
                    break
            if not posto:
                break


def _repescagem(blocos, faixas, fr_rest, prats, reguas, caps, usados,
                alturas=None, territorios=None, permitir_fora=False):
    """Ultimo recurso: quem nao coube na propria faixa tenta as reguas
    mais PROXIMAS dela (pra marca nao se espalhar pela gondola inteira),
    evitando corte de frentes desnecessario.

    v7.19 - a repescagem passou a RESPEITAR O TERRITORIO DA CLASSE. Era
    ela que colocava duas latas de Monster 473ml na ultima regua, no meio
    dos energeticos 2L: a faixa da marca transbordava e a vizinha mais
    proxima era justamente o territorio da classe maior. Agora, quem JA
    tem frente na gondola so e repescado dentro do proprio territorio -
    frente EXTRA nao vale quebrar a separacao por tamanho. Quem ainda
    nao entrou em lugar nenhum continua podendo ir pra qualquer regua,
    porque ficar de fora e pior (a 1a frente e garantida desde a v7.6).

    v7.20 - so que esse escape virou ULTIMO recurso mesmo. Com as reguas
    de cima em 99% e sobrando 2-4cm em cada (menos que uma lata), um
    Monster 473ml sem lugar caia direto na regua dos 2L. Agora, na
    montagem normal (permitir_fora=False), ele simplesmente NAO e
    colocado: entra na lista de faltantes, o laco de fora corta uma
    frente EXTRA de quem ocupa as reguas onde ele caberia e remonta -
    o espaco aparece no proprio territorio. So se nem cortando der e
    que a gondola e remontada com permitir_fora=True."""
    for idx, (bloco, faixa) in enumerate(zip(blocos, faixas)):
        if not faixa:
            continue
        centro = (faixa[0] + faixa[-1]) / 2.0
        proprio = list(territorios[idx]) if territorios else list(reguas)
        perto = sorted(proprio, key=lambda s: (s not in faixa, abs(s - centro)))
        longe = [s for s in reguas if s not in proprio]
        for it in bloco["itens"]:
            ean = str(it["ean"])
            while fr_rest.get(ean, 0) > 0:
                ja_tem = any(str(i["ean"]) == ean
                             for sh in prats for i, _ in sh)
                # v7.39 - frente EXTRA de quem ja esta na gondola fica so
                # na faixa da propria marca. Era essa sobra que espalhava
                # a Piracanjuba/Moca no fim das reguas das outras marcas;
                # o espaco que sobrar e preenchido depois pelos itens da
                # propria regua (passe de preenchimento).
                if ja_tem:
                    pref = [s for s in perto if s in faixa]
                else:
                    pref = perto if not permitir_fora else perto + longe
                posto = 0
                for s in pref:
                    posto = _colocar(it, fr_rest[ean], s, fr_rest, prats,
                                     caps, usados, alturas)
                    if posto:
                        break
                if not posto:
                    break


def distribuir_prateleiras(fita, largs, alturas):
    """v7.9 - monta a gondola em duas partes:
      FASE 1/1b (igual v7.8) - as subcategorias mais CARAS ocupam a faixa
        HORIZONTAL CONTINUA das reguas de cima; a ultima regua parcial e
        completada com os proximos itens ate encher;
      FASE 2 (nova) - o resto vai em FAIXAS POR MARCA nas reguas de
        baixo: marca cara em cima, cada marca ocupa reguas inteiras,
        SKU forte espelha meio a meio entre as reguas da faixa e SKU
        fraco fica inteiro numa regua so. Gigante (5L) vai pro canto
        direito da ultima regua.
    v7.12 - `alturas` e a lista de alturas por regua (aceita um numero
    unico tambem); item so entra em regua que o comporte em pe.
    v7.14 - item de FORMATO GRANDE nao entra na FASE 1/1b e a FASE 2
    reserva pra ele as reguas de BAIXO (territorios).
    v7.22 - `largs` e `alturas` sao listas paralelas, uma entrada por
    SLOT (modulo x regua), ja em ordem TOPO -> BASE. O produto NAO
    atravessa a emenda: cada slot e um container fechado, com a largura
    do seu modulo. Slot 0 = o mais alto (topo do modulo da esquerda)."""
    largs = [float(w) for w in largs] or [130.0]
    num_prat = len(largs)
    prateleiras = [[] for _ in range(num_prat)]
    descartadas = []
    if not isinstance(alturas, (list, tuple)):
        alturas = [float(alturas)] * num_prat
    alturas = list(alturas)
    while len(alturas) < num_prat:
        alturas.append(alturas[-1] if alturas else 40.0)
    alturas = alturas[:num_prat]

    def _n_slots(cm, de_baixo=False):
        """v7.22 - quantos SLOTS sao precisos pra somar `cm`, andando do
        topo (ou da base) pra dentro. Substitui o ceil(cm / largura da
        regua) de antes, que so valia com todas as reguas iguais: com
        1,30 / 1,00 / 0,60, "duas reguas" pode ser 230cm ou 160cm."""
        if cm <= 0:
            return 0
        n, acum = 0, 0.0
        ordem = (range(num_prat - 1, -1, -1) if de_baixo
                 else range(num_prat))
        for i in ordem:
            if acum >= cm - 1e-6:
                break
            acum += largs[i]
            n += 1
        return max(1, n)
    if not fita:
        return prateleiras, descartadas

    # frentes efetivas por SKU (comeca com o que o alocar sugeriu; se
    # faltar espaco, cortamos EXTRAS - nunca a 1a garantida)
    fr = {}
    alturas_itens = []
    for grupo in fita:
        for it in grupo["itens"]:
            fr[str(it["ean"])] = int(it["facings"])
            try:
                h = float(it.get("altura_cm") or 0)
                if h > 0:
                    alturas_itens.append(h)
            except Exception:
                pass
    alt_media = (sum(alturas_itens) / len(alturas_itens)) if alturas_itens else 0.0
    # v7.12 - com alturas diferentes por regua, a referencia do gigante
    # passa a ser a altura TIPICA (mediana) das reguas
    ord_alt = sorted(alturas)
    altura_ref = ord_alt[len(ord_alt) // 2] if ord_alt else 0.0

    # gigantes: calculados uma vez so (nao dependem das frentes) - eles
    # nao sobem pra faixa horizontal nem pra fase 1b, o lugar deles e o
    # canto direito da ultima regua
    todos_itens = [it for grupo in fita for it in grupo["itens"]]
    # v7.15 - o tratamento de GIGANTE (canto direito da ultima regua,
    # v7.9) so vale pra quem NAO tem classe de tamanho propria. Item de
    # classe maior ja tem territorio reservado nas reguas de baixo, e as
    # duas regras se atropelavam: a reserva do gigante comia a
    # capacidade da regua do territorio, a faixa da classe nao cabia e a
    # sobra vazava pra uma regua de cima pela repescagem (era a farinha
    # 5kg reaparecendo no meio da gondola). Sobra pro gigante o caso pra
    # que ele foi feito e que a classe nao pega: o item ALTO que, em area
    # frontal, fica na mesma classe dos vizinhos.
    gig_eans = {str(it["ean"]) for it in todos_itens
                if not it.get("_grande")
                and _eh_gigante(it, altura_ref, alt_media)}
    # v7.11 - se MUITA gente dispara a regra de altura, nao sao outliers e
    # sim o formato da categoria (farinha 5kg, arroz 5kg): o tratamento de
    # canto nao serve - a reserva da ultima regua nao comportaria todos -
    # entao desliga e deixa a regra de PORTE mandar todos pra baixo
    if len(gig_eans) > max(2, int(FRACAO_MAX_GIGANTES * len(todos_itens))):
        gig_eans = set()

    def _fica_embaixo(it):
        """v7.14 - item que NAO pode subir pra faixa horizontal do topo:
        formato grande (regra de acessibilidade) ou gigante (que tem
        lugar reservado no canto da ultima regua)."""
        return bool(it.get("_grande")) or str(it["ean"]) in gig_eans

    def montar(permitir_fora=False):
        """(re)monta as prateleiras com as frentes atuais em fr.
        Devolve (prats, faltaram) - faltaram = eans que nao entraram.
        v7.20 - permitir_fora=True solta a repescagem pra fora do
        territorio da classe; e o ultimo recurso, so quando cortar
        frentes nao resolveu."""
        prats = [[] for _ in range(num_prat)]
        caps = list(largs)                    # v7.22 - uma por slot
        usados = [0.0] * num_prat

        # v7.14 - o corte de quantas subs vao pro topo mede so os itens
        # que REALMENTE vao pra faixa horizontal: os grandes/gigantes
        # descem, entao contar a largura deles aqui so encolhia a faixa
        # de cima a toa.
        larg_g = [sum(float(it["largura_cm"]) * fr[str(it["ean"])]
                      for it in grupo["itens"] if not _fica_embaixo(it))
                  for grupo in fita]
        # v7.14 - a faixa horizontal guarda pras faixas de baixo pelo
        # menos as reguas que o formato grande vai precisar la embaixo.
        # v7.22 - a conta e pelos slots DE BAIXO, que sao justamente os
        # que o formato grande vai ocupar (e que podem ser os estreitos)
        cm_grande = sum(float(it["largura_cm"]) * fr[str(it["ean"])]
                        for it in todos_itens if it.get("_grande"))
        n_res = _n_slots(cm_grande, de_baixo=True) if cm_grande > 0 else 1
        teto_horizontal = (num_prat if len(fita) <= 1
                           else max(1, num_prat - n_res))

        # v7.32 - quantos slots a faixa horizontal OCUPA DE VERDADE, com
        # frente inteira: a conta so em cm (_n_slots) dizia que 31 frentes
        # de 8,2 cm (254 cm) cabiam em 2 reguas de 130, mas cada regua leva
        # 15 (123 cm) e a 31a abria uma 3a regua com UM produto so - e
        # essa regua, fechada pela fase 1b, se perdia pra classe de baixo
        # (Agua Sanitaria: R3 com 1 frente e 2% de ocupacao).
        def _slots_empacotando(n_grupos):
            linha_e, x_e = 0, 0.0
            usou = False
            for grupo in fita[:n_grupos]:
                for it in grupo["itens"]:
                    if _fica_embaixo(it):
                        continue
                    w = float(it["largura_cm"])
                    for _ in range(fr[str(it["ean"])]):
                        if x_e + w > largs[min(linha_e, num_prat - 1)] + 1e-6:
                            linha_e += 1
                            x_e = 0.0
                        x_e += w
                        usou = True
            return (linha_e + 1) if usou else 0

        # quantas subs (as mais caras) entram na faixa horizontal
        n_horiz_subs = 0
        if len(fita) > 1:
            acum = 0.0
            for gi in range(len(fita) - 1):   # a ultima sub nunca e horizontal
                acum_try = acum + larg_g[gi]
                reguas_n = max(_n_slots(acum_try), _slots_empacotando(gi + 1))
                if reguas_n <= teto_horizontal:
                    acum = acum_try
                    n_horiz_subs = gi + 1
                else:
                    break

        # FASE 1 - subs horizontais, CONTINUAS (nao fecha regua entre subs)
        # v7.12 - se o item nao couber EM PE na regua da vez, o que falta
        # dele nao se perde: vai pra sobra_fase1 e desce pra FASE 2, que
        # procura uma regua alta o suficiente
        linha, x = 0, 0.0
        sobra_fase1 = []
        for grupo in fita[:n_horiz_subs]:
            for it in grupo["itens"]:
                n_alvo = fr[str(it["ean"])]
                # v7.14 - FORMATO GRANDE NAO SOBE. Antes ele so ia pro fim
                # da fila, e "fim da fila" ainda caia na regua 2 de 4 (o
                # energetico 2L no meio das latas). Agora ele sai inteiro
                # da faixa horizontal e desce pra FASE 2.
                if _fica_embaixo(it):
                    sobra_fase1.append((it, n_alvo))
                    continue
                w = float(it["largura_cm"])
                posto = 0
                for _ in range(n_alvo):
                    # v7.22 - a faixa horizontal "continua" agora passa
                    # de slot em slot: enche o topo do M1, pula pro topo
                    # do M2 e so depois desce de nivel. Nao existe mais
                    # produto em cima da emenda.
                    if linha < num_prat and x + w > caps[linha] + 1e-6:
                        linha += 1
                        x = 0.0
                    if linha >= num_prat:
                        break
                    if not _cabe_altura(it, linha, alturas):
                        break   # nao cabe em pe nessa regua
                    prats[linha].append((it, 1))
                    x += w
                    usados[linha] = x
                    posto += 1
                if posto < n_alvo:
                    sobra_fase1.append((it, n_alvo - posto))
                if linha >= num_prat:
                    break

        # itens que vao pra parte de baixo, achatados (caro -> barato).
        # a sobra da FASE 1 entra na frente: ela vem das subs mais caras
        resto = [it for it, _ in sobra_fase1]
        resto += [it for grupo in fita[n_horiz_subs:] for it in grupo["itens"]]
        fr_rest = {}
        for it, falta in sobra_fase1:
            fr_rest[str(it["ean"])] = fr_rest.get(str(it["ean"]), 0) + falta
        for grupo in fita[n_horiz_subs:]:
            for it in grupo["itens"]:
                fr_rest.setdefault(str(it["ean"]), fr[str(it["ean"])])
        ri = 0

        # FASE 1b - COMPLETA a regua parcial que a horizontal deixou
        # (GIGANTE e FORMATO GRANDE nunca sobem pra ca: o lugar deles
        #  e o chao - senao a farinha 5kg volta pro topo pela porta
        #  dos fundos)
        if linha < num_prat and 0 < x < caps[linha]:
            posto_topo = {}
            while ri < len(resto):
                it = resto[ri]
                ean = str(it["ean"])
                w = float(it["largura_cm"])
                if (fr_rest[ean] <= 0 or _fica_embaixo(it)
                        or not _cabe_altura(it, linha, alturas)
                        or posto_topo.get(ean, 0) >= MAX_FRENTES_TOPO):
                    ri += 1
                    continue
                if x + w > caps[linha] + 1e-6:
                    break   # regua cheia
                prats[linha].append((it, 1))
                x += w
                usados[linha] = x
                fr_rest[ean] -= 1
                posto_topo[ean] = posto_topo.get(ean, 0) + 1
            linha += 1   # fecha a regua parcial

        # ---------- FASE 2 - FAIXAS POR MARCA ----------
        base = min(linha, num_prat - 1)
        reguas = list(range(base, num_prat))
        n_vert = len(reguas)
        ultima = reguas[-1]

        pendentes = [it for it in resto if fr_rest[str(it["ean"])] > 0]
        gigantes = [it for it in pendentes if str(it["ean"]) in gig_eans]
        normais = [it for it in pendentes if str(it["ean"]) not in gig_eans]

        # gigantes: reservam o canto DIREITO da ultima regua
        plano_gig, gig_cm = [], 0.0
        teto_gig = float(caps[ultima]) * FRACAO_MAX_GIGANTE
        for it in gigantes:
            ean, w, q = str(it["ean"]), float(it["largura_cm"]), 0
            if _cabe_altura(it, ultima, alturas):
                while q < fr_rest[ean] and gig_cm + w <= teto_gig + 1e-6:
                    gig_cm += w
                    q += 1
            plano_gig.append((it, q))
        caps[ultima] = max(0.0, float(largs[ultima]) - gig_cm)

        # gigante que nao coube na reserva volta pro fluxo normal em vez
        # de ficar sem lugar e cair no Banco
        for it, q in plano_gig:
            if q <= 0:
                normais.append(it)
        plano_gig = [(it, q) for it, q in plano_gig if q > 0]

        # v7.15 - TERRITORIOS POR CLASSE DE TAMANHO. Na v7.14 eram dois
        # (pequeno / grande), e no arroz isso juntava 2kg e 5kg na mesma
        # regua. Agora sao quantas classes o recorte tiver: a classe
        # MENOR fica com as reguas de cima e a MAIOR com as de baixo,
        # cada uma com o nº de reguas que o espaco dela pede. Dentro da
        # classe nao entra mais tamanho nenhum - manda o preco e a faixa
        # de marca de sempre.
        reguas_ord = sorted(reguas)
        por_classe = {}
        for it in normais:
            por_classe.setdefault(int(it.get("_classe") or 0), []).append(it)
        cls_blocos = [{"itens": por_classe[c],
                       "cm": sum(float(i["largura_cm"]) * fr_rest[str(i["ean"])]
                                 for i in por_classe[c])}
                      for c in sorted(por_classe)]
        # mais classes que reguas: as MENORES vao se juntando (as de
        # baixo, com o produto pesado, sao as que importam)
        while len(cls_blocos) > n_vert:
            cls_blocos[0:2] = [{
                "itens": cls_blocos[0]["itens"] + cls_blocos[1]["itens"],
                "cm": cls_blocos[0]["cm"] + cls_blocos[1]["cm"]}]

        # v7.22 - a reparticao saiu daqui pro fileira.py. Ate a v7.21
        # ela era em QUOTA DE REGUAS (proporcional, mais o ajuste de "a
        # classe maior nao recebe menos do que precisa", contado em
        # ceil(cm / largura da regua)). Com slots de larguras
        # diferentes, contar regua deixou de dizer alguma coisa: dar
        # duas reguas pra classe do sabao 5kg pode ser dar 260cm ou
        # 160cm. Agora a classe MAIOR pega slots de baixo ate a
        # CAPACIDADE SOMADA cobrir o que ela pede, e o resto sobe. O
        # criterio de altura (regua mais baixa QUE COMPORTA EM PE, da
        # v7.12) continua igual dentro do fileira.reparte_territorios.
        territorios = fl.reparte_territorios(cls_blocos, reguas_ord,
                                             largs, alturas)

        # monta da classe MENOR pra MAIOR, pra que as reguas de cima
        # sejam servidas primeiro
        faixas, blocos, terr_bloco = [], [], []
        for bl, reg in territorios:
            if not bl["itens"]:
                continue
            if not reg:              # ficou sem territorio: usa o que ha
                reg = reguas_ord
            bmarcas = _blocos_por_marca(bl["itens"], fr_rest)
            bmarcas = _fundir_ate(bmarcas, max(1, min(len(bmarcas), len(reg))))
            # dentro do territorio a fila vai da regua mais BAIXA de
            # altura pra mais alta (v7.12): a alta sobra pra quem precisa
            fila = sorted(reg, key=lambda s: (float(alturas[s]), s))
            # v7.39 - marcas pequenas vizinhas dividem regua pra sobrar
            # regua pra marca grande (antes ela transbordava pras outras)
            bmarcas = _fundir_pequenas(bmarcas, [largs[s] for s in fila])
            for bloco, k in zip(bmarcas,
                                fl.quotas_por_capacidade(
                                    bmarcas, [largs[s] for s in fila])):
                faixa = sorted(fila[:k])
                fila = fila[k:]
                blocos.append(bloco)
                faixas.append(faixa)
                terr_bloco.append(reg)
                if faixa:
                    _montar_faixa(bloco, fr_rest, prats, faixa, caps,
                                  usados, alturas)

        # repescagem: quem nao coube na propria faixa tenta as vizinhas
        _repescagem(blocos, faixas, fr_rest, prats, reguas, caps, usados,
                    alturas, terr_bloco, permitir_fora)

        # gigantes por ultimo -> ficam no canto direito da ultima regua
        for it, q in plano_gig:
            ean, w = str(it["ean"]), float(it["largura_cm"])
            if not _cabe_altura(it, ultima, alturas):
                continue
            for _ in range(q):
                if fr_rest[ean] <= 0:
                    break
                prats[ultima].append((it, 1))
                usados[ultima] += w
                fr_rest[ean] -= 1

        colocados = {str(it["ean"]) for sh in prats for it, _ in sh}
        faltaram = [e for e in fr if e not in colocados]
        return prats, faltaram

    # tenta montar; se alguem ficou de fora, corta frentes EXTRAS dos
    # SKUs mais fortes (maiores frentes) e tenta de novo, ate todos
    # caberem com pelo menos 1 frente ou nao dar mais pra cortar
    mapa_it = {str(it["ean"]): it for it in todos_itens}

    prats, faltaram = montar()
    guarda = 0
    while faltaram and guarda < 5000:
        # v7.12 - corta as frentes de quem REALMENTE nao entrou (em geral
        # o item alto, que so cabe em poucas reguas). So se ele ja estiver
        # com 1 frente e que abrimos espaco cortando de quem ocupa as
        # reguas onde ele caberia. Antes cortavamos sempre do maior do
        # recorte, o que derrubava as frentes de todo mundo e deixava
        # reguas inteiras vazias.
        cand = [e for e in faltaram if fr.get(e, 0) > 1]
        if not cand:
            uteis = set()
            for e in faltaram:
                it = mapa_it.get(e)
                if it is None:
                    continue
                for i in range(num_prat):
                    if _cabe_altura(it, i, alturas):
                        uteis.add(i)
            ocupantes = {str(it["ean"]) for i in uteis for it, _ in prats[i]}
            cand = [e for e in ocupantes if fr.get(e, 0) > 1]
        if not cand:
            cand = [e for e in fr if fr[e] > 1]
        if not cand:
            break   # ninguem tem extra pra cortar: gondola fisicamente cheia
        alvo = max(cand, key=lambda e: fr[e])
        fr[alvo] -= 1
        prats, faltaram = montar()
        guarda += 1

    # v7.20 - se mesmo cortando frentes alguem nao coube no proprio
    # territorio, ai sim vale quebrar a separacao por tamanho: ficar de
    # fora e pior que estar na regua errada. Sem isso o SKU iria pro
    # Banco - e ele TEM venda.
    modo_fora = False
    if faltaram:
        prats, faltaram = montar(permitir_fora=True)
        modo_fora = True     # v7.32 - o preenchimento remonta no mesmo modo

    # v7.19 - PREENCHIMENTO POR DELTA em QUALQUER regua. A v7.14 so
    # engordava a faixa da classe maior; agora vale pra todas, porque o
    # buraco pode cair em qualquer lugar - no lava roupas foi a REGUA 2,
    # com 53%. Acontece porque as frentes sao decididas antes do layout,
    # e o territorio e sempre em reguas INTEIRAS: uma classe que pede
    # 1,5 regua leva 2 e deixa meia vazia.
    # A regua mais vazia recebe frentes extras dos itens que JA estao
    # nela, escolhidos pelo DELTA (o mesmo peso do rateio: margem 40% /
    # venda 30% / qtde 30%), na forma peso/(frentes+1) - quem vende mais
    # e ainda tem poucas frentes leva primeiro. Cada tentativa REMONTA a
    # gondola inteira e so vale se as tres condicoes baterem: ninguem
    # ficou de fora, a ocupacao total SUBIU e nenhum item de classe maior
    # subiu de regua.
    def _ocup(ps):
        return sum(float(it["largura_cm"]) for sh in ps for it, _ in sh)

    eans_grandes = {e for e in fr if (mapa_it.get(e) or {}).get("_grande")}

    def _topo_grande(ps):
        """Regua mais ALTA ocupada por item de classe maior. O
        preenchimento nao pode piorar isso: sem essa trava, a frente
        extra que nao cabia na regua do grande vazava pela repescagem
        pra uma regua de cima e a farinha 5kg reaparecia no meio da
        gondola."""
        for s, sh in enumerate(ps):
            if any(str(it["ean"]) in eans_grandes for it, _ in sh):
                return s
        return num_prat

    def _delta(e):
        return float((mapa_it.get(e) or {}).get("peso") or 0.0)

    bloqueadas, guarda = set(), 0
    while not faltaram and guarda < 200:
        guarda += 1
        folgas = []
        for s in range(num_prat):
            # v7.32 - regua VAZIA tambem entra (antes era pulada, e a
            # gondola podia sair com uma regua inteira em 0%)
            if s in bloqueadas:
                continue
            livre = largs[s] - sum(float(it["largura_cm"])
                                   for it, _ in prats[s])
            if livre > 1e-6:
                folgas.append((livre, s))
        if not folgas:
            break
        folga, s = max(folgas)
        vistos, cand = set(), []
        # regua vazia nao tem "quem ja esta nela": os candidatos sao todos
        # os itens que cabem EM PE nela - o remonte decide onde a frente
        # extra vai parar, e a regua so conta se a ocupacao subir
        fonte = ([it for it, _ in prats[s]] if prats[s]
                 else [it for it in todos_itens if _cabe_altura(it, s, alturas)])
        for it in fonte:
            e = str(it["ean"])
            if e in vistos or float(it["largura_cm"]) > folga + 1e-6:
                continue
            vistos.add(e)
            cand.append(e)
        cand.sort(key=lambda e: _delta(e) / (fr[e] + 1), reverse=True)
        avancou = False
        for e in cand[:4 if prats[s] else 8]:   # tenta os melhores antes de desistir
            # v7.38 - tenta +1 ate +6 frentes. Item ESPELHADO em k
            # reguas so cresce de k em k (a sobra do espelho e cortada),
            # entao +1 sozinho nunca mudava nada e a regua ficava em 74%
            # (Arroz 5kg: 4 por regua em 3 reguas, cabiam 5)
            for inc in range(1, min(num_prat, 6) + 1):
                fr[e] += inc
                # v7.32 - remonta no MESMO modo da montagem final: se ela
                # so fechou soltando a repescagem (permitir_fora),
                # remontar sem isso dava "faltou alguem" em toda tentativa
                novos, falt2 = montar(permitir_fora=modo_fora)
                # v7.32 - regua VAZIA: o item de classe maior pode subir
                # ATE ela (e so ate ela)
                limite = _topo_grande(prats)
                if not prats[s]:
                    limite = min(limite, s)
                if (not falt2 and _ocup(novos) > _ocup(prats) + 1e-6
                        and _topo_grande(novos) >= limite):
                    prats, avancou = novos, True
                    break
                fr[e] -= inc
            if avancou:
                break
        if not avancou:
            bloqueadas.add(s)   # essa regua nao tem como encher

    # v7.39 - ACABAMENTO LOCAL: a sobra de cada regua vai pra frente
    # extra dos itens QUE JA ESTAO NELA, sem remontar a gondola (remontar
    # mudava os territorios e a tentativa era recusada). Como a frente
    # extra nao transborda mais pra faixa das outras marcas, e aqui que a
    # regua chega perto de 100% - cada uma com as proprias marcas.
    for s in range(num_prat):
        if not prats[s]:
            continue
        while True:
            livre = largs[s] - sum(float(it["largura_cm"])
                                   for it, _ in prats[s])
            cand = {}
            for it, _ in prats[s]:
                e = str(it["ean"])
                if float(it["largura_cm"]) <= livre + 1e-6 \
                        and _cabe_altura(it, s, alturas):
                    cand[e] = it
            if not cand:
                break
            e = max(cand, key=lambda x: _delta(x) / (fr.get(x, 1) + 1))
            it = cand[e]
            # entra colado nas outras frentes dele na regua
            pos = max(i for i, (x, _) in enumerate(prats[s])
                      if str(x["ean"]) == e)
            prats[s].insert(pos + 1, (it, 1))
            fr[e] = fr.get(e, 1) + 1

    for ean in faltaram:
        it = next((it for grupo in fita for it in grupo["itens"]
                   if str(it["ean"]) == ean), None)
        if it is not None:
            descartadas.append((it["ean"], it["descricao"], "gondola lotada"))

    return prats, descartadas


# ==========================================
# ESTADO DO PLANO (estrutura editavel na sessao)
# ==========================================
def build_prod_info(recorte_df):
    """Dicionario ean -> dados de exibicao/medida (uma linha por ean)."""
    d = recorte_df.copy()
    d["preco_medio"] = (d["venda"] / d["qtde"].replace(0, pd.NA)).fillna(0)
    info = {}
    for _, r in d.iterrows():
        # _s() sanea NaN/None dos campos texto: foto_url NULL no banco
        # vira NaN (que e "truthy") e derrubava o st.image do editor
        info[str(r["ean"])] = {
            "descricao": _s(r.get("descricao")) or str(r["ean"]),
            "marca": _s(r.get("marca")),
            "foto_url": _s(r.get("foto_url")),
            "largura_cm": r.get("largura_cm"),
            "altura_cm": r.get("altura_cm"),
            "profundidade_cm": r.get("profundidade_cm"),
            "codigo_erp": _s(r.get("codigo_erp")),
            # v7.21 - o editor precisa delas pra CRIAR a linha na
            # dim_produtos quando o item veio so da base de ativos
            "categoria": _s(r.get("categoria")),
            "subcategoria": _s(r.get("subcategoria")),
            "preco_medio": float(r["preco_medio"]),
        }
    return info


def ordem_padrao_recorte(recorte_df, col_nivel, escolhas):
    """Ordem DE CIMA PRA BAIXO das categorias quando ha mais de uma
    marcada. v7.36 - PRECO MEDIO (venda / qtde), mais cara em cima.
    Historico: a v7.33 usava tamanho (o menor em cima) e a v7.34 tamanho
    so com diferenca de 2x; nos dois casos o Sabao em Barra (R$ 8,81, o
    mais barato, que fica sempre na ultima regua) subia pro topo por ser
    pequeno. O "maior embaixo" continua valendo DENTRO de cada categoria.
    A pessoa ainda reordena pelo botao Subir na sidebar."""
    esc = list(escolhas)
    if recorte_df is None or recorte_df.empty or col_nivel not in recorte_df:
        return esc
    preco = {}
    for c in esc:
        x = recorte_df[recorte_df[col_nivel] == c]
        q = float(x["qtde"].sum()) if not x.empty else 0.0
        preco[c] = float(x["venda"].sum()) / q if q > 0 else 0.0
    return sorted(esc, key=lambda c: (-preco[c], c))


def niveis_por_categoria(recorte_df, col_nivel, ordem, slots):
    """Reparte as REGUAS entre as categorias, de cima pra baixo na
    `ordem`. Cada categoria leva pelo menos o que precisa pra mostrar 1
    frente de cada SKU e o resto vai pelo DELTA - o mesmo peso do rateio
    de frentes.
    v7.36 - a unidade passou a ser o SLOT (regua de UM modulo), nao mais o
    nivel inteiro da fileira. Os slots ja vem na ordem de leitura (de cima
    pra baixo, da esquerda pra direita), entao cada categoria e um trecho
    CONTINUO dessa ordem. Com 3 modulos, o Sabao em Pasta (3 SKUs, 31 cm)
    fica com UMA regua de um modulo em vez de uma regua inteira da
    fileira (390 cm so pra ele). Devolve {categoria: [indices]}."""
    n = len(slots)
    d = calcular_pesos(recorte_df.copy()) if not recorte_df.empty \
        else recorte_df
    larg_slot = fl.largura_tipica(slots) or 1.0
    minimo, share = [], []
    for c in ordem:
        x = d[d[col_nivel] == c]
        cm1 = float(x["largura_cm"].fillna(0).astype(float).sum())
        minimo.append(max(1, math.ceil(cm1 / larg_slot - 1e-6)))
        share.append(float(x["peso"].sum()) if not x.empty else 0.0)
    tot = sum(share) or 1.0
    share = [v / tot for v in share]
    k = len(ordem)
    if k > n:                                 # mais categoria que regua
        q = [1] * n + [0] * (k - n)
    else:
        q = list(minimo)
        while sum(q) > n:                     # aperta quem pediu mais
            i = max((j for j in range(k) if q[j] > 1),
                    key=lambda j: q[j] - share[j] * n)
            q[i] -= 1
        while sum(q) < n:                     # sobra vai pelo delta
            i = max(range(k), key=lambda j: share[j] * n - q[j])
            q[i] += 1
    res, pos = {}, 0
    for c, qc in zip(ordem, q):
        res[c] = list(range(pos, pos + qc))
        pos += qc
    return res


def semear_plano(recorte_df, slots, col_nivel=None, ordem=None):
    """v7.33 - com MAIS DE UMA categoria marcada, cada uma ganha REGUAS
    INTEIRAS so dela (nada se mistura), empilhadas na `ordem` de cima pra
    baixo, e o motor roda separado dentro de cada bloco. Com uma so,
    e exatamente o de sempre."""
    if (not ordem or len(ordem) < 2 or col_nivel is None
            or recorte_df is None or recorte_df.empty
            or col_nivel not in recorte_df):
        return _semear_bloco(recorte_df, slots)
    blocos = niveis_por_categoria(recorte_df, col_nivel, ordem, slots)
    shelves = [[] for _ in slots]
    fora, resumos = [], []
    for c in ordem:
        sub = recorte_df[recorte_df[col_nivel] == c]
        idx = blocos.get(c) or []
        if sub.empty:
            continue
        if not idx:
            fora += [{"ean": str(e), "motivo": f"sem régua pra {c}"}
                     for e in sub["ean"]]
            continue
        sh_b, fora_b, res_b = _semear_bloco(sub, [slots[i] for i in idx])
        for i, linha in zip(idx, sh_b):
            shelves[i] = linha
        fora += fora_b
        if res_b is not None and not res_b.empty:
            res_b = res_b.copy()
            res_b.insert(0, "Categoria", c)
            resumos.append(res_b)
    resumo = (pd.concat(resumos, ignore_index=True) if resumos
              else pd.DataFrame())
    return shelves, fora, resumo


def _semear_bloco(recorte_df, slots):
    """v7.38 - MARCA NAO SE ESPALHA ENTRE MODULOS (pedido do Adriano:
    Detergente em 2 modulos saia com Limpol e Ype nos dois, e o MESMO
    produto aparecendo na particao da esquerda e na da direita).

    Com o bloco ocupando mais de um modulo, os SKUs sao repartidos entre
    os modulos POR MARCA, da esquerda pra direita: a marca de maior delta
    primeiro, cada marca inteira num modulo enquanto couber. Marca maior
    que o espaco que sobra continua no modulo seguinte (encostada na
    emenda) - mas cada SKU fica num modulo so. Depois o motor de sempre
    roda dentro de cada modulo, entao o "maior embaixo", as faixas e o
    preenchimento valem modulo a modulo."""
    if recorte_df is None or recorte_df.empty:
        return _semear_um(recorte_df, slots)
    mods = sorted({int(sl["mod"]) for sl in slots})
    if len(mods) < 2:
        return _semear_um(recorte_df, slots)
    idx = {m: [i for i, sl in enumerate(slots) if int(sl["mod"]) == m]
           for m in mods}
    cap = {m: sum(float(slots[i]["larg"]) for i in idx[m]) for m in mods}
    d = calcular_pesos(recorte_df.copy())
    d["_marca"] = (d["marca"].fillna("").astype(str).str.strip()
                   if "marca" in d else "")
    d.loc[d["_marca"] == "", "_marca"] = "(sem marca)"
    larg = d["largura_cm"].astype(float).fillna(0.0)
    # espaco que cada SKU pede = as FRENTES que o motor daria a ele na
    # fileira inteira do bloco x a largura (o alocar ja limita o lider -
    # pelo delta puro, um SKU so ficava com um modulo inteiro)
    try:
        fita, _, _ = alocar(recorte_df, fl.larguras(slots),
                            fl.alturas(slots))
        fr = {str(it["ean"]): int(it["facings"])
              for g in fita for it in g["itens"]}
    except Exception:
        fr = {}
    d["_cm"] = [max(w, w * fr.get(str(e), 1))
                for w, e in zip(larg, d["ean"])]
    marcas = (d.groupby("_marca")["peso"].sum()
              .sort_values(ascending=False).index.tolist())

    destino, mi, usado = {}, 0, 0.0
    for mc in marcas:
        x = d[d["_marca"] == mc].sort_values(
            ["subcategoria", "peso"], ascending=[True, False]) \
            if "subcategoria" in d else d[d["_marca"] == mc]
        cm_marca = float(x["_cm"].sum())
        livre = cap[mods[mi]] - usado
        # marca inteira nao cabe no que sobrou, mas cabe no modulo
        # seguinte e este ja esta bem servido: comeca a marca la
        if (cm_marca > livre and mi < len(mods) - 1
                and cm_marca <= cap[mods[mi + 1]]
                and usado >= 0.6 * cap[mods[mi]]):
            mi, usado = mi + 1, 0.0
        for k, r in x.iterrows():
            if (usado + r["_cm"] > cap[mods[mi]] * 1.02
                    and usado > 0 and mi < len(mods) - 1):
                mi, usado = mi + 1, 0.0
            destino[k] = mods[mi]
            usado += float(r["_cm"])

    shelves = [[] for _ in slots]
    fora, resumos = [], []
    for m in mods:
        sub = recorte_df.loc[[k for k, v in destino.items() if v == m]]
        if sub.empty:
            continue
        sh_m, fora_m, res_m = _semear_um(sub, [slots[i] for i in idx[m]])
        for i, linha in zip(idx[m], sh_m):
            shelves[i] = linha
        fora += fora_m
        if res_m is not None and not res_m.empty:
            res_m = res_m.copy()
            res_m.insert(0, "Modulo", f"M{m + 1}")
            resumos.append(res_m)
    resumo = (pd.concat(resumos, ignore_index=True) if resumos
              else pd.DataFrame())
    return shelves, fora, resumo


def _semear_um(recorte_df, slots):
    """Roda o motor e devolve (shelves, fora, resumo).
    v7.22 - recebe a lista de SLOTS da fileira (fileira.montar_slots).
    Ate a v7.21 recebia a gondola e deduzia largura x nº de reguas."""
    largs, alturas = fl.larguras(slots), fl.alturas(slots)
    fita, resumo, excl = alocar(recorte_df, largs, alturas)
    prats, nao_coube = distribuir_prateleiras(fita, largs, alturas)
    excl += nao_coube
    # mescla frentes do mesmo SKU que ficaram lado a lado na prateleira
    shelves = []
    for prat in prats:
        linha = []
        for item, fac in prat:
            ean = str(item["ean"])
            if linha and linha[-1]["ean"] == ean:
                linha[-1]["frentes"] += int(fac)
            else:
                linha.append({"ean": ean, "frentes": int(fac)})
        shelves.append(linha)
    fora = [{"ean": str(e[0]), "motivo": e[2]} for e in excl]
    return shelves, fora, resumo


def ocupacao_cm(shelf, prod_info):
    cm = 0.0
    for e in shelf:
        larg = prod_info.get(e["ean"], {}).get("largura_cm")
        if larg is not None and pd.notna(larg):
            cm += float(larg) * int(e["frentes"])
    return cm


# ==========================================
# PERSISTENCIA (layout_planograma)
# ==========================================
def carregar_plano_salvo(loja, nivel, recorte, gondola, slots, larg_de=None):
    """v7.22 - le o arranjo salvo ja no formato de SLOTS.

    A tabela ganhou a coluna `modulo` (1-based). Linha ANTIGA (gravada
    ate a v7.21) nao tem essa coluna preenchida, e la `prateleira` era o
    indice da regua sobre a fileira INTEIRA, com os modulos emendados -
    entao ela e redistribuida pelos modulos com o fileira.espalhar_antigo
    (o item que estava em cima da emenda e quebrado por frente, sem
    perder nenhuma). `larg_de(ean)` da a largura de 1 frente em cm.

    Se a coluna `modulo` ainda nao existir no banco, o select falha e a
    funcao devolve None - o app cai no arranjo automatico em vez de
    quebrar, e o aviso do ALTER TABLE aparece na tela."""
    r = (get_supabase().table("layout_planograma").select("*")
         .eq("loja", loja).eq("nivel", nivel).eq("recorte", recorte)
         .eq("gondola", gondola)
         .order("prateleira").order("ordem").execute())
    if not r.data:
        return None
    n_reg = {}
    for i, sl in enumerate(slots):
        n_reg[(sl["mod"], sl["reg"])] = i
    shelves = [[] for _ in slots]
    antigas, fora, tem_modulo = {}, [], False
    for row in r.data:
        p = int(row["prateleira"])
        e = {"ean": str(row["ean"]), "frentes": int(row["frentes"])}
        if p == 0:
            fora.append({"ean": e["ean"], "motivo": "removido manualmente"})
            continue
        try:
            m = int(row.get("modulo") or 0)
        except (TypeError, ValueError):
            m = 0
        if m >= 1:
            tem_modulo = True
            i = n_reg.get((m - 1, p - 1))
            if i is not None:
                shelves[i].append(e)
        else:                       # linha anterior a v7.22
            antigas.setdefault(p - 1, []).append(e)
    if antigas:
        ant = [antigas.get(k, []) for k in range(max(antigas) + 1)]
        novas, sobra = fl.espalhar_antigo(ant, slots,
                                          larg_de or (lambda _e: 0.0))
        for i, linha in enumerate(novas):
            shelves[i].extend(linha)
        for e in sobra:
            fora.append({"ean": e["ean"], "motivo": "nao coube no modulo"})
    if not tem_modulo and not antigas and not fora:
        return None
    return shelves, fora


def salvar_plano(plan):
    """v7.22 - grava modulo + prateleira (a regua DENTRO do modulo).
    Requer:
        ALTER TABLE layout_planograma
          ADD COLUMN IF NOT EXISTS modulo int NOT NULL DEFAULT 1;

    v7.29 - TRAVA CONTRA SALVAR EM DOBRO (pedido do Adriano, depois de um
    caso real: a gondola "1,30m x 6" da categoria Achocolatados salvou
    CADA linha DUAS VEZES - toda a gondola veio duplicada, ocupacao deu
    184%). Causa: apagar e inserir de novo sao DUAS chamadas separadas
    pro Supabase; se o Salvar disparar duas vezes quase juntas (duplo
    clique, ou duas abas abertas na mesma categoria/gondola), as duas
    rodadas se intercalam - a 2a nao ve as linhas que a 1a acabou de
    inserir (cada uma so apaga o que ja existia ANTES de comecar) e
    acaba inserindo tudo de novo por cima.
    Agora o apagar+inserir roda dentro da funcao Postgres
    layout_planograma_substituir (rode a migracao antes de usar):
        ver: migracao "layout_planograma_substituir_atomico"
    Ela tranca por (loja, nivel, recorte, gondola) com
    pg_advisory_xact_lock - uma 2a chamada pra MESMA combinacao ESPERA a
    1a terminar (commitar) antes de comecar, entao ela enxerga o
    resultado da 1a e substitui limpo, sem duplicar.
    Se a funcao ainda nao existir no banco (antes de rodar a migracao),
    cai pro delete+insert de sempre - continua funcionando, so sem a
    trava."""
    rows = []
    slots = plan["slots"]
    for i, shelf in enumerate(plan["shelves"]):
        sl = slots[i]
        for ordem, e in enumerate(shelf):
            rows.append({"loja": plan["loja"], "nivel": plan["nivel"],
                         "recorte": plan["recorte"], "ean": e["ean"],
                         "modulo": int(sl["mod"]) + 1,
                         "prateleira": int(sl["reg"]) + 1, "ordem": ordem,
                         "frentes": int(e["frentes"]),
                         "gondola": plan["gondola"]})
    for ordem, item in enumerate(plan["fora"]):
        rows.append({"loja": plan["loja"], "nivel": plan["nivel"],
                     "recorte": plan["recorte"], "ean": item["ean"],
                     "modulo": 1,
                     "prateleira": 0, "ordem": ordem, "frentes": 0,
                     "gondola": plan["gondola"]})
    sb = get_supabase()
    try:
        sb.rpc("layout_planograma_substituir", {
            "p_loja": plan["loja"], "p_nivel": plan["nivel"],
            "p_recorte": plan["recorte"], "p_gondola": plan["gondola"],
            "p_rows": [{"modulo": r["modulo"], "prateleira": r["prateleira"],
                        "ordem": r["ordem"], "ean": r["ean"],
                        "frentes": r["frentes"]} for r in rows],
        }).execute()
    except Exception:
        # v7.22 (sem a trava v7.29) - migracao ainda nao rodada no banco
        (sb.table("layout_planograma").delete()
           .eq("loja", plan["loja"]).eq("nivel", plan["nivel"])
           .eq("recorte", plan["recorte"]).eq("gondola", plan["gondola"]).execute())
        for i in range(0, len(rows), 500):
            sb.table("layout_planograma").insert(rows[i:i + 500]).execute()


# ==========================================
# EDITOR DE PRODUTO (dois cliques no produto)
# ==========================================
def _f(v):
    """float seguro p/ JSON (NaN/None -> None)."""
    try:
        if v is None or pd.isna(v):
            return None
        return float(v)
    except Exception:
        return None


def _s(v):
    """string segura p/ JSON (NaN/None/nao-string -> '')."""
    return v if isinstance(v, str) else ""


def _tratar_foto(dados, remover_fundo=True):
    """Mesma receita do tirar_fundo_fotos.py, versao compacta:
    remove o fundo de estudio (so pixels ligados a borda) e corta na
    caixa dos pixels realmente opacos."""
    import numpy as np
    from PIL import Image, ImageFilter, ImageOps

    im = Image.open(io.BytesIO(dados))
    im = ImageOps.exif_transpose(im).convert("RGBA")

    if remover_fundo:
        from scipy import ndimage
        arr = np.asarray(im).astype(np.int16)
        rgb = arr[..., :3]
        borda = np.concatenate([rgb[:3].reshape(-1, 3), rgb[-3:].reshape(-1, 3),
                                rgb[:, :3].reshape(-1, 3), rgb[:, -3:].reshape(-1, 3)])
        fundo = np.median(borda, axis=0)
        dist = np.abs(rgb - fundo).sum(axis=2)
        rot, n = ndimage.label(dist <= TOLERANCIA)
        na_borda = (set(np.unique(rot[0])) | set(np.unique(rot[-1]))
                    | set(np.unique(rot[:, 0])) | set(np.unique(rot[:, -1])))
        na_borda.discard(0)
        if n and na_borda:
            tab = np.zeros(n + 1, dtype=bool)
            tab[list(na_borda)] = True
            a = np.asarray(im).copy()
            a[..., 3] = np.where(tab[rot], 0, a[..., 3])
            im = Image.fromarray(a)
            alpha = im.getchannel("A").filter(ImageFilter.GaussianBlur(1))
            im.putalpha(alpha)

    # corta na caixa: so pixels bem opacos, ignorando linha/coluna quase vazia
    a = np.asarray(im)
    op = a[..., 3] > LIMIAR_CAIXA
    if op.any():
        cols = np.where(op.mean(axis=0) >= FRACAO_MINIMA)[0]
        rows = np.where(op.mean(axis=1) >= FRACAO_MINIMA)[0]
        if len(cols) and len(rows):
            im = im.crop((int(cols[0]), int(rows[0]),
                          int(cols[-1]) + 1, int(rows[-1]) + 1))

    if im.width > 1200 or im.height > 1200:
        im.thumbnail((1200, 1200), Image.LANCZOS)

    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=85, method=4)
    return buf.getvalue()


@st.cache_data(show_spinner=False)
def tratar_foto_cache(dados: bytes, remover_fundo: bool) -> bytes:
    return _tratar_foto(dados, remover_fundo)


def _subir_foto(ean, dados):
    """Sobe pro bucket sobrescrevendo e devolve a URL publica com ?v= pra
    furar o cache do navegador."""
    sb = get_supabase()
    nome = f"{ean}.webp"
    storage = sb.storage.from_(BUCKET_FOTOS)
    try:
        storage.upload(nome, dados,
                       {"content-type": "image/webp", "x-upsert": "true"})
    except Exception:
        try:
            storage.remove([nome])
        except Exception:
            pass
        storage.upload(nome, dados, {"content-type": "image/webp"})
    base = st.secrets["supabase"]["url"].rstrip("/")
    return f"{base}/storage/v1/object/public/{BUCKET_FOTOS}/{nome}?v={int(time.time())}"


@st.dialog("\u270F\uFE0F Editar produto")
def dialog_editar(ean):
    info = st.session_state.prod_info.get(ean, {})
    st.markdown(f"**{info.get('descricao', ean)}**  \n"
                f"EAN `{ean}`" + (f" \u00b7 {info['marca']}" if info.get("marca") else ""))

    c1, c2 = st.columns([1, 2])
    with c1:
        foto = _s(info.get("foto_url")).strip()
        if foto.startswith("http"):
            try:
                st.image(foto, width=140, caption="foto atual")
            except Exception:
                st.caption("(nao consegui exibir a foto atual)")
        elif foto:
            st.caption("(foto do cadastro invalida - suba uma nova)")
        else:
            st.caption("(sem foto)")
    with c2:
        larg = st.number_input("Largura (cm)", 0.0, 500.0,
                               _f(info.get("largura_cm")) or 0.0, 0.1, format="%.1f")
        alt = st.number_input("Altura (cm)", 0.0, 500.0,
                              _f(info.get("altura_cm")) or 0.0, 0.1, format="%.1f")
        prof = st.number_input("Profundidade (cm)", 0.0, 500.0,
                               _f(info.get("profundidade_cm")) or 0.0, 0.1, format="%.1f")

    up = st.file_uploader("Trocar a foto (opcional)",
                          type=["png", "jpg", "jpeg", "webp"])
    tratar = st.checkbox("Remover fundo e cortar nas bordas", value=True,
                         help="Mesmo tratamento do pipeline do Simplus. "
                              "Desmarque se a foto ja estiver recortada "
                              "com fundo transparente.")
    dados_foto = None
    if up is not None:
        bruto = up.getvalue()
        try:
            dados_foto = tratar_foto_cache(bruto, tratar)
            ca, cb = st.columns(2)
            with ca:
                st.caption("Original")
                st.image(bruto, use_container_width=True)
            with cb:
                st.caption("Como vai ficar")
                st.image(dados_foto, use_container_width=True)
        except Exception as err:
            st.error(f"Nao consegui tratar a foto: {err}")
            dados_foto = None

    b1, b2 = st.columns(2)
    salvar = b1.button("\U0001F4BE Salvar", type="primary", use_container_width=True)
    cancelar = b2.button("Cancelar", use_container_width=True)

    if cancelar:
        st.session_state["editar_ean"] = None
        st.rerun()

    if salvar:
        try:
            novo = {"largura_cm": larg if larg > 0 else None,
                    "altura_cm": alt if alt > 0 else None,
                    "profundidade_cm": prof if prof > 0 else None}
            mudou_dim = any(
                (novo[k] is None) != (_f(info.get(k)) is None)
                or (novo[k] is not None
                    and abs(novo[k] - (_f(info.get(k)) or 0)) > 0.001)
                for k in novo)
            upd = {}
            if mudou_dim:
                upd.update(novo)
                upd["fonte_dimensao"] = "manual"
            if dados_foto is not None:
                upd["foto_url"] = _subir_foto(ean, dados_foto)
                upd["fonte_foto"] = "manual"
            if upd:
                # v7.21 - produto vindo da base de ativos ainda nao existe
                # na dim_produtos: o update nao pegaria linha nenhuma e a
                # medida se perderia calada. Nesse caso, cria a linha.
                sb = get_supabase()
                existe = bool(sb.table("dim_produtos").select("ean")
                              .eq("ean", ean).limit(1).execute().data)
                if existe:
                    sb.table("dim_produtos").update(upd) \
                        .eq("ean", ean).execute()
                else:
                    linha = dict(upd, ean=ean,
                                 descricao=info.get("descricao") or ean)
                    for k in ("marca", "categoria", "subcategoria",
                              "codigo_erp"):
                        if info.get(k):
                            linha[k] = info[k]
                    sb.table("dim_produtos").upsert(
                        linha, on_conflict="ean").execute()
                # reflete na sessao sem re-semear o arranjo
                pi = st.session_state.prod_info.setdefault(ean, {})
                if mudou_dim:
                    pi.update(novo)
                if "foto_url" in upd:
                    pi["foto_url"] = upd["foto_url"]
                st.cache_data.clear()
                st.session_state["edit_nonce"] = \
                    st.session_state.get("edit_nonce", 0) + 1
            st.session_state["editar_ean"] = None
            st.rerun()
        except Exception as err:
            st.error(f"Falha ao salvar: {err}")


# ==========================================
# CADASTRO DE ITEM NOVO (botao na sidebar)
# ==========================================
@st.cache_data(show_spinner=False)
def foto_cosmos(ean):
    """Tenta a foto no CDN do Cosmos (mesmo padrao dos ~10 mil produtos
    ja cadastrados). Devolve os bytes ou None."""
    import requests
    try:
        r = requests.get(f"https://cdn-cosmos.bluesoft.com.br/products/{ean}",
                         timeout=6)
        if r.ok and r.headers.get("content-type", "").startswith("image"):
            return r.content
    except Exception:
        pass
    return None


def _ler_barras(img_bytes):
    """Decodifica codigo de barras da foto (EAN/QR). Precisa de pyzbar
    no requirements + libzbar0 no packages.txt; sem eles devolve a
    string 'SEM_PYZBAR' pro dialogo avisar."""
    try:
        from pyzbar.pyzbar import decode
    except Exception:
        return "SEM_PYZBAR"
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(img_bytes))).convert("L")
    for tent in (im, im.resize((im.width * 2, im.height * 2))):
        for c in decode(tent):
            t = c.data.decode("utf-8", "ignore").strip()
            if t.isdigit():
                return t
    return None


NOVA_OPCAO = "-- nova (digitar) --"
SEM_ESCOLHA = "-- digitar ou ler o EAN --"


@st.dialog("\u2795 Cadastrar novo item")
def dialog_novo(opcoes_df, col_nivel, escolhas):
    st.caption("Pra produto com venda que nao aparece no quadro por nao "
               "existir na dim_produtos (ou estar sem categoria).")

    # ---- lista dos que tem venda e nao tem cadastro ----
    try:
        falt = carregar_faltantes()
    except Exception:
        falt = pd.DataFrame()
        st.info("View **layout_sem_cadastro** nao encontrada - rode o "
                "views_planograma.sql atualizado pra ver a lista dos "
                "EANs com venda e sem cadastro.")
    if not falt.empty:
        falt = falt.copy()
        falt["ean"] = falt["ean"].astype(str)
        rotulos = [f"{r.ean}  (venda R$ {r.venda:,.0f})".replace(",", ".")
                   for r in falt.itertuples()]
        mais = "+" if len(falt) == 500 else ""
        esc = st.selectbox(f"Com venda e sem cadastro ({len(falt)}{mais})",
                           [SEM_ESCOLHA] + rotulos)
        if esc != SEM_ESCOLHA:
            sug = esc.split()[0]
            if sug != st.session_state.get("ultima_sug"):
                st.session_state["ultima_sug"] = sug
                st.session_state["novo_ean"] = sug

    # ---- leitura por camera (opcional) ----
    with st.expander("\U0001F4F7 Ler codigo de barras com a camera"):
        foto_cod = st.camera_input("Aponte pro codigo de barras",
                                   key="cam_barras")
        if foto_cod is not None:
            lido = _ler_barras(foto_cod.getvalue())
            if lido == "SEM_PYZBAR":
                st.info("Pra ler pela camera, adicione **pyzbar** no "
                        "requirements.txt e **libzbar0** no packages.txt "
                        "(igual ao app de dimensoes) - ou digite o EAN "
                        "abaixo.")
            elif lido and lido != st.session_state.get("ultimo_lido"):
                st.session_state["ultimo_lido"] = lido
                st.session_state["novo_ean"] = lido
                st.success(f"Codigo lido: {lido}")
            elif not lido:
                st.warning("Nao achei codigo na foto - tente mais perto "
                           "e com mais luz.")

    ean = st.text_input("EAN / codigo interno", key="novo_ean",
                        max_chars=14).strip()

    fechar = st.empty()
    if not ean or not ean.isdigit() or len(ean) < 6:
        st.info("Escolha na lista, leia com a camera ou digite o codigo.")
        if fechar.button("Fechar", use_container_width=True):
            st.session_state["limpar_novo"] = True
            st.rerun()
        return

    # ---- ja existe? ----
    try:
        r = (get_supabase().table("dim_produtos").select("ean,descricao")
             .eq("ean", ean).execute())
        if r.data:
            st.warning(f"Esse EAN ja existe no cadastro: "
                       f"**{r.data[0].get('descricao') or ean}**. "
                       "Salvar aqui SOBRESCREVE - pra ajuste pontual, "
                       "prefira os dois cliques no produto.")
    except Exception:
        pass

    # ---- dados do produto ----
    desc = st.text_input("Descricao *")
    marca = st.text_input("Marca")
    cats = sorted(opcoes_df["categoria"].dropna().unique().tolist())
    cat_sel = st.selectbox("Categoria *", cats + [NOVA_OPCAO])
    if cat_sel == NOVA_OPCAO:
        categoria = st.text_input("Nova categoria *").strip()
        subs = []
    else:
        categoria = cat_sel
        subs = sorted(opcoes_df.loc[opcoes_df["categoria"] == cat_sel,
                                    "subcategoria"].dropna().unique().tolist())
    sub_sel = st.selectbox("SubCategoria *", subs + [NOVA_OPCAO])
    if sub_sel == NOVA_OPCAO:
        subcategoria = st.text_input("Nova subcategoria *").strip()
    else:
        subcategoria = sub_sel

    c1, c2, c3 = st.columns(3)
    larg = c1.number_input("Largura (cm)", 0.0, 500.0, 0.0, 0.1, format="%.1f")
    alt = c2.number_input("Altura (cm)", 0.0, 500.0, 0.0, 0.1, format="%.1f")
    prof = c3.number_input("Profund. (cm)", 0.0, 500.0, 0.0, 0.1, format="%.1f")
    st.caption("Sem medida o item vai pro Banco como 'sem dimensao' "
               "(da pra medir depois com dois cliques).")

    # ---- foto: propria ou do Cosmos ----
    up = st.file_uploader("Foto do produto (opcional)",
                          type=["png", "jpg", "jpeg", "webp"])
    dados_foto, usar_cosmos, cos = None, False, None
    if up is not None:
        tratar = st.checkbox("Remover fundo e cortar nas bordas", value=True)
        try:
            dados_foto = tratar_foto_cache(up.getvalue(), tratar)
            ca, cb = st.columns(2)
            with ca:
                st.caption("Original")
                st.image(up.getvalue(), use_container_width=True)
            with cb:
                st.caption("Como vai ficar")
                st.image(dados_foto, use_container_width=True)
        except Exception as err:
            st.error(f"Nao consegui tratar a foto: {err}")
            dados_foto = None
    else:
        cos = foto_cosmos(ean)
        if cos:
            cc1, cc2 = st.columns([1, 2])
            with cc1:
                st.image(cos, width=120, caption="achada no Cosmos")
            with cc2:
                usar_cosmos = st.checkbox("Usar essa foto do Cosmos",
                                          value=True)

    # ---- salvar ----
    b1, b2 = st.columns(2)
    if b1.button("\U0001F4BE Cadastrar", type="primary",
                 use_container_width=True):
        if not desc.strip() or not categoria or not subcategoria:
            st.error("Preencha descricao, categoria e subcategoria.")
        else:
            try:
                row = {"ean": ean, "descricao": desc.strip(),
                       "marca": marca.strip() or None,
                       "categoria": categoria, "subcategoria": subcategoria,
                       "largura_cm": larg if larg > 0 else None,
                       "altura_cm": alt if alt > 0 else None,
                       "profundidade_cm": prof if prof > 0 else None}
                if larg > 0 or alt > 0 or prof > 0:
                    row["fonte_dimensao"] = "manual"
                if dados_foto is not None:
                    row["foto_url"] = _subir_foto(ean, dados_foto)
                    row["fonte_foto"] = "manual"
                elif usar_cosmos and cos:
                    row["foto_url"] = ("https://cdn-cosmos.bluesoft.com.br"
                                       f"/products/{ean}")
                    row["fonte_foto"] = "cosmos"
                get_supabase().table("dim_produtos") \
                    .upsert(row, on_conflict="ean").execute()

                # se e do recorte aberto, ja aparece no Banco sem
                # perder as edicoes nao salvas do arranjo
                pertence = (categoria if col_nivel == "categoria"
                            else subcategoria) in escolhas
                if pertence and "plan" in st.session_state:
                    plan = st.session_state.plan
                    presentes = ({e["ean"] for sh in plan["shelves"]
                                  for e in sh}
                                 | {i["ean"] for i in plan["fora"]})
                    if ean not in presentes:
                        plan["fora"].append({"ean": ean,
                                             "motivo": "novo cadastro"})
                    st.session_state.prod_info[ean] = {
                        "descricao": desc.strip(), "marca": marca.strip(),
                        "foto_url": row.get("foto_url", ""),
                        "largura_cm": row["largura_cm"],
                        "altura_cm": row["altura_cm"],
                        "profundidade_cm": row["profundidade_cm"],
                        "codigo_erp": "",
                        "preco_medio": 0.0}
                    st.session_state["msg_novo"] = \
                        f"{desc.strip()} cadastrado - ta no Banco/Fora."
                else:
                    st.session_state["msg_novo"] = \
                        (f"{desc.strip()} cadastrado - aparece ao abrir "
                         f"'{subcategoria}'.")
                st.cache_data.clear()
                st.session_state["edit_nonce"] = \
                    st.session_state.get("edit_nonce", 0) + 1
                st.session_state["limpar_novo"] = True
                st.rerun()
            except Exception as err:
                st.error(f"Falha ao cadastrar: {err}")
    if b2.button("Cancelar", use_container_width=True):
        st.session_state["limpar_novo"] = True
        st.rerun()


# ==========================================
# RENDER ESTATICO (para imprimir - mesmo visual do canvas)
# ==========================================
def _occ_estilo(pct):
    """v7.40 - semaforo: estourou / cheia / media / vazia demais."""
    if pct > 1.001:
        return "background:#7f0000;color:#fff"
    if pct >= 0.9:
        return "background:#2e7d32;color:#fff"
    if pct >= 0.7:
        return "background:#ffd54f;color:#5d4000"
    if pct <= 0:
        return "background:rgba(255,255,255,.22);color:#fff"
    return "background:#e53935;color:#fff"


def _esc(v):
    """Escapa texto pra atributo/conteudo HTML (descricao com aspas ou <
    quebrava o title do tooltip e o HTML exportado)."""
    return (str(v).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def _dim_txt(info):
    larg, alt = _f(info.get("largura_cm")), _f(info.get("altura_cm"))
    if larg is None or alt is None:
        return "sem dimensao"
    prof = _f(info.get("profundidade_cm"))
    t = f"{larg:.1f} x {alt:.1f}"
    if prof is not None:
        t += f" x {prof:.1f}"
    return t + " cm (LxAxP)"


def _bloco_produto(e, prod_info, esc):
    """Uma frente (ou N) do produto, do jeito que sai no canvas."""
    info = prod_info.get(e["ean"], {})
    larg, alt = info.get("largura_cm"), info.get("altura_cm")
    if larg is None or pd.isna(larg) or alt is None or pd.isna(alt):
        return ""
    fac = int(e["frentes"])
    cod = _s(info.get("codigo_erp"))
    titulo = _esc((f'Cod ERP: {cod} | ' if cod else '')
                  + f'{info.get("descricao", e["ean"])} | '
                  f'R$ {info.get("preco_medio", 0):.2f} | '
                  f'{fac} frente(s) | {_dim_txt(info)}')
    w = int(float(larg) * esc)
    h = int(float(alt) * esc)
    foto = info.get("foto_url") or ""
    if foto:
        bloco = (f'<img src="{foto}" title="{titulo}" '
                 f'style="width:{w}px;height:{h}px;object-fit:contain;'
                 'background:transparent;border:none;display:block">')
    else:
        bloco = (f'<div title="{titulo}" style="width:{w}px;height:{h}px;'
                 f'background:#fdf0dd;border:1px dashed {LARANJA};'
                 'box-sizing:border-box;'
                 'font:9px sans-serif;color:#a35708;overflow:hidden;'
                 'display:flex;align-items:center;justify-content:center;'
                 'text-align:center">'
                 f'{_esc(str(info.get("descricao", ""))[:18])}</div>')
    return bloco * fac


def desenhar(plan, prod_info):
    """v7.22 - desenha UMA COLUNA POR MODULO, separadas por montante.

    Ate a v7.21 a fileira era uma regua longa so, com o montante
    desenhado como listra de fundo de X em X centimetros. Agora cada
    modulo tem a largura e o nº de reguas dele, entao vira coluna
    propria.

    ALINHAMENTO: os modulos sao encostados no CHAO (align-items:flex-end)
    e o modulo com MENOS reguas ganha um espacador em cima. Assim a
    tarja laranja continua exatamente como sempre foi - nao precisou
    entrar na altura da regua - e mesmo assim os pisos batem."""
    esc = float(plan.get("escala", ESCALA))
    slots = plan["slots"]
    alturas = fl.alturas(slots)
    grupos = fl.por_modulo(slots)
    # a tarja (16px) + o respiro (10px) somam fora da altura fisica; o
    # modulo com menos reguas leva menos overhead, entao a diferenca
    # vira espacador no TOPO dele
    over = 26
    altura_px = [int(sum(alturas[i] for i in g) * esc) + over * len(g)
                 for g in grupos]
    alvo = max(altura_px) if altura_px else 0

    upright = ('<div style="width:12px;background-color:#a6abb0;'
               'border-radius:2px;background-image:repeating-linear-gradient('
               'to bottom,#7d8288 0 3px,rgba(0,0,0,0) 3px 14px);'
               'background-size:4px 14px;background-position:center 8px;'
               'background-repeat:repeat-y"></div>')
    html = ['<div style="display:inline-block;background:#eef0f2;'
            'padding:14px;border-radius:10px">',
            '<div style="display:flex;align-items:flex-end">',
            upright]
    for m, g in enumerate(grupos):
        larg_m = float(slots[g[0]]["larg"]) if g else 0.0
        W = int(larg_m * esc)
        folga = alvo - altura_px[m]
        html.append('<div style="background:#fff;padding:8px 4px 4px;'
                    'display:flex;flex-direction:column">')
        if folga > 0:
            html.append(f'<div style="height:{folga}px"></div>')
        html.append(f'<div style="font:600 9px sans-serif;color:#9aa0a6;'
                    f'padding:0 0 2px 2px">M{m + 1} \u00b7 '
                    f'{larg_m:g} cm</div>')
        for pos, i in enumerate(g):
            shelf = plan["shelves"][i]
            cm = ocupacao_cm(shelf, prod_info)
            pct = cm / larg_m if larg_m else 0
            topo = " (topo)" if pos == 0 else ""
            H = int(float(alturas[i]) * esc)
            # cada regua + tarja num wrapper: na impressao ele leva
            # break-inside:avoid, pra nao partir no meio da folha
            html.append('<div class="mp-linha">')
            html.append(
                f'<div style="width:{W}px;height:{H}px;background:#fff;'
                'display:flex;align-items:flex-end;overflow:hidden">')
            for e in shelf:
                html.append(_bloco_produto(e, prod_info, esc))
            html.append('</div>')
            html.append(
                f'<div style="width:{max(20, W - 16)}px;height:16px;'
                f'background:{LARANJA};'
                'color:#fff;display:flex;align-items:center;'
                'justify-content:space-between;padding:0 8px;'
                'font:600 10px sans-serif;border-radius:2px;margin:0 0 10px">'
                f'<span>R{pos + 1}{topo} \u00b7 {alturas[i]:g} cm</span>'
                f'<span style="padding:0 6px;border-radius:8px;'
                f'font-weight:600;'
                f'{_occ_estilo(pct)}">{cm:.0f}/{larg_m:.0f} cm '
                f'({pct:.0%})</span></div>')
            html.append('</div>')
        html.append(f'<div style="width:{W}px;height:12px;background:#8d9297;'
                    'border-radius:2px"></div>')
        html.append('</div>')
        html.append(upright)
    html.append('</div></div>')
    return "".join(html)


def _slug(txt):
    """Nome de arquivo seguro."""
    fora = ' /\\:*?"<>|,+'
    s = "".join("_" if c in fora else c for c in str(txt))
    while "__" in s:
        s = s.replace("__", "_")
    return s.strip("_")[:70] or "planograma"


# papel -> (regra @page, largura util em px @96dpi com margem de 8mm)
# SEMPRE RETRATO (decisao do Adriano): em retrato sobra altura, entao as
# 4-5 reguas da gondola caem numa folha so; o A3 existe pra fileira longa
# (varios modulos), onde o A4 obrigaria uma escala ilegivel.
PAPEL_PADRAO = "A4 retrato"
PAPEIS = {   # nome -> (regra @page, largura util px, altura util px)
    "A4 retrato": ("A4 portrait", 733, 1062),
    "A3 retrato": ("A3 portrait", 1062, 1527),
}
ALTURA_CABECALHO_PX = 130   # titulo + subtitulo + cards de metrica
TARJA_PX = 26               # tarja laranja da regua + respiro entre reguas


def escala_impressao(slots, papel, uma_folha=True):
    """px por cm da impressao. Sempre cabe na LARGURA da folha; com
    uma_folha=True tambem cabe na ALTURA, pra fileira inteira sair numa
    folha so (em retrato normalmente sobra altura pras 4-5 reguas).

    v7.22 - a largura e a SOMA das larguras dos modulos e a altura e a da
    coluna mais alta (a que tem mais reguas leva mais tarja)."""
    _, larg_util, alt_util = PAPEIS.get(papel, PAPEIS[PAPEL_PADRAO])
    grupos = fl.por_modulo(slots)
    alt = fl.alturas(slots)
    larg_total = sum(float(slots[g[0]]["larg"]) for g in grupos if g)
    # cada modulo tem montante e respiro proprios (~20px)
    esc = int((larg_util - 20 * len(grupos)) // max(1.0, larg_total or 100))
    if uma_folha and grupos:
        soma = max(sum(alt[i] for i in g) for g in grupos)
        n = max(len(g) for g in grupos)
        disp = alt_util - ALTURA_CABECALHO_PX - n * TARJA_PX - 30
        if disp > 0 and soma > 0:
            esc = min(esc, int(disp // soma))
    return max(1, min(10, esc))


def doc_impressao(plan, prod_info, titulo, subtitulo, metricas,
                  papel=PAPEL_PADRAO, uma_folha=True):
    """Pagina HTML autocontida com o quadro da gondola, pronta pro
    'Salvar como PDF' do navegador.

    IMPORTANTE (bug corrigido): a versao anterior desenhava grande e
    encaixava na folha com transform:scale() calculado em JS. Nao
    funciona - o transform nao muda o box do elemento no fluxo e, na
    impressao, o Chrome remonta o layout com a largura da folha e
    empurra o quadro pra folha seguinte (saia 1 pagina em branco). Agora
    a escala ja sai PRONTA do Python, em px por cm, dimensionada pela
    largura util do papel escolhido - nada de transform, nada de medir
    a tela. O marcador /*AUTO*/ e trocado no clique do botao Imprimir;
    no HTML baixado ele fica quieto, sem abrir o dialogo sozinho."""
    css_page = PAPEIS.get(papel, PAPEIS[PAPEL_PADRAO])[0]
    esc = escala_impressao(plan["slots"], papel, uma_folha)
    p = dict(plan)
    p["escala"] = esc
    corpo = desenhar(p, prod_info)
    cards = "".join(f'<div class="mt">{_esc(r)}<b>{_esc(v)}</b></div>'
                    for r, v in metricas)
    titulo, subtitulo = _esc(titulo), _esc(subtitulo)
    return f"""<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>{titulo}</title>
<style>
 html,body{{margin:0;padding:0;background:#fff}}
 body{{font:13px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       color:#222;padding:14px}}
 h1{{font-size:17px;margin:0 0 2px;color:{AZUL_MOLI}}}
 .sub{{font-size:12px;color:#666;margin:0 0 10px}}
 .mts{{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}}
 .mt{{border:1px solid #dfe3e6;border-radius:6px;padding:4px 10px;
      font-size:10px;color:#666}}
 .mt b{{display:block;font-size:15px;color:#222}}
 .barra{{margin:0 0 14px}}
 .barra button{{background:{LARANJA};color:#fff;border:0;border-radius:6px;
   padding:8px 16px;font:600 13px inherit;cursor:pointer}}
 .barra span{{font-size:11px;color:#777;margin-left:10px}}
 @page{{size:{css_page};margin:8mm}}
 @media print{{
   .barra{{display:none}}
   body{{padding:0}}
   h1,.sub,.mts{{break-after:avoid;page-break-after:avoid}}
   .mp-linha{{break-inside:avoid;page-break-inside:avoid}}
   *{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
 }}
</style></head><body>
<div class="barra"><button onclick="imprimir()">Imprimir / Salvar em PDF</button>
<span>Papel: {_esc(papel)} &middot; escala {esc} px/cm. No dialogo, marque
"Graficos de fundo" pra sair com as cores, orientacao Retrato e escala 100%.
</span></div>
<h1>{titulo}</h1><p class="sub">{subtitulo}</p>
<div class="mts">{cards}</div>
{corpo}
<script>
function esperarFotos(){{
  var pend=[].slice.call(document.images).filter(function(i){{return !i.complete}});
  return Promise.all(pend.map(function(i){{
    return new Promise(function(r){{i.onload=i.onerror=r; setTimeout(r,6000)}});
  }}));
}}
function imprimir(){{
  esperarFotos().then(function(){{setTimeout(function(){{window.print()}},200)}});
}}
/*AUTO*/
</script></body></html>"""


def bloco_exportar(plan, prod_info, titulo, subtitulo, metricas, nome,
                   papel=PAPEL_PADRAO, uma_folha=True):
    """Dois botoes: abre a pagina de impressao (com o dialogo do
    navegador ja aberto) ou baixa o HTML autocontido pra arquivar."""
    doc = doc_impressao(plan, prod_info, titulo, subtitulo, metricas, papel,
                        uma_folha)
    # </script> dentro da string quebraria o <script> de fora
    doc_js = json.dumps(doc).replace("</", "<\\/")
    components.html(f"""
<style>
 .bt{{background:{LARANJA};color:#fff;border:0;border-radius:6px;
      padding:8px 15px;font:600 13px system-ui,sans-serif;cursor:pointer}}
 .bt.sec{{background:#fff;color:#444;border:1px solid #cfd4d8}}
 .bt:hover{{filter:brightness(.94)}}
 .av{{font:12px system-ui,sans-serif;color:#b71c1c;margin-top:8px}}
</style>
<div style="display:flex;gap:8px;align-items:center">
  <button class="bt" id="imp">\U0001F5A8\uFE0F Imprimir / Salvar em PDF</button>
  <button class="bt sec" id="bx">\u2B07\uFE0F Baixar HTML</button>
</div>
<div class="av" id="av"></div>
<script>
var DOC = {doc_js};
var NOME = {json.dumps(nome)};
document.getElementById('imp').onclick = function(){{
  var w = window.open('', '_blank');
  if (!w) {{
    document.getElementById('av').textContent =
      'O navegador bloqueou a janela nova. Libere o pop-up deste site '
      + 'ou use "Baixar HTML" e abra o arquivo pra imprimir.';
    return;
  }}
  w.document.open();
  w.document.write(DOC.replace('/*AUTO*/', 'setTimeout(imprimir,250);'));
  w.document.close();
}};
document.getElementById('bx').onclick = function(){{
  var b = new Blob([DOC], {{type:'text/html;charset=utf-8'}});
  var a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = NOME + '.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){{URL.revokeObjectURL(a.href)}}, 4000);
}};
</script>""", height=95)


# ==========================================
# EDICAO V4 (canvas drag-and-drop com as fotos)
# ==========================================
_DND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gondola_dnd")
if os.path.isdir(_DND_DIR):
    _gondola_dnd = components.declare_component("gondola_dnd", path=_DND_DIR)
else:
    _gondola_dnd = None


def reencaixar_slots(plan, slots, larg_de=None):
    """v7.22 - substitui o ajustar_reguas. Quando a configuracao dos
    modulos muda na sidebar (largura, nº de reguas ou altura), a fileira
    ganha outro conjunto de SLOTS; este reencaixe leva o que ja estava
    montado pro slot de mesmo (modulo, regua) - sem re-semear e sem
    perder os arrastos.

    v7.23 - APARA O QUE NAO CABE MAIS. A primeira versao so movia as
    reguas de lugar e nao reconferia a LARGURA: quem baixava o modulo 2
    de 1,30m pra 1,00m ficava com os mesmos 127cm de produto numa regua
    de 100 - a tarja acusava 127% e a ocupacao total passava de 100.
    Agora, ao estreitar, as frentes que sobram sao cortadas do FIM da
    regua (a direita, que e o lado que "cai" da gondola); o SKU que
    perde TODAS as frentes vai pro Banco em vez de sumir. Quem tem so 1
    frente e nao cabe tambem vai pro Banco.

    `larg_de(ean)` devolve a largura de 1 frente em cm."""
    larg_de = larg_de or (lambda _e: 0.0)
    antigo = {(sl["mod"], sl["reg"]): i
              for i, sl in enumerate(plan.get("slots") or [])}
    novas = [[] for _ in slots]
    usados = set()
    cortados = 0
    for i, sl in enumerate(slots):
        j = antigo.get((sl["mod"], sl["reg"]))
        if j is None or j >= len(plan["shelves"]):
            continue
        usados.add(j)
        cap, cheio = float(sl["larg"]), 0.0
        for e in plan["shelves"][j]:
            try:
                w = float(larg_de(e["ean"]) or 0.0)
            except (TypeError, ValueError):
                w = 0.0
            if w <= 0:                      # sem dimensao: nao da pra medir
                plan["fora"].append({"ean": e["ean"],
                                     "motivo": "sem dimensao"})
                cortados += 1
                continue
            cabem = int((cap - cheio + 1e-6) // w)
            if cabem <= 0:
                plan["fora"].append({"ean": e["ean"],
                                     "motivo": "nao cabe no modulo"})
                cortados += 1
                continue
            n = min(cabem, int(e["frentes"]))
            novas[i].append({"ean": e["ean"], "frentes": n})
            cheio += n * w
    for j, shelf in enumerate(plan["shelves"]):
        if j in usados:
            continue
        for e in shelf:
            plan["fora"].append({"ean": e["ean"], "motivo": "regua removida"})
            cortados += 1
    plan["shelves"] = novas
    plan["slots"] = slots
    plan["num_prat"] = len(slots)
    plan["alturas"] = fl.alturas(slots)
    plan["largura_prat"] = fl.capacidade(slots)
    return cortados


def _estado_plan(plan):
    """v7.41 - foto do arranjo (reguas + Banco) pra comparar e desfazer."""
    return json.dumps([plan.get("shelves", []), plan.get("fora", [])],
                      sort_keys=True)


def montar_payload(plan, prod_info, rev, edita=True, ajusta_alt=True,
                   titulo="", vazia=False):
    produtos = {}
    eans = ({e["ean"] for sh in plan["shelves"] for e in sh}
            | {i["ean"] for i in plan["fora"]})
    for ean in eans:
        info = prod_info.get(ean, {})
        produtos[ean] = {"desc": _s(info.get("descricao")) or str(ean),
                         "foto": _s(info.get("foto_url")),
                         "larg": _f(info.get("largura_cm")),
                         "alt": _f(info.get("altura_cm")),
                         "prof": _f(info.get("profundidade_cm")),
                         "cod_erp": _s(info.get("codigo_erp")),
                         # v7.40 - pro "Colorir por" do canvas
                         "marca": _s(info.get("marca")),
                         "sub": _s(info.get("subcategoria")),
                         "preco": _f(info.get("preco_medio")) or 0.0}
    slots = plan["slots"]
    alturas = fl.alturas(slots)
    return json.dumps({
        # v7.22 - "slots" e o que o index.html novo consome: uma entrada
        # por modulo x regua, na mesma ordem de plan["shelves"]. Os
        # campos antigos continuam indo pra nao quebrar um index.html
        # desatualizado em cache do navegador.
        "slots": [{"mod": int(sl["mod"]), "reg": int(sl["reg"]),
                   "larg": float(sl["larg"]), "alt": float(sl["alt"]),
                   "y": float(sl["y"])} for sl in slots],
        "largura": float(max([sl["larg"] for sl in slots] or [130.0])),
        "altura": float(plan.get("altura_prat") or (alturas[0] if alturas
                                                    else 40.0)),
        "alturas": [float(a) for a in alturas],
        "modulo": float(max([sl["larg"] for sl in slots] or [130.0])),
        "escala": float(plan.get("escala", ESCALA)),
        "edita": bool(edita),
        # v7.24 - alca de altura da regua, separada do "edita": o
        # perfil USUARIO tambem arrasta a tarja; so a edicao de
        # dimensao/foto (dois cliques) segue exclusiva do admin.
        "ajusta_alt": bool(ajusta_alt),
        "rev": rev,
        "shelves": [[{"ean": e["ean"], "frentes": int(e["frentes"])} for e in sh]
                    for sh in plan["shelves"]],
        "fora": [{"ean": i["ean"], "motivo": i.get("motivo", "")}
                 for i in plan["fora"]],
        "produtos": produtos,
        # v7.40 - placa do topo da gondola e mensagem da tela vazia
        "titulo": str(titulo or ""),
        "vazia": bool(vazia),
    }, allow_nan=False)


def aplicar_retorno(plan, val, num_prat):
    shelves = [[] for _ in range(num_prat)]
    for s, sh in enumerate(val.get("shelves", [])[:num_prat]):
        for e in sh:
            fr = max(1, int(e.get("frentes", 1)))
            shelves[s].append({"ean": str(e["ean"]), "frentes": fr})
    fora = [{"ean": str(i["ean"]),
             "motivo": i.get("motivo") or "removido manualmente"}
            for i in val.get("fora", [])]
    plan["shelves"], plan["fora"] = shelves, fora


def salvar_alturas_gondola(nome_gondola, alturas):
    """Grava a coluna alturas_cm da layout_gondolas (v7.12)."""
    (get_supabase().table("layout_gondolas")
     .update({"alturas_cm": texto_alturas(alturas)})
     .eq("nome", nome_gondola).execute())


def _reparte_altura_nreg(g_nome, m, alt_cad):
    """v7.35 - callback do "N de reguas": a gondola tem ALTURA FIXA (o que
    muda na loja e quantas reguas cabem nela), entao ao por ou tirar
    regua a altura somada do modulo se mantem e e repartida IGUAL entre
    as reguas novas (cm inteiro; o resto vai pras de baixo). Roda antes
    do rerun, quando os campos de altura ainda nao existem na rodada."""
    ss = st.session_state
    novo = int(ss.get(f"mr_{g_nome}_{m}") or 1)
    velho = int(ss.get(f"mrprev_{g_nome}_{m}") or len(alt_cad) or novo)
    if novo == velho or novo < 1:
        return
    total = 0.0
    for i in range(velho):
        base = float(alt_cad[i] if i < len(alt_cad) else alt_cad[-1])
        total += float(ss.get(f"ma_{g_nome}_{m}_{i}", base))
    cada = int(total // novo)
    resto = int(round(total - cada * novo))
    for i in range(novo):
        extra = 1 if i >= novo - resto else 0      # sobra vai pras de baixo
        ss[f"ma_{g_nome}_{m}_{i}"] = float(max(5, cada + extra))
    for i in range(novo, 12):
        ss.pop(f"ma_{g_nome}_{m}_{i}", None)


def editor_modulos(g_nome, g, n_mod, eh_admin):
    """v7.22 - BLOCO DE MODULOS da sidebar: largura e nº de reguas de
    CADA modulo, digitados na hora (decisao do Adriano), mais as alturas
    de cada regua.

    A gondola selecionada vira o MOLDE: e dela que saem os valores
    iniciais (largura_cm, num_prateleiras e a coluna alturas_cm). Dai em
    diante cada modulo e livre - da pra ter 1,30m x5, 1,00m x4 e 0,60m
    x5 na mesma fileira, com a altura total batendo.

    As chaves de sessao levam o nome da gondola, entao trocar de gondola
    volta pros valores do cadastro em vez de arrastar a composicao
    anterior. Devolve a lista `mods` que o fileira.py consome."""
    larg_cad = float(g["largura_cm"])
    n_cad = int(g["num_prateleiras"])
    alt_cad = alturas_da_gondola(g, n_cad)
    mods = []
    for m in range(int(n_mod)):
        if n_mod > 1:
            st.markdown(f'<div style="font:600 11px system-ui,sans-serif;'
                        f'color:{AZUL_SIDEBAR_TXT};margin:6px 0 -6px">'
                        f'M\u00f3dulo {m + 1}</div>',
                        unsafe_allow_html=True)
        c1, c2 = st.columns(2)
        larg = c1.number_input("Largura (cm)", 20.0, 600.0, larg_cad, 5.0,
                               format="%.0f", key=f"mw_{g_nome}_{m}",
                               help="Largura util deste modulo. O produto "
                                    "nao atravessa a emenda pro vizinho.")
        nreg = int(c2.number_input("N\u00ba de r\u00e9guas", 1, 12, n_cad, 1,
                                   key=f"mr_{g_nome}_{m}",
                                   on_change=_reparte_altura_nreg,
                                   args=(g_nome, m, alt_cad),
                                   help="Mudou o n\u00famero de r\u00e9guas: "
                                        "a altura do m\u00f3dulo continua a "
                                        "mesma (repartida igual entre elas) "
                                        "e os produtos s\u00e3o remontados."))
        st.session_state[f"mrprev_{g_nome}_{m}"] = nreg
        alturas = []
        for i in range(nreg):
            base = float(alt_cad[i] if i < len(alt_cad) else alt_cad[-1])
            alturas.append(st.session_state.get(f"ma_{g_nome}_{m}_{i}", base))
        mods.append({"largura": float(larg), "alturas": alturas})

    with st.expander("\U0001F4CF Altura das r\u00e9guas"):
        st.caption("Da r\u00e9gua 1 (topo) at\u00e9 a de baixo, em cm. As "
                   "r\u00e9guas se apoiam no CH\u00c3O: se um m\u00f3dulo "
                   "somar menos altura que o outro, a folga fica em cima.")
        for m, mod in enumerate(mods):
            if n_mod > 1:
                st.markdown(f'<div style="font:600 11px system-ui,sans-serif;'
                            f'color:{AZUL_SIDEBAR_TXT};margin:8px 0 0">M\u00f3dulo '
                            f'{m + 1} \u00b7 {mod["largura"]:g} cm</div>',
                            unsafe_allow_html=True)
            novas = []
            for i in range(len(mod["alturas"])):
                base = float(mod["alturas"][i])
                rot = f"R\u00e9gua {i + 1}" + (" (topo)" if i == 0 else "")
                novas.append(st.number_input(rot, 5.0, 300.0, base, 1.0,
                                             format="%.0f",
                                             key=f"ma_{g_nome}_{m}_{i}"))
            mod["alturas"] = [float(a) for a in novas]
            st.caption(f"Altura somada: **{sum(novas):.0f} cm** em "
                       f"{len(novas)} r\u00e9guas")
        somas = {round(sum(mo["alturas"]), 1) for mo in mods}
        if len(somas) > 1:
            st.warning("Os m\u00f3dulos n\u00e3o somam a mesma altura "
                       f"({', '.join(f'{v:g}' for v in sorted(somas))} cm). "
                       "Os pisos continuam alinhados; a sobra fica em cima.")
        c1, c2 = st.columns(2)
        if n_mod > 1 and c1.button("Igualar ao M1", use_container_width=True,
                                   key=f"ig_mod_{g_nome}",
                                   help="Copia largura, nº de r\u00e9guas e "
                                        "alturas do m\u00f3dulo 1 pros "
                                        "demais."):
            st.session_state["copiar_m1"] = g_nome
            st.rerun()
        if eh_admin and c2.button("\U0001F4BE Gravar padr\u00e3o",
                                  use_container_width=True,
                                  key=f"salvar_alt_{g_nome}",
                                  help="Grava as alturas do m\u00f3dulo 1 "
                                       "na gondola (layout_gondolas."
                                       "alturas_cm), como molde das "
                                       "pr\u00f3ximas montagens."):
            try:
                salvar_alturas_gondola(g_nome, mods[0]["alturas"])
                st.cache_data.clear()
                st.session_state["msg_novo"] = \
                    f"Alturas do M1 gravadas na gondola {g_nome}."
                st.session_state["edit_nonce"] = \
                    st.session_state.get("edit_nonce", 0) + 1
                st.rerun()
            except Exception as err:
                st.error("Nao consegui gravar. Se a coluna ainda nao "
                         "existe, rode no SQL Editor:\n\n"
                         "ALTER TABLE layout_gondolas ADD COLUMN IF NOT "
                         f"EXISTS alturas_cm text;\n\nDetalhe: {err}")
    return mods


def estilo_sidebar():
    """v7.16 - identidade visual do Portal de Pedidos na sidebar: cartao de
    cabecalho, titulos de secao e o primario magenta.
    v7.27 (pedido do Adriano) - fundo ESCURO SOLIDO na sidebar inteira, no
    lugar do gradiente azul claro de antes, igual ao visual do Promotores e
    dos outros apps do Molicenter (mesmo AZUL_MOLI do cartao de login, so
    que agora preenchendo tudo). Como o fundo deixou de ser claro, todo
    texto solto da sidebar (rotulos, legendas, titulos de secao, cartao de
    cabecalho, quadros com borda, expander) passou pra cor clara
    AZUL_SIDEBAR_TXT pra manter o contraste. Os campos dos widgets
    (selects, inputs, checkboxes) continuam com o fundo branco de sempre -
    so o "chrome" ao redor deles escureceu. So CSS - nao muda widget
    nenhum."""
    TXT = AZUL_SIDEBAR_TXT
    st.markdown(f"""
    <style>
      [data-testid="stSidebar"],
      [data-testid="stSidebar"] > div,
      [data-testid="stSidebarContent"]{{
        background:{AZUL_MOLI}}}
      [data-testid="stSidebar"] [data-testid="stVerticalBlock"]{{
        background:transparent}}
      [data-testid="stSidebar"] hr{{
        border-color:rgba(255,255,255,.18)}}
      [data-testid="stSidebar"] [data-testid="stWidgetLabel"] p,
      [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p,
      [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] li,
      [data-testid="stSidebar"] [data-testid="stCaptionContainer"],
      [data-testid="stSidebar"] [data-testid="stCaptionContainer"] p,
      [data-testid="stSidebar"] label,
      [data-testid="stSidebar"] [data-testid="stTickBarMin"],
      [data-testid="stSidebar"] [data-testid="stTickBarMax"],
      [data-testid="stSidebar"] [data-testid="stThumbValue"],
      [data-testid="stSidebar"] h1,
      [data-testid="stSidebar"] h2,
      [data-testid="stSidebar"] h3{{
        color:{TXT} !important}}
      .moli-cab{{
        background:rgba(255,255,255,.09);
        border:1px solid rgba(255,255,255,.16);
        border-radius:10px;padding:10px 14px;
        margin:0 0 4px;color:#fff}}
      .moli-cab b{{font:600 15px/1.2 system-ui,sans-serif;display:block}}
      .moli-cab span{{font:11px/1.5 system-ui,sans-serif;opacity:.82}}
      .moli-sec{{
        color:#fff;font:700 11px/1.4 system-ui,sans-serif;
        letter-spacing:.09em;text-transform:uppercase;
        border-bottom:2px solid rgba(255,255,255,.25);
        padding:0 0 4px;margin:10px 0 6px}}
      /* v7.41 - sidebar compacta */
      [data-testid="stSidebarUserContent"]{{padding-top:.4rem !important;
        padding-bottom:0 !important}}
      [data-testid="stSidebarHeader"]{{padding-top:.3rem;
        padding-bottom:0;min-height:0;height:2.2rem}}
      [data-testid="stSidebar"] [data-testid="stVerticalBlock"]{{
        gap:.5rem}}
      [data-testid="stSidebar"] [data-testid="stWidgetLabel"] p{{
        font-size:12px}}
      /* abas no fundo escuro */
      [data-testid="stSidebar"] [data-baseweb="tab-list"]{{gap:4px}}
      [data-testid="stSidebar"] [data-baseweb="tab"]{{
        background:rgba(255,255,255,.07);border-radius:8px 8px 0 0;
        padding:6px 12px;flex:1;justify-content:center}}
      [data-testid="stSidebar"] [data-baseweb="tab"][aria-selected="true"]{{
        background:rgba(255,255,255,.18)}}
      [data-testid="stSidebar"] [data-baseweb="tab"] p{{
        color:{TXT} !important;font-weight:600;font-size:13px}}
      [data-testid="stSidebar"] [data-baseweb="tab-highlight"]{{
        background:{MAGENTA_MOLI} !important}}
      [data-testid="stSidebar"] [data-baseweb="tab-border"]{{
        background:rgba(255,255,255,.2) !important}}
      /* rodape fixo das acoes */
      /* o Streamlit novo embrulha o container num stLayoutWrapper do
         mesmo tamanho - o sticky tem que ir nesse embrulho */
      [data-testid="stLayoutWrapper"]:has(> .st-key-moli_acoes){{
        position:sticky;bottom:0;z-index:30;background:{AZUL_MOLI}}}
      [data-testid="stSidebar"] .st-key-moli_acoes{{position:sticky;
        bottom:0;z-index:30;background:{AZUL_MOLI} !important;padding:2px 0 12px;margin-top:6px;
        box-shadow:0 -10px 14px -8px rgba(0,0,0,.55)}}
      .st-key-moli_acoes .moli-sec{{margin-top:6px}}
      .st-key-moli_acoes button{{min-height:34px;padding:2px 6px}}
      .st-key-moli_acoes button p{{font-size:12px;white-space:nowrap}}
      .moli-sujo{{color:#ffb74d;font:600 11px system-ui,sans-serif;
        text-align:center;margin-top:-2px}}
      [data-testid="stSidebar"] button[kind="primary"]{{
        background:{MAGENTA_MOLI};border-color:{MAGENTA_MOLI};
        color:#fff;font-weight:600}}
      [data-testid="stSidebar"] button[kind="primary"]:hover{{
        background:#c50069;border-color:#c50069}}
      [data-testid="stSidebar"] button[kind="secondary"]{{
        background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.32);
        color:#fff}}
      [data-testid="stSidebar"] button[kind="secondary"]:hover{{
        background:rgba(255,255,255,.18);border-color:#fff;color:#fff}}
      [data-testid="stSidebar"] [data-testid="stExpander"]{{
        background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.20);
        border-radius:8px}}
      [data-testid="stSidebar"] [data-testid="stExpander"] svg{{
        fill:{TXT}}}
      [data-testid="stSidebar"] [data-testid="stVerticalBlockBorderWrapper"]{{
        background:rgba(255,255,255,.06);
        border-color:rgba(255,255,255,.20) !important;
        border-radius:8px}}
    </style>""", unsafe_allow_html=True)


def secao(titulo):
    """Titulo de bloco da sidebar (v7.16)."""
    st.markdown(f'<div class="moli-sec">{_esc(titulo)}</div>',
                unsafe_allow_html=True)


def _mover_ordem(ch_ord, i, passo):
    """v7.33 - seta da ordem das categorias (callback: roda antes do
    rerun, entao a tela ja nasce com a ordem nova)."""
    o = st.session_state.get("ordem_rec", {}).get(ch_ord)
    j = i + passo
    if o and 0 <= i < len(o) and 0 <= j < len(o):
        o[i], o[j] = o[j], o[i]


def _sem_acento(t):
    """minusculo, sem acento e sem espaco repetido (busca do seletor)."""
    import unicodedata
    t = unicodedata.normalize("NFKD", str(t if t is not None else ""))
    t = "".join(c for c in t if not unicodedata.combining(c))
    return " ".join(t.lower().split())


def seletor_recorte(nivel, col_nivel, opcoes, subs_de=None):
    """v7.14 - QUADRO FIXO na sidebar (antes era um popover que so abria
    no clique). Ja nasce mostrando ~15 opcoes com rolagem; a busca fica
    em cima e filtra a lista dentro do proprio quadro. As marcadas ficam
    pinadas no topo, mesmo fora da busca.
    OBS: o st.text_input do Streamlit so dispara no Enter/ao sair do
    campo - nao existe evento por tecla sem componente custom. Como a
    lista ja aparece inteira (rolando), na pratica quase nao precisa
    digitar."""
    ns = f"sel_{col_nivel}_"   # uma checkbox por opcao, na sessao
    marcadas = [o for o in opcoes if st.session_state.get(ns + o)]
    st.caption(f"{len(marcadas)} marcada(s) de {len(opcoes)}" if marcadas
               else f"{len(opcoes)} op\u00e7\u00f5es")
    busca = st.text_input(
        "Buscar", key=f"busca_{col_nivel}",
        placeholder="\U0001F50D filtrar... (ex.: cerveja)",
        label_visibility="collapsed",
        help="Digite parte do nome e aperte Enter pra encurtar a lista "
             "do quadro abaixo. Deixe vazio pra ver tudo.")
    # v7.37 - a busca sempre foi "CONTEM" (nao "comeca com"), mas
    # diferenciava acento ("agua" nao achava "Água") e, no modo
    # Categoria, so olhava o nome da categoria ("alu" nao achava nada,
    # porque aluminio e SUBcategoria de Limpadores). Agora ignora acento
    # e, em Categoria, tambem acha a categoria pelas subcategorias dela.
    b = _sem_acento(busca)
    if b:
        visiveis = [o for o in opcoes
                    if b in _sem_acento(o)
                    or any(b in _sem_acento(x)
                           for x in (subs_de or {}).get(o, ()))]
    else:
        visiveis = opcoes

    with st.container(border=True, height=ALTURA_SELETOR):
        for o in marcadas:          # marcadas sempre no topo
            st.checkbox(o, key=ns + o)
        pend = [o for o in visiveis if o not in marcadas]
        if marcadas and pend:
            st.markdown("---")
        if not pend and not marcadas:
            st.caption("Nada com esse nome nessa loja.")
        cortou = len(pend) - MAX_LISTA_SEL
        for o in pend[:MAX_LISTA_SEL]:
            st.checkbox(o, key=ns + o)
        if cortou > 0:
            st.caption(f"+{cortou} op\u00e7\u00f5es \u2014 use a busca "
                       "acima pra encurtar a lista")

    if marcadas and st.button("\U0001F9F9 Limpar sele\u00e7\u00e3o",
                              use_container_width=True):
        st.session_state["limpar_sel"] = True
        st.rerun()
    return [o for o in opcoes if st.session_state.get(ns + o)]


# ==========================================
# INTERFACE
# ==========================================
def alturas_para_os_altos(mods, df):
    """v7.32 - REGUA DE BAIXO SOBE PRA CABER O PRODUTO ALTO (pedido do
    Adriano: Agua Sanitaria 5L com 36 cm numa gondola de reguas de 35 cm
    ia inteira pro Banco, quando o combinado e o maior ficar embaixo).

    Se algum produto do recorte e mais alto que a regua mais alta do
    modulo, as reguas DE BAIXO sobem ate a altura dele (cm inteiro pra
    cima) e a diferenca sai das reguas de cima, do topo pra baixo, cada
    uma descendo no maximo ate a altura do maior produto que NAO e alto
    (ela continua comportando todo o resto). A altura total do modulo
    nao muda. So se as de cima nao tiverem folga suficiente e que o
    modulo cresce - e a mensagem avisa.

    Quantas reguas sobem: o espaco que os altos pedem pelo DELTA (o mesmo
    peso do rateio de frentes) sobre a capacidade da fileira, nunca menos
    que 1 frente de cada um, convertido em reguas inteiras da fileira.

    Devolve (lista de alturas por modulo, texto) ou (None, None) quando
    nada precisa mudar."""
    if df is None or df.empty or not mods:
        return None, None
    d = df[df["largura_cm"].notna() & df["altura_cm"].notna()].copy()
    if d.empty:
        return None, None
    d["altura_cm"] = d["altura_cm"].astype(float)
    d["largura_cm"] = d["largura_cm"].astype(float)
    teto_atual = min(max(float(a) for a in m["alturas"]) for m in mods)
    altos = d[d["altura_cm"] > teto_atual + 1e-6]
    if altos.empty:
        return None, None
    precisa = float(math.ceil(altos["altura_cm"].max() - 1e-6))
    baixos = d[d["altura_cm"] <= teto_atual + 1e-6]
    piso_doador = float(max(8, math.ceil(baixos["altura_cm"].max() - 1e-6))
                        if not baixos.empty else 8)

    largura_fileira = sum(float(m["largura"]) for m in mods) or 1.0
    capacidade = sum(float(m["largura"]) * len(m["alturas"]) for m in mods)
    pesos = calcular_pesos(d)
    # DEGRAUS: os altos, do mais alto pro mais baixo, vao ocupando reguas
    # a partir do CHAO, cada um com o espaco que o delta dele pede (nunca
    # menos que 1 frente). A regua j (0 = a de baixo) fica com a altura do
    # MAIOR item que caiu nela - entao o 5L puxa a de baixo pra 37 e o 2L,
    # se tambem passar do teto, puxa a de cima dele so pro que ele precisa.
    necessidade = {}                 # j -> altura que a regua j precisa
    acum = 0.0
    for idx in altos.sort_values("altura_cm", ascending=False).index:
        h = float(math.ceil(d.at[idx, "altura_cm"] - 1e-6))
        cm = max(float(d.at[idx, "largura_cm"]),
                 float(pesos.at[idx, "peso"]) * capacidade)
        j0 = int(acum // largura_fileira)
        acum += cm
        j1 = int(max(acum - 1e-6, 0) // largura_fileira)
        for j in range(j0, j1 + 1):
            necessidade[j] = max(necessidade.get(j, 0.0), h)

    # degraus muito proximos (32/33/34) fragmentam: o item de 33 nao entra
    # na de 32 e as reguas ficam meio vazias. Degrau que fica a menos de
    # DEGRAU_MIN_CM do de baixo dele vira um so, com a altura do maior.
    js = sorted(necessidade)
    for a_, b_ in zip(js, js[1:]):
        if necessidade[a_] - necessidade[b_] < DEGRAU_MIN_CM:
            necessidade[b_] = necessidade[a_]

    novas, cresceu = [], False
    for m in mods:
        alts = [float(a) for a in m["alturas"]]
        n = len(alts)
        # deixa pelo menos 1 regua pros que NAO sao altos
        teto_k = n - 1 if (n > 1 and not baixos.empty) else n
        sobe = []
        for j, h in sorted(necessidade.items()):
            if j >= teto_k:
                break
            i = n - 1 - j                        # j conta do chao
            if h > alts[i] + 1e-6:
                sobe.append(i)
            alts[i] = max(alts[i], h)
        falta = sum(alts) - sum(float(a) for a in m["alturas"])
        # as doadoras cedem 1 cm por vez, sempre a mais alta delas (empate:
        # a de cima) - assim a diferenca se espalha em vez de afundar so o
        # topo
        doad = [i for i in range(n) if i not in sobe]
        while falta > 1e-6:
            cands = [i for i in doad if alts[i] - piso_doador > 1e-6]
            if not cands:
                break
            i = max(cands, key=lambda x: (alts[x], -x))
            t = min(1.0, alts[i] - piso_doador, falta)
            alts[i] -= t
            falta -= t
        if falta > 1e-6:
            cresceu = True
        novas.append([round(a, 1) for a in alts])

    if all([round(float(a), 1) for a in m["alturas"]] == nv
           for m, nv in zip(mods, novas)):
        return None, None
    nomes = ", ".join(sorted(set(str(x) for x in altos["descricao"]))[:3])
    if len(altos) > 3:
        nomes += f" e mais {len(altos) - 3}"
    txt = (f"Régua de baixo subiu pra {precisa:g} cm pra caber {nomes}"
           + (" - a gôndola ficou mais alta (as de cima não "
              "tinham folga)." if cresceu
              else "; a diferença saiu das réguas de cima."))
    return novas, txt


def alturas_para_os_altos_blocos(mods, df, col_nivel=None, ordem=None):
    """v7.33 - mesma regra do alturas_para_os_altos, mas com MAIS DE UMA
    categoria cada bloco (as reguas que sao dela) se ajusta sozinho: a
    regua de baixo DO BLOCO sobe pro produto alto dele e as de cima DO
    BLOCO cedem. Sem isso, a agua sanitaria em baixo do alvejante perdia
    os 5L, porque a regua alta tinha ficado com quem estava no chao."""
    if not ordem or len(ordem) < 2 or col_nivel is None or df is None \
            or df.empty or col_nivel not in df:
        return alturas_para_os_altos(mods, df)
    slots = fl.montar_slots(mods)
    blocos = niveis_por_categoria(df, col_nivel, ordem, slots)
    novas = [[float(a) for a in m["alturas"]] for m in mods]
    textos = []
    for c in ordem:
        idx = blocos.get(c) or []
        if not idx:
            continue
        regs = {}                              # modulo -> reguas do bloco
        for i in idx:
            regs.setdefault(int(slots[i]["mod"]), []).append(int(slots[i]["reg"]))
        ms = sorted(regs)
        sub_mods = [{"largura": mods[m]["largura"],
                     "alturas": [novas[m][r] for r in sorted(regs[m])]}
                    for m in ms]
        nv, txt = alturas_para_os_altos(sub_mods, df[df[col_nivel] == c])
        if not nv:
            continue
        for m, alts in zip(ms, nv):
            for r, a in zip(sorted(regs[m]), alts):
                novas[m][r] = float(a)
        textos.append(f"{c}: {txt}")
    if not textos:
        return None, None
    return [[round(a, 1) for a in m] for m in novas], " | ".join(textos)


# ==========================================
# v7.40 - CABECALHO, CHIPS E METRICAS
# ==========================================
@st.cache_data(show_spinner=False)
def _logo_b64():
    import base64
    try:
        with open(LOGO_LOGIN, "rb") as f:
            return base64.b64encode(f.read()).decode()
    except Exception:
        return ""


def estilo_main():
    """CSS da area principal: cabecalho, chips, cartoes de metrica e a
    barra do Streamlit (Share / estrela / lapis) escondida."""
    st.markdown(f"""
    <style>
      [data-testid="stToolbarActions"], .stAppDeployButton,
      [data-testid="stAppDeployButton"]{{display:none !important}}
      /* v7.40 - fundo leve na area principal (fora dos modulos) */
      [data-testid="stApp"], [data-testid="stAppViewContainer"],
      [data-testid="stMain"], [data-testid="stHeader"]{{
        background:#eef2f6 !important}}
      [data-testid="stExpander"]{{background:#fff;border-radius:10px}}
      .block-container{{padding-top:4rem}}
      .mp-cab{{display:flex;align-items:center;gap:14px;margin:6px 0 6px;
        overflow:visible}}
      .mp-cab img{{height:56px;width:auto;object-fit:contain;flex:0 0 auto}}
      .mp-cab h1{{font:700 30px/1.1 "Source Sans Pro",system-ui,sans-serif;
        color:{AZUL_MOLI};margin:0;padding:0}}
      .mp-cab .apoio{{font:13px system-ui,sans-serif;color:#6b7680;
        margin:2px 0 0}}
      .mp-chips{{display:flex;flex-wrap:wrap;gap:8px;align-items:center;
        margin:6px 0 12px}}
      .mp-chips .tit{{font:700 20px/1.2 "Source Sans Pro",system-ui,
        sans-serif;color:#1f2a33;margin-right:6px}}
      .mp-chip{{background:#e8eef4;color:{AZUL_MOLI};border-radius:999px;
        padding:3px 11px;font:600 12px system-ui,sans-serif;
        border:1px solid #d3dde7}}
      .mp-cards{{display:flex;gap:12px;flex-wrap:wrap;margin:6px 0 14px}}
      .mp-card{{background:#fff;border:1px solid #e3e7eb;border-radius:12px;
        padding:10px 16px;min-width:130px;
        box-shadow:0 1px 3px rgba(16,24,40,.06)}}
      .mp-card .r{{font:600 11px system-ui,sans-serif;color:#6b7680;
        text-transform:uppercase;letter-spacing:.04em}}
      .mp-card .v{{font:700 26px/1.15 system-ui,sans-serif;color:#1f2a33;
        margin-top:2px}}
      .mp-card.alerta{{border-color:#f5b98a;background:#fff7f0}}
      .mp-card.alerta .v{{color:{LARANJA}}}
      .mp-card.ocup{{min-width:190px}}
      .mp-barra{{height:6px;background:#eceff2;border-radius:3px;
        margin-top:6px;overflow:hidden}}
      .mp-barra i{{display:block;height:100%;border-radius:3px}}
    </style>""", unsafe_allow_html=True)


def cabecalho_app():
    logo = _logo_b64()
    img = (f'<img src="data:image/png;base64,{logo}" alt="">' if logo
           else '<span style="font-size:40px">\U0001F5C4️</span>')
    st.markdown(
        f'<div class="mp-cab">{img}<div><h1>Planograma</h1>'
        '<div class="apoio">Gestão de Categoria — Molicenter'
        '</div></div></div>', unsafe_allow_html=True)


def chips_recorte(titulo, loja, mods, n_mod):
    """Titulo do recorte + chips (loja, composicao, modulos, frente)."""
    larg = sum(float(m["largura"]) for m in mods)
    nregs = sorted({len(m["alturas"]) for m in mods})
    reg_txt = "/".join(str(n) for n in nregs)
    if len({float(m["largura"]) for m in mods}) == 1:
        comp = f'{float(mods[0]["largura"]) / 100:.2f}'.replace(".", ",") \
            + f"m × {reg_txt} réguas"
    else:
        comp = fl.composicao(mods)
    chips = [f"Loja {loja}", comp,
             f"{n_mod} módulo" + ("s" if n_mod > 1 else ""),
             f"{larg:g} cm de frente",
             f"{fl.altura_total(mods):g} cm de altura"]
    st.markdown(
        f'<div class="mp-chips"><span class="tit">{_esc(titulo)}</span>'
        + "".join(f'<span class="mp-chip">{_esc(c)}</span>' for c in chips)
        + "</div>", unsafe_allow_html=True)


def _cor_ocup(pct):
    if pct > 1.001:
        return "#7f0000"
    if pct >= 0.9:
        return "#2e7d32"
    if pct >= 0.7:
        return "#f9a825"
    return "#e53935"


def cards_metricas(skus, frentes, pct, sem_foto, sem_dim):
    """v7.40 - cartoes de metrica. pct = ocupacao (0..1) ou None."""
    if pct is None:
        ocup_txt, cor, larg = "-", "#cfd5da", 0
    else:
        ocup_txt = f"{pct:.0%}"
        cor = _cor_ocup(pct) if pct > 0 else "#cfd5da"
        larg = max(0, min(100, round(pct * 100)))
    cards = [
        ("", "\U0001F4E6 SKUs na gôndola", f"{skus}", ""),
        ("", "\U0001F9F1 Frentes", f"{frentes}", ""),
        ("ocup", "\U0001F4CF Ocupação total",
         f'<span style="color:{cor if pct else "#1f2a33"}">{ocup_txt}'
         '</span>',
         f'<div class="mp-barra"><i style="width:{larg}%;'
         f'background:{cor}"></i></div>'),
        ("alerta" if sem_foto else "", "\U0001F4F7 Sem foto",
         f"{sem_foto}", ""),
        ("alerta" if sem_dim else "", "\U0001F4D0 Banco sem medida",
         f"{sem_dim}", ""),
    ]
    st.markdown(
        '<div class="mp-cards">' + "".join(
            f'<div class="mp-card {cl}"><div class="r">{r}</div>'
            f'<div class="v">{v}</div>{extra}</div>'
            for cl, r, v, extra in cards) + "</div>",
        unsafe_allow_html=True)


def gondola_vazia(g_nome, g, mods, slots, n_mod, loja, nivel, escala,
                  perfil, nonce, salvar, largura_desenho):
    """v7.30 - tela de abertura SEM recorte marcado: desenha a gondola
    escolhida (modulos x reguas da sidebar) sem produto nenhum, no mesmo
    componente de arrastar. Da pra mexer na altura das reguas (tarja e
    topo) antes de escolher a categoria. Nao toca no plano da sessao e
    nunca grava nada no Supabase."""
    plan = {"slots": slots, "num_prat": len(slots),
            "largura_prat": fl.capacidade(slots),
            "altura_prat": float(g["altura_prateleira_cm"]),
            "alturas": fl.alturas(slots), "escala": escala,
            "shelves": [[] for _ in slots], "fora": []}

    if salvar:
        st.warning("Nada pra salvar: marque uma categoria ou subcategoria "
                   "na barra lateral primeiro.")

    cards_metricas(0, 0, 0.0, 0, 0)                     # v7.40
    chips_recorte("Sem categoria", loja, mods, n_mod)

    rev = (f"vazia-{perfil[0]}-{nonce}-{len(slots)}-{escala}-"
           f"{fl.composicao(mods)}-"
           f"{'x'.join(f'{a:g}' for a in plan['alturas'])}-{g_nome}-{n_mod}")
    payload = montar_payload(plan, {}, rev, edita=False, ajusta_alt=True,
                             titulo="Sem categoria",
                             vazia=True)
    val = _gondola_dnd(data=payload,
                       key=f"dnd_vazia_{g_nome}_{n_mod}_{len(slots)}_{nonce}",
                       default=None)
    if val and isinstance(val, dict) and val.get("rev") == rev:
        # mesma regra do canvas normal (v7.23): a altura arrastada vai pros
        # campos da sidebar e a tela recarrega uma vez
        alt_novas = val.get("alturas")
        if (isinstance(alt_novas, list)
                and len(alt_novas) == len(slots)
                and any(abs(float(a) - float(b)) > 0.4
                        for a, b in zip(alt_novas, plan["alturas"]))):
            st.session_state["alt_drag"] = {
                "g": g_nome,
                "vals": [(int(sl["mod"]), int(sl["reg"]), round(float(a)))
                         for sl, a in zip(slots, alt_novas)]}
            st.rerun()


def main():
    st.set_page_config(page_title="Planograma", page_icon="\U0001F5C4\uFE0F", layout="wide")
    perfil = checar_login()
    eh_admin = perfil == "admin"
    estilo_main()                                       # v7.40
    cabecalho_app()

    # limpa os campos do cadastro ANTES dos widgets existirem nesta rodada
    if st.session_state.pop("limpar_novo", False):
        for k in ("novo_ean", "ultimo_lido", "ultima_sug"):
            st.session_state.pop(k, None)
    # idem pras caixinhas de categoria/subcategoria (botao Limpar selecao)
    # v7.23 - altura arrastada na tarja do canvas. O componente devolve a
    # nova altura DEPOIS que os number_input da sidebar ja existem nesta
    # rodada, e o Streamlit nao deixa escrever num widget ja instanciado -
    # por isso o valor fica parado numa flag e e aplicado aqui, no comeco
    # da rodada seguinte (mesmo truque do "Igualar ao M1" e do "Limpar").
    ad = st.session_state.pop("alt_drag", None)
    if ad:
        for m, reg, a in ad["vals"]:
            st.session_state[f"ma_{ad['g']}_{m}_{reg}"] = float(max(5, a))

    # v7.22 - "Igualar ao M1": copia largura / nº de reguas / alturas do
    # modulo 1 pros demais. Tem que rodar ANTES dos widgets existirem
    # nesta rodada, igual ao "Igualar todas" da v7.12
    gi = st.session_state.pop("copiar_m1", None)
    if gi:
        w0 = st.session_state.get(f"mw_{gi}_0")
        r0 = st.session_state.get(f"mr_{gi}_0")
        alt0 = [st.session_state.get(f"ma_{gi}_0_{i}")
                for i in range(int(r0 or 0))]
        for k in [k for k in list(st.session_state)
                  if k.startswith(f"mw_{gi}_") or k.startswith(f"mr_{gi}_")
                  or k.startswith(f"ma_{gi}_")]:
            st.session_state.pop(k, None)
        if w0 and r0:
            for m in range(8):
                st.session_state[f"mw_{gi}_{m}"] = float(w0)
                st.session_state[f"mr_{gi}_{m}"] = int(r0)
                for i, a in enumerate(alt0):
                    if a:
                        st.session_state[f"ma_{gi}_{m}_{i}"] = float(a)

    if st.session_state.pop("limpar_sel", False):
        for k in [k for k in list(st.session_state)
                  if k.startswith("sel_categoria_")
                  or k.startswith("sel_subcategoria_")]:
            st.session_state.pop(k, None)

    if _gondola_dnd is None:
        st.error("Pasta 'gondola_dnd' nao encontrada no repositorio. "
                 "Suba a pasta gondola_dnd/index.html junto com o planograma.py.")
        st.stop()

    gondolas = carregar_gondolas()
    try:
        opcoes_df = carregar_opcoes()
    except Exception as err:
        st.error("Nao consegui ler a view **layout_opcoes** no Supabase. "
                 "Rode o arquivo `views_planograma.sql` no SQL Editor "
                 "(cria layout_opcoes e layout_base) e recarregue. "
                 f"Detalhe: {err}")
        st.stop()

    if gondolas.empty or opcoes_df.empty:
        st.warning("Cadastre gondolas (layout_gondolas) e rode o "
                   "exportarlayoutvendas.py para carregar os pesos.")
        st.stop()

    # v7.16 - SIDEBAR EM TRES BLOCOS. Os widgets nao nascem na ordem em
    # que precisam aparecer (o nº de reguas so existe depois do plano
    # montado, e o plano depende do recorte escolhido), entao os lugares
    # sao RESERVADOS aqui como containers e preenchidos depois, na ordem
    # que o codigo consegue. O Streamlit desenha na posicao do container,
    # nao na hora da chamada.
    nonce = st.session_state.get("reset_nonce", 0)
    with st.sidebar:
        estilo_sidebar()
        cc, cs = st.columns([3, 2])
        rot_perfil = ("\U0001F510 Administrador" if eh_admin
                      else "\U0001F464 Usu\u00e1rio")
        cc.markdown('<div class="moli-cab"><b>Configura\u00e7\u00e3o</b>'
                    f'<span>{rot_perfil}</span></div>',
                    unsafe_allow_html=True)
        if cs.button("Sair", use_container_width=True):
            st.session_state.pop("perfil", None)
            st.rerun()
        # v7.31 - ordem pedida pelo Adriano: Gondola, Recorte e os botoes
        # de Acoes por ULTIMO (embaixo). So muda a ordem dos containers;
        # o preenchimento continua na mesma sequencia de sempre.
        # v7.41 - ABAS (so uma aparece por vez) + rodape fixo com as acoes
        # v7.42 - LOJA fora das abas, logo abaixo do Configuracao/Sair, e
        # a aba Gondola vem PRIMEIRO (pedido do Adriano)
        slot_loja = st.container()
        aba_gon, aba_rec = st.tabs(["\u2699\uFE0F G\u00f4ndola",
                                    "\U0001F5C2\uFE0F Categorias"])
        slot_recorte = aba_rec.container()
        slot_gondola = aba_gon.container()
        slot_acoes = st.container(key="moli_acoes")

    # v7.41 - os botoes sao DESENHADOS no fim da rodada (pra o Salvar
    # saber se ha alteracao nao salva), mas a ACAO vem do on_click, que
    # o Streamlit roda antes do script - por isso ela e lida aqui em cima.
    acao = st.session_state.pop("acao", None)
    clique = {acao: True} if acao else {}
    acoes_feitas = []

    def _marca_acao(k):
        st.session_state["acao"] = k

    def render_acoes(sujo=False, pode_desfazer=False):
        if acoes_feitas:
            return
        acoes_feitas.append(1)
        with slot_acoes:
            secao("A\u00e7\u00f5es")
            c1, c2 = st.columns([3, 2])
            c1.button("\U0001F4BE Salvar" + (" \u25CF" if sujo else ""),
                      type="primary", use_container_width=True,
                      key="bt_salvar", on_click=_marca_acao,
                      args=("salvar",),
                      help=("H\u00e1 altera\u00e7\u00f5es n\u00e3o salvas. "
                            if sujo else "")
                      + "Grava o arranjo da tela no Supabase.")
            c2.button("\u21B6 Desfazer", use_container_width=True,
                      key="bt_desfazer", on_click=_marca_acao,
                      args=("desfazer",), disabled=not pode_desfazer,
                      help="Volta o \u00faltimo arraste ou clique "
                           "(\u2212 / + / \u00d7 / \u2b07).")
            cols = st.columns(3 if eh_admin else 2)
            cols[0].button("Atualizar", use_container_width=True,
                           key="bt_atualizar", on_click=_marca_acao,
                           args=("atualizar",),
                           help="Rebaixa vendas e cadastro do Supabase. Use "
                                "depois de rodar o exportarlayoutvendas.py "
                                "ou mexer no cadastro por fora.")
            cols[1].button("Resetar", use_container_width=True,
                           key="bt_resetar", on_click=_marca_acao,
                           args=("resetar",),
                           help="Descarta os arrastos e volta pro arranjo "
                                "autom\u00e1tico.")
            if eh_admin:
                cols[2].button("\u2795 Novo", use_container_width=True,
                               key="bt_novo", on_click=_marca_acao,
                               args=("novo",),
                               help="Cadastrar item com venda que n\u00e3o "
                                    "existe na dim_produtos.")
            if sujo:
                st.markdown('<div class="moli-sujo">\u25CF altera\u00e7\u00f5es '
                            'n\u00e3o salvas</div>', unsafe_allow_html=True)

    if clique.get("atualizar"):
        st.cache_data.clear()
        st.rerun()
    if clique.get("resetar"):
        st.session_state["forcar_reset"] = True
        st.session_state["reset_nonce"] = nonce + 1
        st.rerun()
    if clique.get("novo"):
        # disparo unico: a flag e consumida (pop) na hora de abrir o
        # dialogo, mais abaixo - fechar no X nao deixa residuo, entao
        # ele nao reabre sozinho nas proximas interacoes
        st.session_state["abrir_novo"] = True
    salvar = bool(clique.get("salvar"))
    desfazer = bool(clique.get("desfazer"))

    # ---------- BLOCO 2: gondola e visualizacao ----------
    # v7.42 - Loja fixa acima das abas (vale pra Gondola e Categorias)
    with slot_loja:
        # respiro entre o cartao Configuracao e o rotulo "Loja"
        st.markdown('<div style="height:14px"></div>',
                    unsafe_allow_html=True)
        # so as lojas de LOJAS_ATIVAS (001 a 008); se nenhuma casar,
        # mostra todas pra nao travar a tela
        todas = sorted(opcoes_df["loja"].unique())

        def _num(v):
            try:
                return int(str(v).strip())
            except ValueError:
                return None
        lojas = [l for l in todas if _num(l) in LOJAS_ATIVAS] or todas
        cl_, _ = st.columns(2)            # mesma largura do campo Modulos
        loja = cl_.selectbox("\U0001F3EA Loja", lojas)

    with slot_gondola:
        # v7.42 - a Loja saiu daqui; Gondola ocupa a linha inteira
        g_nome = st.selectbox("G\u00f4ndola", ordem_gondolas(gondolas["nome"]),
                              help=f"Abre em {GONDOLA_PADRAO}; as demais "
                                   "seguem em ordem alfabetica.")
        g = gondolas[gondolas["nome"] == g_nome].iloc[0]
        cm_, cz_ = st.columns(2)
        n_mod = int(cm_.number_input(
            "M\u00f3dulos", min_value=1, max_value=8, value=1, step=1,
            help="Quantos m\u00f3dulos formam esta fileira, lado a lado. "
                 "Cada um tem a pr\u00f3pria largura e o pr\u00f3prio "
                 "nº de r\u00e9guas."))
        zoom_ph = cz_.empty()
        # v7.22 - largura / nº de reguas / alturas POR MODULO
        mods = editor_modulos(g_nome, g, n_mod, eh_admin)
        slots = fl.montar_slots(mods)
        largura_prat = fl.capacidade(slots)            # cm lineares totais
        largura_desenho = sum(m["largura"] for m in mods)
        zoom_auto = max(2, min(8, int(1100 // max(1.0, largura_desenho))))
        ajuste_tela = st.checkbox("Ajustar zoom \u00e0 tela", value=False,
                                  key="ajuste_tela",
                                  help="Calcula o zoom pra fileira inteira "
                                       "caber na janela.")
        if ajuste_tela:
            escala = zoom_auto
            zoom_ph.number_input("Zoom (px/cm)", 2, 8, int(zoom_auto), 1,
                                 disabled=True,
                                 help="Autom\u00e1tico (Ajustar zoom "
                                      "\u00e0 tela ligado).")
        else:
            escala = int(zoom_ph.number_input(
                "Zoom (px/cm)", 2, 8, int(min(ESCALA, max(2, zoom_auto))), 1,
                key="zoom_cm",
                help="Diminua para caber fileiras longas na tela."))
        if n_mod > 1:
            st.caption(f"Fileira: {fl.composicao(mods)} \u2014 "
                       f"{largura_desenho:g} cm de frente, "
                       f"{fl.altura_total(mods):g} cm de altura")

    # ---------- BLOCO 3: recorte (categoria / subcategoria) ----------
    with slot_recorte:
        nivel = st.radio("Montar por", ["Categoria", "SubCategoria"],
                         horizontal=True)
        col_nivel = "categoria" if nivel == "Categoria" else "subcategoria"
        opcoes = sorted(opcoes_df.loc[opcoes_df["loja"] == loja, col_nivel]
                        .dropna().unique())
        # v7.28 - CATEGORIA_PADRAO marcada sozinha, so na 1a renderizacao
        # da sessao (antes de qualquer clique) - precisa rodar ANTES do
        # seletor_recorte() criar as checkboxes, que le o valor inicial
        # do session_state na hora que o widget nasce. A flag garante
        # que isso acontece uma vez so: desmarcar depois, ou usar
        # "Limpar selecao", nao traz a categoria de volta sozinha.
        if not st.session_state.get("categ_padrao_feita"):
            if (CATEGORIA_PADRAO and nivel == "Categoria"
                    and CATEGORIA_PADRAO in opcoes):
                st.session_state[f"sel_{col_nivel}_{CATEGORIA_PADRAO}"] = True
            st.session_state["categ_padrao_feita"] = True
        subs_de = None
        if col_nivel == "categoria" and "subcategoria" in opcoes_df:
            _o = opcoes_df.loc[opcoes_df["loja"] == loja,
                               ["categoria", "subcategoria"]].dropna()
            subs_de = _o.groupby("categoria")["subcategoria"] \
                        .apply(lambda x: tuple(set(x))).to_dict()
        escolhas = (seletor_recorte(nivel, col_nivel, opcoes, subs_de)
                    if len(opcoes) else [])

    if not len(opcoes):
        st.session_state.pop("abrir_novo", None)
        render_acoes()
        st.info("Sem produtos com venda nesse recorte.")
        st.stop()

    # dialogo de cadastro: ANTES do st.stop() de "sem categoria", com a
    # flag consumida via pop - abre uma vez so por clique no botao
    if eh_admin and st.session_state.pop("abrir_novo", False):
        dialog_novo(opcoes_df, col_nivel, escolhas)

    if not escolhas:
        # v7.30 - em vez de tela em branco, desenha a gondola vazia
        render_acoes()
        gondola_vazia(g_nome, g, mods, slots, n_mod, loja, nivel, escala,
                      perfil, nonce, salvar, largura_desenho)
        st.stop()
    escolhas = sorted(escolhas)
    recorte_chave = " + ".join(escolhas)

    # ---- carga filtrada NO SERVIDOR: so a loja + recorte escolhido ----
    recorte = carregar_recorte(loja, col_nivel, tuple(escolhas))
    if recorte.empty:
        render_acoes()
        st.info("Sem produtos com venda nesse recorte.")
        st.stop()
    recorte["ean"] = recorte["ean"].astype(str)

    # v7.33 - MAIS DE UMA CATEGORIA: cada uma fica com reguas inteiras so
    # dela, empilhadas nesta ordem (de cima pra baixo). O padrao poe a de
    # produto menor em cima; a pessoa reordena com as setas na sidebar.
    ordem_rec = None
    if len(escolhas) > 1:
        ch_ord = (col_nivel, tuple(escolhas))
        ordens = st.session_state.setdefault("ordem_rec", {})
        if sorted(ordens.get(ch_ord, [])) != sorted(escolhas):
            ordens[ch_ord] = ordem_padrao_recorte(recorte, col_nivel, escolhas)
        ordem_rec = list(ordens[ch_ord])
        with slot_recorte:
            st.caption("Ordem na gôndola (de cima pra baixo) — "
                       "cada uma fica em réguas só dela")
            # v7.34 - as setas sozinhas sumiam na coluna estreita (botao
            # vazio). Agora e um botao "Subir" com texto, numa coluna mais
            # larga; subir os de baixo ja da qualquer ordem.
            for i, c in enumerate(ordem_rec):
                c1, c2 = st.columns([3, 2], gap="small",
                                    vertical_alignment="center")
                c1.markdown(f"**{i + 1}.** {c}")
                if i > 0:
                    c2.button("\u2B06 Subir", key=f"ord_up_{col_nivel}_{c}",
                              on_click=_mover_ordem, args=(ch_ord, i, -1),
                              use_container_width=True,
                              help=f"Coloca {c} acima de {ordem_rec[i - 1]}")

    catalogo = carregar_catalogo(col_nivel, tuple(escolhas))
    if catalogo.empty:
        cat_extra = catalogo
    else:
        catalogo["ean"] = catalogo["ean"].astype(str)
        # o recorte (produtos COM venda) vem da view layout_base, que nao
        # tem codigo_erp - traz do cadastro (catalogo) casando por EAN,
        # senao o Cod ERP so apareceria no tooltip dos itens do Banco
        if "codigo_erp" in catalogo.columns:
            mapa_cod = dict(zip(catalogo["ean"], catalogo["codigo_erp"]))
            recorte["codigo_erp"] = recorte["ean"].map(mapa_cod)
        # v7.21 - o filtro de dimensao saiu daqui: item sem medida agora
        # aparece no Banco (dois cliques pra medir), em vez de sumir
        cat_extra = catalogo[~catalogo["ean"].isin(recorte["ean"])].copy()
        for c in ("qtde", "venda", "margem"):
            cat_extra[c] = 0.0

    # v7.21 - BASE DE ATIVOS (produtos.xlsx do repositorio): completa a
    # dimensao que falta, SEM NUNCA sobrescrever o que ja esta no
    # cadastro, e manda pro Banco os ativos que nao tiveram venda.
    # A gondola automatica NAO muda: ela continua saindo so do `recorte`,
    # que e quem vendeu.
    recorte, cat_extra, base_stats = bp.aplicar_base(
        recorte, cat_extra, col_nivel, escolhas)

    altura_prat = float(g["altura_prateleira_cm"])
    prat_padrao = int(g["num_prateleiras"])
    # v7.22 - a chave de PERSISTENCIA leva a composicao da fileira; ela
    # sai identica a v7.21 enquanto os modulos forem iguais ao cadastro
    # ("<gondola>" com 1, "<gondola> xN" com N), entao nenhum arranjo ja
    # salvo se perde
    g_chave = fl.chave(g_nome, mods, g["largura_cm"], prat_padrao)
    # a IDENTIDADE do plano na sessao NAO leva as medidas dos modulos: se
    # levasse, mexer numa largura jogaria fora os arrastos e re-semearia
    # tudo. Medida que muda passa pelo reencaixar_slots, logo abaixo.
    # v7.35 - a COMPOSICAO (largura e nº de reguas de cada modulo) entrou
    # na identidade do plano: por ou tirar regua (ou mudar a largura)
    # REMONTA os produtos sozinho, em vez de so encaixar o arranjo antigo
    # e deixar regua nova vazia. Altura de regua continua fora da chave -
    # mexer nela so reencaixa, sem perder os arrastos.
    chave = (loja, nivel, recorte_chave, g_nome, n_mod,
             tuple(ordem_rec or ()),           # v7.33 - a ordem tambem
             fl.composicao(mods))

    # v7.32 - produto mais alto que a regua: a regua de baixo sobe (e as
    # de cima cedem) ANTES de montar. Roda uma vez por recorte+fileira
    # (marca em auto_alt_feito): se depois a pessoa baixar a regua a mao,
    # o app respeita e nao sobe de novo. O valor vai pros campos da
    # sidebar pelo mesmo caminho do arraste da tarja (alt_drag), e a
    # tela recarrega pra montar ja com as alturas novas.
    marca_alt = (chave, fl.composicao(mods))
    if (st.session_state.get("plan_key") != chave
            and marca_alt not in st.session_state.setdefault(
                "auto_alt_feito", set())):
        st.session_state["auto_alt_feito"].add(marca_alt)
        atuais = [[round(float(a), 1) for a in m["alturas"]] for m in mods]
        # se o ultimo ajuste automatico foi NESTA fileira e ninguem mexeu
        # depois, a conta parte das alturas de ANTES dele - assim, ao
        # trocar pra uma categoria sem produto alto, as reguas voltam ao
        # que eram (em vez de herdar o 37/34 da agua sanitaria)
        ult = st.session_state.get("auto_alt_ultimo")
        base_alt = atuais
        if (ult and ult["g"] == g_nome
                and ult["comp"] == fl.composicao(mods)
                and ult["depois"] == atuais):
            base_alt = ult["antes"]
        base_mods = [dict(m, alturas=a) for m, a in zip(mods, base_alt)]
        novas_alt, txt_alt = alturas_para_os_altos_blocos(
            base_mods, recorte, col_nivel, ordem_rec)
        alvo_alt = novas_alt or base_alt
        if novas_alt:
            st.session_state["auto_alt_ultimo"] = {
                "g": g_nome, "comp": fl.composicao(mods),
                "antes": base_alt, "depois": novas_alt}
        else:
            st.session_state.pop("auto_alt_ultimo", None)
        if alvo_alt != atuais:
            st.session_state["alt_drag"] = {
                "g": g_nome,
                # so as reguas que mudaram (nao arredonda as outras)
                "vals": [(m, i, a) for m, alts in enumerate(alvo_alt)
                         for i, a in enumerate(alts)
                         if abs(float(a) - float(mods[m]["alturas"][i]))
                         > 0.05]}
            st.session_state["msg_novo"] = (
                txt_alt or "Alturas das réguas voltaram ao que eram "
                           "(este recorte não tem produto mais alto "
                           "que a régua).")
            st.rerun()

    forcar = st.session_state.pop("forcar_reset", False)
    if st.session_state.get("plan_key") != chave or forcar:
        prod_info = build_prod_info(
            pd.concat([recorte, cat_extra], ignore_index=True))
        st.session_state.prod_info = prod_info
        try:
            salvo = None if forcar else carregar_plano_salvo(
                loja, nivel, recorte_chave, g_chave, slots,
                lambda e: _f(prod_info.get(e, {}).get("largura_cm")) or 0.0)
        except Exception as err:
            salvo = None
            st.warning("Nao consegui ler o arranjo salvo. Se ainda nao "
                       "rodou o SQL da v7.22, rode no SQL Editor:\n\n"
                       "ALTER TABLE layout_planograma ADD COLUMN IF NOT "
                       f"EXISTS modulo int NOT NULL DEFAULT 1;\n\n"
                       f"Detalhe: {err}")
        if salvo:
            shelves, fora = salvo
            _, _, resumo = semear_plano(recorte, slots, col_nivel, ordem_rec)
            origem = "salvo"
        else:
            shelves, fora, resumo = semear_plano(recorte, slots, col_nivel,
                                                 ordem_rec)
            origem = "automatico"
        presentes = ({e["ean"] for sh in shelves for e in sh}
                     | {i["ean"] for i in fora})
        for ean in cat_extra["ean"].astype(str):
            if ean not in presentes:
                fora.append({"ean": ean, "motivo": "sem venda (catalogo)"})
        st.session_state.plan = {
            "loja": loja, "nivel": nivel, "recorte": recorte_chave,
            "gondola": g_chave, "modulos": n_mod,
            "slots": slots, "num_prat": len(slots),
            "largura_prat": largura_prat,
            "altura_prat": altura_prat, "shelves": shelves, "fora": fora,
            "alturas": fl.alturas(slots)}
        st.session_state.resumo = resumo
        st.session_state.origem = origem
        st.session_state.plan_key = chave
        # v7.41 - ponto de partida do "nao salvo" e do Desfazer
        st.session_state["plan_base"] = _estado_plan(st.session_state.plan)
        st.session_state["hist"] = []

    plan = st.session_state.plan
    plan["escala"] = escala
    plan["gondola"] = g_chave
    prod_info = st.session_state.prod_info

    # v7.22 - mexeu na largura / nº de reguas / altura de algum modulo?
    # reencaixa o que ja esta montado nos slots novos, sem re-semear
    if [(x["mod"], x["reg"], x["larg"], x["alt"]) for x in plan["slots"]] \
            != [(x["mod"], x["reg"], x["larg"], x["alt"]) for x in slots]:
        n_cort = reencaixar_slots(
            plan, slots,
            lambda e: _f(prod_info.get(e, {}).get("largura_cm")) or 0.0)
        st.session_state["hist"] = []     # v7.41 - snapshot nao serve mais
        if n_cort:
            st.session_state["msg_novo"] = (
                f"{n_cort} item(ns) foram pro Banco - a fileira encolheu.")
    num_prat = len(plan["shelves"])

    # v7.41 - DESFAZER: volta pro estado anterior do historico. O contador
    # entra na rev, entao o canvas repinta com o estado restaurado (e o
    # valor antigo que ele ainda guarda, de rev velha, e ignorado).
    hist = st.session_state.setdefault("hist", [])
    if desfazer and hist:
        ant = json.loads(hist.pop())
        if len(ant[0]) == num_prat:
            plan["shelves"], plan["fora"] = ant[0], ant[1]
        st.session_state["undo_n"] = st.session_state.get("undo_n", 0) + 1

    tag = ("\U0001F7E2 arranjo automatico" if st.session_state.origem == "automatico"
           else "\U0001F4BE arranjo salvo")
    extra_admin = ("DOIS CLIQUES no produto pra editar dimensoes/foto. "
                   if eh_admin else "")
    st.caption(f"{tag} - arraste os produtos na gondola; estique a alcinha da "
               "direita pra somar frentes; arraste pro Banco pra tirar. "
               "Arraste a tarja laranja pra cima/baixo pra mudar a altura "
               f"da regua. {extra_admin}Clique em Salvar para gravar.")
    txt_base = bp.texto_stats(base_stats)          # v7.21
    if txt_base:
        st.caption("\U0001F4C4 " + txt_base)

    metricas_ph = st.container()
    fileira = (f"{g_nome}" if n_mod == 1
               else (f"{g_nome} x{n_mod} modulos "
                     f"({fl.composicao(mods)} \u2014 {largura_desenho:.0f} cm)"))
    chips_recorte(recorte_chave, loja, mods, n_mod)     # v7.40

    # ---- canvas drag-and-drop ----
    edit_nonce = st.session_state.get("edit_nonce", 0)
    # v7.22 - a composicao entra na rev: mexer so numa largura tem que
    # repintar o canvas, e ela nao aparece no nº de reguas nem na altura
    rev = (f"{perfil[0]}-{nonce}-{edit_nonce}-"
           f"u{st.session_state.get('undo_n', 0)}-{num_prat}-{escala}-"
           f"{fl.composicao(mods)}-"
           f"{'x'.join(f'{a:g}' for a in plan['alturas'])}-"
           f"{'-'.join(map(str, chave))}")
    payload = montar_payload(plan, prod_info, rev, edita=eh_admin,
                             ajusta_alt=True,
                             titulo=" + ".join(ordem_rec or escolhas))          # v7.24
    val = _gondola_dnd(data=payload, key=f"dnd_{chave}_{num_prat}_{nonce}",
                       default=None)
    if val and isinstance(val, dict) and val.get("rev") == rev:
        antes = _estado_plan(plan)
        aplicar_retorno(plan, val, num_prat)
        if _estado_plan(plan) != antes:            # v7.41 - Desfazer
            hist.append(antes)
            del hist[:-30]
        # v7.23 - a tarja laranja virou alca de altura: o canvas devolve
        # uma altura por slot. Quem manda continua sendo a sidebar, entao
        # o valor e escrito nos campos dela e a tela recarrega uma vez.
        alt_novas = val.get("alturas")
        if (isinstance(alt_novas, list)          # v7.24 - os dois perfis
                and len(alt_novas) == len(plan["slots"])
                and any(abs(float(a) - float(b)) > 0.4
                        for a, b in zip(alt_novas, plan["alturas"]))):
            st.session_state["alt_drag"] = {
                "g": g_nome,
                "vals": [(int(sl["mod"]), int(sl["reg"]), round(float(a)))
                         for sl, a in zip(plan["slots"], alt_novas)]}
            st.rerun()
        ed = val.get("edit") or {}
        if (eh_admin and ed.get("ean")
                and ed.get("t") != st.session_state.get("edit_token")):
            st.session_state["edit_token"] = ed.get("t")
            st.session_state["editar_ean"] = str(ed["ean"])

    if eh_admin and st.session_state.get("editar_ean"):
        dialog_editar(st.session_state["editar_ean"])

    msg = st.session_state.pop("msg_novo", None)
    if msg:
        st.toast(msg, icon="\u2705")

    if salvar:
        try:
            with st.spinner("Salvando..."):
                salvar_plano(plan)
            st.session_state.origem = "salvo"
            st.session_state["plan_base"] = _estado_plan(plan)   # v7.41
            st.success("Arranjo salvo no Supabase.")
        except Exception as err:
            st.error("Falha ao salvar. Se ainda nao rodou o SQL da "
                     "v7.22, rode no SQL Editor:\n\n"
                     "ALTER TABLE layout_planograma ADD COLUMN IF NOT "
                     f"EXISTS modulo int NOT NULL DEFAULT 1;\n\n"
                     f"Detalhe: {err}")

    # v7.41 - rodape de acoes, ja sabendo se ha alteracao nao salva
    render_acoes(sujo=_estado_plan(plan) != st.session_state.get("plan_base"),
                 pode_desfazer=bool(hist))

    # ---- metricas (apos as edicoes) ----
    skus = len({e["ean"] for sh in plan["shelves"] for e in sh})
    frentes = sum(int(e["frentes"]) for sh in plan["shelves"] for e in sh)
    usado = sum(ocupacao_cm(sh, prod_info) for sh in plan["shelves"])
    total = fl.capacidade(plan["slots"])
    sem_foto = len({e["ean"] for sh in plan["shelves"] for e in sh
                    if not prod_info.get(e["ean"], {}).get("foto_url")})
    # v7.21 - quantos itens do Banco estao sem medida. E a fila de
    # trabalho do app de dimensoes / da planilha do comercial.
    sem_dim = len({i["ean"] for i in plan["fora"]
                   if _f(prod_info.get(i["ean"], {}).get("largura_cm")) is None
                   or _f(prod_info.get(i["ean"], {}).get("altura_cm")) is None})
    ocup_txt = f"{usado / total:.0%}" if total else "-"
    with metricas_ph:                                   # v7.40
        cards_metricas(skus, frentes, (usado / total) if total else None,
                       sem_foto, sem_dim)

    # ---- visualizacao estatica + exportar (imprimir / PDF / HTML) ----
    with st.expander("\U0001F5A8\uFE0F Visualizacao estatica \u2014 imprimir "
                     "ou salvar em PDF"):
        titulo_imp = f"Planograma \u2014 {recorte_chave}"
        sub_imp = (f"Loja {loja} \u00b7 {fileira} \u00b7 "
                   f"{len(plan['shelves'])} r\u00e9guas em "
                   f"{n_mod} m\u00f3dulo(s) \u00b7 "
                   f"{fl.altura_total(mods):g} cm de altura \u00b7 "
                   f"gerado em {agora_br():%d/%m/%Y %H:%M}")
        metricas_imp = (("SKUs", skus), ("Frentes", frentes),
                        ("Ocupa\u00e7\u00e3o", ocup_txt),
                        ("Sem foto", sem_foto))
        nome_arq = _slug(f"planograma_{loja}_{recorte_chave}_{g_chave}")
        papel = st.radio("Papel (sempre retrato)", list(PAPEIS),
                         horizontal=True, key=f"papel_{chave}",
                         help="A fileira inteira e dimensionada pra caber na "
                              "largura da folha. Fileira longa (varios "
                              "modulos) fica mais legivel em A3.")
        uma_folha = st.checkbox("Caber em uma folha", value=True,
                                key=f"folha_{chave}",
                                help="Diminui a escala tambem pela altura "
                                     "pra gondola inteira sair numa folha. "
                                     "Desmarque pra imprimir maior, aceitando "
                                     "quebrar em mais paginas.")
        esc_imp = escala_impressao(plan["slots"], papel, uma_folha)
        bloco_exportar(plan, prod_info, titulo_imp, sub_imp,
                       metricas_imp, nome_arq, papel, uma_folha)
        st.caption(f"Sai igualzinho ao quadro abaixo \u2014 {papel}, escala "
                   f"{esc_imp} px/cm para {largura_desenho:.0f} cm de "
                   f"frente \u2014 com as "
                   "fotos, as faixas e a ocupa\u00e7\u00e3o de cada "
                   "r\u00e9gua. Reflete tamb\u00e9m os ajustes que "
                   "voc\u00ea acabou de fazer arrastando.")
        st.markdown(desenhar(plan, prod_info), unsafe_allow_html=True)

    resumo = st.session_state.get("resumo")
    if resumo is not None and not resumo.empty:
        with st.expander("\U0001F4D0 Distribuicao sugerida por subcategoria (% Delta)"):
            st.caption("Referencia do calculo automatico (nao reflete edicoes).")
            st.dataframe(resumo, use_container_width=True, hide_index=True)


if __name__ == "__main__":
    main()
