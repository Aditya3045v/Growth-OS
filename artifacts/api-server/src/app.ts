import express from "express";
import cors from "cors";
import pinoHttp, { HttpLogger } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();

const pinoMiddleware = ((pinoHttp as any).default || pinoHttp) as any;

app.use(
  pinoMiddleware({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }) as express.RequestHandler,
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
