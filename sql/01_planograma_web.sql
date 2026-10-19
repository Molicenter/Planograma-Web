-- =====================================================================
-- Planograma Web (Molicenter) - banco do app web (GitHub Pages)
-- Mesmo padrao do QL Web: o navegador so chama as funcoes plano_web_*,
-- todas SECURITY DEFINER e todas (menos o login) exigem o token da sessao.
-- As tabelas do Streamlit (layout_planograma, layout_gondolas, dim_produtos,
-- views layout_*) NAO mudam: os dois apps leem e gravam as mesmas.
-- Usuarios: tabela plano_web_usuarios (o Administrador cria/edita pelo app).
-- O fim deste arquivo cria os dois usuarios de hoje (Administrador e Usuario).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- login ----------
create table if not exists plano_web_usuarios (
  nome          text primary key,          -- o que aparece na lista do login
  perfil        text not null check (perfil in ('admin', 'usuario')),
  senha_hash    text not null,             -- bcrypt (crypt + gen_salt('bf'))
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create table if not exists plano_web_sessoes (
  token     uuid primary key default gen_random_uuid(),
  usuario   text not null,
  perfil    text not null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null
);
create table if not exists plano_web_tentativas (
  id      bigserial primary key,
  usuario text,
  ok      boolean not null,
  em      timestamptz not null default now()
);

-- ---------- base de ativos (o antigo produtos.xlsx do repositorio) ----------
create table if not exists plano_web_base_produtos (
  chave           text primary key,      -- EAN quando ha, senao o codigo interno
  ean             text,
  codigo_erp      text,
  descricao       text,
  categoria       text,
  subcategoria    text,
  marca           text,
  largura_cm      double precision,
  altura_cm       double precision,
  profundidade_cm double precision,
  cat_norm        text,                  -- minusculo, sem acento (mesmo _norm do base_produtos.py)
  sub_norm        text
);
create index if not exists plano_web_base_cat on plano_web_base_produtos (cat_norm);
create index if not exists plano_web_base_sub on plano_web_base_produtos (sub_norm);
create table if not exists plano_web_importacoes (
  id      bigserial primary key,
  em      timestamptz not null default now(),
  usuario text,
  arquivo text,
  linhas  int,
  com_dim int
);

alter table plano_web_usuarios      enable row level security;
alter table plano_web_sessoes       enable row level security;
alter table plano_web_tentativas    enable row level security;
alter table plano_web_base_produtos enable row level security;
alter table plano_web_importacoes   enable row level security;
-- sem politica nenhuma: so as funcoes abaixo (SECURITY DEFINER) enxergam

-- ---------- sessao ----------
create or replace function _plano_web_perfil(p_token uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v text;
begin
  update plano_web_sessoes s set expira_em = greatest(s.expira_em, now() + interval '12 hours')
    from plano_web_usuarios u
   where s.token = p_token and s.expira_em > now() and u.nome = s.usuario and u.ativo
  returning u.perfil into v;
  if v is null then raise exception 'SESSAO_INVALIDA'; end if;
  return v;
end $$;

create or replace function plano_web_login(p_usuario text, p_senha text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_perfil text; v_hash text; v_token uuid;
begin
  if (select count(*) from plano_web_tentativas
       where usuario = p_usuario and not ok and em > now() - interval '10 minutes') >= 8 then
    raise exception 'MUITAS_TENTATIVAS';
  end if;
  select perfil, senha_hash into v_perfil, v_hash
    from plano_web_usuarios where nome = p_usuario and ativo;
  if v_perfil is null then raise exception 'USUARIO_INVALIDO'; end if;
  if v_hash <> crypt(coalesce(trim(p_senha), ''), v_hash) then
    insert into plano_web_tentativas (usuario, ok) values (p_usuario, false);
    raise exception 'SENHA_INCORRETA';
  end if;
  insert into plano_web_tentativas (usuario, ok) values (p_usuario, true);
  delete from plano_web_sessoes where expira_em < now();
  delete from plano_web_tentativas where em < now() - interval '30 days';
  insert into plano_web_sessoes (usuario, perfil, expira_em)
  values (p_usuario, v_perfil, now() + interval '18 hours')
  returning token into v_token;
  return json_build_object('token', v_token, 'usuario', p_usuario, 'perfil', v_perfil);
end $$;

-- lista do login (so os nomes ativos - nada de perfil nem senha)
create or replace function plano_web_lista_usuarios()
returns json language sql security definer set search_path = public as $$
  select coalesce(json_agg(nome order by (perfil <> 'admin'), nome), '[]')
    from plano_web_usuarios where ativo;
$$;

create or replace function plano_web_sair(p_token uuid)
returns void language sql security definer set search_path = public as $$
  delete from plano_web_sessoes where token = p_token;
$$;

-- ---------- carga inicial: gondolas, lojas x categorias, base ----------
create or replace function plano_web_inicio(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_perfil text := _plano_web_perfil(p_token);
begin
  return json_build_object(
    'perfil', v_perfil,
    'gondolas', (select coalesce(json_agg(json_build_object(
        'nome', nome, 'largura_cm', largura_cm, 'num_prateleiras', num_prateleiras,
        'altura_prateleira_cm', altura_prateleira_cm, 'alturas_cm', alturas_cm) order by nome), '[]')
       from layout_gondolas),
    'opcoes', (select coalesce(json_agg(json_build_array(loja, categoria, subcategoria)), '[]')
       from layout_opcoes),
    'base', json_build_object(
       'total', (select count(*) from plano_web_base_produtos),
       'com_dim', (select count(*) from plano_web_base_produtos where largura_cm is not null),
       'ultima', (select row_to_json(x) from (select em, usuario, arquivo, linhas
                    from plano_web_importacoes order by em desc limit 1) x)));
end $$;

-- ---------- o recorte aberto: vendas + cadastro + base de ativos ----------
-- p_col = 'categoria' ou 'subcategoria'; p_norm = as escolhas ja normalizadas
create or replace function plano_web_recorte(p_token uuid, p_loja text, p_col text,
                                             p_escolhas text[], p_norm text[])
returns json language plpgsql security definer set search_path = public as $$
declare v_perfil text := _plano_web_perfil(p_token);
begin
  if p_col not in ('categoria', 'subcategoria') then raise exception 'NIVEL_INVALIDO'; end if;
  return json_build_object(
    'recorte', (select coalesce(json_agg(json_build_array(b.ean, b.qtde, b.venda, b.margem, b.descricao,
                  b.marca, b.categoria, b.subcategoria, b.largura_cm, b.altura_cm, b.profundidade_cm,
                  b.foto_url, p.codigo_erp) order by b.ean), '[]')
        from layout_base b left join dim_produtos p on p.ean = b.ean
       where b.loja = p_loja
         and (case when p_col = 'categoria' then b.categoria else b.subcategoria end) = any(p_escolhas)),
    'catalogo', (select coalesce(json_agg(json_build_array(ean, descricao, marca, categoria, subcategoria,
                  largura_cm, altura_cm, profundidade_cm, foto_url, codigo_erp) order by ean), '[]')
        from dim_produtos
       where (case when p_col = 'categoria' then categoria else subcategoria end) = any(p_escolhas)),
    'base', (select coalesce(json_agg(json_build_array(chave, ean, codigo_erp, descricao, categoria,
                  subcategoria, marca, largura_cm, altura_cm, profundidade_cm) order by chave), '[]')
        from plano_web_base_produtos
       where (case when p_col = 'categoria' then cat_norm else sub_norm end) = any(p_norm)));
end $$;

-- ---------- arranjo salvo (mesma tabela do Streamlit) ----------
create or replace function plano_web_plano_salvo(p_token uuid, p_loja text, p_nivel text,
                                                 p_recorte text, p_gondola text)
returns json language plpgsql security definer set search_path = public as $$
declare v_perfil text := _plano_web_perfil(p_token);
begin
  return (select coalesce(json_agg(json_build_array(modulo, prateleira, ordem, ean, frentes)
                 order by prateleira, ordem, modulo), '[]')
            from layout_planograma
           where loja = p_loja and nivel = p_nivel and recorte = p_recorte and gondola = p_gondola);
end $$;

create or replace function plano_web_salvar(p_token uuid, p_loja text, p_nivel text,
                                            p_recorte text, p_gondola text, p_rows jsonb)
returns json language plpgsql security definer set search_path = public as $$
declare v_perfil text := _plano_web_perfil(p_token);
begin
  -- apagar+inserir numa transacao so, trancado por loja/nivel/recorte/gondola (v7.29)
  perform layout_planograma_substituir(p_loja, p_nivel, p_recorte, p_gondola, p_rows);
  return json_build_object('ok', true, 'linhas', jsonb_array_length(p_rows));
end $$;

-- ---------- admin: molde de alturas da gondola ----------
create or replace function plano_web_gondola_alturas(p_token uuid, p_nome text, p_alturas text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _plano_web_perfil(p_token) <> 'admin' then raise exception 'SEM_PERMISSAO'; end if;
  update layout_gondolas set alturas_cm = nullif(trim(p_alturas), '') where nome = p_nome;
end $$;

-- ---------- admin: medidas do produto (dois cliques) ----------
-- p: {ean, largura_cm, altura_cm, profundidade_cm, descricao, marca, categoria, subcategoria, codigo_erp}
create or replace function plano_web_produto_medidas(p_token uuid, p json)
returns json language plpgsql security definer set search_path = public as $$
declare v_ean text := trim(p->>'ean');
        v_l numeric := nullif(p->>'largura_cm', '')::numeric;
        v_a numeric := nullif(p->>'altura_cm', '')::numeric;
        v_p numeric := nullif(p->>'profundidade_cm', '')::numeric;
begin
  if _plano_web_perfil(p_token) <> 'admin' then raise exception 'SEM_PERMISSAO'; end if;
  if coalesce(v_ean, '') = '' then raise exception 'EAN_VAZIO'; end if;
  if v_l <= 0 then v_l := null; end if;
  if v_a <= 0 then v_a := null; end if;
  if v_p <= 0 then v_p := null; end if;
  if exists (select 1 from dim_produtos where ean = v_ean) then
    update dim_produtos set largura_cm = v_l, altura_cm = v_a, profundidade_cm = v_p,
                            fonte_dimensao = 'manual'
     where ean = v_ean;
  else
    -- produto vindo so da base de ativos: cria a linha (v7.21)
    insert into dim_produtos (ean, descricao, marca, categoria, subcategoria, codigo_erp,
                              largura_cm, altura_cm, profundidade_cm, fonte_dimensao)
    values (v_ean, coalesce(nullif(p->>'descricao', ''), v_ean), nullif(p->>'marca', ''),
            nullif(p->>'categoria', ''), nullif(p->>'subcategoria', ''), nullif(p->>'codigo_erp', ''),
            v_l, v_a, v_p, 'manual');
  end if;
  return (select json_build_object('largura_cm', largura_cm, 'altura_cm', altura_cm,
                                   'profundidade_cm', profundidade_cm)
            from dim_produtos where ean = v_ean);
end $$;

-- ---------- admin: importar a base de ativos (produtos.xlsx) ----------
-- p_linhas: [[chave, ean, codigo_erp, descricao, categoria, subcategoria, marca,
--             largura, altura, profundidade, cat_norm, sub_norm], ...]
-- p_gravar = false so devolve o resumo (pra conferir antes de gravar)
create or replace function plano_web_base_importar(p_token uuid, p_linhas json, p_arquivo text,
                                                   p_gravar boolean)
returns json language plpgsql security definer set search_path = public as $$
declare v_res json;
begin
  if _plano_web_perfil(p_token) <> 'admin' then raise exception 'SEM_PERMISSAO'; end if;
  if json_array_length(p_linhas) = 0 then raise exception 'ARQUIVO_VAZIO'; end if;
  create temp table _nova on commit drop as
    select x->>0 chave, x->>1 ean, x->>2 codigo_erp, x->>3 descricao, x->>4 categoria,
           x->>5 subcategoria, x->>6 marca, (x->>7)::double precision largura_cm,
           (x->>8)::double precision altura_cm, (x->>9)::double precision profundidade_cm,
           x->>10 cat_norm, x->>11 sub_norm
      from json_array_elements(p_linhas) x;
  select json_build_object(
    'linhas', (select count(*) from _nova),
    'com_dim', (select count(*) from _nova where largura_cm is not null),
    'atual', (select count(*) from plano_web_base_produtos),
    'novos', (select count(*) from _nova n where not exists (select 1 from plano_web_base_produtos b where b.chave = n.chave)),
    'sairam', (select count(*) from plano_web_base_produtos b where not exists (select 1 from _nova n where n.chave = b.chave)),
    'categorias', (select count(distinct cat_norm) from _nova),
    'subcategorias', (select count(distinct sub_norm) from _nova)) into v_res;
  if p_gravar then
    delete from plano_web_base_produtos;
    insert into plano_web_base_produtos select distinct on (chave) * from _nova where coalesce(chave, '') <> '';
    insert into plano_web_importacoes (usuario, arquivo, linhas, com_dim)
    values ((select usuario from plano_web_sessoes where token = p_token), p_arquivo, (v_res->>'linhas')::int, (v_res->>'com_dim')::int);
  end if;
  return v_res;
end $$;

create or replace function plano_web_base_historico(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  perform _plano_web_perfil(p_token);
  return (select coalesce(json_agg(row_to_json(x)), '[]') from
          (select em, usuario, arquivo, linhas, com_dim from plano_web_importacoes order by em desc limit 10) x);
end $$;

-- ---------- admin: usuarios ----------
create or replace function plano_web_usuarios_lista(p_token uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if _plano_web_perfil(p_token) <> 'admin' then raise exception 'SEM_PERMISSAO'; end if;
  return (select coalesce(json_agg(json_build_object('nome', u.nome, 'perfil', u.perfil, 'ativo', u.ativo,
            'criado_em', u.criado_em, 'atualizado_em', u.atualizado_em,
            'ultimo_acesso', (select max(em) from plano_web_tentativas t where t.usuario = u.nome and t.ok))
            order by (u.perfil <> 'admin'), u.nome), '[]')
            from plano_web_usuarios u);
end $$;

-- cria (p_novo = true) ou edita um usuario. p_senha vazia na edicao = mantem a senha.
-- Renomear: p_nome_antigo = nome atual, p_nome = nome novo.
create or replace function plano_web_usuario_salvar(p_token uuid, p_nome_antigo text, p_nome text,
                                                    p_perfil text, p_ativo boolean, p_senha text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_eu text; v_nome text := trim(coalesce(p_nome, ''));
        v_antigo text := nullif(trim(coalesce(p_nome_antigo, '')), '');
begin
  if _plano_web_perfil(p_token) <> 'admin' then raise exception 'SEM_PERMISSAO'; end if;
  select usuario into v_eu from plano_web_sessoes where token = p_token;
  if v_nome = '' then raise exception 'NOME_VAZIO'; end if;
  if p_perfil not in ('admin', 'usuario') then raise exception 'PERFIL_INVALIDO'; end if;
  if v_antigo is null then                                   -- novo
    if exists (select 1 from plano_web_usuarios where lower(nome) = lower(v_nome)) then
      raise exception 'USUARIO_EXISTE';
    end if;
    if length(coalesce(trim(p_senha), '')) < 4 then raise exception 'SENHA_CURTA'; end if;
    insert into plano_web_usuarios (nome, perfil, senha_hash, ativo)
    values (v_nome, p_perfil, crypt(trim(p_senha), gen_salt('bf')), coalesce(p_ativo, true));
  else                                                       -- edicao
    if not exists (select 1 from plano_web_usuarios where nome = v_antigo) then raise exception 'USUARIO_INVALIDO'; end if;
    if v_nome <> v_antigo and exists (select 1 from plano_web_usuarios where lower(nome) = lower(v_nome)) then
      raise exception 'USUARIO_EXISTE';
    end if;
    -- nunca deixa o sistema sem administrador ativo, nem o admin se trancar pra fora
    if (p_perfil <> 'admin' or not coalesce(p_ativo, true))
       and (select perfil from plano_web_usuarios where nome = v_antigo) = 'admin'
       and (select count(*) from plano_web_usuarios where perfil = 'admin' and ativo and nome <> v_antigo) = 0 then
      raise exception 'ULTIMO_ADMIN';
    end if;
    if v_antigo = v_eu and not coalesce(p_ativo, true) then raise exception 'NAO_DESATIVA_A_SI'; end if;
    if coalesce(trim(p_senha), '') <> '' and length(trim(p_senha)) < 4 then raise exception 'SENHA_CURTA'; end if;
    update plano_web_usuarios
       set nome = v_nome, perfil = p_perfil, ativo = coalesce(p_ativo, true), atualizado_em = now(),
           senha_hash = case when coalesce(trim(p_senha), '') <> '' then crypt(trim(p_senha), gen_salt('bf'))
                             else senha_hash end
     where nome = v_antigo;
    update plano_web_sessoes set usuario = v_nome where usuario = v_antigo;
    -- quem foi desativado ou perdeu o perfil cai na proxima chamada
    if not coalesce(p_ativo, true) then delete from plano_web_sessoes where usuario = v_nome; end if;
    update plano_web_sessoes set perfil = p_perfil where usuario = v_nome;
  end if;
  return json_build_object('ok', true);
end $$;

-- o app web so chama as funcoes; a funcao interna de sessao nao fica exposta
revoke all on function _plano_web_perfil(uuid) from public, anon, authenticated;
grant execute on function plano_web_login(text, text), plano_web_lista_usuarios(), plano_web_sair(uuid), plano_web_inicio(uuid),
  plano_web_recorte(uuid, text, text, text[], text[]), plano_web_plano_salvo(uuid, text, text, text, text),
  plano_web_salvar(uuid, text, text, text, text, jsonb), plano_web_gondola_alturas(uuid, text, text),
  plano_web_produto_medidas(uuid, json), plano_web_base_importar(uuid, json, text, boolean),
  plano_web_base_historico(uuid), plano_web_usuarios_lista(uuid),
  plano_web_usuario_salvar(uuid, text, text, text, boolean, text)
  to anon, authenticated;

-- ---------- usuarios iniciais (as senhas de hoje do Streamlit) ----------
-- Depois o Administrador cria, edita e troca senha pela tela Usuarios do app.
insert into plano_web_usuarios (nome, perfil, senha_hash) values
  ('Administrador', 'admin',   extensions.crypt('moli012345', extensions.gen_salt('bf'))),
  ('Usuário',       'usuario', extensions.crypt('moli1234',   extensions.gen_salt('bf')))
on conflict (nome) do nothing;
