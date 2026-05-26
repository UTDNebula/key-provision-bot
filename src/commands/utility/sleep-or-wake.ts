import {
  ActivityType,
  PermissionFlagsBits,
  PresenceUpdateStatus,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/interface.ts";

/**
 * Command to go invisible, or online. Only the admin has the ability to
 * tell it to sleep or wake up.
 */
const sleepWakeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("sleep_or_wake")
    .setDescription("Sleep or wake the key provision bot")
    // Only admin people have the ability to sleep or wake the bot
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const bot = interaction.client.user;

    if (bot.presence.status === "online") {
      bot.setPresence({
        activities: [{ name: "Sleep", type: ActivityType.Custom }],
        status: PresenceUpdateStatus.Invisible,
      });
      await interaction.reply(
        "I'm going offline. If you'd like to request API key, please comeback later.",
      );
    } else {
      bot.setPresence({
        activities: [
          { name: "Provision Nebula API key", type: ActivityType.Custom },
        ],
        status: PresenceUpdateStatus.Online,
      });
      await interaction.reply(
        "Hello everyone. I'm back and ready to provision key.",
      );
    }
  },
};

export default sleepWakeCommand;
