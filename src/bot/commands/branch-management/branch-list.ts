import { SlashCommandBuilder } from "discord.js";
import { Command } from "@/bot/interface.ts";
import { withGithubVerified } from "@/bot/guards.ts";
import { getAuthorizedNeonUser, getBrancherClient } from "@/bot/utils.ts";

const listBranchesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("list-branches")
    .setDescription("List database branches"),
  execute: withGithubVerified(async (interaction) => {
    const neonUser = await getAuthorizedNeonUser(interaction.user);
    const brancher = getBrancherClient();
    const branches = await brancher.user.getBranches(neonUser);

    await interaction.reply({
      content:
        branches.length === 0
          ? "No branches found."
          : branches.map((b) => `• \`${b}\``).join("\n"),
      ephemeral: true,
    });
  }),
};

export default listBranchesCommand;
