import {
  ActivityType,
  MessageFlags,
  PermissionFlagsBits,
  PresenceUpdateStatus,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/interface.ts";

/**
 * Command to go invisible.
 * Only the admin has the permsision to command it to sleep or wake up.
 */
const sleepCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("sleep")
    .setDescription("Wake the key provision bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
      activities: [{ name: "Sleeping...", type: ActivityType.Custom }],
      status: PresenceUpdateStatus.Invisible,
    });
    await interaction.reply("I'm going offline now. Goodbye everyone!");
  },
};

export default sleepCommand;
