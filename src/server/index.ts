import "dotenv/config";

import express from "express";
import githubRouter from "./routes/github.ts";

const app = express();
const port = process.env.PORT ?? 3000;

export async function startServer() {
  app.use(githubRouter);

  app.listen(port, () => {
    console.log(`[SERVER] OAuth server listening on port ${port}`);
  });
}
