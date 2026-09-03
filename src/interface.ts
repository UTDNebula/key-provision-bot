import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  ModalSubmitInteraction,
  SlashCommandBuilder,
} from "discord.js";

/**
 * Slash command
 */
export type Command = {
  cooldown?: number;
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
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
export type KeyProvision = {
  userId: string;
  username: string;
  project: string;
  description: string;
  encryptedKey: string;
};
