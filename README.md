# Planograma Web (Molicenter)

Nova versão do Planograma em HTML/CSS/JavaScript, para o GitHub Pages, no
mesmo modelo do QL Web, do Promotores e do Portal de Pedidos. Substitui o app
Streamlit (`Molicenter/Planograma`, `planograma.py` v7.42).

## Publicar

1. Suba este repositório como `Molicenter/Planograma-Web`.
2. Settings → Pages → *Deploy from a branch* → `main` / pasta `/docs`.
3. O banco já foi preparado com `sql/01_planograma_web.sql` (rodar de novo não estraga nada).

Endereço: `https://molicenter.github.io/Planograma-Web/`

## Estrutura

```
docs/                o que vai pro GitHub Pages
  index.html         casca (login + menu), no visual do QL Web
  app.js             telas: Planograma, Base de ativos, Usuários
  motor.js           o MOTOR (frentes + arranjo automático), traduzido do Python
  gondola.js         o canvas de arrastar (era o gondola_dnd/index.html)
  base.js            base de ativos (era o base_produtos.py)
  config.js          endereço e chave PÚBLICA do Supabase
sql/
  01_planograma_web.sql  tabelas plano_web_* e funções (login, recorte, salvar…)
ref/                 cópia do app Streamlit original (só referência e teste)
test/
  paridade.js        compara motor.js com o planograma.py original
  ref_runner.py      roda o motor original (com streamlit/supabase "de mentira")
  fixtures_*.json    dados reais da layout_base usados no teste
  e2e/               teste do app inteiro num navegador, com um Supabase local
```

## Banco

O app web lê e grava as **mesmas tabelas** do Streamlit (`layout_planograma`,
`layout_gondolas`, `dim_produtos`, views `layout_*`), então um arranjo salvo
num aparece no outro. Tudo passa pelas funções `plano_web_*` (SECURITY
DEFINER, exigem o token do login). Tabelas novas, só do app web:

- `plano_web_usuarios` — logins (bcrypt). O Administrador cria/edita pela tela Usuários.
- `plano_web_sessoes`, `plano_web_tentativas` — sessão de 18 h e bloqueio de 10 min após 8 erros.
- `plano_web_base_produtos`, `plano_web_importacoes` — a base de ativos (o antigo `produtos.xlsx`).

Perfis: **Administrador** edita medidas (dois cliques), grava o molde de
alturas da gôndola, importa a base e cuida dos usuários; **Usuário** monta,
arrasta e salva os arranjos (inclusive mexe na altura das réguas).

## O que ficou pra próxima etapa

- Trocar a FOTO do produto (com remoção de fundo) — precisa de uma função no
  Supabase pra subir a imagem com segurança.
- "Cadastrar novo item" (produto com venda que não existe na dim_produtos).

## O motor

`docs/motor.js` é a tradução função a função do motor do `planograma.py`
v7.42 e do `fileira.py` v7.22: classes de tamanho, territórios, faixas por
marca, espelho, gigante, repescagem, corte de frentes, preenchimento por
delta, acabamento local, categorias que não se misturam, marca junta em
fileira de vários módulos e a régua de baixo que sobe pro produto alto.
O histórico de cada regra continua documentado no `ref/planograma.py`.

Roda no navegador (`window.Motor`) e no Node (`require`), sem DOM.

### Paridade com o Python

```
node test/paridade.js [n_sinteticos] [semente]
```

Monta cenários com dados reais (Água Sanitária, Energéticos, Arroz, Lava
Roupas, Sabão em Pó/Barra/Pasta, Leite Condensado + Creme de Leite…) em
várias gôndolas (1,30 x 5, 3 módulos, fileira mista 130+100+66, a da cerveja
130x5+130x4+130x5…), mais cenários sintéticos aleatórios, roda os dois
motores e compara régua por régua. Precisa de Python com `pandas<3`
(variável `PY`).

Para o resultado bater até o último centímetro, o JS reproduz detalhes do
pandas e do Python que mudam casos de fronteira: a soma pareada do numpy,
a soma de Kahan do groupby, o `sum()` compensado do Python 3.12+, a divisão
piso `//` e o `round()` meio-para-par. Não simplifique essas funções.

**Única diferença deliberada:** quando um produto não cabe e o motor corta
frentes de quem ocupa as réguas onde ele caberia, o original desempata pela
ordem de um `set()` do Python, que muda a cada execução (o app em produção
é aleatório nesse caso). O `motor.js` desempata pela ordem de leitura das
réguas, e o teste aplica a mesma regra numa cópia do original.
