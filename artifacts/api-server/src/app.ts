import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built kalar-map frontend if it exists
const frontendDist = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "artifacts",
  "kalar-map",
  "dist",
  "public",
);

if (existsSync(frontendDist)) {
  logger.info({ frontendDist }, "Serving frontend static files");
  app.use(express.static(frontendDist));

  // SPA fallback — send index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  logger.warn(
    { frontendDist },
    "Frontend dist not found — only API routes available",
  );
  app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "Kalar Map API is running" });
  });
}

export default app;
