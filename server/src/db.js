import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "desenvolva.sqlite3");
export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );
`);

const setMeta = db.prepare(
  "INSERT INTO meta (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor"
);
setMeta.run("sistema", "Desenvolva");
setMeta.run("db_iniciado_em", new Date().toISOString());

db.exec(`
  CREATE TABLE IF NOT EXISTS terapeutas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const TERAPEUTAS_INICIAIS = [
  ["Eduarda Michaeli", "Terapeuta Ocupacional"],
  ["Gabriele Souza", "Terapeuta Ocupacional"],
  ["Jeaniquel Félix", "Terapeuta Ocupacional"],
  ["Letícia Nascimento", "Fonoaudióloga"],
  ["Letícia Laurindo", "Fonoaudióloga"],
  ["Yasmin Alves", "Psicóloga"],
  ["Caroline Costa", "Psicóloga"],
  ["Victória Áreas", "Psicóloga"],
  ["Luísa Ferreira", "Psicopedagoga"],
  ["Cheyenne Monteiro", "Psicopedagoga"],
];

const totalTerapeutas = db.prepare("SELECT COUNT(*) AS total FROM terapeutas").get().total;
if (totalTerapeutas === 0) {
  const inserirTerapeuta = db.prepare("INSERT INTO terapeutas (nome, especialidade) VALUES (?, ?)");
  for (const [nome, especialidade] of TERAPEUTAS_INICIAIS) {
    inserirTerapeuta.run(nome, especialidade);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS colaboradores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cargo TEXT NOT NULL,
    tipo_pagamento TEXT NOT NULL CHECK (tipo_pagamento IN ('fixo', 'variavel')),
    valor_base REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS parcelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL,
    valor_total REAL NOT NULL,
    quantidade_parcelas INTEGER NOT NULL,
    mes_inicio INTEGER NOT NULL CHECK (mes_inicio BETWEEN 1 AND 12),
    ano_inicio INTEGER NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS parcelas_lancamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcela_id INTEGER NOT NULL REFERENCES parcelas(id) ON DELETE CASCADE,
    numero_parcela INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    valor REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS entradas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Unimed', 'Bradesco', 'Particular', 'Sublocação de salas')),
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'a_receber' CHECK (status IN ('recebido', 'a_receber')),
    data_recebimento TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS saidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('fixa', 'variavel')),
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente')),
    data TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS folha_pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    colaborador_id INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    valor REAL NOT NULL DEFAULT 0,
    tipo_pagamento TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (colaborador_id, mes, ano)
  );
`);

// migração: bancos criados antes desta coluna existir ganham ela via ALTER TABLE.
// tipo_pagamento agora é gravado na própria linha do mês (não buscado ao vivo do
// cadastro), para que mudar o tipo de um colaborador não reclassifique
// retroativamente os meses de folha já lançados.
const colunasFolha = db.prepare("PRAGMA table_info(folha_pagamento)").all().map((c) => c.name);
if (!colunasFolha.includes("tipo_pagamento")) {
  db.exec("ALTER TABLE folha_pagamento ADD COLUMN tipo_pagamento TEXT");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS repasses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    terapeuta_id INTEGER NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    valor REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente')),
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (terapeuta_id, mes, ano)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS producao_lancamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_servico TEXT NOT NULL CHECK (
      tipo_servico IN (
        'Integração Sensorial',
        'ABA / Prompt',
        'Atendimento Particular',
        'Bradesco',
        'Convencional',
        'Outros valores'
      )
    ),
    data TEXT NOT NULL,
    terapeuta_id INTEGER NOT NULL REFERENCES terapeutas(id) ON DELETE CASCADE,
    valor REAL NOT NULL,
    percentual REAL NOT NULL CHECK (percentual >= 0 AND percentual <= 100),
    valor_terapeuta REAL NOT NULL,
    valor_clinica REAL NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
