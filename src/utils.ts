import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Command, KeyProvision, ModalSubmit } from "@/interface.ts";
import { MongoClient, Collection } from "mongodb";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically retrieve all the commands in the commands folder
 */
export async function getCommands(): Promise<Command[]> {
  const commands: Command[] = [];

  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandPath)
      .filter((file) => file.endsWith(".ts"));
    for (const file of commandFiles) {
      const filePath = path.join(commandPath, file);
      const module = await import(pathToFileURL(filePath).href);
      const command = module.default;
      if ("data" in command && "execute" in command) {
        commands.push(command);
      }
    }
  }
  return commands;
}

/**
 * Dynamically retrieve all the modal submit interactions
 * in the modals folder
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

const mongoURL = process.env.MONGO_URL;
if (!mongoURL) {
  console.error("Undefined MONGO_URL. Program terminating.");
  process.exit(1);
}
const mongoClient = new MongoClient(mongoURL);
let cachedConnection: Promise<MongoClient> | null = null;
/**
 * Cache the connection to Mongo DB
 */
export async function getClient(): Promise<MongoClient> {
  try {
    if (!cachedConnection) {
      console.log("Successfully connected to MongoDB!");
      cachedConnection = mongoClient.connect();
    }
    return cachedConnection;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    console.error(
      `Error connecting to MongoDB ${message}. Program terminating.`,
    );
    process.exit(1);
  }
}

/**
 * Connect to the key provisions collection of database
 */
export async function getKeyProvisionCollection(): Promise<
  Collection<KeyProvision>
> {
  const dbName = process.env.DATABASE_NAME;
  if (!dbName) {
    throw new Error("Undefined DATABASE_NAME");
  }
  const keyColName = process.env.KEY_COL_NAME;
  if (!keyColName) {
    throw new Error("Undefined KEY_COL_NAME");
  }

  // Get the cached connection to the database
  const client = await getClient();
  return client.db(dbName).collection<KeyProvision>(keyColName);
}
