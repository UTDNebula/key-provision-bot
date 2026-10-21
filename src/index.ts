import { startBot } from "./bot/index.ts";

try {
  await startBot(); // bot
} catch (err) {
  console.error("[ERROR] Error starting up:", err);
  process.exit(1);
}
