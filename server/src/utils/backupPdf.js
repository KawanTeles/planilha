import { fileURLToPath } from "node:url";
import path from "node:path";
import PDFDocument from "pdfkit";
import { query } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTE_REGULAR_PATH = path.join(__dirname, "../assets/fonts/Inter-Regular.ttf");
const FONTE_SEMIBOLD_PATH = path.join(__dirname, "../assets/fonts/Inter-SemiBold.ttf");
const FONTE_BOLD_PATH = path.join(__dirname, "../assets/fonts/Inter-Bold.ttf");
const LOGO_PATH = path.join(__dirname, "../assets/images/logo.png");

const FONTE_REGULAR = "Inter-Regular";
const FONTE_SEMIBOLD = "Inter-SemiBold";
const FONTE_BOLD = "Inter-Bold";

// mesma paleta de client/src/theme.css — cores "suaves" para fundo, tons escuros para texto
// legível sobre elas (mesmo esquema dos selos da tela)
const CORES = {
  rosa: "#fca8d8",
  rosaSuave: "#fde3f2",
  rosaTexto: "#a33564",
  azul: "#84ccfc",
  azulSuave: "#e2f4fd",
  azulTexto: "#0b67a1",
  verde: "#c0e478",
  verdeSuave: "#eff8de",
  verdeTexto: "#3b5514",
  lilas: "#d890e4",
  lilasSuave: "#f6e8fb",
  lilasTexto: "#7a2d94",
  dourado: "#d8be78",
  douradoSuave: "#f7f0e0",
  douradoTexto: "#9e750e",
  cinzaSuave: "#f1eef4",
  cinzaTexto: "#6a6473",
  textoPrincipal: "#4a4550",
  textoSuave: "#8a8590",
  borda: "#ece7f0",
  zebra: "#faf9fb",
};

const CICLO_CORES_SECAO = [
  { fundo: CORES.azulSuave, texto: CORES.azulTexto, forte: CORES.azul },
  { fundo: CORES.rosaSuave, texto: CORES.rosaTexto, forte: CORES.rosa },
  { fundo: CORES.douradoSuave, texto: CORES.douradoTexto, forte: CORES.dourado },
  { fundo: CORES.verdeSuave, texto: CORES.verdeTexto, forte: CORES.verde },
  { fundo: CORES.lilasSuave, texto: CORES.lilasTexto, forte: CORES.lilas },
];

const MESES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// --- formatação ---------------------------------------------------------

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return "—";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// datas "date-only" do Postgres chegam como string "AAAA-MM-DD" — não passar por
// new Date() (interpretaria como UTC meia-noite e poderia voltar um dia no fuso local)
function formatarData(valor) {
  if (!valor) return "—";
  const texto = String(valor).slice(0, 10);
  const [ano, mes, dia] = texto.split("-");
  if (!ano || !mes || !dia) return texto;
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(valor) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Maceio",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(data);
  const obter = (tipo) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${obter("day")}/${obter("month")}/${obter("year")} às ${obter("hour")}:${obter("minute")}`;
}

function mesAno(mes, ano) {
  const nome = MESES_ABREV[Number(mes) - 1] ?? String(mes);
  return `${nome}/${ano}`;
}

const SITUACAO_MAPA = {
  ativo: { rotulo: "Ativo", ...corBadge("verde") },
  pago: { rotulo: "Pago", ...corBadge("verde") },
  recebido: { rotulo: "Recebido", ...corBadge("verde") },
  inativo: { rotulo: "Inativo", ...corBadge("cinza") },
  pendente: { rotulo: "Pendente", ...corBadge("cinza") },
  a_receber: { rotulo: "A receber", ...corBadge("cinza") },
};

function corBadge(tom) {
  if (tom === "verde") return { fundo: CORES.verdeSuave, texto: CORES.verdeTexto };
  if (tom === "rosa") return { fundo: CORES.rosaSuave, texto: CORES.rosaTexto };
  return { fundo: CORES.cinzaSuave, texto: CORES.cinzaTexto };
}

// combina status + excluido numa única "Situação" — excluido sempre tem prioridade
function situacaoCelula(status, excluido) {
  if (excluido) return celulaBadge("Excluído", CORES.rosaSuave, CORES.rosaTexto);
  const info = SITUACAO_MAPA[status] ?? { rotulo: status ?? "—", ...corBadge("cinza") };
  return celulaBadge(info.rotulo, info.fundo, info.texto);
}

function situacaoSimplesCelula(status) {
  const info = SITUACAO_MAPA[status] ?? { rotulo: status ?? "—", ...corBadge("cinza") };
  return celulaBadge(info.rotulo, info.fundo, info.texto);
}

// --- células --------------------------------------------------------------

function celulaTexto(valor, opts = {}) {
  return {
    texto: valor === null || valor === undefined || valor === "" ? "—" : String(valor),
    align: opts.align ?? "left",
    tamanho: opts.tamanho ?? 8.5,
    negrito: opts.negrito ?? false,
    cor: opts.cor ?? CORES.textoPrincipal,
  };
}

function celulaId(valor) {
  return { texto: `#${valor}`, align: "left", tamanho: 7, negrito: false, cor: CORES.textoSuave, semQuebra: true };
}

