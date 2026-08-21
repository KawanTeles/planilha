import { useState } from "react";

const LARGURA = 760;
const ALTURA = 260;
const MARGEM = { topo: 16, baixo: 34, esquerda: 12, direita: 12 };

function arredondarTeto(valor) {
  if (valor <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(valor));
  return Math.ceil(valor / magnitude) * magnitude;
}

export default function GraficoAtaSistema({ semanas }) {
  const [hover, setHover] = useState(null);

  const areaLargura = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.baixo;

  const maxValor = Math.max(0, ...semanas.map((s) => Math.max(s.totalAta, s.totalSistema)));
  const teto = arredondarTeto(maxValor * 1.15);

  const larguraSlot = areaLargura / Math.max(semanas.length, 1);
  const larguraBarra = Math.min(28, larguraSlot * 0.32);
  const espacamento = 6;

  const x = (i) => MARGEM.esquerda + i * larguraSlot + larguraSlot / 2;
  const y = (v) => MARGEM.topo + areaAltura - (v / teto) * areaAltura;
  const altura = (v) => Math.max((v / teto) * areaAltura, v > 0 ? 1 : 0);

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Ata x sistema por semana</h3>
      </div>
      <div className="grafico-legenda">
        <span className="grafico-legenda-item">
          <span className="grafico-swatch" style={{ background: "var(--grafico-azul)" }} /> Ata
        </span>
        <span className="grafico-legenda-item">
          <span className="grafico-swatch" style={{ background: "var(--grafico-verde)" }} /> Sistema
        </span>
      </div>
      <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="grafico-svg" role="img" aria-label="Ata x sistema por semana">
        <line
          x1={MARGEM.esquerda}
          x2={LARGURA - MARGEM.direita}
          y1={MARGEM.topo + areaAltura}
          y2={MARGEM.topo + areaAltura}
          className="grafico-baseline"
        />
        {semanas.map((s, i) => (
          <g key={s.indice}>
            <rect
              x={x(i) - espacamento / 2 - larguraBarra}
              y={y(s.totalAta)}
              width={larguraBarra}
              height={altura(s.totalAta)}
              rx="3"
              fill="var(--grafico-azul)"
            />
            <rect
              x={x(i) + espacamento / 2}
              y={y(s.totalSistema)}
              width={larguraBarra}
              height={altura(s.totalSistema)}
              rx="3"
              fill="var(--grafico-verde)"
            />
            <text x={x(i)} y={ALTURA - 10} textAnchor="middle" className="grafico-eixo-texto">
              Sem {s.indice}
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
        ))}
      </svg>
      {hover !== null && (
        <div className="grafico-tooltip">
          <strong>Semana {semanas[hover].indice}</strong>
          <div>
            <span className="grafico-swatch" style={{ background: "var(--grafico-azul)" }} /> Ata:{" "}
            {semanas[hover].totalAta}
          </div>
          <div>
            <span className="grafico-swatch" style={{ background: "var(--grafico-verde)" }} /> Sistema:{" "}
            {semanas[hover].totalSistema}
          </div>
          <div className={semanas[hover].diferenca === 0 ? "" : "balanco-negativo"}>
            Diferença: {semanas[hover].diferenca === 0 ? "OK" : semanas[hover].diferenca > 0 ? `+${semanas[hover].diferenca}` : semanas[hover].diferenca}
          </div>
        </div>
      )}
    </div>
  );
}
