import type { Command, ModalSubmit } from "@/bot/interface.ts";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import BrancherDBClient from "./db-brancher/BrancherDBClient.ts";
import NeonProviderClient from "./db-brancher/providers/Neon.ts";
import { Branch } from "@neon/sdk";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically retrieve all the commands in the commands folder
 */
export async function getCommands(): Promise<Command[]> {
  const commands: Command[] = [];

  async function scan(dir: string): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.name.endsWith(".ts")) {
        const module = await import(pathToFileURL(fullPath).href);
        const command = module.default;
        if (command && "data" in command && "execute" in command) {
          commands.push(command);
        }
      }
    }
  }

  await scan(path.join(__dirname, "commands"));
  return commands;
}

/**
 * Dynamically retrieve all the modal submit interactions in the modals folder
 */
export async function getModalSubmits(): Promise<ModalSubmit[]> {
  const modalSubmits: ModalSubmit[] = [];

  const modalSubmitPath = path.join(__dirname, "modals");
  const modalSubmitFiles = fs
    .readdirSync(modalSubmitPath)
    .filter((file) => file.endsWith(".ts"));

  for (const file of modalSubmitFiles) {
    const filePath = path.join(modalSubmitPath, file);
    const module = await import(pathToFileURL(filePath).href);
    const submit = module.default;
    if ("customId" in submit && "execute" in submit) {
      modalSubmits.push(submit);
    }
  }

  return modalSubmits;
}

let cachedBrancherClient: BrancherDBClient<Branch> | null = null;

export function getBrancherClient(): BrancherDBClient<Branch> {
  const neonApiKey = process.env.NEON_API_KEY;
  if (!neonApiKey) {
    throw new Error("Undefined NEON_API_KEY");
  }
  const projectId = process.env.NEON_PROJECT_ID;
  if (!projectId) {
    throw new Error("Undefined NEON_PROJECT_ID");
  }

  if (!cachedBrancherClient) {
    const branchProvider = new NeonProviderClient({
      apiKey: neonApiKey,
      projectId: projectId,
    });

    cachedBrancherClient = new BrancherDBClient(branchProvider);
  }

  return cachedBrancherClient;
}
