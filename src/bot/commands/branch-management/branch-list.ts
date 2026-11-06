import { SlashCommandBuilder } from "discord.js";
import { Command } from "@/bot/interface.ts";
import { withGithubVerified } from "@/bot/guards.ts";

// TODO: replace with real GitHub API call
async function fetchBranches(): Promise<string[]> {
  // TODO: DB Brancher stuff
}

const listBranchesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("list-branches")
    .setDescription("List database branches"),
  execute: withGithubVerified(async (interaction) => {
    const branches = await fetchBranches();
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
