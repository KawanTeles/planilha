import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [pedido, setPedido] = useState(null);
  const resolverRef = useRef(null);

  const confirmar = useCallback((mensagem) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setPedido(mensagem);
    });
  }, []);

  function responder(resultado) {
    setPedido(null);
    resolverRef.current?.(resultado);
    resolverRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {pedido && (
        <div className="confirm-fundo" onClick={() => responder(false)}>
          <div className="confirm-caixa" onClick={(e) => e.stopPropagation()}>
            <p>{pedido}</p>
            <div className="formulario-acoes">
              <button className="botao botao-secundario" onClick={() => responder(false)}>
                Cancelar
              </button>
              <button className="botao botao-perigo" onClick={() => responder(true)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
