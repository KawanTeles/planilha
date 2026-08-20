import { Navigate } from "react-router-dom";

export default function FinanceiroAnualRedirect() {
  const agora = new Date();
  return <Navigate to={`/financeiro-anual/${agora.getFullYear()}`} replace />;
}
