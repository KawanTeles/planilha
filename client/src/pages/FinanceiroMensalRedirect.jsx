import { Navigate } from "react-router-dom";

export default function FinanceiroMensalRedirect() {
  const agora = new Date();
  return <Navigate to={`/financeiro-mensal/${agora.getFullYear()}/${agora.getMonth() + 1}`} replace />;
}