function celulaBadge(rotulo, fundo, corTexto) {
  return { badge: { rotulo, fundo, cor: corTexto } };
}

// --- medição e desenho de células -----------------------------------------

const PADDING_X = 6;
const PADDING_Y = 5;
const ALTURA_MIN_LINHA = 20;
const ALTURA_BADGE = 15;
const ALTURA_CABECALHO = 22;

function alturaCelula(doc, celula, largura) {
  if (celula.badge) return ALTURA_BADGE;
  doc.font(celula.negrito ? FONTE_SEMIBOLD : FONTE_REGULAR).fontSize(celula.tamanho);
  if (celula.semQuebra) return doc.currentLineHeight();
  return doc.heightOfString(celula.texto, { width: Math.max(largura - PADDING_X * 2, 10) });
}

function desenharCelula(doc, celula, x, y, largura, alturaLinha) {
  if (celula.badge) {
    doc.font(FONTE_SEMIBOLD).fontSize(7.5);
    const larguraTexto = doc.widthOfString(celula.badge.rotulo);
    const larguraBadge = Math.min(larguraTexto + 16, largura - PADDING_X);
    const bx = x + PADDING_X;
    const by = y + (alturaLinha - ALTURA_BADGE) / 2;
    doc.roundedRect(bx, by, larguraBadge, ALTURA_BADGE, ALTURA_BADGE / 2).fill(celula.badge.fundo);
    doc
      .fillColor(celula.badge.cor)
      .font(FONTE_SEMIBOLD)
      .fontSize(7.5)
      .text(celula.badge.rotulo, bx, by + 4, { width: larguraBadge, align: "center", lineBreak: false });
    return;
  }
  doc
    .font(celula.negrito ? FONTE_SEMIBOLD : FONTE_REGULAR)
    .fontSize(celula.tamanho)
    .fillColor(celula.cor);
  doc.text(celula.texto, x + PADDING_X, y + PADDING_Y, {
    width: Math.max(largura - PADDING_X * 2, 10),
    align: celula.align,
    lineBreak: !celula.semQuebra,
  });
}

// --- motor de tabela --------------------------------------------------------

function normalizarLargurasColunas(colunas, larguraDisponivel) {
  const somaDeclarada = colunas.reduce((soma, c) => soma + c.largura, 0);
  const fator = larguraDisponivel / somaDeclarada;
  return colunas.map((c) => ({ ...c, largura: c.largura * fator }));
}

class GeradorPdfBackup {
  constructor(doc) {
    this.doc = doc;
    this.numeroPagina = 0;
    this.inicioPaginaPorTabela = {};
    doc.on("pageAdded", () => {
      this.numeroPagina += 1;
    });
  }

  novaPaginaDados() {
    this.doc.addPage({ size: "A4", layout: "landscape", margins: { top: 40, bottom: 40, left: 40, right: 40 } });
    return this.doc.page.margins.top;
  }

