import type {
  APIKeyProvision,
  BranchProvision,
  Command,
  ModalSubmit,
} from "@/bot/interface.ts";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import "dotenv/config";
import { Collection, MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

const GITHUB_LINKED_ROLE_ID = "1562301242548555927";

/**
 * Ensures the member has the GithubLinked role.
 * Returns true if they already had it (or the prompt was sent),
 * false if the interaction context was invalid.
 */
// FIXME: This github linked role does not ensure properly
export async function ensureGithubLinkedRole(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  if (!interaction.inCachedGuild()) {
    return false;
  }

  const member = interaction.member;

  if (member.roles.cache.has(GITHUB_LINKED_ROLE_ID)) {
    return true;
  }
  // TODO: Something needs to happen upon hitting the button
  console.log("Triggered");
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("link_github_role")
      .setLabel("Attach GithubLinked Role")
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({
    content:
      "You do not have the **GithubLinked** role yet. Please click the button below to attach it.",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });

  return false;
}
