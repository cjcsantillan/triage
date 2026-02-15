import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Request, type Response, type NextFunction } from "express";
import "dotenv/config";
import { triageRouter } from "./routes/triage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(triageRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[triage] unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`[triage] listening on http://localhost:${PORT}`);
});