  larguraUtil() {
    return this.doc.page.width - this.doc.page.margins.left - this.doc.page.margins.right;
  }

  garantirEspaco(alturaNecessaria) {
    const limite = this.doc.page.height - this.doc.page.margins.bottom;
    if (this.doc.y + alturaNecessaria > limite) {
      return this.novaPaginaDados();
    }
    return this.doc.y;
  }

  desenharCabecalhoTabela(colunas, y, cor) {
    const doc = this.doc;
    const x0 = doc.page.margins.left;
    const larguraTotal = colunas.reduce((s, c) => s + c.largura, 0);
    doc.rect(x0, y, larguraTotal, ALTURA_CABECALHO).fill(cor.fundo);
    let cx = x0;
    doc.font(FONTE_SEMIBOLD).fontSize(8).fillColor(cor.texto);
    for (const col of colunas) {
      doc.text(col.titulo.toUpperCase(), cx + PADDING_X, y + 7, {
        width: col.largura - PADDING_X * 2,
        align: col.align === "right" ? "right" : "left",
        lineBreak: false,
      });
      cx += col.largura;
    }
    doc
      .moveTo(x0, y + ALTURA_CABECALHO)
      .lineTo(x0 + larguraTotal, y + ALTURA_CABECALHO)
      .strokeColor(cor.forte)
      .lineWidth(1)
      .stroke();
    return y + ALTURA_CABECALHO;
  }

  desenharTabela({ tabela, titulo, cor, colunas: colunasBrutas, linhas, semRegistros }) {
    const doc = this.doc;
    const larguraTotal = this.larguraUtil();
    const colunas = normalizarLargurasColunas(colunasBrutas, larguraTotal);

    // titulo da secao + contagem — precisa de espaço para o titulo + cabecalho + 1 linha,
    // senao o titulo fica "orfao" sozinho no fim da pagina
    const alturaMinima = 34 + ALTURA_CABECALHO + ALTURA_MIN_LINHA;
    this.garantirEspaco(alturaMinima);

    if (this.inicioPaginaPorTabela[tabela] === undefined) {
      this.inicioPaginaPorTabela[tabela] = this.numeroPagina;
    }

    doc
      .font(FONTE_BOLD)
      .fontSize(13)
      .fillColor(cor.texto)
      .text(titulo, doc.page.margins.left, doc.y, { continued: false });
    doc
      .font(FONTE_REGULAR)
      .fontSize(8.5)
      .fillColor(CORES.textoSuave)
      .text(`${linhas.length} registro(s)`, doc.page.margins.left, doc.y + 1);
    doc.moveDown(0.6);

    if (semRegistros || linhas.length === 0) {
      doc.font(FONTE_REGULAR).fontSize(9).fillColor(CORES.textoSuave).text("Nenhum registro.");
      doc.moveDown(1.2);
      return;
    }

    let y = this.desenharCabecalhoTabela(colunas, doc.y, cor);
    const x0 = doc.page.margins.left;
    const larguraLinha = colunas.reduce((s, c) => s + c.largura, 0);

    linhas.forEach((celulas, indice) => {
      const alturaLinha = Math.max(
        ALTURA_MIN_LINHA,
        ...colunas.map((col, i) => alturaCelula(doc, celulas[i], col.largura) + PADDING_Y * 2)
      );

      const limite = doc.page.height - doc.page.margins.bottom;
      if (y + alturaLinha > limite) {
        this.novaPaginaDados();
        y = this.desenharCabecalhoTabela(colunas, doc.y, cor);
      }

      if (indice % 2 === 1) {
        doc.rect(x0, y, larguraLinha, alturaLinha).fill(CORES.zebra);
      }

      let cx = x0;
      for (let i = 0; i < colunas.length; i++) {
        desenharCelula(doc, celulas[i], cx, y, colunas[i].largura, alturaLinha);
        cx += colunas[i].largura;
      }
      doc
        .moveTo(x0, y + alturaLinha)
        .lineTo(x0 + larguraLinha, y + alturaLinha)
        .strokeColor(CORES.borda)
        .lineWidth(0.5)
        .stroke();

      y += alturaLinha;
    });

    doc.y = y;
    doc.moveDown(1.1);
  }
}

