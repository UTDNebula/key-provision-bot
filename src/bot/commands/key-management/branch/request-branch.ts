import { withGithubLinkedRole } from "@/bot/guards.ts";
import { Command } from "@/bot/interface.ts";
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
} from "discord.js";

// Keep project list as a single source of truth so the handler
// and the modal can't drift apart
export const PROJECTS = [
  {
    label: "Clubs",
    value: "clubs",
    description: "A database branch for clubs",
  },
] as const;

export type ProjectValue = (typeof PROJECTS)[number]["value"];

function buildRequestBranchForm(): ModalBuilder {
  const nameInput = new TextInputBuilder()
    .setCustomId("branchName")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(80);

  const nameLabel = new LabelBuilder()
    .setLabel("What is this key's name name?")
    .setDescription("Anything! It's used for naming your branch's use case.")
    .setTextInputComponent(nameInput);

  const projectSelect = new StringSelectMenuBuilder()
    .setCustomId("project")
    .setPlaceholder("Select a project")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      PROJECTS.map((p, i) => ({
        label: p.label,
        value: p.value,
        description: p.description,
        default: i === 0,
      })),
    );

  const projectLabel = new LabelBuilder()
    .setLabel("Project")
    .setStringSelectMenuComponent(projectSelect);

  return new ModalBuilder()
    .setCustomId("requestBranchModal")
    .setTitle("Request a Branch")
    .addLabelComponents(nameLabel, projectLabel);
}

const requestBranchCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("request-branch")
    .setDescription("Request a database branch"),
  execute: withGithubLinkedRole(async (interaction) => {
    await interaction.showModal(buildRequestBranchForm());
  }),
};

export default requestBranchCommand;
