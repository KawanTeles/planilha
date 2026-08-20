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

export default function GraficoBalancoMensal({ meses }) {
  const [hover, setHover] = useState(null);

  const areaLargura = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.baixo;

  const maxAbs = Math.max(0, ...meses.map((m) => Math.abs(m.balanco)));
  const teto = arredondarTeto(maxAbs * 1.15);

  const baseY = MARGEM.topo + areaAltura / 2;
  const escala = areaAltura / 2 / teto;

  const larguraSlot = areaLargura / 12;
  const larguraBarra = Math.min(24, larguraSlot * 0.5);

  const x = (i) => MARGEM.esquerda + i * larguraSlot + larguraSlot / 2;

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Balanço mensal</h3>
      </div>
      <div className="grafico-legenda">
        <span className="grafico-legenda-item">
          <span className="grafico-swatch" style={{ background: "var(--grafico-verde)" }} /> Positivo
        </span>
        <span className="grafico-legenda-item">
          <span className="grafico-swatch" style={{ background: "var(--grafico-rosa)" }} /> Negativo
        </span>
      </div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="grafico-svg" role="img" aria-label="Balanço mensal">
        <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={baseY} y2={baseY} className="grafico-baseline" />

        {meses.map((m, i) => {
          const altura = Math.min(Math.abs(m.balanco) * escala, areaAltura / 2);
          const positivo = m.balanco >= 0;
          const yBarra = positivo ? baseY - altura : baseY;
          return (
            <g key={m.mes}>
              <rect
                x={x(i) - larguraBarra / 2}
                y={yBarra}
                width={larguraBarra}
                height={Math.max(altura, 1)}
                rx="4"
                fill={positivo ? "var(--grafico-verde)" : "var(--grafico-rosa)"}
              />
              <text x={x(i)} y={ALTURA - 10} textAnchor="middle" className="grafico-eixo-texto">
                {MESES[m.mes - 1].slice(0, 3)}
              </text>
              <rect
                x={x(i) - larguraSlot / 2}
                y={0}
                width={larguraSlot}
                height={ALTURA - MARGEM.baixo}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="grafico-tooltip">
          <strong>{MESES[meses[hover].mes - 1]}</strong>
          <div className={meses[hover].balanco >= 0 ? "balanco-positivo" : "balanco-negativo"}>
            Balanço: {formatarMoeda(meses[hover].balanco)}
          </div>
        </div>
      )}
    </div>
  );
}
