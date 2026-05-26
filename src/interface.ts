import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  SlashCommandBuilder,
} from "discord.js";

// The slash command
export type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

/**
 * Custom Discord Client that includes list of commands, cooldowns, etc.
 */
export interface DiscordClient extends Client {
  commands: Collection<string, Command>;
}