// --- busca de dados por tabela (já formatados em células) -------------------

async function carregarSecoes() {
  const secoes = [];

  const terapeutas = await query(
    "SELECT id, nome, especialidade, data_nascimento, email, status, excluido, criado_em FROM terapeutas ORDER BY nome"
  );
  secoes.push({
    tabela: "terapeutas",
    titulo: "Terapeutas",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Nome", largura: 150 },
      { titulo: "Especialidade", largura: 130 },
      { titulo: "Nascimento", largura: 75 },
      { titulo: "Email", largura: 150 },
      { titulo: "Situação", largura: 75 },
      { titulo: "Cadastrado em", largura: 155 },
    ],
    linhas: terapeutas.map((t) => [
      celulaId(t.id),
      celulaTexto(t.nome, { negrito: true }),
      celulaTexto(t.especialidade),
      celulaTexto(formatarData(t.data_nascimento)),
      celulaTexto(t.email),
      situacaoCelula(t.status, t.excluido),
      celulaTexto(formatarDataHora(t.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const colaboradores = await query(
    `SELECT id, nome, cargo, tipo_pagamento, valor_base, data_nascimento, email, status, excluido, criado_em
     FROM colaboradores ORDER BY nome`
  );
  secoes.push({
    tabela: "colaboradores",
    titulo: "Colaboradores",
    colunas: [
      { titulo: "#", largura: 32 },
      { titulo: "Nome", largura: 120 },
      { titulo: "Cargo", largura: 100 },
      { titulo: "Tipo pag.", largura: 65 },
      { titulo: "Valor base", largura: 80, align: "right" },
      { titulo: "Nascimento", largura: 70 },
      { titulo: "Email", largura: 115 },
      { titulo: "Situação", largura: 65 },
      { titulo: "Cadastrado em", largura: 125 },
    ],
    linhas: colaboradores.map((c) => [
      celulaId(c.id),
      celulaTexto(c.nome, { negrito: true }),
      celulaTexto(c.cargo),
      celulaTexto(c.tipo_pagamento === "fixo" ? "Fixo" : "Variável"),
      celulaTexto(formatarMoeda(c.valor_base), { align: "right" }),
      celulaTexto(formatarData(c.data_nascimento)),
      celulaTexto(c.email),
      situacaoCelula(c.status, c.excluido),
      celulaTexto(formatarDataHora(c.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const parcelas = await query(
    "SELECT id, descricao, valor_total, quantidade_parcelas, mes_inicio, ano_inicio, criado_em FROM parcelas ORDER BY descricao"
  );
  secoes.push({
    tabela: "parcelas",
    titulo: "Parcelas e Empréstimos",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Descrição", largura: 220 },
      { titulo: "Valor total", largura: 100, align: "right" },
      { titulo: "Parcelas", largura: 70 },
      { titulo: "Início", largura: 80 },
      { titulo: "Cadastrado em", largura: 165 },
    ],
    linhas: parcelas.map((p) => [
      celulaId(p.id),
      celulaTexto(p.descricao, { negrito: true }),
      celulaTexto(formatarMoeda(p.valor_total), { align: "right" }),
      celulaTexto(`${p.quantidade_parcelas}x`),
      celulaTexto(mesAno(p.mes_inicio, p.ano_inicio)),
      celulaTexto(formatarDataHora(p.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const parcelasLancamentos = await query(
    `SELECT pl.id, p.descricao, pl.numero_parcela, pl.mes, pl.ano, pl.valor, pl.status
     FROM parcelas_lancamentos pl JOIN parcelas p ON p.id = pl.parcela_id
     ORDER BY p.descricao, pl.numero_parcela`
  );
  secoes.push({
    tabela: "parcelas_lancamentos",
    titulo: "Lançamentos de Parcelas (por mês)",
    colunas: [
      { titulo: "#", largura: 38 },
      { titulo: "Parcela", largura: 220 },
      { titulo: "Nº", largura: 60 },
      { titulo: "Mês", largura: 90 },
      { titulo: "Valor", largura: 110, align: "right" },
      { titulo: "Situação", largura: 100 },
    ],
    linhas: parcelasLancamentos.map((p) => [
      celulaId(p.id),
      celulaTexto(p.descricao),
      celulaTexto(`${p.numero_parcela}`),
      celulaTexto(mesAno(p.mes, p.ano)),
      celulaTexto(formatarMoeda(p.valor), { align: "right" }),
      situacaoSimplesCelula(p.status),
    ]),
  });

  const entradas = await query(
    "SELECT id, mes, ano, categoria, descricao, valor, status, data_recebimento, criado_em FROM entradas ORDER BY ano DESC, mes DESC"
  );
  secoes.push({
    tabela: "entradas",
    titulo: "Entradas",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Mês", largura: 70 },
      { titulo: "Categoria", largura: 130 },
      { titulo: "Descrição", largura: 190 },
      { titulo: "Valor", largura: 100, align: "right" },
      { titulo: "Situação", largura: 80 },
      { titulo: "Recebimento", largura: 80 },
      { titulo: "Cadastrado em", largura: 130 },
    ],
    linhas: entradas.map((e) => [
      celulaId(e.id),
      celulaTexto(mesAno(e.mes, e.ano)),
      celulaTexto(e.categoria),
      celulaTexto(e.descricao, { negrito: true }),
      celulaTexto(formatarMoeda(e.valor), { align: "right" }),
      situacaoSimplesCelula(e.status),
      celulaTexto(formatarData(e.data_recebimento)),
      celulaTexto(formatarDataHora(e.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const saidas = await query(
    "SELECT id, mes, ano, tipo, descricao, valor, status, data, criado_em FROM saidas ORDER BY ano DESC, mes DESC"
  );
  secoes.push({
    tabela: "saidas",
    titulo: "Saídas",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Mês", largura: 70 },
      { titulo: "Tipo", largura: 65 },
      { titulo: "Descrição", largura: 210 },
      { titulo: "Valor", largura: 100, align: "right" },
      { titulo: "Situação", largura: 80 },
      { titulo: "Data", largura: 80 },
      { titulo: "Cadastrado em", largura: 145 },
    ],
    linhas: saidas.map((s) => [
      celulaId(s.id),
      celulaTexto(mesAno(s.mes, s.ano)),
      celulaTexto(s.tipo === "fixa" ? "Fixa" : "Variável"),
      celulaTexto(s.descricao, { negrito: true }),
      celulaTexto(formatarMoeda(s.valor), { align: "right" }),
      situacaoSimplesCelula(s.status),
      celulaTexto(formatarData(s.data)),
      celulaTexto(formatarDataHora(s.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const folha = await query(
    `SELECT fp.id, c.nome, c.cargo, fp.mes, fp.ano, fp.valor, fp.tipo_pagamento, fp.status, fp.criado_em
     FROM folha_pagamento fp JOIN colaboradores c ON c.id = fp.colaborador_id
     ORDER BY fp.ano DESC, fp.mes DESC, c.nome`
  );
  secoes.push({
    tabela: "folha_pagamento",
    titulo: "Folha de Pagamento",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Colaborador", largura: 150 },
      { titulo: "Cargo", largura: 110 },
      { titulo: "Mês", largura: 70 },
      { titulo: "Valor", largura: 100, align: "right" },
      { titulo: "Tipo", largura: 65 },
      { titulo: "Situação", largura: 80 },
      { titulo: "Cadastrado em", largura: 155 },
    ],
    linhas: folha.map((f) => [
      celulaId(f.id),
      celulaTexto(f.nome, { negrito: true }),
      celulaTexto(f.cargo),
      celulaTexto(mesAno(f.mes, f.ano)),
      celulaTexto(formatarMoeda(f.valor), { align: "right" }),
      celulaTexto(f.tipo_pagamento === "fixo" ? "Fixo" : "Variável"),
      situacaoSimplesCelula(f.status),
      celulaTexto(formatarDataHora(f.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const repasses = await query(
    `SELECT r.id, t.nome, t.especialidade, r.mes, r.ano, r.valor, r.status, r.criado_em
     FROM repasses r JOIN terapeutas t ON t.id = r.terapeuta_id
     ORDER BY r.ano DESC, r.mes DESC, t.nome`
  );
  secoes.push({
    tabela: "repasses",
    titulo: "Repasses de Terapeutas",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Terapeuta", largura: 160 },
      { titulo: "Especialidade", largura: 130 },
      { titulo: "Mês", largura: 75 },
      { titulo: "Valor", largura: 105, align: "right" },
      { titulo: "Situação", largura: 85 },
      { titulo: "Cadastrado em", largura: 175 },
    ],
    linhas: repasses.map((r) => [
      celulaId(r.id),
      celulaTexto(r.nome, { negrito: true }),
      celulaTexto(r.especialidade),
      celulaTexto(mesAno(r.mes, r.ano)),
      celulaTexto(formatarMoeda(r.valor), { align: "right" }),
      situacaoSimplesCelula(r.status),
      celulaTexto(formatarDataHora(r.criado_em), { tamanho: 8, cor: CORES.textoSuave }),
    ]),
  });

  const producao = await query(
    `SELECT pl.id, t.nome AS terapeuta, pl.tipo_servico, pl.data, pl.quantidade, pl.valor_unitario,
            pl.valor, pl.percentual, pl.valor_terapeuta, pl.valor_clinica
     FROM producao_lancamentos pl JOIN terapeutas t ON t.id = pl.terapeuta_id
     ORDER BY pl.data DESC`
  );
  secoes.push({
    tabela: "producao_lancamentos",
    titulo: "Produção de Terapeutas",
    colunas: [
      { titulo: "#", largura: 34 },
      { titulo: "Terapeuta", largura: 140 },
      { titulo: "Serviço", largura: 130 },
      { titulo: "Data", largura: 65 },
      { titulo: "Qtd", largura: 40 },
      { titulo: "V. unit.", largura: 75, align: "right" },
      { titulo: "Valor total", largura: 85, align: "right" },
      { titulo: "%", largura: 40, align: "right" },
      { titulo: "V. terapeuta", largura: 90, align: "right" },
      { titulo: "V. clínica", largura: 85, align: "right" },
    ],
    linhas: producao.map((p) => [
      celulaId(p.id),
      celulaTexto(p.terapeuta, { negrito: true }),
      celulaTexto(p.tipo_servico),
      celulaTexto(formatarData(p.data)),
      celulaTexto(p.quantidade ?? "—"),
      celulaTexto(p.valor_unitario ? formatarMoeda(p.valor_unitario) : "—", { align: "right" }),
      celulaTexto(formatarMoeda(p.valor), { align: "right" }),
      celulaTexto(`${Number(p.percentual)}%`, { align: "right" }),
      celulaTexto(formatarMoeda(p.valor_terapeuta), { align: "right" }),
      celulaTexto(formatarMoeda(p.valor_clinica), { align: "right" }),
    ]),
  });

  return secoes;
}

// --- geração completa -------------------------------------------------------

export async function gerarBackupPdf(res) {
  const secoes = await carregarSecoes();

  const doc = new PDFDocument({ bufferPages: true, autoFirstPage: false });
  doc.registerFont(FONTE_REGULAR, FONTE_REGULAR_PATH);
  doc.registerFont(FONTE_SEMIBOLD, FONTE_SEMIBOLD_PATH);
  doc.registerFont(FONTE_BOLD, FONTE_BOLD_PATH);
  doc.pipe(res);

  const gerador = new GeradorPdfBackup(doc);
  const agora = new Date();

  // --- capa (retrato) ---
  doc.addPage({ size: "A4", layout: "portrait", margins: { top: 56, bottom: 56, left: 56, right: 56 } });
  try {
    doc.image(LOGO_PATH, doc.page.width / 2 - 40, doc.y, { width: 80 });
  } catch {
    // segue sem logo se o arquivo não puder ser lido — não deve derrubar o backup
  }
  doc.y += 96;
  doc
    .font(FONTE_BOLD)
    .fontSize(24)
    .fillColor(CORES.textoPrincipal)
    .text("Desenvolva", { align: "center" });
  doc
    .font(FONTE_SEMIBOLD)
    .fontSize(14)
    .fillColor(CORES.lilasTexto)
    .text("Backup completo do sistema", { align: "center" });
  doc.moveDown(0.6);
  doc
    .font(FONTE_REGULAR)
    .fontSize(10.5)
    .fillColor(CORES.textoSuave)
    .text(`Exportado em ${formatarDataHora(agora)}`, { align: "center" });

  doc.moveDown(2.5);
  const indiceTituloY = doc.y;
  doc
    .font(FONTE_SEMIBOLD)
    .fontSize(11)
    .fillColor(CORES.textoPrincipal)
    .text("Conteúdo deste backup", doc.page.margins.left, indiceTituloY);
  doc
    .moveTo(doc.page.margins.left, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor(CORES.borda)
    .lineWidth(1)
    .stroke();
  doc.y += 16;
  const indiceCorpoY = doc.y;

  // --- páginas de dados (paisagem) ---
  // só a primeira precisa de quebra forçada (a capa é retrato); as demais tabelas
  // fluem na mesma página quando cabem — desenharTabela decide sozinha via garantirEspaco
  gerador.novaPaginaDados();
  secoes.forEach((secao, i) => {
    const cor = CICLO_CORES_SECAO[i % CICLO_CORES_SECAO.length];
    gerador.desenharTabela({
      tabela: secao.tabela,
      titulo: secao.titulo,
      cor,
      colunas: secao.colunas,
      linhas: secao.linhas,
    });
  });

  // --- volta pra capa e desenha o índice, agora que sabemos as páginas ---
  const totalPaginas = doc.bufferedPageRange().count;
  doc.switchToPage(0);
  doc.y = indiceCorpoY;
  doc.x = doc.page.margins.left;
  secoes.forEach((secao, i) => {
    const cor = CICLO_CORES_SECAO[i % CICLO_CORES_SECAO.length];
    // numeroPagina já é 1-based no momento em que o título da seção é desenhado (a capa é a página 1)
    const pagina = gerador.inicioPaginaPorTabela[secao.tabela];
    const registros = secao.linhas.length;
    const y = doc.y;
    doc.rect(doc.page.margins.left, y + 2, 8, 8).fill(cor.forte);
    doc
      .font(FONTE_SEMIBOLD)
      .fontSize(10)
      .fillColor(CORES.textoPrincipal)
      .text(secao.titulo, doc.page.margins.left + 16, y, { continued: false, width: 260 });
    doc
      .font(FONTE_REGULAR)
      .fontSize(9.5)
      .fillColor(CORES.textoSuave)
      .text(`${registros} registro(s) — pág. ${pagina}`, doc.page.margins.left + 280, y, { width: 200 });
    doc.y = y + 20;
  });

  // --- rodapé em todas as páginas, exceto a capa ---
  for (let i = 1; i < totalPaginas; i++) {
    doc.switchToPage(i);
    const rodapeY = doc.page.height - doc.page.margins.bottom + 14;
    // escrever abaixo da margem inferior faria o pdfkit criar uma pagina nova
    // automaticamente (comportamento padrao de overflow) — zera a margem por um instante
    const margemInferiorOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font(FONTE_REGULAR)
      .fontSize(7.5)
      .fillColor(CORES.textoSuave)
      .text(
        `Desenvolva — Backup gerado em ${formatarDataHora(agora)}`,
        doc.page.margins.left,
        rodapeY,
        { width: 300, lineBreak: false }
      );
    doc
      .font(FONTE_REGULAR)
      .fontSize(7.5)
      .fillColor(CORES.textoSuave)
      .text(`Página ${i + 1} de ${totalPaginas}`, doc.page.width - doc.page.margins.right - 150, rodapeY, {
        width: 150,
        align: "right",
        lineBreak: false,
      });
    doc.page.margins.bottom = margemInferiorOriginal;
  }

  doc.end();
}
