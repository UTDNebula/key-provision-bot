import { withGithubVerified } from "@/bot/guards.ts";
import { Command } from "@/bot/interface.ts";
import { getAuthorizedNeonUser, getBrancherClient } from "@/bot/utils.ts";
import {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

const branchDeleteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("branch-delete")
    .setDescription("Delete a database branch"),
  execute: withGithubVerified(async (interaction) => {
    const neonUser = await getAuthorizedNeonUser(interaction.user);
    const brancher = getBrancherClient();
    const branches = await brancher.user.getBranches(neonUser);
    const projectSelect = new StringSelectMenuBuilder()
      .setCustomId("delete:project")
      .setPlaceholder("Select a branch")
      .addOptions(
        // TODO: Im assuming if we filter based on notebook or clubs that
        //  we will choose just filter by the branches as opposed to keeping them seperate with a modal
        branches.map((p) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(p.name)
            .setDescription(p.project_id)
            .setValue(p.name),
        ),
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      projectSelect,
    );

    await interaction.editReply({
      content: "Which project is the branch in?",
      components: [row],
    });
  }),
};

export default branchDeleteCommand;
