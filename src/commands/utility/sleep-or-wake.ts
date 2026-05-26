import {
  ActivityType,
  PermissionFlagsBits,
  PresenceUpdateStatus,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/interface.ts";

/**
 * Command to go invisible, or online. 
 * Only the admin has the permsision to command it to sleep or wake up.
 */
const sleepWakeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("sleep_or_wake")
    .setDescription("Sleep or wake the key provision bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const bot = interaction.client.user;

    if (bot.presence.status === "online") {
      bot.setPresence({
        activities: [{ name: "Sleep", type: ActivityType.Custom }],
        status: PresenceUpdateStatus.Invisible,
      });
      await interaction.reply("I'm going offline now. Goodbye everyone!");
    } else {
      bot.setPresence({
        activities: [{ name: "Provide API Key", type: ActivityType.Custom }],
        status: PresenceUpdateStatus.Online,
      });
      await interaction.reply(
        "Hi everyone! I'm back and ready to provision key.",
      );
    }
  },
};

export default sleepWakeCommand;
