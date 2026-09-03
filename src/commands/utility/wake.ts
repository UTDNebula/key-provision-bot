import {
  ActivityType,
  MessageFlags,
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
    const adminIds = process.env.BOT_ADMINS?.split(",") || [];

    if (!adminIds.includes(interaction.user.id)) {
      await interaction.reply({
        content: "You are not allowed to use this command",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

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
