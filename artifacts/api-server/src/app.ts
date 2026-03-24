import express, { type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();

// @ts-ignore - pino-http ESM/CJS interop handling
const pino = (pinoHttp as any).default || pinoHttp;

app.use(
  pino({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: (req as any).id,
          method: (req as any).method,
          url: (req as any).url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: (res as any).statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
