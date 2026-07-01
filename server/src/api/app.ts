import express from "express";
import { corsMiddleware } from "./middleware/cors";
import { sessionMiddleware } from "./middleware/session";
import authRouter from "./routes/auth";
import sheetsRouter from "./routes/sheets";
import projectsRouter from "./routes/projects";
import overviewRouter from "./routes/overview";
import changesRouter from "./routes/changes";
import pushRouter from "./routes/push";

const app = express();

app.use(corsMiddleware);
app.options("*", corsMiddleware);
app.use(express.json());
app.use(sessionMiddleware as express.RequestHandler);

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/api/sheets", sheetsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/changes", changesRouter);
app.use("/api/push", pushRouter);

export default app;
