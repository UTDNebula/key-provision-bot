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

let cachedConnection: Promise<MongoClient> | null = null;
/**
 * Connect to DB, and cache the connection
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!cachedConnection) {
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) {
      throw new Error("Undefined MONGO_URL");
    }

    const mongoClient = new MongoClient(mongoURL);

    cachedConnection = mongoClient
      .connect()
      .then((client) => {
        console.log("Successfully connected to MongoDB!");
        return client;
      })
      .catch((err) => {
        cachedConnection = null;
        throw err;
      });
  }

  return cachedConnection;
}

/**
 * Connect to the key provisions collection of database
 */
export async function getKeyProvisionCollection(): Promise<
  Collection<KeyProvision>
> {
  const client = await getMongoClient();
  return client.db("combinedDB").collection<KeyProvision>("keyProvisions");
}
