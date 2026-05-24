import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically retrieve all the commands in the commands folder
 */
export async function getCommands() {
  const commands = [];

  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandPath)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(commandPath, file);
      const command = (await import(pathToFileURL(filePath).href)).default;
      if ("data" in command && "execute" in command) {
        commands.push(command);
      }
    }
  }
  return commands;
}
