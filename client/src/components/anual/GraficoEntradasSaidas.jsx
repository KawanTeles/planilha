import { useState } from "react";
import { MESES, formatarMoeda } from "../../constants.js";

const LARGURA = 760;
const ALTURA = 260;
const MARGEM = { topo: 16, baixo: 34, esquerda: 12, direita: 12 };

function arredondarTeto(valor) {
  if (valor <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(valor));
  return Math.ceil(valor / magnitude) * magnitude;
}

function formatarValorEixo(valor) {
  if (valor >= 1000) {
    const emMil = valor / 1000;
    const arredondado = Math.round(emMil * 10) / 10;
    return `${Number.isInteger(arredondado) ? arredondado : arredondado.toFixed(1)}k`;
  }
  return String(Math.round(valor));
}

export default function GraficoEntradasSaidas({ meses }) {
  const [hover, setHover] = useState(null);

  const areaLargura = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.baixo;

  const maxValor = Math.max(0, ...meses.map((m) => Math.max(m.totalEntradas, m.totalSaidas)));
  const teto = arredondarTeto(maxValor * 1.1);

  const x = (i) => MARGEM.esquerda + (i / 11) * areaLargura;
  const y = (v) => MARGEM.topo + areaAltura - (v / teto) * areaAltura;

  const pontosEntradas = meses.map((m, i) => [x(i), y(m.totalEntradas)]);
  const pontosSaidas = meses.map((m, i) => [x(i), y(m.totalSaidas)]);

  const linha = (pontos) => pontos.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px},${py}`).join(" ");

  const gridlines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: MARGEM.topo + areaAltura - f * areaAltura,
    valor: teto * f,
  }));

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Evolução mensal — entradas x saídas</h3>
      </div>
      <div className="grafico-legenda">
        <span className="grafico-legenda-item">
          <span className="grafico-swatch" style={{ background: "var(--grafico-verde)" }} /> Entradas
        </span>
        <span className="grafico-legenda-item">
          <span className="grafico-swatch" style={{ background: "var(--grafico-rosa)" }} /> Saídas
        </span>
      </div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="grafico-svg" role="img" aria-label="Evolução mensal de entradas e saídas">
        {gridlines.map((g) => (
          <g key={g.y}>
            <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={g.y} y2={g.y} className="grafico-gridline" />
            <text x={0} y={g.y + 4} className="grafico-eixo-texto">
              {formatarValorEixo(g.valor)}
            </text>
          </g>
        ))}

        <path d={linha(pontosEntradas)} className="grafico-linha" stroke="var(--grafico-verde)" />
        <path d={linha(pontosSaidas)} className="grafico-linha" stroke="var(--grafico-rosa)" />

        {meses.map((m, i) => (
          <g key={m.mes}>
            <circle cx={x(i)} cy={y(m.totalEntradas)} r="5" fill="var(--grafico-verde)" className="grafico-ponto" />
            <circle cx={x(i)} cy={y(m.totalSaidas)} r="5" fill="var(--grafico-rosa)" className="grafico-ponto" />
            <text x={x(i)} y={ALTURA - 10} textAnchor="middle" className="grafico-eixo-texto">
              {MESES[m.mes - 1].slice(0, 3)}
            </text>
            <rect
              x={x(i) - areaLargura / 24}
              y={0}
              width={areaLargura / 12}
              height={ALTURA - MARGEM.baixo}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            />
            {hover === i && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={MARGEM.topo}
                y2={ALTURA - MARGEM.baixo}
                className="grafico-crosshair"
              />
            )}
          </g>
        ))}
      </svg>
      {hover !== null && (
        <div className="grafico-tooltip">
          <strong>{MESES[meses[hover].mes - 1]}</strong>
          <div>
            <span className="grafico-swatch" style={{ background: "var(--grafico-verde)" }} /> Entradas:{" "}
            {formatarMoeda(meses[hover].totalEntradas)}
          </div>
          <div>
            <span className="grafico-swatch" style={{ background: "var(--grafico-rosa)" }} /> Saídas:{" "}
            {formatarMoeda(meses[hover].totalSaidas)}
          </div>
        </div>
      )}
    </div>
  );
}
