import {
  ActivityType,
  PresenceUpdateStatus,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/interface.ts";

/**
 * Command to go online.
 * Only the admin has the permsision to command it to sleep or wake up.
 */
const wakeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("wake")
    .setDescription("wake the key provision bot"),
  async execute(interaction) {
    const bot = interaction.client.user;

    bot.setPresence({
      activities: [
        { name: "Provisioning API Key...", type: ActivityType.Custom },
      ],
      status: PresenceUpdateStatus.Online,
    });
    await interaction.reply(
      "Hi everyone! I'm back and ready to provision key.",
    );
  },
};

export default wakeCommand;
