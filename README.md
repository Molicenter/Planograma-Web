# Planograma Web (Molicenter)

Nova versão do Planograma em HTML/CSS/JavaScript, para o GitHub Pages, no
mesmo modelo do QL Web, do Promotores e do Portal de Pedidos. Substitui o app
Streamlit (`Molicenter/Planograma`, `planograma.py` v7.42).

## Estrutura

```
docs/            o que vai pro GitHub Pages
  motor.js       o MOTOR (frentes + arranjo automático), traduzido do Python
ref/             cópia do app Streamlit original (só referência e teste)
test/
  paridade.js    compara motor.js com o planograma.py original
  ref_runner.py  roda o motor original (com streamlit/supabase "de mentira")
  fixtures_*.json dados reais da layout_base usados no teste
```

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
