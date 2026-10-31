import { startBot } from "./bot/index.ts";
import { startServer } from "./server/index.ts";

// TODO: Make sure error handling propogates to here instead maybe?
try {
  await startBot();
  await startServer();
} catch (err) {
  console.error("[ERROR] Error starting up:", err);
  process.exit(1);
}
