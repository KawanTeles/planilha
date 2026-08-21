-- Schema Postgres para o Supabase, equivalente ao schema SQLite anterior (server/src/db.js).
-- "ABA / Prompt" já nasce separado em "ABA" e "Prompt" (pedido de tela de Produção de Terapeutas).

create table if not exists administradores (
  id bigint generated always as identity primary key,
  email text not null unique,
  senha_hash text not null,
  criado_em timestamptz not null default now()
);

create table if not exists meta (
  chave text primary key,
  valor text not null
);

insert into meta (chave, valor) values ('sistema', 'Desenvolva')
  on conflict (chave) do update set valor = excluded.valor;
insert into meta (chave, valor) values ('db_iniciado_em', now()::text)
  on conflict (chave) do nothing;

create table if not exists terapeutas (
  id bigint generated always as identity primary key,
  nome text not null,
  especialidade text not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  data_nascimento text,
  email text,
  senha_hash text,
  excluido boolean not null default false,
  criado_em timestamptz not null default now()
);

insert into terapeutas (nome, especialidade)
select nome, especialidade from (values
  ('Eduarda Michaeli', 'Terapeuta Ocupacional'),
  ('Gabriele Souza', 'Terapeuta Ocupacional'),
  ('Jeaniquel Félix', 'Terapeuta Ocupacional'),
  ('Letícia Nascimento', 'Fonoaudióloga'),
  ('Letícia Laurindo', 'Fonoaudióloga'),
  ('Yasmin Alves', 'Psicóloga'),
  ('Caroline Costa', 'Psicóloga'),
  ('Victória Áreas', 'Psicóloga'),
  ('Luísa Ferreira', 'Psicopedagoga'),
  ('Cheyenne Monteiro', 'Psicopedagoga')
) as seed(nome, especialidade)
where not exists (select 1 from terapeutas);

create table if not exists colaboradores (
  id bigint generated always as identity primary key,
  nome text not null,
  cargo text not null,
  tipo_pagamento text not null check (tipo_pagamento in ('fixo', 'variavel')),
  valor_base numeric not null default 0,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  data_nascimento text,
  email text,
  senha_hash text,
  excluido boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists parcelas (
  id bigint generated always as identity primary key,
  descricao text not null,
  valor_total numeric not null,
  quantidade_parcelas integer not null,
  mes_inicio integer not null check (mes_inicio between 1 and 12),
  ano_inicio integer not null,
  criado_em timestamptz not null default now()
);

create table if not exists parcelas_lancamentos (
  id bigint generated always as identity primary key,
  parcela_id bigint not null references parcelas(id) on delete cascade,
  numero_parcela integer not null,
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  valor numeric not null,
  status text not null default 'pendente' check (status in ('pago', 'pendente'))
);

create table if not exists entradas (
  id bigint generated always as identity primary key,
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  categoria text not null check (categoria in ('Unimed', 'Bradesco', 'Particular', 'Sublocação de salas')),
  descricao text not null,
  valor numeric not null,
  status text not null default 'a_receber' check (status in ('recebido', 'a_receber')),
  data_recebimento text,
  criado_em timestamptz not null default now()
);

create table if not exists saidas (
  id bigint generated always as identity primary key,
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  tipo text not null check (tipo in ('fixa', 'variavel')),
  descricao text not null,
  valor numeric not null,
  status text not null default 'pendente' check (status in ('pago', 'pendente')),
  data text,
  criado_em timestamptz not null default now()
);

create table if not exists folha_pagamento (
  id bigint generated always as identity primary key,
  colaborador_id bigint not null references colaboradores(id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  valor numeric not null default 0,
  tipo_pagamento text,
  status text not null default 'pendente' check (status in ('pago', 'pendente')),
  criado_em timestamptz not null default now(),
  unique (colaborador_id, mes, ano)
);

create table if not exists repasses (
  id bigint generated always as identity primary key,
  terapeuta_id bigint not null references terapeutas(id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  ano integer not null,
  valor numeric not null default 0,
  status text not null default 'pendente' check (status in ('pago', 'pendente')),
  criado_em timestamptz not null default now(),
  unique (terapeuta_id, mes, ano)
);

create table if not exists producao_lancamentos (
  id bigint generated always as identity primary key,
  tipo_servico text not null check (
    tipo_servico in (
      'Integração Sensorial',
      'ABA',
      'Prompt',
      'Atendimento Particular',
      'Bradesco',
      'Convencional',
      'Outros valores'
    )
  ),
  data text not null,
  terapeuta_id bigint not null references terapeutas(id) on delete cascade,
  -- quantidade/valor_unitario só são preenchidos nas abas por quantidade (todas exceto
  -- "Outros valores" — Etapa 6); "valor" sempre guarda o valor TOTAL do lançamento
  -- (quantidade × valor_unitario nas abas novas, ou o valor único digitado em "Outros valores")
  quantidade integer,
  valor_unitario numeric,
  valor numeric not null,
  percentual numeric not null check (percentual >= 0 and percentual <= 100),
  valor_terapeuta numeric not null,
  valor_clinica numeric not null,
  criado_em timestamptz not null default now()
);
