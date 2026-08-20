import { useState } from "react";
import { formatarMoeda } from "../../constants.js";

const CORES = {
  Unimed: "var(--grafico-azul)",
  Bradesco: "var(--grafico-rosa)",
  Particular: "var(--grafico-dourado)",
  "Sublocação de salas": "var(--grafico-lilas)",
};

const LARGURA = 760;
const ALTURA_BARRA = 40;

export default function GraficoComposicaoEntradas({ entradasPorCategoria }) {
  const [hover, setHover] = useState(null);

  const total = entradasPorCategoria.reduce((soma, c) => soma + c.valor, 0);

  let acumulado = 0;
  const segmentos = entradasPorCategoria.map((c) => {
    const largura = total > 0 ? (c.valor / total) * LARGURA : LARGURA / entradasPorCategoria.length;
    const seg = { ...c, x: acumulado, largura, percentual: total > 0 ? (c.valor / total) * 100 : 0 };
    acumulado += largura + 2; // 2px de espaçamento entre segmentos
    return seg;
  });

  return (
    <div className="bloco-financeiro">
      <div className="bloco-financeiro-cabecalho">
        <h3>Composição das entradas por categoria</h3>
      </div>

      {total === 0 ? (
        <p className="texto-suave">Nenhuma entrada lançada neste ano ainda.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${LARGURA} ${ALTURA_BARRA}`}
            className="grafico-svg"
            style={{ height: ALTURA_BARRA }}
            role="img"
            aria-label="Composição das entradas por categoria"
          >
            {segmentos.map((s) => (
              <rect
                key={s.categoria}
                x={s.x}
                y={0}
                width={Math.max(s.largura, 0)}
                height={ALTURA_BARRA}
                rx="4"
                fill={CORES[s.categoria]}
                onMouseEnter={() => setHover(s.categoria)}
                onMouseLeave={() => setHover((h) => (h === s.categoria ? null : h))}
                opacity={hover && hover !== s.categoria ? 0.55 : 1}
              />
            ))}
          </svg>

          <div className="composicao-legenda">
            {segmentos.map((s) => (
              <div
                key={s.categoria}
                className="composicao-legenda-linha"
                onMouseEnter={() => setHover(s.categoria)}
                onMouseLeave={() => setHover((h) => (h === s.categoria ? null : h))}
                style={{ opacity: hover && hover !== s.categoria ? 0.55 : 1 }}
              >
                <span className="grafico-swatch" style={{ background: CORES[s.categoria] }} />
                <span className="composicao-legenda-nome">{s.categoria}</span>
                <span className="composicao-legenda-valor">{formatarMoeda(s.valor)}</span>
                <span className="texto-suave">{s.percentual.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
