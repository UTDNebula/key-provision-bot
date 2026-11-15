import {
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  UserSelectMenuBuilder,
} from "discord.js";
import { withSelectedLeadership } from "@/bot/guards.ts";
import { Command } from "@/bot/interface.ts";

function buildRequestKeyForm(): ModalBuilder {
  const userSelect = new UserSelectMenuBuilder()
    .setCustomId("targetUser")
    .setPlaceholder("Search by username or nickname…")
    .setMinValues(1)
    .setMaxValues(1)
    .setRequired(true);

  const userLabel = new LabelBuilder()
    .setLabel("Who is this API key for?")
    .setDescription("Search by username or nickname.")
    .setUserSelectMenuComponent(userSelect);

  return new ModalBuilder()
    .setCustomId("adminProvisionKeyForm")
    .setTitle("Request API Key Form")
    .addLabelComponents(userLabel);
}

const adminProvisionKeyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("admin-provision-key")
    .setDescription("Request an API key on behalf of another user"),
  execute: withSelectedLeadership(async (interaction) => {
    await interaction.showModal(buildRequestKeyForm());
  }),
};

export default adminProvisionKeyCommand;
