import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  ModalSubmitInteraction,
  SlashCommandBuilder,
} from "discord.js";

export type Execute = (
  interaction: ChatInputCommandInteraction,
) => Promise<void>;

/**
 * Slash command
 */
export type Command = {
  cooldown?: number;
  data: SlashCommandBuilder;
  execute: Execute;
};

/**
 * The modal submit interaction handler
 */
export type ModalSubmit = {
  customId: string;
  execute: (interaction: ModalSubmitInteraction) => Promise<void>;
};

/**
 * Custom Discord Client that includes list of commands, cooldowns, etc.
 */
export interface DiscordClient extends Client {
  // Map from the command's name to the command
  commands: Collection<string, Command>;

  // Map from the command's name to (user id -> timestamp)
  cooldowns: Collection<string, Collection<string, number>>;

  // Map from the modal's custom ID to the modal submission handler
  modalSubmits: Collection<string, ModalSubmit>;
}

/**
 * Information about the key's provision
 */
export type APIKeyProvision = {
  userId: string;
  username: string;
  project: string;
  description: string;
  encryptedKey: string;
  apiPurpose: string[];
};

/**
 * Information about a a branch's provision
 */
export type BranchProvision = {
  userId: string;
  githubUserId: string;
  githubUsername: string;
  branches: Record<string, Branch>; // key === branch.name
};

export type Branch = {
  name: string;
  url: string;
  project: string;
  createdAt: Date;
};
