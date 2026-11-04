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
  branches: BranchMetadata[];
};

export type BranchMetadata = {
  branchId: string;
  index: number;
  project: string;
  createdAt: Date;
  lastFetchedAt: Date;
};

/**
 * Projects we support from nebula organization
 */
export type Project = {
  label: string;
  value: string;
  description: string;
  neonProjectId: string;
  productionDatabaseURL?: string;
};

export const PROJECTS = [
  {
    label: "Clubs",
    value: "clubs",
    description: "A database branch for Clubs",
    neonProjectId: process.env.CLUBS_NEON_PROJECT_ID!,
    productionDatabaseURL: process.env.CLUBS_PRODUCTION_DATABASE_URL,
  },
  {
    label: "Notebook",
    value: "notebook",
    description: "A database branch for Notebook",
    neonProjectId: process.env.NOTEBOOK_NEON_PROJECT_ID!,
    productionDatabaseURL: process.env.NOTEBOOK_PRODUCTION_DATABASE_URL,
  },
] as const satisfies Project[];

export type ProjectValue = (typeof PROJECTS)[number]["value"];
