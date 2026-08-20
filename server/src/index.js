import express from "express";
import cors from "cors";
import { db } from "./db.js";
import { terapeutasRouter } from "./routes/terapeutas.js";
import { colaboradoresRouter } from "./routes/colaboradores.js";
import { parcelasRouter } from "./routes/parcelas.js";
import { entradasRouter } from "./routes/entradas.js";
import { saidasRouter } from "./routes/saidas.js";
import { folhaPagamentoRouter } from "./routes/folhaPagamento.js";
import { repassesRouter } from "./routes/repasses.js";
import { financeiroAnualRouter } from "./routes/financeiroAnual.js";
import { producaoRouter } from "./routes/producao.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  const row = db.prepare("SELECT valor FROM meta WHERE chave = 'sistema'").get();
  res.json({ status: "ok", sistema: row?.valor ?? "Desenvolva" });
});

app.use("/api/terapeutas", terapeutasRouter);
app.use("/api/colaboradores", colaboradoresRouter);
app.use("/api/parcelas", parcelasRouter);
app.use("/api/entradas", entradasRouter);
app.use("/api/saidas", saidasRouter);
app.use("/api/folha-pagamento", folhaPagamentoRouter);
app.use("/api/repasses", repassesRouter);
app.use("/api/financeiro-anual", financeiroAnualRouter);
app.use("/api/producao", producaoRouter);

app.listen(PORT, () => {
  console.log(`Desenvolva API rodando em http://localhost:${PORT}`);
});
